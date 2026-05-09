# API Design

## Base URLs

```
/api/v1/          ← Tenant-scoped API (staff endpoints)
/api/v1/customer/ ← Customer portal endpoints (customer guard)
/api/platform/    ← Platform-admin API (SaaS operator only)
/api/public/      ← Public endpoints (no auth, no tenant middleware)
/api/health       ← Health check (no auth)
```

## Tenant Resolution

Every request to `/api/v1/` must carry a valid Sanctum token. The `TenantMiddleware` resolves `tenant_id` from the token and sets it on the request object. All downstream queries automatically apply the tenant Global Scope.

```
Request → TenantMiddleware (sets request->tenantId) → PermissionMiddleware → Controller
```

The `tenant_id` is NEVER accepted from the request body or URL parameters — it always comes from the JWT. If a client sends a `tenant_id` in the body, it is ignored.

## Authentication Headers

```http
Authorization: Bearer {sanctum_token}
X-Branch-Id: {branch_uuid}          ← Required for branch-scoped endpoints
Idempotency-Key: {client-uuid}      ← Required for order + payment creation (prevents duplicates on retry)
Accept: application/json
Content-Type: application/json
```

## Versioning

- All endpoints are versioned at `/api/v1/`
- Breaking changes introduce `/api/v2/` (both maintained during deprecation window)
- Non-breaking additions are added to the existing version

## REST Conventions

```
GET    /api/v1/orders              → index (paginated list)
POST   /api/v1/orders              → store (create)
GET    /api/v1/orders/{id}         → show (single resource)
PUT    /api/v1/orders/{id}         → update (full replace — rarely used)
PATCH  /api/v1/orders/{id}         → update (partial — common)
DELETE /api/v1/orders/{id}         → destroy

Nested resources (use sparingly, max 1 level deep):
GET    /api/v1/orders/{id}/items   → order line items

Action endpoints (when REST verbs don't fit):
POST   /api/v1/orders/{id}/confirm
POST   /api/v1/orders/{id}/cancel
POST   /api/v1/tables/{id}/seat
POST   /api/v1/tables/{id}/clear
POST   /api/v1/menu/items/{id}/eighty-six
POST   /api/v1/menu/items/{id}/restore
```

## Pagination

### Offset Pagination (default — use for most list endpoints)
```json
GET /api/v1/orders?page=2&per_page=25&branch_id={uuid}&status=confirmed

{
  "data": [ ... ],
  "meta": {
    "current_page": 2,
    "per_page": 25,
    "total": 142,
    "last_page": 6,
    "from": 26,
    "to": 50
  },
  "links": {
    "first": "/api/v1/orders?page=1",
    "prev": "/api/v1/orders?page=1",
    "next": "/api/v1/orders?page=3",
    "last": "/api/v1/orders?page=6"
  }
}
```

### Cursor Pagination (high-volume append-only tables)
Use for: `stock_movements`, `audit_log`, `loyalty_transactions`, `order_status_history`
```json
GET /api/v1/inventory/items/{id}/movements?cursor={cursor}&limit=50

{
  "data": [ ... ],
  "meta": {
    "limit": 50,
    "has_more": true,
    "next_cursor": "eyJpZCI6Ijg3NiJ9"
  }
}
```

## Filtering and Sorting

```
GET /api/v1/orders?branch_id={uuid}&status=confirmed&source=uber_eats
GET /api/v1/orders?created_after=2026-01-01&created_before=2026-01-31
GET /api/v1/orders?sort=created_at&direction=desc
GET /api/v1/menu/items?category_id={uuid}&is_active=true
```

All filter parameters are validated in Form Request classes. Unknown filter params return 422.

## Export Pattern

Two patterns depending on dataset size:

### Sync export (small, bounded datasets — e.g. payroll)
```
GET /api/v1/staff/payroll/export?date_from=2026-01-01&date_to=2026-01-31
→ streams CSV directly, Content-Disposition: attachment
```

### Async export (large datasets — e.g. analytics, temperature logs)
```
POST /api/v1/analytics/reports/export   → { "job_id": "uuid" }
GET  /api/v1/exports/{job_id}/status    → { "status": "processing|ready|failed", "url": "s3-url", "expires_at": "..." }
```

## Error Response Schema

```json
// 400 Bad Request
{ "error": { "code": "INVALID_REQUEST", "message": "...", "details": {} } }

// 401 Unauthorized
{ "error": { "code": "UNAUTHENTICATED", "message": "Authentication required." } }

// 403 Forbidden
{ "error": { "code": "INSUFFICIENT_PERMISSIONS", "message": "You do not have permission to orders.cancel.", "required_permission": "orders.cancel" } }

// 404 Not Found
{ "error": { "code": "ORDER_NOT_FOUND", "message": "The requested order does not exist." } }

// 409 Conflict (state transition errors)
{ "error": { "code": "INVALID_STATUS_TRANSITION", "message": "Order cannot move from 'completed' to 'confirmed'.", "current_status": "completed", "attempted_status": "confirmed" } }

// 422 Validation Failed
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The given data was invalid.",
    "details": {
      "table_id": ["The selected table is not available."],
      "party_size": ["Party size exceeds table capacity."]
    }
  }
}

// 429 Rate Limited
{ "error": { "code": "RATE_LIMITED", "message": "Too many requests. Retry after 60 seconds.", "retry_after": 60 } }

// 500 Internal Server Error
{ "error": { "code": "SERVER_ERROR", "message": "An unexpected error occurred. Reference: {error_id}" } }
```

## Rate Limiting

Per-tenant rate limits enforced via Laravel's `ThrottleRequests` middleware with Redis driver.
Limit key: `tenant:{tenant_id}:{route_group}`. Customer portal limits are per-customer.

| Route group | Limit |
|---|---|
| Standard tenant endpoints | 1000 req/min |
| Webhook endpoints | 500 req/min |
| Export endpoints | 10 req/min |
| Analytics endpoints | 60 req/min |
| Customer portal endpoints | 120 req/min per customer |
| Public menu endpoint | 300 req/min per IP |

## Webhook Endpoints

```
POST /api/webhooks/stripe     ← Stripe (Decision 7: Stripe confirmed)
POST /api/webhooks/uber-eats  ← Uber Eats (Phase 3 production integration)
POST /api/webhooks/wolt       ← Wolt (Phase 3 production integration; Decision 22: replaces DoorDash)
POST /api/webhooks/twilio     ← Twilio (Decision 8: Twilio confirmed)
```

Webhook endpoints are:
- Outside the `TenantMiddleware` — tenant resolved from payload content
- Require signature verification BEFORE any business logic
- Must return 200 within 5 seconds (business logic dispatched to queue)
- Use Redis to store processed event IDs for idempotency (TTL 72h)

## Health Check

```
GET /api/health   → { "status": "ok", "version": "1.0", "timestamp": "2026-04-07T10:00:00Z" }
```

No auth required. Used by Docker health checks and load balancer probes.

---

## Key Endpoint Groups

### Auth (`/api/v1/auth/` and `/api/platform/auth/`)
```
-- Staff auth
POST   /api/v1/auth/login                    → staff login, returns 8-hour token
POST   /api/v1/auth/logout                   → revoke current token
POST   /api/v1/auth/refresh                  → exchange expiring token for a new one
GET    /api/v1/auth/me                       → current user + resolved permissions array
POST   /api/v1/auth/forgot-password          → send password reset email
POST   /api/v1/auth/reset-password           → validate reset token + set new password

-- Customer auth (platform-level, Decision 3)
POST   /api/v1/auth/customer/login           → customer login, returns platform-level token
POST   /api/v1/auth/customer/register        → new customer registration
POST   /api/v1/auth/customer/logout
POST   /api/v1/auth/customer/refresh
GET    /api/v1/auth/customer/restaurants     → list restaurants customer has visited (customer_tenant_profiles)
POST   /api/v1/auth/customer/select          → select restaurant context, returns tenant-scoped token
POST   /api/v1/auth/customer/forgot-password → email or SMS OTP per communication_prefs
POST   /api/v1/auth/customer/reset-password  → validate token/OTP + set new password

-- Platform admin auth
POST   /api/platform/auth/login              → platform admin login, no expiry token
POST   /api/platform/auth/logout             → explicit token revocation
```

### Branches (`/api/v1/branches/`)
```
GET    /api/v1/branches                      → list tenant's branches
POST   /api/v1/branches                      → create branch
GET    /api/v1/branches/{id}
PATCH  /api/v1/branches/{id}
DELETE /api/v1/branches/{id}
GET    /api/v1/branches/{id}/hours           → list special operating hours
POST   /api/v1/branches/{id}/hours           → add special hours override
PATCH  /api/v1/branches/{id}/hours/{date}    → update a specific date override
DELETE /api/v1/branches/{id}/hours/{date}    → remove a specific date override
```

### Staff (`/api/v1/staff/`)
```
-- Owners (must precede staff CRUD routes to avoid /staff/{id} conflict)
POST   /api/v1/staff/owners                  → create additional business owner; requires owners.manage permission
                                               Body: { name, email }
                                               Response: { owner: {id,name,email}, temp_password }

-- Staff members
GET    /api/v1/staff                         → list staff (scoped by caller's branch access)
POST   /api/v1/staff                         → onboard new staff member
GET    /api/v1/staff/{id}
PATCH  /api/v1/staff/{id}
POST   /api/v1/staff/{id}/offboard           → suspend → revoke tokens → inactive
POST   /api/v1/staff/{id}/documents          → upload document (S3)
DELETE /api/v1/staff/{id}/documents/{type}   → remove document

-- Roles (dynamic role builder)
GET    /api/v1/staff/roles                   → list tenant roles (system + custom)
POST   /api/v1/staff/roles                   → create custom role
GET    /api/v1/staff/roles/{id}
PATCH  /api/v1/staff/roles/{id}              → only non-system roles; privilege escalation enforced
DELETE /api/v1/staff/roles/{id}              → only if no active users assigned
GET    /api/v1/staff/permissions             → full slug list grouped by module

-- Role assignment
POST   /api/v1/staff/{id}/roles              → assign role + branch_ids to staff member
DELETE /api/v1/staff/{id}/roles/{role_id}    → remove role assignment

-- Shifts
GET    /api/v1/staff/shifts                  → list shifts (branch_id + date range required)
POST   /api/v1/staff/shifts                  → create shift
GET    /api/v1/staff/shifts/{id}
PATCH  /api/v1/staff/shifts/{id}
DELETE /api/v1/staff/shifts/{id}
POST   /api/v1/staff/shifts/{id}/claim       → staff claims an open shift
POST   /api/v1/staff/shifts/publish          → publish all draft shifts for a branch + week

-- Attendance & time tracking
POST   /api/v1/staff/clock-in               → staff clock-in action
POST   /api/v1/staff/clock-out              → staff clock-out action
GET    /api/v1/staff/attendance              → list records (branch_id + date range required)
GET    /api/v1/staff/attendance/{id}

-- Payroll (sync export)
GET    /api/v1/staff/payroll/export          → CSV stream; requires date_from + date_to params
```

### Menu (`/api/v1/menu/`)
```
-- Categories
GET    /api/v1/menu/categories               → list (supports parent_id filter for sub-categories)
POST   /api/v1/menu/categories
GET    /api/v1/menu/categories/{id}
PATCH  /api/v1/menu/categories/{id}
DELETE /api/v1/menu/categories/{id}

-- Items
GET    /api/v1/menu/items
POST   /api/v1/menu/items
GET    /api/v1/menu/items/{id}
PATCH  /api/v1/menu/items/{id}
DELETE /api/v1/menu/items/{id}               → requires menu.delete_master permission
POST   /api/v1/menu/items/{id}/eighty-six    → manual 86 (trigger_type='manual')
POST   /api/v1/menu/items/{id}/restore       → checks trigger_type; inventory-linked requires manual confirmation
GET    /api/v1/menu/items/{id}/86-history    → eighty_six_log entries for this item

-- Modifier groups & modifiers
GET    /api/v1/menu/modifier-groups
POST   /api/v1/menu/modifier-groups
GET    /api/v1/menu/modifier-groups/{id}
PATCH  /api/v1/menu/modifier-groups/{id}
DELETE /api/v1/menu/modifier-groups/{id}
GET    /api/v1/menu/modifier-groups/{id}/modifiers
POST   /api/v1/menu/modifier-groups/{id}/modifiers
PATCH  /api/v1/menu/modifier-groups/{id}/modifiers/{modifier_id}
DELETE /api/v1/menu/modifier-groups/{id}/modifiers/{modifier_id}

-- Branch overrides
GET    /api/v1/menu/branch-overrides/{branch_id}
PUT    /api/v1/menu/branch-overrides/{branch_id}/{item_id}

-- Platform sync (⚠️ Phase 3 — Uber Eats + Wolt integrations)
POST   /api/v1/menu/sync                     → trigger full platform sync
```

### Public Menu (`/api/public/`)
```
-- No auth required. QR code points here.
GET    /api/public/menu/{branch_slug}        → full menu with live 86 status + dietary flags
                                               WebSocket channel: tenant.{tid}.branch.{bid}.orders
                                               (filtered by customer dietary prefs if customer token provided)
```

### Orders (`/api/v1/orders/`)
```
-- Core CRUD
GET    /api/v1/orders                        → list (branch-scoped, supports status/source/date filters)
POST   /api/v1/orders                        → create (requires Idempotency-Key header)
GET    /api/v1/orders/{id}
PATCH  /api/v1/orders/{id}                   → modify before preparation only

-- Status lifecycle (9 stages)
POST   /api/v1/orders/{id}/confirm           → new → confirmed (triggers stock deduction job)
POST   /api/v1/orders/{id}/prepare           → confirmed → preparing
POST   /api/v1/orders/{id}/ready             → preparing → ready
POST   /api/v1/orders/{id}/out-for-delivery  → ready → out_for_delivery (delivery orders only)
POST   /api/v1/orders/{id}/deliver           → out_for_delivery → delivered
POST   /api/v1/orders/{id}/serve             → ready → served (dine-in only)
POST   /api/v1/orders/{id}/settle            → served → bill_settled
POST   /api/v1/orders/{id}/cancel            → any non-final stage → cancelled (feeds RefundEngine)
GET    /api/v1/orders/{id}/status-history    → full transition log from order_status_history

-- Line items
GET    /api/v1/orders/{id}/items
POST   /api/v1/orders/{id}/items             → add item to open order
PATCH  /api/v1/orders/{id}/items/{item_id}   → modify item (before preparation only)
DELETE /api/v1/orders/{id}/items/{item_id}

-- Payments & refunds
POST   /api/v1/orders/{id}/payment           → create PaymentIntent (requires Idempotency-Key)
POST   /api/v1/orders/{id}/refund            → feeds centralised RefundEngine
POST   /api/v1/orders/{id}/split-bill        → split into multiple payment intents

-- Delivery
GET    /api/v1/delivery-zones                → list branch delivery zones
POST   /api/v1/delivery-zones               → create zone
GET    /api/v1/delivery-zones/{id}
PATCH  /api/v1/delivery-zones/{id}
DELETE /api/v1/delivery-zones/{id}
POST   /api/v1/delivery-zones/{id}/pause     → pause zone (status='paused')
POST   /api/v1/delivery-zones/{id}/resume

-- Platform pause (peak hour throttle)
POST   /api/v1/orders/pause-platforms        → manual pause all delivery platforms for a branch
POST   /api/v1/orders/resume-platforms

-- Promo codes
GET    /api/v1/promo-codes
POST   /api/v1/promo-codes
GET    /api/v1/promo-codes/{id}
PATCH  /api/v1/promo-codes/{id}
DELETE /api/v1/promo-codes/{id}
POST   /api/v1/promo-codes/validate          → validate code at checkout, returns discount details

-- Disputes
GET    /api/v1/disputes                      → list disputes (branch-scoped)
GET    /api/v1/disputes/{id}
POST   /api/v1/disputes/{id}/respond         → accept/partial/dispute with evidence
```

### KDS — Kitchen Display System (`/api/v1/kds/`)
```
GET    /api/v1/kds/tickets                        → live tickets for a station (branch + station filter)
GET    /api/v1/kds/tickets/{id}
POST   /api/v1/kds/tickets/{id}/prepare           → mark item as prepared (requires kds.mark_prepared)
POST   /api/v1/kds/tickets/{id}/acknowledge-allergen
                                                  → ⚠️ hard gate: must happen within 30s of ticket arrival
                                                  → logged immutably, cannot be reversed
                                                  → requires kds.acknowledge_allergen permission
```

### Reservations (`/api/v1/reservations/`)
```
-- Reservations
GET    /api/v1/reservations                  → list (branch_id + date range filter)
POST   /api/v1/reservations                  → create (triggers 24h + 2h reminder jobs)
GET    /api/v1/reservations/{id}
PATCH  /api/v1/reservations/{id}
POST   /api/v1/reservations/{id}/arrive      → confirmed → arrived
POST   /api/v1/reservations/{id}/seat        → arrived → seated (links to table)
POST   /api/v1/reservations/{id}/complete    → seated → completed
POST   /api/v1/reservations/{id}/no-show     → increments customer no_show_count
POST   /api/v1/reservations/{id}/cancel      → triggers refund if deposit paid

-- Availability
GET    /api/v1/reservations/availability     → available tables for date/time/party_size

-- Floor plan
GET    /api/v1/floor-plan/{branch_id}
PATCH  /api/v1/floor-plan/{branch_id}        → update layout_data (requires reservations.edit_floor_plan)

-- Tables
GET    /api/v1/tables                        → list tables (branch-scoped)
POST   /api/v1/tables                        → create table
GET    /api/v1/tables/{id}
PATCH  /api/v1/tables/{id}
DELETE /api/v1/tables/{id}
POST   /api/v1/tables/{id}/seat              → free/reserved → occupied
POST   /api/v1/tables/{id}/clear            → needs_cleaning → free
POST   /api/v1/tables/{id}/block            → → blocked (requires reservations.block_tables)
POST   /api/v1/tables/{id}/unblock

-- Waitlist
GET    /api/v1/waitlist                      → active waitlist for a branch
POST   /api/v1/waitlist                      → add to waitlist (walk-in profile match at 500ms SLA)
GET    /api/v1/waitlist/{id}
POST   /api/v1/waitlist/{id}/seat            → seat from waitlist → links to table
POST   /api/v1/waitlist/{id}/remove          → mark as left/expired
```

### Events (`/api/v1/events/`)
```
-- Enquiry pipeline
GET    /api/v1/events                        → list (supports status filter)
POST   /api/v1/events                        → create enquiry
GET    /api/v1/events/{id}
PATCH  /api/v1/events/{id}
POST   /api/v1/events/{id}/send-proposal     → enquiry → proposal
POST   /api/v1/events/{id}/confirm           → proposal → confirmed (triggers deposit collection + task generation)
POST   /api/v1/events/{id}/cancel            → with cancellation policy (non-refundable fee retained)
POST   /api/v1/events/{id}/mark-lost         → requires reason: price|date_unavailable|competitor|no_response|other

-- Phase transitions
POST   /api/v1/events/{id}/pre-event         → confirmed → pre_event
POST   /api/v1/events/{id}/day-of            → pre_event → day_of (pushes run sheet to host)
POST   /api/v1/events/{id}/complete          → day_of → completed

-- Pre-event tasks
GET    /api/v1/events/{id}/tasks
POST   /api/v1/events/{id}/tasks
PATCH  /api/v1/events/{id}/tasks/{task_id}   → mark complete / reassign

-- Run sheet
GET    /api/v1/events/{id}/run-sheet
GET    /api/v1/events/{id}/run-sheet/export  → async PDF export

-- Orders linked to event
GET    /api/v1/events/{id}/orders

-- Payment & deposits
POST   /api/v1/events/{id}/payment           → collect deposit via Stripe PaymentIntent

-- Event spaces
GET    /api/v1/events/spaces
POST   /api/v1/events/spaces
GET    /api/v1/events/spaces/{id}
PATCH  /api/v1/events/spaces/{id}
DELETE /api/v1/events/spaces/{id}

-- Event packages
GET    /api/v1/events/packages
POST   /api/v1/events/packages
GET    /api/v1/events/packages/{id}
PATCH  /api/v1/events/packages/{id}
DELETE /api/v1/events/packages/{id}

-- Corporate accounts
GET    /api/v1/events/corporate-accounts
POST   /api/v1/events/corporate-accounts
GET    /api/v1/events/corporate-accounts/{id}
PATCH  /api/v1/events/corporate-accounts/{id}
POST   /api/v1/events/corporate-accounts/{id}/hold    → status → on_hold
POST   /api/v1/events/corporate-accounts/{id}/reactivate
```

### Inventory (`/api/v1/inventory/`)
```
-- Inventory items
GET    /api/v1/inventory/items               → list (branch-scoped, supports category/low-stock filters)
POST   /api/v1/inventory/items
GET    /api/v1/inventory/items/{id}
PATCH  /api/v1/inventory/items/{id}
DELETE /api/v1/inventory/items/{id}
POST   /api/v1/inventory/items/{id}/adjust   → manual stock adjustment (logged to stock_movements)
POST   /api/v1/inventory/items/{id}/transfer → transfer stock between branches
GET    /api/v1/inventory/items/{id}/movements → cursor-paginated stock movement history

-- Recipes
GET    /api/v1/inventory/recipes
POST   /api/v1/inventory/recipes
GET    /api/v1/inventory/recipes/{id}
PATCH  /api/v1/inventory/recipes/{id}
DELETE /api/v1/inventory/recipes/{id}
POST   /api/v1/inventory/recipes/{id}/submit  → draft → pending_approval
POST   /api/v1/inventory/recipes/{id}/approve → pending_approval → approved (Owner/Branch Manager)
POST   /api/v1/inventory/recipes/{id}/archive → approved → archived

-- Suppliers
GET    /api/v1/inventory/suppliers
POST   /api/v1/inventory/suppliers
GET    /api/v1/inventory/suppliers/{id}
PATCH  /api/v1/inventory/suppliers/{id}
DELETE /api/v1/inventory/suppliers/{id}

-- Purchase orders
GET    /api/v1/inventory/purchase-orders
POST   /api/v1/inventory/purchase-orders
GET    /api/v1/inventory/purchase-orders/{id}
PATCH  /api/v1/inventory/purchase-orders/{id}
POST   /api/v1/inventory/purchase-orders/{id}/send    → draft → sent (dispatched to supplier)
POST   /api/v1/inventory/purchase-orders/{id}/cancel

-- Goods received notes (GRN)
GET    /api/v1/inventory/grn
POST   /api/v1/inventory/grn                 → create GRN against a PO or ad-hoc
GET    /api/v1/inventory/grn/{id}
POST   /api/v1/inventory/grn/{id}/receive    → confirm receipt → triggers WAC recalculation + stock_movements INSERT

-- Waste logging
GET    /api/v1/inventory/waste
POST   /api/v1/inventory/waste               → log waste event (snaps cost_at_wac at log time)

-- Stocktakes & period close
GET    /api/v1/inventory/stocktakes
POST   /api/v1/inventory/stocktakes          → start new stocktake
GET    /api/v1/inventory/stocktakes/{id}
PATCH  /api/v1/inventory/stocktakes/{id}     → update counts during stocktake
POST   /api/v1/inventory/stocktakes/{id}/complete → in_progress → completed (calculates variance)
POST   /api/v1/inventory/stocktakes/{id}/lock    → completed → locked (period close, Owner only)

-- Temperature log (food safety — 7yr retention)
GET    /api/v1/inventory/temperature-log/export  → async PDF/CSV export for inspections
```

### Customers — Staff-Facing (`/api/v1/customers/`)
```
-- Profile management
GET    /api/v1/customers                     → search by phone/email/name (tenant-scoped)
POST   /api/v1/customers                     → create + enrol (auto-creates customer_tenant_profiles)
GET    /api/v1/customers/{id}
PATCH  /api/v1/customers/{id}
POST   /api/v1/customers/merge               → merge duplicate profiles (Owner/Manager, logged, reversible 30d)

-- Loyalty
GET    /api/v1/customers/{id}/loyalty        → points balance, tier, transaction history (cursor-paginated)
POST   /api/v1/customers/{id}/loyalty/adjust → manual points adjustment (logged to loyalty_transactions)

-- History
GET    /api/v1/customers/{id}/orders         → order history for this tenant
GET    /api/v1/customers/{id}/reservations   → reservation history for this tenant

-- GDPR
POST   /api/v1/customers/{id}/gdpr/erasure   → initiate erasure process (14-day window)
GET    /api/v1/customers/{id}/gdpr/export    → async data export

-- Campaigns
GET    /api/v1/customers/campaigns
POST   /api/v1/customers/campaigns
GET    /api/v1/customers/campaigns/{id}
PATCH  /api/v1/customers/campaigns/{id}
POST   /api/v1/customers/campaigns/{id}/cancel
```

### Customer Portal — Customer-Facing (`/api/v1/customer/`)
```
-- Profile
GET    /api/v1/customer/profile
PATCH  /api/v1/customer/profile

-- Loyalty
GET    /api/v1/customer/loyalty              → balance, tier, points history (cursor-paginated)
POST   /api/v1/customer/loyalty/redeem       → redeem points (multiples of 100, min 100)

-- History
GET    /api/v1/customer/bookings             → reservation history for selected restaurant
GET    /api/v1/customer/orders               → order history for selected restaurant

-- GDPR self-service
POST   /api/v1/customer/gdpr/erasure-request → initiates 14-day confirmation window
GET    /api/v1/customer/gdpr/data-export     → async GDPR data portability export
```

### Analytics (`/api/v1/analytics/`)
```
-- Role-gated dashboards
GET    /api/v1/analytics/owner-dashboard     → requires analytics.owner_dashboard
GET    /api/v1/analytics/branch-dashboard    → requires analytics.branch_dashboard
GET    /api/v1/analytics/kitchen-dashboard   → requires analytics.kitchen_dashboard
GET    /api/v1/analytics/events-dashboard    → requires analytics.events_dashboard
GET    /api/v1/analytics/customer-dashboard  → requires analytics.customer_dashboard

-- Reports
GET    /api/v1/analytics/revenue             → date range, channel breakdown
GET    /api/v1/analytics/dishes              → dish performance + menu engineering matrix
GET    /api/v1/analytics/customers           → RFM segments, CLV, churn risk scores
GET    /api/v1/analytics/inventory           → COGS, food cost %, waste cost
GET    /api/v1/analytics/staff               → labour cost %, aggregate performance (no individual PII)
GET    /api/v1/analytics/tax-report          → VAT/GST report by tax category per period

-- Audit log
GET    /api/v1/analytics/audit-log           → cursor-paginated, requires analytics.audit_log

-- Exports (async pattern)
POST   /api/v1/analytics/reports/export      → submits async export job → { job_id }
GET    /api/v1/exports/{job_id}/status       → { status, url, expires_at }

-- Period close (Owner only)
POST   /api/v1/analytics/period-close        → requires completed stocktake for the period
```

### Platform Admin (`/api/platform/`)
```
-- Auth (unauthenticated)
POST   /api/platform/auth/login              → Step 1: validate credentials, send OTP email
                                               Response: { challenge_token, email_hint }
POST   /api/platform/auth/verify-mfa         → Step 2: verify 6-digit OTP, issue real auth token
                                               Body: { challenge_token, otp }
                                               Response: { token, admin: {id,name,email} }

-- Auth (platform guard — auth:platform required)
POST   /api/platform/auth/logout             → revoke current token (no expiry tokens — explicit revoke only)
GET    /api/platform/auth/me                 → current admin profile { id, name, email }

-- Tenant management
GET    /api/platform/tenants                 → paginated list; supports ?search=&page=&per_page=
POST   /api/platform/tenants                 → Body: { name, slug, plan_id, owner_name, owner_email }
                                               Auto-provisions: 8 system roles + first owner user
                                               Response: { tenant, owner: {id,name,email}, temp_password }
GET    /api/platform/tenants/{id}
PATCH  /api/platform/tenants/{id}            → Body: { name?, plan_id?, status?, settings? }
DELETE /api/platform/tenants/{id}            → soft-cancel (status=cancelled — never hard-delete)
GET    /api/platform/tenants/{id}/stats      → usage stats: branch_count, active_staff_count, customer_count,
                                               last_30_days: { order_count, total_revenue },
                                               upcoming_reservations, upcoming_events, plan info
POST   /api/platform/tenants/{id}/impersonate → issues 1-hour owner token; writes audit log
                                               Response: { token, expires_at, user: { id, name, email,
                                               tenant_id, tenant_name, role_slug, branch_ids, permissions[] } }
POST   /api/platform/tenants/{id}/suspend    → Body: { reason? }; writes audit log
POST   /api/platform/tenants/{id}/reactivate → writes audit log
PATCH  /api/platform/tenants/{id}/settings   → Body: { settings: { key: value } }
                                               Updates tenant-scoped settings on behalf of tenant

-- Subscription plans
GET    /api/platform/plans                   → list all plans ordered by price_monthly
GET    /api/platform/plans/{id}              → single plan
POST   /api/platform/plans                   → Body: { name, slug, max_branches, price_monthly?, features? }
PATCH  /api/platform/plans/{id}              → Body: { name?, max_branches?, price_monthly?, features?, is_active? }
POST   /api/platform/tenants/{id}/change-plan → Body: { plan_id }; writes audit log

-- Platform settings (global feature flags + platform config)
GET    /api/platform/settings                → all platform-scope settings with values, labels, types, defaults
PATCH  /api/platform/settings                → Body: { settings: { key: value } }
                                               Keys: platform.maintenance_mode, platform.new_signups_enabled,
                                               platform.stripe_enabled, platform.default_plan,
                                               platform.max_api_requests_per_min,
                                               feature.loyalty_programme, feature.events_module,
                                               feature.inventory_tracking, feature.kds_display,
                                               feature.advanced_analytics, feature.api_access,
                                               feature.multi_branch, feature.white_label,
                                               feature.uber_eats_integration, feature.sms_notifications,
                                               feature.shift_management, feature.delivery_optimisation
```

## Broadcasting Auth

```
POST   /api/v1/broadcasting/auth     ← Reverb channel authorisation
```

Private channel authorisation checks:
- The user's token is valid
- The channel's `tenant_id` matches the user's `tenant_id`
- The channel's `branch_id` is in the user's allowed `branch_ids`

WebSocket channels:
```
tenant.{tenantId}.branch.{branchId}.orders   → order status updates, new orders
tenant.{tenantId}.branch.{branchId}.tables   → table state changes (3s SLA)
tenant.{tenantId}.branch.{branchId}.kds      → KDS ticket updates, allergen alerts
tenant.{tenantId}.alerts                     → manager-level alerts (86 events, churn risk, overdue tasks)
```
