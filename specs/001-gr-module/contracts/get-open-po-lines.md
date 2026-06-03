# API Contract: Get Open PO Lines

**Endpoint**: `GET /api/purchase-orders/:id/open-lines`

**Purpose**: Retrieve all open (unallocated) PO lines for a purchase order, used by the GR Create page to let users select which lines to receive.

**Note**: This endpoint is part of the PO module and is reused by the GR module. Documented here for reference.

---

## Request

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Unique identifier of the Purchase Order |

### Headers

```
Content-Type: application/json
```

### Query Parameters

None

---

## Response

### Success Response (200 OK)

```json
{
  "items": [
    {
      "id": "UUID (string)",
      "poNumber": "string (format: PO-YYYY-NNNN)",
      "lineNo": "integer (1-based)",
      "itemCode": "string",
      "itemName": "string",
      "qtyOrdered": "number (decimal)",
      "qtyReceived": "number (decimal)",
      "qtyOpenForGr": "number (decimal, calculated: qtyOrdered - qtyReceived)",
      "uom": "string (UNIT, CASE, BOX, etc.)",
      "unitPrice": "number (decimal)",
      "siteCode": "string",
      "requiredDate": "YYYY-MM-DD or null"
    }
  ]
}
```

### Success Response Example (200 OK)

```json
{
  "items": [
    {
      "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "poNumber": "PO-2026-0001",
      "lineNo": 1,
      "itemCode": "SKU-001",
      "itemName": "Widget A",
      "qtyOrdered": 100,
      "qtyReceived": 0,
      "qtyOpenForGr": 100,
      "uom": "UNIT",
      "unitPrice": 25.50,
      "siteCode": "WAREHOUSE-A",
      "requiredDate": "2026-06-15"
    },
    {
      "id": "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
      "poNumber": "PO-2026-0001",
      "lineNo": 2,
      "itemCode": "SKU-002",
      "itemName": "Gadget B",
      "qtyOrdered": 75,
      "qtyReceived": 25,
      "qtyOpenForGr": 50,
      "uom": "CASE",
      "unitPrice": 150.00,
      "siteCode": "WAREHOUSE-B",
      "requiredDate": "2026-06-20"
    }
  ]
}
```

### Empty Response (200 OK) — No open lines

```json
{
  "items": []
}
```

### Error Responses

#### 404 Not Found — PO does not exist

```json
{
  "message": "Purchase order not found"
}
```

#### 400 Bad Request — Invalid ID format

```json
{
  "message": "Invalid PO ID format"
}
```

#### 500 Internal Server Error

```json
{
  "message": "Internal server error"
}
```

---

## Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier of PO line |
| `poNumber` | String | PO number (for reference) |
| `lineNo` | Integer | Line sequence within PO (1-based) |
| `itemCode` | String | Item/SKU code |
| `itemName` | String | Item description |
| `qtyOrdered` | Decimal | Total quantity ordered on this PO line |
| `qtyReceived` | Decimal | Quantity received across all GRs so far |
| `qtyOpenForGr` | Decimal | **Calculated**: qtyOrdered - qtyReceived; available to receive in a new GR |
| `uom` | String | Unit of measure (UNIT, CASE, BOX, etc.) |
| `unitPrice` | Decimal | Unit price |
| `siteCode` | String | Delivery/storage location |
| `requiredDate` | Date | Required delivery date (nullable) |

---

## Usage in Frontend

### GR Create Page

1. User navigates to "Create Goods Receipt" page
2. User selects a PO from dropdown or search
3. Frontend calls `GET /api/purchase-orders/:poId/open-lines`
4. Backend returns list of PO lines with available quantities
5. Frontend displays table with:
   - Checkbox (to select line for GR)
   - Item code + name
   - Qty ordered + qty open for GR
   - Unit price
   - UOM
6. User checks lines to include in GR
7. For each selected line, user enters `qtyReceived` (must be ≤ qtyOpenForGr)
8. User submits → calls `POST /api/goods-receipts`

---

## Query Logic

Backend queries for open lines using:

```sql
SELECT 
  po_lines.id,
  po_lines.po_id,
  po_lines.line_no,
  po_lines.item_code,
  po_lines.item_name,
  po_lines.qty_ordered,
  po_lines.qty_received,
  (po_lines.qty_ordered - po_lines.qty_received) AS qty_open_for_gr,
  po_lines.uom,
  po_lines.unit_price,
  po_lines.site_code,
  po_lines.required_date,
  po.po_number
FROM po_lines
INNER JOIN purchase_orders po ON po_lines.po_id = po.id
WHERE po.id = ?
  AND po_lines.qty_ordered > po_lines.qty_received
ORDER BY po_lines.line_no ASC;
```

**Filter**: Only lines where `qty_ordered > qty_received` (i.e., open lines with unallocated qty).

---

## Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | PO found; returns open lines (possibly empty) |
| 400 | Bad Request | Invalid ID format |
| 404 | Not Found | PO not found by ID |
| 500 | Server Error | Unexpected server-side error |

---

## Notes

- Only lines with `qtyOpenForGr > 0` are included in response (i.e., not fully received)
- `qtyOpenForGr` is calculated in response; not stored in database
- This endpoint is idempotent and read-only; can be called multiple times without side effects
- If PO has no open lines, response is 200 with empty items array
- All decimal fields (qty, price) are returned as numbers; precision is Decimal(14,2) in database
- All timestamps are ISO 8601 format, UTC timezone
