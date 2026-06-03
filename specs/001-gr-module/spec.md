# Feature Specification: Goods Receipt (GR) Module

**Feature Branch**: `001-gr-module`

**Created**: June 3, 2026

**Status**: Draft

**Input**: Implement a Goods Receipt (GR) module that allows warehouse staff to receive items against purchase orders with validation and status tracking.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Goods Receipt with PO Line Selection (Priority: P1)

A warehouse staff member receives a delivery against an existing purchase order. They need to create a Goods Receipt by selecting one or more open PO lines and entering the quantities they received. This is the core workflow that connects physical goods arrival to the procurement system.

**Why this priority**: This is the primary value delivery — without the ability to create GRs, warehouse staff cannot record incoming goods. It's the entry point to the entire GR module and the most frequently used action.

**Independent Test**: Can be fully tested by selecting open PO lines, entering received quantities, and verifying the GR record is created in DRAFT status. Delivers immediate value: goods receipt is now captured in the system.

**Acceptance Scenarios**:

1. **Given** open PO lines exist in the system, **When** warehouse staff navigates to the GR Create page, **Then** the page displays a list of available PO lines with their details (PO number, line item, allocated quantity)
2. **Given** PO lines are displayed, **When** staff selects multiple PO lines and enters received quantities, **Then** all selected lines appear in the line items section with entered quantities
3. **Given** line items are entered, **When** staff clicks the "Create" button, **Then** a new Goods Receipt is created in DRAFT status with the submitted line items
4. **Given** a GR is created successfully, **When** creation completes, **Then** the user is redirected to the GR Detail page showing the newly created GR

---

### User Story 2 - Post Goods Receipt to Finalize (Priority: P1)

After creating a Goods Receipt in DRAFT status, warehouse staff must be able to post/finalize the GR to mark the goods as officially received in the system. This status transition is critical for inventory and payment processing downstream.

**Why this priority**: Posting finalizes the receipt and prevents further modifications. It's equally critical as creation because without posting, the GR remains incomplete. Many workflows depend on knowing which GRs have been posted.

**Independent Test**: Can be fully tested by creating a GR in DRAFT status and posting it, verifying status changes to POSTED and line items are locked. Delivers value: goods receipt is now finalized and locked from changes.

**Acceptance Scenarios**:

1. **Given** a GR exists in DRAFT status, **When** staff views the GR Detail page, **Then** a "Post GR" button is visible and enabled
2. **Given** the "Post GR" button is clicked, **When** the request succeeds, **Then** the GR status changes to POSTED and the page reflects this update
3. **Given** a GR is in POSTED status, **When** the GR Detail page is refreshed, **Then** the "Post GR" button is hidden and line items appear in read-only mode
4. **Given** a GR is POSTED, **When** staff attempts to post it again, **Then** an error message indicates the GR is already posted

---

### User Story 3 - View GR with Linked PO and PR Context (Priority: P2)

Warehouse staff needs to view a complete Goods Receipt with traceability back to the original Purchase Order and Purchase Requisition. This provides context for why goods were ordered and helps with dispute resolution.

**Why this priority**: Traceability is valuable but secondary to core GR creation/posting workflow. Most workflows will not require clicking through to PR/PO, but when they do (e.g., discrepancies), it's essential information.

**Independent Test**: Can be fully tested by navigating to a GR Detail page and verifying linked PO and PR information is displayed with clickable links. Delivers value: staff can trace goods back to requisition and order for audit/verification.

**Acceptance Scenarios**:

1. **Given** a GR Detail page is displayed, **When** the page loads, **Then** the linked PO number is shown as a clickable link and the linked PR number is shown as a clickable link
2. **Given** the PO link is clicked, **When** navigation completes, **Then** the user is taken to the PO Detail page for that purchase order
3. **Given** the PR link is clicked, **When** navigation completes, **Then** the user is taken to the PR Detail page for that purchase requisition
4. **Given** GR line items are displayed, **When** the user views each line item, **Then** the line shows which PO line it corresponds to (e.g., "PO-001 Line 1")

---

### User Story 4 - View GR List with Status Indicators (Priority: P2)

Warehouse staff needs a list view of all Goods Receipts to quickly find GRs, check their status, and navigate to details for actions like posting. This provides operational overview and access to GRs.

**Why this priority**: Important for navigation and operational oversight, but secondary to the core create/post workflow. Staff primarily works on individual GRs, not the list; list view is for finding and accessing specific GRs.

**Independent Test**: Can be fully tested by navigating to GR List page and verifying all GRs are displayed with correct status badges. Delivers value: staff can find and access GRs they need to work on.

**Acceptance Scenarios**:

1. **Given** multiple Goods Receipts exist, **When** the GR List page is displayed, **Then** all GRs are listed in a table with columns: GR number, status, PO reference, created date
2. **Given** GRs have different statuses, **When** the list is displayed, **Then** each GR shows a status badge with appropriate styling (DRAFT = default, POSTED = success/green)
3. **Given** a GR row is clicked, **When** the click completes, **Then** the user is navigated to the GR Detail page for that GR
4. **Given** no GRs exist, **When** the GR List page is displayed, **Then** an empty state message is shown: "No Goods Receipts found"

---

### Edge Cases

- What happens when staff selects a PO line but doesn't enter a quantity? (Should show validation error)
- How does the system handle receiving more quantity than the PO allocated? (Should prevent via validation)
- What if a PO line is partially received across multiple GRs? (Subsequent GRs can only receive remaining unallocated qty)
- What happens when staff tries to post a GR with zero quantities? (Should prevent posting with validation error)
- How does system handle concurrent creation of GRs for the same PO line? (Allocated qty is tracked; each GR reduces remaining qty available)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a GR List page displaying all Goods Receipts with columns: GR number, status, PO reference, created date
- **FR-002**: System MUST provide a GR Create page where users can select open PO lines and enter received quantities for each line
- **FR-003**: System MUST provide a GR Detail page showing GR header (number, status, dates), line items (PO line details, allocated qty, received qty), and linked PO/PR navigation
- **FR-004**: System MUST create a new Goods Receipt in DRAFT status via `POST /api/goods-receipts` endpoint with request body containing: po_line_id, received_quantity for each line
- **FR-005**: System MUST support posting a Goods Receipt via `POST /api/goods-receipts/:id/post` endpoint, transitioning status from DRAFT to POSTED
- **FR-006**: System MUST retrieve a Goods Receipt via `GET /api/goods-receipts/:id` endpoint with full details: header, line items, linked PO/PR information
- **FR-007**: System MUST validate that received quantity in a GR line MUST NOT exceed the PO line allocated quantity; if exceeded, reject with clear error message
- **FR-008**: System MUST prevent posting a GR if any line item has zero or null received quantity
- **FR-009**: System MUST support status transitions: DRAFT → POSTED only; no transitions back to DRAFT or to other states
- **FR-010**: System MUST track GR line items linked to specific PO lines, maintaining referential integrity
- **FR-011**: System MUST display PO number and PR number on GR Detail page as clickable navigation links (when applicable)
- **FR-012**: System MUST follow existing UI patterns (button styles, form layout, table structure, validation messaging) established in PR module

### Key Entities

- **GoodsReceipt**: Represents a receipt of goods. Attributes: id (UUID), gr_number (unique identifier), status (DRAFT/POSTED), po_id (references Purchase Order), created_at, posted_at (nullable until POSTED)
- **GoodsReceiptLine**: Represents a single line item within a Goods Receipt. Attributes: id (UUID), gr_id (FK to GoodsReceipt), po_line_id (FK to PO Line), received_quantity, allocated_quantity (from PO line at time of creation), created_at
- **GRStatus**: Enumeration with values: DRAFT (editable, not finalized), POSTED (finalized, locked)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Warehouse staff can create a Goods Receipt and post it to POSTED status in under 3 minutes (happy path)
- **SC-002**: Over-receipt validation prevents 100% of attempted over-allocations (no GR line can exceed PO allocated qty)
- **SC-003**: 95% of GR create/post operations complete successfully without validation errors on first attempt (for valid inputs)
- **SC-004**: GR List page loads with full list of GRs (up to 100 items) in under 2 seconds
- **SC-005**: GR Detail page displays complete GR information including linked PO/PR in under 2 seconds
- **SC-006**: All GR API endpoints (create, post, detail) respond with proper HTTP status codes and error messages

## Assumptions

- **User Base**: Only authenticated warehouse staff users have access to GR module; no public access
- **PO Prerequisites**: Purchase Orders with open/unallocated lines exist in the system and are created via the PO module (in scope for workshop)
- **Allocated Quantities**: Each PO line has an allocated_quantity that represents how much can be received across all GRs; GR validation uses this value
- **Inventory Management**: Inventory updates and stock adjustments are out of scope for GR module (v1); GR is purely for receipt confirmation and traceability
- **Goods Inspection**: No quality inspection or acceptance/rejection workflow is included; all received quantities are accepted as-is
- **Payment Integration**: Payment processing triggering is out of scope; GR posting does not automatically create payment records
- **Mobile Support**: Mobile app is out of scope; GR module is desktop/web browser only
- **Search/Filter**: GR List page basic list only; advanced search, filtering by status, or date range is out of scope for v1
- **Concurrent Edits**: Last-write-wins on DRAFT GRs; no optimistic locking or conflict detection (acceptable for workshop scope)
- **UI Patterns**: All UI components (buttons, forms, tables, status badges, validation messages) must match existing PR module patterns exactly
- **Database**: PostgreSQL; GR schema is pre-created; no schema migrations needed during implementation
- **Testing Priority**: Jest tests focus on over-receipt validation rule and status transitions; Playwright tests cover happy path end-to-end (create → detail → post)
