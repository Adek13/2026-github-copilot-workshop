# Data Model: GR Module

**Phase 1 Output** | **Date**: June 3, 2026

---

## Entity Overview

### GoodsReceipt (goods_receipts table)

The header entity representing a complete goods receipt event.

**Purpose**: Track the receipt of goods against a purchase order, with status lifecycle from creation to finalization.

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-----------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier (generated on creation) |
| `gr_number` | VARCHAR(30) | UNIQUE, NOT NULL | Human-readable GR identifier (format: GR-2026-0001) |
| `po_id` | UUID | FOREIGN KEY, NOT NULL | References purchase_orders(id); GR is always linked to exactly one PO |
| `status` | VARCHAR(20) | CHECK (DRAFT\|POSTED) | Lifecycle state: DRAFT (editable) or POSTED (finalized, locked) |
| `receipt_date` | DATE | Nullable | Date goods were received (populated at creation or posting) |
| `notes` | TEXT | Nullable | Optional notes about receipt (damage, discrepancies, etc.) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Timestamp of GR creation |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Timestamp of last update |

**Example**:
```json
{
  "id": "a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6",
  "grNumber": "GR-2026-0001",
  "poId": "po-uuid-here",
  "status": "DRAFT",
  "receiptDate": "2026-06-03",
  "notes": "Received partial shipment; 2 units damaged",
  "createdAt": "2026-06-03T10:15:00Z",
  "updatedAt": "2026-06-03T10:15:00Z"
}
```

---

### GoodsReceiptLine (gr_lines table)

The line-item entity representing a single line of goods within a GR.

**Purpose**: Track individual line-item receipts, linking each received quantity to a specific PO line.

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-----------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier (generated on creation) |
| `gr_id` | UUID | FOREIGN KEY, NOT NULL | References goods_receipts(id); cascade delete |
| `po_line_id` | UUID | FOREIGN KEY, NOT NULL | References po_lines(id); identifies which PO line is being received |
| `line_no` | INT | UNIQUE with gr_id | Line sequence number within GR (1, 2, 3, ...) |
| `qty_received` | NUMERIC(14,2) | NOT NULL, CHECK (> 0) | Quantity received (always positive) |
| `actual_site_code` | VARCHAR(50) | NOT NULL | Physical location/site where goods are received |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Timestamp of line creation |

**Unique Constraint**: `(gr_id, line_no)` — ensures line numbers are unique within a GR

**Example**:
```json
{
  "id": "line-uuid-1",
  "grId": "gr-uuid-here",
  "poLineId": "po-line-uuid-123",
  "lineNo": 1,
  "qtyReceived": 50,
  "actualSiteCode": "WAREHOUSE-A",
  "createdAt": "2026-06-03T10:15:00Z"
}
```

---

## Relationships

### GoodsReceipt → PurchaseOrder (N:1)

- Each GR is linked to exactly one PO via `po_id`
- Foreign key constraint: `REFERENCES purchase_orders(id) ON DELETE RESTRICT`
- Rationale: Prevent orphaned GRs by restricting PO deletion if GRs exist

### GoodsReceiptLine → GoodsReceipt (N:1)

- Each GR line belongs to exactly one GR via `gr_id`
- Foreign key constraint: `REFERENCES goods_receipts(id) ON DELETE CASCADE`
- Rationale: When GR is deleted, all lines are automatically deleted

### GoodsReceiptLine → POLine (N:1)

- Each GR line receives against a specific PO line via `po_line_id`
- Foreign key constraint: `REFERENCES po_lines(id) ON DELETE RESTRICT`
- Rationale: Prevent orphaned GR lines by restricting PO line deletion if GR lines reference it
- Note: Multiple GR lines can reference the same PO line (e.g., partial receipt across multiple GRs)

### GoodsReceipt ← PurchaseRequisition (indirect via PO)

- GR does not directly reference PR; navigation is: GR → PO → PR lines (via pr_line_allocations join)
- Enables traceability: warehouse staff can view PR context from GR detail page

---

## Validations

### Validation 1: Over-Receipt Prevention (Core Business Rule)

**Rule**: A GR line's `qty_received` must NOT exceed the PO line's allocated quantity at the time of GR creation.

**Definition**:
```
qty_received_in_new_gr_line ≤ (po_line.qty_ordered - sum_of_qty_received_across_existing_grs_for_po_line)
```

**Implementation**: Service layer validation before creating GR.

**Error Message**:
```
Received quantity (X) exceeds PO line allocated quantity (Y). 
Please reduce the received quantity or select a different line.
```

**Example**:
- PO Line 1: qty_ordered = 100
- Existing GR 1 for PO Line 1: qty_received = 50
- Remaining allocation: 100 - 50 = 50
- New GR 2 attempt: qty_received = 60 (REJECTED)
- New GR 2 attempt: qty_received = 40 (ACCEPTED)

**Test Case (Jest)**:
```javascript
test('rejects qty_received exceeding remaining po line allocation', async () => {
  const grData = {
    poId: 'po-123',
    lines: [
      { poLineId: 'po-line-1', qtyReceived: 150 } // PO line has 100 qty_ordered
    ]
  };
  // Service should throw error with statusCode 400
});
```

---

### Validation 2: No Zero Quantities in GR Lines

**Rule**: Each GR line must have `qty_received > 0`.

**Implementation**: Route-level validation and database constraint.

**Error Message**:
```
Each line must have a received quantity greater than 0. 
Please enter valid quantities or remove empty lines.
```

---

### Validation 3: No Posting with Missing Quantities

**Rule**: GR cannot transition from DRAFT to POSTED if any line item has `qty_received <= 0` or NULL.

**Implementation**: Service layer validation before state transition.

**Error Message**:
```
Cannot post GR. All line items must have received quantities > 0. 
Please verify quantities before posting.
```

**Test Case (Jest)**:
```javascript
test('prevents posting GR with zero or null quantities', async () => {
  const gr = { id: 'gr-123', status: 'DRAFT', lines: [{ qtyReceived: null }] };
  // Service should throw error: "All line items must have received quantities > 0"
});
```

---

### Validation 4: GR Status Transition Rules

**Rule**: Only transition DRAFT → POSTED. No other transitions allowed.

**Implementation**: Service layer status check before transition.

**Allowed Transitions**:
- DRAFT → POSTED (via POST /api/goods-receipts/:id/post)

**Blocked Transitions**:
- POSTED → DRAFT (no reversal)
- POSTED → POSTED (idempotent, but error is acceptable: "GR is already posted")
- Any state → invalid state

**Error Message (if already POSTED)**:
```
Goods Receipt is already posted and cannot be posted again.
```

**Test Case (Jest)**:
```javascript
test('prevents posting GR that is already POSTED', async () => {
  const gr = { id: 'gr-123', status: 'POSTED' };
  // Service should throw error with statusCode 400
});
```

---

## State Diagram

```
Initial State: DRAFT
  ↓
  ├─ User can create GR lines (add/remove)
  ├─ User can edit GR header (notes, receipt_date)
  ├─ User can cancel GR (delete it)
  └─ User can post GR (transition to POSTED)
  ↓
Final State: POSTED
  ├─ GR is locked (no edits allowed)
  ├─ Line items are read-only
  ├─ No state reversal
  └─ GR is ready for inventory/payment processing
```

---

## Query Patterns

### Query: Open PO Lines Available for GR Creation

**Purpose**: Retrieve PO lines that have unallocated quantity available for new GR.

**Definition**:
```sql
SELECT po_lines.*, 
       (po_lines.qty_ordered - po_lines.qty_received) AS qty_open
FROM po_lines
WHERE po_lines.qty_ordered > po_lines.qty_received
  AND po_lines.po_id = ?
ORDER BY po_lines.line_no ASC;
```

**DTO Returned**:
```json
{
  "id": "po-line-uuid",
  "poNumber": "PO-2026-0001",
  "lineNo": 1,
  "itemCode": "SKU-123",
  "itemName": "Widget A",
  "qtyOrdered": 100,
  "qtyReceived": 30,
  "qtyOpenForGr": 70,
  "uom": "UNIT",
  "unitPrice": 25.00,
  "siteCode": "WAREHOUSE-A",
  "requiredDate": "2026-06-15"
}
```

### Query: GR with Linked PO and PR Context

**Purpose**: Retrieve full GR details including PO header, PR line allocations, and item descriptions.

**Definition**:
```sql
SELECT 
  gr.*,
  po.po_number,
  po.vendor_name,
  STRING_AGG(DISTINCT pr.pr_number, ', ') AS pr_numbers
FROM goods_receipts gr
INNER JOIN purchase_orders po ON gr.po_id = po.id
LEFT JOIN pr_line_allocations pla ON gr.po_id = ANY(
  SELECT po.id FROM purchase_orders po 
  WHERE po.id = gr.po_id
)
LEFT JOIN pr_lines prl ON pla.pr_line_id = prl.id
LEFT JOIN purchase_requisitions pr ON prl.pr_id = pr.id
WHERE gr.id = ?
GROUP BY gr.id, po.po_number, po.vendor_name;
```

---

## DTO Examples

### GR List Response (from GET /api/goods-receipts)

```json
{
  "items": [
    {
      "id": "gr-uuid-1",
      "grNumber": "GR-2026-0001",
      "status": "POSTED",
      "poNumber": "PO-2026-0001",
      "poVendor": "Acme Supplies",
      "createdAt": "2026-06-03T10:15:00Z",
      "updatedAt": "2026-06-03T10:30:00Z"
    },
    {
      "id": "gr-uuid-2",
      "grNumber": "GR-2026-0002",
      "status": "DRAFT",
      "poNumber": "PO-2026-0002",
      "poVendor": "Tech Distributors",
      "createdAt": "2026-06-03T11:00:00Z",
      "updatedAt": "2026-06-03T11:00:00Z"
    }
  ]
}
```

### GR Detail Response (from GET /api/goods-receipts/:id)

```json
{
  "id": "gr-uuid-1",
  "grNumber": "GR-2026-0001",
  "status": "DRAFT",
  "receiptDate": "2026-06-03",
  "notes": "Partial shipment received",
  "createdAt": "2026-06-03T10:15:00Z",
  "updatedAt": "2026-06-03T10:15:00Z",
  "po": {
    "id": "po-uuid",
    "poNumber": "PO-2026-0001",
    "vendorName": "Acme Supplies"
  },
  "lines": [
    {
      "id": "gr-line-uuid-1",
      "lineNo": 1,
      "poLineRef": "PO-2026-0001 Line 1",
      "itemCode": "SKU-123",
      "itemName": "Widget A",
      "qtyOrdered": 100,
      "qtyReceived": 50,
      "uom": "UNIT",
      "actualSiteCode": "WAREHOUSE-A"
    }
  ],
  "prNumbers": ["PR-2026-0001"]
}
```

### GR Create Request (to POST /api/goods-receipts)

```json
{
  "poId": "po-uuid-123",
  "receiptDate": "2026-06-03",
  "notes": "Received via courier",
  "lines": [
    {
      "poLineId": "po-line-uuid-1",
      "qtyReceived": 50,
      "actualSiteCode": "WAREHOUSE-A"
    },
    {
      "poLineId": "po-line-uuid-2",
      "qtyReceived": 30,
      "actualSiteCode": "WAREHOUSE-B"
    }
  ]
}
```

### GR Create Response (from POST /api/goods-receipts, 201 Created)

```json
{
  "id": "gr-uuid-123",
  "grNumber": "GR-2026-0001",
  "status": "DRAFT",
  "receiptDate": "2026-06-03",
  "notes": "Received via courier",
  "createdAt": "2026-06-03T10:15:00Z",
  "updatedAt": "2026-06-03T10:15:00Z",
  "po": {
    "id": "po-uuid-123",
    "poNumber": "PO-2026-0001"
  },
  "lines": [
    {
      "id": "gr-line-uuid-1",
      "lineNo": 1,
      "poLineId": "po-line-uuid-1",
      "qtyReceived": 50,
      "actualSiteCode": "WAREHOUSE-A"
    },
    {
      "id": "gr-line-uuid-2",
      "lineNo": 2,
      "poLineId": "po-line-uuid-2",
      "qtyReceived": 30,
      "actualSiteCode": "WAREHOUSE-B"
    }
  ]
}
```

---

## Summary

The GR data model is simple and well-constrained:

- **GoodsReceipt**: Header entity with lifecycle (DRAFT → POSTED)
- **GoodsReceiptLine**: Line items with qty_received and site mapping
- **Validations**: Over-receipt prevention, no zero quantities, status transitions
- **Relationships**: GR → PO (1:N), GR line → PO line (M:N), GR line → GR (1:N with cascade)
- **Audit Trail**: created_at, updated_at timestamps capture change history

This model supports the feature spec requirements (FR-001 through FR-012) and enables the core workflows: create with line selection, post to finalize, and view with traceability.
