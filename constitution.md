<!-- 
SYNC IMPACT REPORT (v1.0.0)
=================================
Initial Constitution Created for Procurement MVP Workshop
- Version: 1.0.0 (new)
- Ratified: 2026-06-03
- Principles: 5 core principles
- New Sections: Scope Constraints, Technology Stack, Code & UI Guidelines
- Templates to sync: plan-template.md, spec-template.md, tasks-template.md
-->

# Procurement MVP Constitution

## Core Principles

### I. Module-First Architecture
Build the procurement system in cohesive, independently deployable modules: **Purchase Requisition (PR)**, **Purchase Order (PO)**, and **Goods Receipt (GR)**.
- Each module owns its data, API routes, and business logic
- Modules interact only via well-defined REST contracts
- PR module is baseline; PO module is primary workshop focus; GR is exploration phase
- No cross-module database dependencies or tight coupling

### II. Workshop Clarity Over Complexity
Prioritize participant learning and code clarity over production-grade enterprise features.
- Avoid SSO, advanced approval matrices, workflow engines, reporting
- Keep code files short and readable for teaching context
- Use explicit naming and simple patterns; no clever abstractions
- When tradeoff arises between robustness and clarity, choose clarity
- Design for workshop participants, not production scale

### III. REST API Contracts (Non-Negotiable)
All inter-service and frontend-backend communication MUST use REST JSON API with clear contracts.
- Each endpoint MUST have documented request/response schemas
- Validation MUST be explicit in route handlers or service layer
- Error responses MUST include descriptive messages and HTTP status codes
- API compatibility MUST be maintained across module versions (see plan.md for endpoints)
- No breaking API changes without versioning strategy

### IV. Test-Driven Development (Required)
Tests MUST be written before or alongside implementation, not after.
- **Jest**: Unit and service logic tests; validate business rules (e.g., PO allocation limits)
- **Playwright**: E2E tests for page flows integrated with real baseline data
- Focus on critical paths: PR submission, PO creation from PR lines, allocation validation
- Minimum coverage for new features: happy path + one sad path per business rule
- Do NOT over-invest in test framework complexity; keep tests readable

### V. Consistent UI & Code Patterns
Follow baseline UI design and code style for cohesion across the workshop.
- Reuse CSS variables defined in baseline for colors, spacing, typography
- Copy existing Vue component patterns for consistency (e.g., form layouts, tables)
- Use explicit service functions for API calls; keep route handlers thin
- Never use emojis in UI or commit messages; create custom SVG icons if needed
- Naming MUST be clear: avoid abbreviations, use full words (e.g., `purchaseOrder` not `po`)

## Scope Constraints

The workshop builds in phases:

| Phase | Status | Scope |
|-------|--------|-------|
| **PR Module** | ✅ Baseline | Database schema, dashboard, PR CRUD, list/create/detail pages, API endpoints |
| **PO Module** | 🔨 Backlog | PO CRUD, list/create/detail pages, API endpoints, allocation validation |
| **GR Module** | ⏳ Exploration | Out of scope during workshop; reserved for post-backlog learning |
| **Bookmarks** | 📋 Optional | Post-backlog feature; driven via GitHub Issues |

**Out of scope (do NOT implement):**
- SSO, multi-tenancy, advanced permissions
- Reporting, analytics, dashboards beyond baseline
- Notifications, email, webhooks
- Enterprise compliance rules, audit trails (beyond basic schema)
- Payment processing, supplier invoice matching

## Technology Stack (Fixed)

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend Framework | Fastify | Node.js 18+ |
| Backend Language | JavaScript | ES6+ |
| Frontend Framework | Vue | 3 + Vite |
| Frontend Language | JavaScript | ES6+ |
| Database | PostgreSQL | 16 (Docker) |
| Unit Testing | Jest | Latest |
| E2E Testing | Playwright | Latest |
| ORM / Query Builder | **None** (raw SQL) | Do NOT use Prisma |
| API Style | REST JSON | — |

## Code & UI Guidelines

### Backend Code Style
- Favor service functions for business logic (validation, state transitions, queries)
- Route handlers MUST be thin: validate input → call service → return result
- Use explicit error handling; no silent failures
- Database queries MUST be readable; use SQL directly (no ORMs)
- Folder structure: `routes/`, `services/`, `db/`, `tests/`

### Frontend Code Style
- Reuse baseline Vue components: follow the same structure, naming, slot patterns
- Use existing CSS variables (`--color-primary`, `--spacing-base`, etc.)
- Forms MUST have basic validation feedback shown to user
- Page naming: `PurchaseRequisitionList.vue`, `PurchaseOrderDetail.vue` (full names, PascalCase)
- Folder structure: `pages/`, `components/`, `services/`

### Commit Message & UI
- Commit messages: clear, imperative tone; no emojis
  - ✅ Good: `feat: add PO create endpoint with allocation validation`
  - ❌ Bad: `add stuff 🎉`, `wip`, `fix it`
- UI text: clear and concise; no humor or slang
- All forms MUST show clear error and success messages

## Governance

**Constitution Authority**: This constitution supersedes all conflicting development practices. When in doubt, defer to the Core Principles.

**Amendment Process**:
1. Proposed change MUST document current principle/section, rationale, and impact
2. Changes to Core Principles require explicit sign-off from workshop lead
3. All amendments MUST update `LAST_AMENDED_DATE` and increment `CONSTITUTION_VERSION`
4. Version rules: MAJOR for principle removals/redefinitions, MINOR for additions/expansions, PATCH for clarifications

**Compliance Review**:
- All PRs MUST verify alignment with principles before merge
- New features MUST justify any deviations from scope constraints
- Test coverage MUST satisfy principle IV requirements before deployment
- Runtime guidance lives in [docs/plan.md](../../../docs/plan.md), [docs/how-it-works.md](../../../docs/how-it-works.md), and `.github/copilot-instructions.md`

**Version**: 1.0.0 | **Ratified**: 2026-06-03 | **Last Amended**: 2026-06-03
