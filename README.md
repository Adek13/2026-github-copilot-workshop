# Procurement MVP Copilot Workshop

A hands-on 5-hour workshop to build a web-based procurement management system while learning GitHub Copilot across the full development lifecycle.

## Overview

This workshop provides a baseline implementation of the Purchase Requisition (PR) module with a complete database schema and dashboard. Your task is to implement the **Purchase Order (PO) module** following the established patterns, with support from GitHub Copilot.

**What is included:**
- **Baseline**: Database schema, home dashboard, and PR module (list/create/detail views + REST APIs)
- **Your scope**: PO module implementation (list/create/detail views + REST APIs + business validations)
- **Out of scope**: Goods Receipt (GR) module—reserved for exploration after the workshop

For detailed specifications and API contracts, see [Project Plan](docs/plan.md).

## Technology Stack

| Component | Technology |
|-----------|------------|
| Backend API | Fastify + JavaScript (Node.js 18+) |
| Frontend | Vue 3 + Vite + JavaScript |
| Database | PostgreSQL (Docker) |
| Unit Testing | Jest |
| E2E Testing | Playwright |

## Project Structure

```
procurement-mvp/
├── backend/                    # Fastify REST API server
│   ├── src/
│   │   ├── app.js             # Application configuration
│   │   ├── routes/            # API endpoint handlers
│   │   ├── services/          # Business logic layer
│   │   └── db/                # Database connections
│   ├── tests/                 # Unit test suite
│   └── package.json
├── frontend/                   # Vue 3 SPA with Vite
│   ├── src/
│   │   ├── components/        # Reusable Vue components
│   │   ├── pages/             # Page-level layouts
│   │   ├── services/          # API client utilities
│   │   └── App.vue            # Root component
│   ├── tests/                 # Component and E2E tests
│   └── package.json
├── db/                        # Database management
│   ├── migrations/            # SQL schema files
│   └── seeds/                 # Sample dataset
├── docs/                      # Workshop documentation
│   ├── plan.md                # Specifications and API contracts
│   ├── how-it-works.md        # Architecture and data flow
│   └── progress.md            # Workshop progress tracking
├── tests/e2e/                 # Playwright E2E test suites
├── docker/                    # Docker configuration
└── docker-compose.yml         # Multi-service orchestration
```

## Quick Start

### Prerequisites

- Node.js v18 or higher
- Docker and Docker Compose
- Git

### Installation

#### Step 1: Clone Repository and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd 001-core-procurement-system

# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

#### Step 2: Initialize Database

```bash
docker compose up -d db
```

The database automatically:
- Runs schema migrations from `db/migrations/001_init_procurement_mvp.sql`
- Seeds sample data from `db/seeds/002_seed_procurement_mvp.sql`

Verify database readiness:

```bash
docker compose exec -T db psql -U workshop -d procurement_mvp \
  -c "SELECT pr_number, status FROM purchase_requisitions ORDER BY pr_number;"
```

Expected output: Sample PR records (e.g., PR-001, PR-002, etc.)

#### Step 3: Start Backend Server

In one terminal:

```bash
cd backend
npm run dev
```

Backend runs on `http://localhost:3000` and shows Fastify startup logs.

#### Step 4: Start Frontend Server

In another terminal:

```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:5173` and is ready for interaction in your browser.

## Available npm Scripts

All commands run from the project root or specified subdirectories.

### Development

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start backend and frontend concurrently |
| `npm run dev:backend` | Start backend development server only (Fastify) |
| `npm run dev:frontend` | Start frontend development server only (Vite) |

### Testing

| Command | Purpose |
|---------|---------|
| `npm run test:unit` | Run Jest unit tests (backend business logic) |
| `npm run test:e2e` | Run Playwright E2E tests in headless mode |
| `npm run test:e2e:ui` | Run Playwright tests with interactive UI (useful for debugging) |
| `npm run test:e2e:debug` | Run Playwright with debugger inspector attached |

### Build

| Command | Purpose |
|---------|---------|
| `npm run build:frontend` | Build Vue application for production |

### Database

| Command | Purpose |
|---------|---------|
| `docker compose up -d db` | Start PostgreSQL container |
| `docker compose down -v` | Stop all services and remove database volume (fresh start) |

## Module Breakdown

### Purchase Requisition (PR) Module — Baseline (Complete)

The PR module is fully implemented as a reference for your PO implementation.

**Features:**
- PR list view with status tracking (Draft, Approved, Rejected)
- Create new PR with multiple line items
- PR detail view with read-only display
- Soft delete for archived PRs

**Implemented APIs:**
- `GET /api/purchase-requisitions` — List PRs with optional filtering
- `POST /api/purchase-requisitions` — Create new PR
- `GET /api/purchase-requisitions/:id` — Retrieve PR detail
- Full validation for required fields

### Purchase Order (PO) Module — Your Implementation Scope

This is the module you must implement during the workshop. Follow the PR module patterns as your reference.

**Requirements:**
- PO list view with status tracking (Draft, Submitted, Received)
- Create new PO from approved PR lines (with validation)
- PO detail view
- Business validation: **allocation quantity ≤ PR line remaining quantity**
- Submit PO functionality with status transitions

**APIs to Implement:**
- `POST /api/purchase-orders` — Create new PO
- `GET /api/purchase-orders/:id` — Retrieve PO detail
- `GET /api/purchase-orders/:id/open-lines` — Retrieve available PR lines for allocation
- `POST /api/purchase-orders/:id/submit` — Submit PO (status transition)

**Key Business Validations:**
- Prevent over-allocation (PO quantity cannot exceed PR line remaining quantity)
- Enforce status transitions (Draft → Submitted → Received)
- Only allow PO creation from approved PR lines

### Goods Receipt (GR) Module — Out of Scope

This module is not part of the workshop implementation scope. It is available as an optional exploration activity after completing the backlog.

## Development Workflow

### Recommended Approach

1. **Study the Baseline** — Review the PR module implementation to understand:
   - Folder structure and file organization
   - Database schema and relationships
   - Established naming conventions and patterns
   - API design principles

2. **Review Documentation**
   - [Project Plan](docs/plan.md) — Full specifications, API contracts, and validation rules
   - [Architecture Guide](docs/how-it-works.md) — System overview and data flow

3. **Implement the PO Module** — Follow the PR module structure:
   - Backend routes: `backend/src/routes/purchase-orders.js`
   - Business services: `backend/src/services/purchase-orders.js`
   - Frontend pages: `frontend/src/pages/PurchaseOrders.vue`, `PODetail.vue`, `POCreate.vue`
   - E2E tests: `tests/e2e/po-module.spec.js`

4. **Test Continuously** — Run tests frequently as you build:
   ```bash
   npm run test:unit          # Validate backend logic
   npm run test:e2e:ui        # Debug E2E tests interactively
   ```

5. **Use Copilot Effectively** — Leverage GitHub Copilot for:
   - Generating CRUD endpoints following established patterns
   - Creating validation and business logic functions
   - Building Vue components
   - Writing comprehensive test cases

### Testing Strategy

**Unit Tests (Jest)** — Focus on business logic validation:
- PO over-allocation prevention
- Status transition rules
- Request input validation
- Edge cases and error conditions

**E2E Tests (Playwright)** — Focus on user workflows:
- Create PO from approved PR lines
- Submit PO with status transitions
- Verify error messages and validations
- End-to-end happy path scenarios

Before committing changes, run the full test suite:
```bash
npm run test:unit          # Quick validation
npm run test:e2e:ui        # Interactive debugging if needed
```

## Troubleshooting

### Database Connection Error

**Symptom:** `relation "purchase_requisitions" does not exist`

**Solution:**
```bash
# Remove existing volume and reinitialize
docker compose down -v
docker compose up -d db

# Check initialization logs
docker compose logs --no-color db | tail -n 50
```

**Verify Success** — Look for these lines in logs:
- `[initdb] Running baseline migration...`
- `[initdb] Seeding sample data...`
- `[initdb] Database initialization complete.`

### Port Already in Use

**Symptom:** Backend (port 3000) or Frontend (port 5173) fails to start

**Windows:**
```cmd
netstat -ano | findstr :3000
taskkill /PID <PID> /F

netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

**macOS/Linux:**
```bash
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
lsof -i :5173 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### Test Failures

**Solution** — Use interactive debugging tools:

```bash
# Debug E2E tests with UI
npm run test:e2e:ui

# Debug with Playwright Inspector
npm run test:e2e:debug
```

These tools allow you to step through tests and inspect element states in real time.

## Documentation

| Document | Purpose |
|----------|---------|
| [Project Plan](docs/plan.md) | Complete workshop specifications, API contracts, acceptance criteria |
| [Architecture Guide](docs/how-it-works.md) | System architecture overview and data flow |
| [Progress Tracking](docs/progress.md) | Monitor progress throughout the workshop |
| [Operations Runbook](docs/runbook.md) | Operational procedures and troubleshooting reference |

## Repository Hygiene

Generated test artifacts and build outputs are excluded from the repository via `.gitignore`:
- `playwright-report/` — E2E test reports and traces
- `test-results/` — Test execution results
- `backend/coverage/` — Backend unit test coverage reports
- `frontend/coverage/` — Frontend test coverage reports

**Note:** To share test evidence with instructors or team members, use screenshot files or external storage rather than committing artifacts to the repository.

## Learning Outcomes

After completing this workshop, you will have:
- A fully functional procurement MVP running in a production-like environment
- Hands-on experience implementing features with GitHub Copilot assistance
- Deep understanding of REST API design, validation, and business logic
- E2E test coverage for complex multi-module workflows
- Practical experience building components with Vue 3 and Fastify
- Confidence to build larger applications with Copilot as your development partner
