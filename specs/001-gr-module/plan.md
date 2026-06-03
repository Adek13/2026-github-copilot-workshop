# Implementation Plan: Goods Receipt (GR) Module

**Branch**: `feature/gr-module-frameworked` | **Date**: June 3, 2026 | **Spec**: [specs/001-gr-module/spec.md](specs/001-gr-module/spec.md)

**Input**: Feature specification from `/specs/001-gr-module/spec.md`

## Summary

Implement a Goods Receipt (GR) module enabling warehouse staff to receive items against purchase orders with over-receipt validation and status tracking. GR is created in DRAFT status by selecting PO lines and entering received quantities, then posted to POSTED status to finalize. The module reuses backend patterns from the PR module, integrates with the PO data model, and follows established UI conventions. Core validations: received_qty ≤ PO line allocated_qty, and no posting with zero quantities.

## Technical Context

**Language/Version**: JavaScript (ES6+) | Node.js 18+

**Backend Framework**: Fastify 4.x with custom middleware/plugins

**Frontend Framework**: Vue 3 + Vite

**Primary Dependencies**: 
- Backend: `uuid`, `pg` (PostgreSQL), `lodash` utilities
- Frontend: Vue Router, built-in Fetch API (no external HTTP library)

**Storage**: PostgreSQL 16 (Docker local) — tables `goods_receipts`, `gr_lines` pre-created; schema stable

**Testing**: 
- Unit: Jest (backend business logic)
- E2E: Playwright (frontend workflows)

**Target Platform**: Web browser (desktop/laptop); no mobile support

**Project Type**: Multi-tier web application (backend API + Vue SPA)

**Performance Goals**: 
- GR List load: <2s for 100+ items
- GR Detail load: <2s with linked PO/PR context
- API endpoints: <500ms per request
- Happy path (create → detail → post): <3 minutes

**Constraints**: 
- Workshop-first design; prioritize clarity over enterprise features
- No SSO, advanced approvals, payment integration, quality inspection
- Concurrent edit policy: last-write-wins (acceptable for workshop)
- API compatibility maintained across PR/PO/GR modules

**Scale/Scope**: 
- Scope: GR list/create/detail pages + 3 endpoints (POST create, POST post, GET detail)
- Participants: ~20–30 workshop attendees
- Data: baseline seeded POs; up to 100 GRs in demo
- Code: ~400–500 lines backend (service + routes) + ~300–400 lines frontend (pages/components)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

✅ **Module-First Architecture** — GR module is cohesive and independently deployable. Data model (goods_receipts, gr_lines) is owned by GR; interaction with PR/PO modules is via REST contracts only. Database foreign keys enforce referential integrity but no circular dependencies.

✅ **Workshop Clarity Over Complexity** — No SSO, workflow engines, reporting. Service functions are explicit and readable. Validations are simple: qty check and status transition. Error messages are descriptive. Code files kept short (~200–300 lines per file).

✅ **REST API Contracts** — All endpoints documented with request/response schemas. Validation explicit in service layer. Error responses include HTTP status codes and messages. API compatible with PR/PO module style (same route structure, same error format).

✅ **Test-Driven Development** — Jest tests for over-receipt validation (qty_received ≤ allocated_qty) and status transitions. Playwright E2E tests for happy path (create → detail → post). Focus on critical paths; no over-engineering of test frameworks.

✅ **Consistent UI & Code Patterns** — Reuse PR module Vue patterns (form layout, status badges, navigation). CSS variables from baseline applied. Service functions thin and explicit. SVG icons only (no emojis). Component naming clear: `GoodsReceiptList.vue`, `GoodsReceiptDetail.vue`, not abbreviations.

**Violations**: None. This feature aligns fully with workshop constitution.

## Project Structure

### Documentation (this feature)

```text
specs/001-gr-module/
├── plan.md              # This file (main implementation plan)
├── spec.md              # Feature specification (user stories, requirements)
├── research.md          # Phase 0 output (resolved technical decisions)
├── data-model.md        # Phase 1 output (GR entities, validations)
├── quickstart.md        # Phase 1 output (setup & running guide)
├── contracts/           # Phase 1 output (API request/response schemas)
│   ├── create-gr.md
│   ├── post-gr.md
│   ├── get-gr.md
│   └── get-open-po-lines.md
└── tasks.md             # Phase 2 output (GitHub Issues; created by /speckit.tasks)
```

### Source Code (repository)

```text
backend/
├── src/
│   ├── routes/
│   │   ├── requisition-routes.js        [existing PR module]
│   │   ├── purchase-order-routes.js     [existing PO module]
│   │   └── goods-receipt-routes.js      [NEW: GR routes]
│   ├── services/
│   │   ├── requisition-service.js       [existing PR module]
│   │   ├── purchase-order-service.js    [existing PO module]
│   │   └── goods-receipt-service.js     [NEW: GR business logic & validation]
│   ├── db/
│   │   └── queries.js                   [existing; may add GR query helpers]
│   ├── app.js                           [main app; register new route]
│   └── ...
└── tests/
  ├── goods-receipt-service.test.js    [NEW: Jest tests for GR validation & status]
  └── ...

frontend/
├── src/
│   ├── pages/
│   │   ├── PurchaseRequisitionList.vue  [existing PR]
│   │   ├── PurchaseOrderList.vue        [existing PO]
│   │   ├── GoodsReceiptList.vue         [NEW: GR list page]
│   │   ├── GoodsReceiptCreate.vue       [NEW: GR create page]
│   │   └── GoodsReceiptDetail.vue       [NEW: GR detail page]
│   ├── components/
│   │   ├── PrTable.vue                  [existing reused component]
│   │   └── [possibly reuse for GR]
│   ├── api.js                           [existing; add GR endpoints]
│   ├── router/
│   │   └── index.js                     [existing; add GR routes]
│   └── ...
└── tests/
  ├── e2e/
  │   ├── goods-receipt-list.spec.js   [NEW: E2E tests]
  │   ├── goods-receipt-create.spec.js [NEW: E2E tests]
  │   └── goods-receipt-detail.spec.js [NEW: E2E tests happy path]
  └── ...

db/
├── migrations/
│   └── 001_init_procurement_mvp.sql     [existing; GR tables pre-created]
└── seeds/
  └── seed-data.js                     [existing; may seed sample POs for GR testing]
```

**Structure Decision**: Multi-tier web application with:
- Backend: Fastify routes + service layer + database queries (no ORM)
- Frontend: Vue 3 pages with components, API service layer
- Database: PostgreSQL with existing schema; GR tables ready
- This structure mirrors the PR/PO modules for consistency and participant learning

## Complexity Tracking

No Constitution violations. No additional complexity justification needed.
