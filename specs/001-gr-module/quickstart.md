# Quickstart: GR Module Implementation

**Phase 1 Output** | **Date**: June 3, 2026 | **Target**: Ready for Phase 2 task breakdown and implementation

---

## Overview

This guide provides setup instructions and running procedures for the GR (Goods Receipt) module implementation during the workshop.

---

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ 
- Git with feature branch `feature/gr-module-frameworked` checked out
- Database seeded with baseline PR and PO data
- Understanding of PR module code patterns (routes, services, validations)

---

## Local Setup

### 1. Install Dependencies

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install

cd ..
```

### 2. Start PostgreSQL and Backend

```bash
# Start Docker services (PostgreSQL on port 5432)
docker-compose up -d

# Run backend (Fastify on port 3001)
cd backend
npm start
```

Backend will:
- Connect to PostgreSQL
- Run migrations from `db/migrations/`
- Start HTTP server on http://localhost:3001

### 3. Start Frontend Development Server

```bash
# In a new terminal
cd frontend
npm run dev
```

Frontend will start on http://localhost:5173 with hot module reloading.

### 4. Verify Baseline Data

Open http://localhost:5173 in browser and navigate to Dashboard.

**Expected**:
- PR list shows seeded purchase requisitions
- PO list shows seeded purchase orders
- Both modules functioning (PR and PO should have data)

---

## Implementation Workflow

### Phase 1: Backend Service & Routes (Estimated 1–2 hours)

**Files to create**:
- `backend/src/services/goods-receipt-service.js` — Business logic + validations
- `backend/src/routes/goods-receipt-routes.js` — HTTP endpoints
- `backend/tests/goods-receipt-service.test.js` — Jest unit tests

**Files to modify**:
- `backend/src/app.js` — Register GR routes

**Key Functions** (Service):
- `createGoodsReceipt(db, payload)` — Create GR with line items, validate over-receipt
- `postGoodsReceipt(db, grId)` — Transition GR from DRAFT to POSTED
- `getGoodsReceiptById(db, grId)` — Retrieve GR with full details and PR context
- `listGoodsReceipts(db)` — List all GRs
- `getOpenPoLines(db, poId)` — Retrieve open lines for a PO (reuse from PO module)

**Validation Functions**:
- `validateCreatePayload(payload)` — Check required fields, format
- `validateOverReceipt(db, poLineId, qtyRequested)` — Core business rule
- `validateStatusTransition(currentStatus, newStatus)` — DRAFT → POSTED only

**Database Helpers**:
- `queryGrWithDetails(db, grId)` — Join goods_receipts, gr_lines, po, pr via allocations

### Phase 2: Frontend Pages (Estimated 2–3 hours)

**Files to create**:
- `frontend/src/pages/GoodsReceiptList.vue` — GR list page
- `frontend/src/pages/GoodsReceiptCreate.vue` — GR create page
- `frontend/src/pages/GoodsReceiptDetail.vue` — GR detail page

**Files to modify**:
- `frontend/src/api.js` — Add GR API endpoints
- `frontend/src/router/index.js` — Add GR routes
- `frontend/src/App.vue` — Add GR navigation link (if needed)

**Key Components**:
- GoodsReceiptList: Table with GR number, status badge, PO ref, created date
- GoodsReceiptCreate: PO selector, line selection table, qty input fields, validation messages
- GoodsReceiptDetail: GR header info, line items table, PO/PR links, "Post GR" button

### Phase 3: Testing (Estimated 1–2 hours)

**Backend tests** (`backend/tests/goods-receipt-service.test.js`):
- Test over-receipt validation (rejects qty > allocated)
- Test zero-quantity prevention
- Test DRAFT → POSTED transition
- Test queryGrWithDetails joins

**Frontend tests** (`frontend/tests/e2e/goods-receipt-*.spec.js`):
- GR List: Render table with seed data GRs
- GR Create: Select PO, select lines, enter qty, create GR, redirect to detail
- GR Detail: Display GR, show "Post GR" button (if DRAFT), post GR, verify status change

---

## Key Design Decisions (from research.md)

1. **Service Layer Pattern**: Thin routes → thick services (mirrors PR/PO modules)
2. **Over-Receipt Validation**: Service-layer check before creating GR line
3. **Status Machine**: DRAFT → POSTED only (one-way)
4. **Error Handling**: Explicit messages, HTTP status codes (201, 200, 400, 404, 500)
5. **UI Reuse**: Leverage PR module patterns (status badges, form layout, tables)

---

## API Endpoints to Implement

| Method | Endpoint | Purpose | Status Code |
|--------|----------|---------|-------------|
| POST | /api/goods-receipts | Create GR | 201 |
| GET | /api/goods-receipts/:id | Get GR detail | 200 |
| POST | /api/goods-receipts/:id/post | Post GR (transition to POSTED) | 200 |
| GET | /api/purchase-orders/:id/open-lines | Get open lines (reuse from PO) | 200 |

**Contracts** (detailed specs):
- See `specs/001-gr-module/contracts/create-gr.md`
- See `specs/001-gr-module/contracts/post-gr.md`
- See `specs/001-gr-module/contracts/get-gr.md`
- See `specs/001-gr-module/contracts/get-open-po-lines.md`

---

## Database Tables (Already Created)

```sql
-- goods_receipts table
CREATE TABLE goods_receipts (
  id UUID PRIMARY KEY,
  gr_number VARCHAR(30) NOT NULL UNIQUE,
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL CHECK (status IN ('DRAFT', 'POSTED')),
  receipt_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- gr_lines table
CREATE TABLE gr_lines (
  id UUID PRIMARY KEY,
  gr_id UUID NOT NULL REFERENCES goods_receipts(id) ON DELETE CASCADE,
  po_line_id UUID NOT NULL REFERENCES po_lines(id) ON DELETE RESTRICT,
  line_no INT NOT NULL,
  qty_received NUMERIC(14,2) NOT NULL CHECK (qty_received > 0),
  actual_site_code VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (gr_id, line_no)
);
```

No migrations required. Tables are pre-created and indexed.

---

## Running Tests

### Backend Unit Tests (Jest)

```bash
cd backend
npm test -- tests/goods-receipt-service.test.js
```

Expected: 8–10 tests covering validations and status transitions.

### Frontend E2E Tests (Playwright)

```bash
cd frontend
npm run test:e2e -- goods-receipt
```

Expected: 5–7 tests covering GR list, create, detail, and post workflows.

### Run All Tests

```bash
# From project root
npm test
```

---

## Debugging

### Backend

**Enable logs** in `backend/src/services/goods-receipt-service.js`:
```javascript
console.log('[GR Service] Creating GR with payload:', payload);
console.log('[GR Service] Over-receipt check failed:', error);
```

**Check database directly**:
```bash
# Open PostgreSQL shell
docker exec -it procurement-db psql -U postgres -d procurement_mvp

# Query GRs
SELECT * FROM goods_receipts;
SELECT * FROM gr_lines;
```

### Frontend

**Vue DevTools** browser extension: Inspect component state during GR creation.

**Network tab** (DevTools F12):
- Watch API requests: POST /api/goods-receipts, POST /post, GET /details
- Verify request/response bodies match contracts

---

## Common Issues

### Issue: Over-receipt validation always passes

**Cause**: Validation not implemented in service.

**Fix**: Implement `validateOverReceipt()` in `goods-receipt-service.js`:
```javascript
const allocatedQty = // query po_lines.qty_ordered - sum(gr_lines.qty_received)
if (qtyReceived > allocatedQty) {
  throw new Error(`Received quantity exceeds allocated: ${qtyReceived} > ${allocatedQty}`);
}
```

### Issue: GR posting fails with "Status already POSTED"

**Cause**: Idempotence logic issue (if calling /post twice).

**Expected Behavior**: Second /post call should return 400 with message "Goods Receipt is already posted".

**Verify**: Check `postGoodsReceipt()` service logic:
```javascript
if (gr.status === 'POSTED') {
  const error = new Error('Goods Receipt is already posted');
  error.statusCode = 400;
  throw error;
}
```

### Issue: Frontend GR Create page shows no PO lines

**Cause**: `GET /api/purchase-orders/:id/open-lines` endpoint not working.

**Fix**: 
1. Verify PO endpoint exists and returns data
2. Check API call in frontend: `api.js` method name and URL
3. Verify seed data has POs with open lines (qty_ordered > qty_received)

---

## Deployment Checklist (Pre-Merge)

Before merging feature branch to main:

- [ ] Backend service passes all Jest tests
- [ ] Frontend passes all Playwright E2E tests
- [ ] GR Create page creates GR in DRAFT status
- [ ] GR Detail page displays GR with linked PO/PR
- [ ] GR Post page transitions GR to POSTED and locks editing
- [ ] Over-receipt validation blocks invalid quantities
- [ ] Error messages are descriptive and helpful
- [ ] UI follows baseline patterns (status badges, forms, tables)
- [ ] Code style matches PR/PO modules (service layer, naming conventions)
- [ ] API contracts documented and validated

---

## Summary

1. **Setup**: Install deps, start Docker + backend + frontend
2. **Implement**: Backend service/routes → Frontend pages → Tests
3. **Test**: Jest (business logic) + Playwright (E2E workflows)
4. **Deploy**: Verify all tests pass, merge feature branch

**Estimated Total Time**: 4–7 hours for experienced developers; 8–12 hours for workshop participants learning patterns.

**Success Criteria**:
- GR list/create/detail pages functional
- All validations working (over-receipt, status transitions)
- Baseline UI patterns applied
- Tests passing (>80% critical paths covered)
