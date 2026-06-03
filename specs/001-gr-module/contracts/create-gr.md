# API Contract: Create Goods Receipt

**Endpoint**: `POST /api/goods-receipts`

**Purpose**: Create a new Goods Receipt in DRAFT status with line items selected from open PO lines.

---

## Request

### Headers

```
Content-Type: application/json
```

### Body

```json
{
  "poId": "UUID (string)",
  "receiptDate": "YYYY-MM-DD (date string, optional)",
  "notes": "text (string, optional, max 500 chars)",
  "lines": [
    {
      "poLineId": "UUID (string, required)",
      "qtyReceived": "number (decimal, required, > 0)",
      "actualSiteCode": "string (required, max 50 chars)"
    }
  ]
}
```

### Body Validation Rules

| Field | Type | Required | Constraints | Error Message |
|-------|------|----------|-----------|---------------|
| `poId` | UUID | Yes | Must be a valid UUID; PO must exist | "poId must be a valid UUID" or "Purchase order not found" |
| `receiptDate` | Date | No | Format YYYY-MM-DD; if provided, must be today or earlier | "receiptDate must be today or earlier" |
| `notes` | String | No | Max 500 characters | "notes must not exceed 500 characters" |
| `lines` | Array | Yes | Must contain at least 1 line item | "lines must contain at least one item" |
| `lines[].poLineId` | UUID | Yes | Must exist; must belong to specified PO | "poLineId not found for this PO" |
| `lines[].qtyReceived` | Number | Yes | Must be > 0; cannot exceed allocated qty | "qtyReceived must be greater than 0" or "Received quantity (X) exceeds PO line allocated quantity (Y)" |
| `lines[].actualSiteCode` | String | Yes | Max 50 chars; non-empty | "actualSiteCode is required" |

### Request Example

```json
{
  "poId": "550e8400-e29b-41d4-a716-446655440000",
  "receiptDate": "2026-06-03",
  "notes": "Received partial shipment via FedEx",
  "lines": [
    {
      "poLineId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "qtyReceived": 50,
      "actualSiteCode": "WAREHOUSE-A"
    },
    {
      "poLineId": "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
      "qtyReceived": 30,
      "actualSiteCode": "WAREHOUSE-B"
    }
  ]
}
```

---

## Response

### Success Response (201 Created)

```json
{
  "id": "UUID (string)",
  "grNumber": "string (format: GR-YYYY-NNNN)",
  "status": "DRAFT",
  "receiptDate": "YYYY-MM-DD or null",
  "notes": "string or null",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp",
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

### Success Response Example (201 Created)

```json
{
  "id": "a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6",
  "grNumber": "GR-2026-0001",
  "status": "DRAFT",
  "receiptDate": "2026-06-03",
  "notes": "Received partial shipment via FedEx",
  "createdAt": "2026-06-03T10:15:00.000Z",
  "updatedAt": "2026-06-03T10:15:00.000Z",
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

#### 400 Bad Request — Validation Failure

```json
{
  "message": "string (descriptive error message)"
}
```

**Common Scenarios**:

1. **Invalid poId**:
   ```json
   {
     "message": "poId must be a valid UUID"
   }
   ```

2. **PO not found**:
   ```json
   {
     "message": "Purchase order not found"
   }
   ```

3. **PO line not found**:
   ```json
   {
     "message": "One or more PO lines not found or do not belong to this purchase order"
   }
   ```

4. **Over-receipt**:
   ```json
   {
     "message": "Received quantity (120) exceeds PO line allocated quantity (100)"
   }
   ```

5. **Empty lines**:
   ```json
   {
     "message": "lines must contain at least one item"
   }
   ```

6. **Invalid quantity**:
   ```json
   {
     "message": "qtyReceived must be greater than 0"
   }
   ```

7. **Invalid receipt date**:
   ```json
   {
     "message": "receiptDate must be today or earlier"
   }
   ```

#### 500 Internal Server Error

```json
{
  "message": "Internal server error"
}
```

---

## Workflow

1. Frontend calls `POST /api/goods-receipts` with request body
2. Backend validates:
   - poId is UUID and PO exists
   - lines array is non-empty
   - Each poLineId exists and belongs to specified PO
   - Each qtyReceived > 0 and does not exceed allocated qty (over-receipt check)
3. If validation passes:
   - Generate GR number (GR-YYYY-NNNN)
   - Create goods_receipt row with status = DRAFT
   - Create gr_lines rows for each line
   - Return 201 with full GR object
4. If validation fails:
   - Return 400 with descriptive error message

---

## Status Codes

| Code | Meaning | When |
|------|---------|------|
| 201 | Created | GR successfully created |
| 400 | Bad Request | Validation failure (missing field, invalid value, over-receipt) |
| 500 | Server Error | Unexpected server-side error |

---

## Notes

- `grNumber` is auto-generated by backend based on count of existing GRs
- All timestamps are ISO 8601 format, UTC timezone
- GR always created in DRAFT status; user must call /post endpoint to finalize
- Over-receipt validation uses current allocated_qty; concurrent GR creates could theoretically cause race condition (acceptable per workshop constitution: last-write-wins)
