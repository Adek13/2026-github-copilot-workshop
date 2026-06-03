# Research: GR Module Technical Decisions

**Phase 0 Output** | **Date**: June 3, 2026 | **Status**: Complete — All clarifications resolved

---

## Database Schema

### Decision
Use existing pre-created PostgreSQL tables: `goods_receipts` and `gr_lines` in `db/migrations/001_init_procurement_mvp.sql`.

### Rationale
Schema is already provisioned and stable. Tables include all required fields: status tracking (DRAFT/POSTED), temporal fields (created_at, updated_at), and foreign keys to purchase_orders and po_lines. No schema migrations required during implementation.

### Alternatives Considered
- Adding new migration: Rejected. Schema already exists and is tested; no new requirements discovered during planning.

---

## Backend Architecture Pattern

### Decision
Service + Route layer pattern with explicit validation and thin route handlers.

**Service layer**: Business logic, validations, database queries (using raw SQL, no ORM).
**Route layer**: HTTP mapping, request/response formatting, error handling delegation.

### Rationale
Mirrors existing PR/PO modules for consistency. Validation is explicit and readable. Service functions can be unit-tested independently. No ORM (per constitution) keeps code simple and transparent.

### Alternatives Considered
- Controller/repository pattern: Rejected. PR/PO already use service pattern; consistency matters for workshop learning.
- GraphQL: Rejected. Constitution mandates REST JSON; participants need to understand REST conventions.

---

## API Endpoint Design

### Decision
Three endpoints following REST conventions and existing PR/PO style:

1. **POST /api/goods-receipts** — Create GR in DRAFT status with line items
2. **POST /api/goods-receipts/:id/post** — Transition GR from DRAFT to POSTED
3. **GET /api/goods-receipts/:id** — Retrieve GR with full details and linked PO/PR context

Additional endpoint (may reuse existing or add):
4. **GET /api/purchase-orders/:id/open-lines** — Already exists in PO module; reuse for GR create page

### Rationale
Simple and teachable. Follows REST conventions: POST for creation and state transitions, GET for retrieval. No PUT/PATCH complexity. Matches existing PR/PO module style.

### Alternatives Considered
- PUT /api/goods-receipts/:id with status field: Rejected. POST with sub-endpoint (/post) is clearer for state transitions and aligns with PO module.
- Separate endpoints per line item (POST /api/goods-receipts/:id/lines): Rejected. Keep simple; line items are created together with GR header.

---

## Validation Strategy

### Decision
Two key validations:

1. **Over-receipt prevention**: `qty_received <= po_line.qty_ordered - (qty_already_received_across_all_grs)`
2. **No zero-quantity posting**: GR cannot transition to POSTED if any line has qty_received <= 0

Validation performed in service layer; errors returned with 400 status code and descriptive message.

### Rationale
Over-receipt validation is the core business rule mentioned in spec (FR-007). Zero-quantity check prevents meaningless receipts. Service-layer validation keeps business logic testable and reusable.

### Alternatives Considered
- Database-level constraints only: Rejected. Database constraints are good, but service-layer validation provides better error messages and user feedback.
- Client-side validation only: Rejected. Always validate server-side for security and consistency.

---

## Status Transition Rules

### Decision
One-way state machine: DRAFT → POSTED only.

- GR starts in DRAFT (editable).
- POST /api/goods-receipts/:id/post transitions to POSTED (locked, no further edits).
- No reverse transitions (no POSTED → DRAFT).

### Rationale
Simple and auditable. POSTED status indicates finalized receipt ready for payment/inventory processing. One-way prevents accidental reversals and keeps audit trail clean.

### Alternatives Considered
- Multi-way transitions (POSTED → DRAFT): Rejected. Adds complexity; workshop doesn't require reversal scenarios.
- Three-state machine (DRAFT → POSTED → CLOSED): Rejected. POSTED is sufficient for workshop scope.

---

## Frontend Component Architecture

### Decision
Vue 3 with Composition API (per vue-best-practices skill).

Three pages:
1. **GoodsReceiptList.vue** — Display all GRs with status badges
2. **GoodsReceiptCreate.vue** — Select PO lines, enter quantities, create GR
3. **GoodsReceiptDetail.vue** — View GR details, post if in DRAFT

Reuse baseline components and CSS variables for consistency.

### Rationale
Composition API is Vue 3 standard and preferred per skill guidance. Matches existing PR module structure. Reusing components reduces code and learning curve.

### Alternatives Considered
- Options API: Rejected. Constitution and skill specify Composition API for Vue 3.
- Separate components for each page section: Rejected. Keep pages focused and readable; extract components only when reused.

---

## Error Handling

### Decision
Explicit error messages returned in response body:

```json
{
  "message": "Received quantity (150) exceeds PO line allocated quantity (100)"
}
```

HTTP status codes:
- 201: Created (POST /api/goods-receipts success)
- 200: OK (GET, POST state change success)
- 400: Bad Request (validation failure)
- 404: Not Found (GR/PO not found)
- 500: Server Error (unexpected failure)

### Rationale
Clear messages help workshop participants understand validation failures. Matches existing PR/PO module error style. HTTP status codes are standard and predictable.

### Alternatives Considered
- Generic error codes: Rejected. Descriptive messages aid learning and debugging.
- Exceptions without catching: Rejected. Explicit error handling in service layer is cleaner and prevents crashes.

---

## Testing Approach

### Decision
Jest tests for service layer business logic (validation, status transitions, queries).
Playwright E2E tests for happy-path workflows (create → detail → post).

**Jest focus**: Over-receipt validation, zero-quantity prevention, DRAFT → POSTED transition.
**Playwright focus**: GR creation, detail page navigation, posting flow.

### Rationale
Jest validates critical business rules in isolation; Playwright validates end-to-end user flow. Minimum coverage for workshop (critical paths + one sad path).

### Alternatives Considered
- 100% code coverage: Rejected. Not practical for workshop; focus on critical paths.
- Only unit tests: Rejected. E2E tests provide confidence in user workflows.
- Only E2E tests: Rejected. Unit tests for business rules are faster to run and easier to debug.

---

## UI Patterns

### Decision
Reuse PR module patterns:
- Status badges: green for POSTED, default styling for DRAFT
- Form layout: card-based, with validation messages below fields
- Tables: columns for GR number, status, PO reference, created date
- Navigation: breadcrumb or back button for context
- Buttons: "Create GR", "Post GR", "Cancel"

### Rationale
Consistency reduces cognitive load for workshop participants. Familiar patterns make it easy to focus on learning GR-specific logic, not UI.

### Alternatives Considered
- Custom styling: Rejected. Reuse baseline CSS variables and component patterns.
- Different table layout: Rejected. PR module table structure is proven and accessible.

---

## Summary of Decisions

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Schema** | Use existing tables | Stable, no migrations needed |
| **Backend** | Service + Route pattern | Consistency with PR/PO; testable |
| **API** | 3 REST endpoints | Simple, teachable, REST-compliant |
| **Validation** | Service layer + over-receipt rule | Business-logic focused, auditable |
| **Status Machine** | DRAFT → POSTED only | Simple, one-way, audit-clean |
| **Frontend** | Vue 3 Composition API | Standard Vue 3 pattern |
| **Components** | Reuse PR module patterns | Consistency, reduced learning curve |
| **Errors** | Explicit messages + HTTP codes | Clear feedback, standard codes |
| **Testing** | Jest + Playwright critical paths | Fast feedback, user confidence |

All decisions align with workshop constitution (clarity, consistency, REST contracts, TDD) and existing baseline patterns.
