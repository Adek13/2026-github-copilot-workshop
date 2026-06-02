# Runbook: PO Backlog Checklist

Purpose: concise, actionable checklist to guide implementation, testing, and review of the Purchase Order (PO) backlog.

## Implementation Quality
- Keep route handlers thin; place business logic in service modules.
- Validate inputs and return clear, standard JSON error responses (use 4xx codes and consistent payload).
- Small, focused commits with descriptive messages; prefer feature branches per task.
- Add short inline notes for non-obvious business rules and reference migration files when changing schema.

## Testing
- Unit tests: cover core business rules (PO allocation guard, status transitions).
- Route tests: cover validation paths and error responses (422 cases).
- E2E smoke: seed APPROVED PR -> create PO -> submit PO -> view PO detail.
- Keep tests deterministic; mock external calls and run against a seeded test DB for integration tests.

## Documentation Discipline
- Update `docs/plan.md` and this runbook when changing endpoints or contracts.
- Add README snippets for setup changes or extra env vars needed for running PO flows.
- Document migration intent and schema changes inside migration files and commit messages.
- Include testing steps in PR descriptions to help reviewers verify behavior.

## Acceptance Criteria
- Backend: Jest tests pass for service layer and route validations.
- Frontend: PO pages exist, call API client methods, and surface backend validation messages.
- E2E: Playwright PO happy-path smoke test passes locally/CI.
- PR: includes brief testing steps, updated docs, and a checklist showing the above items satisfied.

## Quick Commands
- Run backend tests:

```bash
cd backend
npm test
```

- Run Playwright E2E (repo root):

```bash
npx playwright test tests/e2e/po-module.spec.js
```

---
Saved checklist for PO backlog implementation and review.
