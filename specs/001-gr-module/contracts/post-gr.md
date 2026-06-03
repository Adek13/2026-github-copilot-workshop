# API Contract: Post Goods Receipt

**Endpoint**: `POST /api/goods-receipts/:id/post`

**Purpose**: Transition a Goods Receipt from DRAFT to POSTED status, finalizing the receipt and locking it from further edits.

---

## Request

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Unique identifier of the GR to post |

### Headers

```
Content-Type: application/json
```

### Body

Empty body (no parameters required)

```json
{}
```

---

## Response

### Success Response (200 OK)

```json
{
  "id": "UUID (string)",
  "grNumber": "string (format: GR-YYYY-NNNN)",
  "status": "POSTED",
  "receiptDate": "YYYY-MM-DD or null",
  "notes": "string or null",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp (updated to current time)",
  "po": {
    "id": "UUID",
    "poNumber": "string",
    "vendorName": "string"
  },
  "lines": [
    {
      "id": "UUID",
      "lineNo": "integer (1-based)",
      "poLineId": "UUID",
      "qtyReceived": "number (decimal)",
      "actualSiteCode": "string"
    }
  ]
}
```

### Success Response Example (200 OK)

```json
{
  "id": "a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6",
  "grNumber": "GR-2026-0001",
  "status": "POSTED",
  "receiptDate": "2026-06-03",
  "notes": "Received partial shipment via FedEx",
  "createdAt": "2026-06-03T10:15:00.000Z",
  "updatedAt": "2026-06-03T10:30:00.000Z",
  "po": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "poNumber": "PO-2026-0001",
    "vendorName": "Acme Supplies Inc."
  },
  "lines": [
    {
      "id": "line-uuid-1",
      "lineNo": 1,
      "poLineId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "qtyReceived": 50,
      "actualSiteCode": "WAREHOUSE-A"
    },
    {
      "id": "line-uuid-2",
      "lineNo": 2,
      "poLineId": "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
      "qtyReceived": 30,
      "actualSiteCode": "WAREHOUSE-B"
    }
  ]
}
```

### Error Responses

#### 404 Not Found — GR does not exist

```json
{
  "message": "Goods Receipt not found"
}
```

#### 400 Bad Request — Validation Failure

```json
{
  "message": "string (descriptive error message)"
}
```

**Common Scenarios**:

1. **GR already posted**:
   ```json
   {
     "message": "Goods Receipt is already posted"
   }
   ```

2. **GR has no line items**:
   ```json
   {
     "message": "Cannot post GR with no line items"
   }
   ```

3. **GR has line items with zero/null quantities**:
   ```json
   {
     "message": "All line items must have received quantities greater than 0"
   }
   ```

4. **Invalid GR ID format**:
   ```json
   {
     "message": "Invalid GR ID format"
   }
   ```

#### 500 Internal Server Error

```json
{
  "message": "Internal server error"
}
```

---

## State Transition Logic

**Preconditions** (must be true to post):
- GR exists and is found by ID
- GR status is currently DRAFT
- GR has at least one line item
- All line items have qtyReceived > 0

**Postconditions** (after successful post):
- GR status changes to POSTED
- updatedAt timestamp is refreshed to current time
- GR is locked from further edits (no DELETE or line item modifications)

**Side Effects**:
- If implemented: PO lines' qty_received is updated to reflect the GR line quantities

---

## Workflow

1. Frontend calls `POST /api/goods-receipts/:id/post` with empty body
2. Backend validates:
   - GR with ID exists
   - GR status is DRAFT (not already POSTED)
   - GR has at least one line item
   - All line items have qtyReceived > 0
3. If validation passes:
   - Update goods_receipts row: status = POSTED, updated_at = NOW()
   - Optionally update po_lines: qty_received += sum(gr_lines.qty_received) — **implementation detail**
   - Return 200 with updated GR object
4. If validation fails:
   - Return 400 or 404 with descriptive error message

---

## Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | GR successfully posted |
| 400 | Bad Request | Validation failure (already posted, no line items, zero quantities, invalid ID) |
| 404 | Not Found | GR not found by ID |
| 500 | Server Error | Unexpected server-side error |

---

## Idempotence

**Not idempotent**: Calling /post on an already POSTED GR returns 400 error (not 200).

Rationale: State transitions should be explicit and not silently succeed on already-final states. This helps catch bugs and unintended requests.

---

## Notes

- Posting is a one-way transition: POSTED GRs cannot revert to DRAFT
- Once posted, GR line items are read-only from the frontend (display only)
- If po_lines.qty_received is updated during posting, this signals downstream systems (e.g., inventory, payment) that receipt is complete
- All timestamps are ISO 8601 format, UTC timezone
- The updatedAt field is explicitly refreshed to allow frontend to detect when posting completed
