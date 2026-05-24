# Build Phases

## Phase 1 — Foundation (everything else depends on this)

**Goal:** A working multi-tenant system with orders flowing end-to-end, live dashboard, and Stripe payments. The absolute minimum for a restaurant to actually run.

### Infrastructure setup
- [x] docker-compose.yml for local dev (Postgres, Redis, Reverb, API, Web)
- [x] Laravel project scaffolding with directory structure from `docs/02-tech-stack.md`
- [x] TenantScope global scope on all tenant models (manual implementation — no stancl/tenancy, Decision 1)
- [x] TenantMiddleware + tenant resolution from JWT
- [x] React project scaffolding with TypeScript strict mode + MST + Axios

### Auth system
- [x] Three Sanctum guards (staff, customer, platform_admin)
- [x] `permissions` table seeded with all ~80 slugs from `config/permissions.php`
- [x] `roles` table seeded with 8 system roles
- [x] `role_permissions` pivot seeded (system role defaults)
- [x] JWT token with permissions array resolved + cached in Redis
- [x] Gate registration using cached permissions
- [x] TenantMiddleware + PermissionMiddleware chain
- [x] Login / logout / me endpoints
- [x] AuthStore (MST) + PermissionGate component

### Branch & Staff Management
- [x] Tenant + branch CRUD endpoints
- [x] Staff CRUD + role assignment
- [x] `user_roles` with branch_ids scoping
- [x] Branch switcher in React (sets X-Branch-Id header)

### Menu Management
- [x] Menu categories + items CRUD
- [x] Branch override CRUD
- [x] 86 / restore endpoints with dual trigger types (manual + inventory)
- [x] MenuStore (MST) + menu management pages

### Orders & Deliveries
- [x] All 7 channel ingestion + normalisation pipeline (uber_eats + wolt — Decision 22)
- [x] 9-stage lifecycle with status transitions
- [x] Stock deduction event (OrderConfirmed → DeductStockJob)
- [x] Stripe Terminal + Stripe Payments integration (Decision 7)
- [x] Stripe webhook endpoint (signature verified, idempotent)
- [x] Basic cancellation (pre-prep = full refund)
- [x] Refund engine (Stripe Refunds API)
- [x] Laravel Reverb setup + order status WebSocket broadcasts
- [x] OrderStore (MST) + live order Kanban dashboard

### Acceptance criteria for Phase 1
- A manager can log in, see only their tenant's data, create a branch, add staff with roles
- A dine-in order can be placed, confirmed, tracked through all 9 stages, and paid via Stripe
- An Uber Eats order arrives via webhook, appears on the dashboard, and can be accepted
- 86-ing an item broadcasts via WebSocket within 5 seconds to all connected clients
- Tenant A cannot see Tenant B's orders, staff, or menu data (tested with automated tests)

---

## Phase 2 — Core Modules

**Goal:** All operational modules working. A restaurant can fully run day-to-day.

### Table & Reservation Management
- [x] Floor plan CRUD + table state machine (5 states)
- [x] Reservation lifecycle (confirmed → arrived → seated → completed / no-show / cancelled)
- [x] Availability algorithm (respects special operating hours)
- [x] Walk-in profile matching (500ms SLA)
- [x] Waitlist management + ETA calculation
- [x] 24h and 2h SMS reminders (queued)
- [x] Table state WebSocket broadcasts
- [x] ReservationStore + floor plan UI

### Customer Profiles & Loyalty
- [x] Profile auto-creation on booking / walk-in / enrolment
- [x] Deduplication (E.164 phone as primary key)
- [x] Delivery platform profile matching
- [x] Bronze/Silver/Gold tier structure + weekly recalculation job
- [x] Points earn on settled orders (atomic loyalty transactions)
- [x] Points redemption at POS
- [x] GDPR: consent storage, right to access export, right to erasure
- [x] Birthday recognition campaigns
- [x] CustomerStore + basic loyalty UI

### Inventory & Kitchen
- [x] Inventory items CRUD with WAC tracking
- [x] Recipe CRUD (Draft/Pending/Approved states)
- [x] GRN with temperature logging + WAC recalculation
- [x] Waste logging (6 types)
- [x] Stocktake workflow
- [x] KDS WebSocket channel + allergen acknowledgement (30s SLA, hard gate)
- [x] Inventory-linked 86 auto-trigger on zero stock
- [x] InventoryStore + KDS page

### Events & Functions
- [x] 5-phase event lifecycle state machine
- [x] Enquiry pipeline → proposal → deposit (Stripe) → confirmed
- [x] Event packages + corporate accounts
- [x] Pre-event planning tasks
- [x] Run sheet generation
- [x] Recurring event parent/child model
- [x] Post-event billing + invoice generation
- [x] EventStore + events management pages

### SaaS onboarding
- [x] Tenant signup flow (create tenant + first branch + owner account)
- [x] Subscription plan selection (if billing decided in Discussion 2)
- [x] Platform admin panel — EXTRACTED to standalone `/admin` app (see Phase 3)

### Acceptance criteria for Phase 2
- Full reservation lifecycle works end-to-end including SMS reminders
- A customer profile is created on first booking; loyalty points awarded on settlement
- A stocktake correctly calculates WAC and flags variance
- An event goes from enquiry to post-event invoice with deposit collected via Stripe
- KDS allergen acknowledgement gate prevents item from being marked ready until acknowledged

---

## Phase 3 — Intelligence and Platform

**Goal:** Analytics working, loyalty campaigns, external integrations live, dynamic roles UI, customer portal.

### Analytics & Reporting
- [x] Hourly aggregation jobs (RabbitMQ workers — Decision 10, Horizon not used)
- [x] Daily aggregation jobs (scheduler)
- [x] Weekly RFM recalculation job
- [ ] Monthly CLV + tier recalculation job (CLV formula not yet implemented)
- [x] 5 role-appropriate dashboards
- [x] Menu engineering matrix (Stars/Plowhorses/Puzzles/Dogs)
- [x] Churn risk detection + churn risk list
- [x] PDF export (dompdf/browsershot) + CSV export
- [ ] Scheduled report delivery (Amazon SES — Decision 9)
- [ ] Tax collected report endpoint (net_sales, tax_rate, tax_amount per category per period)
- [ ] RevPASH calculation respecting special operating hours
- [x] Financial period close
- [x] Audit log viewer

### Dynamic role builder UI
- [x] Role management pages (list, create, edit, delete custom roles)
- [x] Permission group UI (grouped by module with toggle switches)
- [x] Role assignment to staff members

### External integrations (production) — ALL COMPLETE
- [x] Uber Eats: full menu sync + order management + store status
- [x] Wolt: full menu sync + order management + store status (Decision 22: Wolt replaces DoorDash)
- [x] Twilio: SMS delivery + STOP opt-out sync (SmsProviderInterface + NullSmsProvider for local dev)
- [x] Amazon SES: transactional + marketing emails (Decision 9)
- [x] Platform throttle (pause delivery platforms from dashboard)

### Customer portal
- [x] Customer login/registration
- [x] Loyalty balance + tier + progress display
- [x] Booking history
- [x] GDPR self-service (view data, request deletion)
- [x] Communication preference management

### Platform admin app (`/admin`) — COMPLETE
- [x] Standalone Vite app (React 19, TanStack Router, MST, Tailwind v4) at port 5600
- [x] Split-panel login with 2-step OTP flow
- [x] Collapsible dark-indigo sidebar (220px / 64px), 4 nav groups, 9 routes
- [x] Dashboard — KPI cards, MRR area chart, plan distribution, recent sign-ups
- [x] Tenants — searchable table, status filter tabs, slide-in detail panel, new tenant wizard, impersonate/suspend actions
- [x] Billing & Plans — plan cards + mock revenue breakdown
- [x] System Health — 8-service status table, incident log
- [x] Feature Flags — toggleable global/tenant flags
- [x] Platform Analytics — KPI tiles, bar chart, region revenue table
- [x] Users & Roles — admin accounts + roles tables
- [x] Audit Logs — immutable log table with search
- [x] Support Tickets — ticket queue with priority/status badges
- [x] Cross-app impersonation (URL params → staff app reads on load)
- [x] `PlatformStore` singleton (no RootStore); rehydrates from `cl_admin_token`

### Landing / customer website app (`/landing`) — COMPLETE (Decision 23)
- [x] Standalone Vite app (React 19, TanStack Router, MST) at port 5700
- [x] Three visual templates: `v1-maison` (upscale dark), `v2-editorial` (magazine), `v3-cinematic` (full-bleed)
- [x] Template selection driven by `landing_template_settings.template` per tenant
- [x] `LandingConfigStore` — fetches template, customCss, contentBlocks, socialFeeds, featuredItems, SEO config
- [x] Customer auth (login/register) using `customer` guard — token stored as `landing_token`
- [x] Account area: loyalty balance, order history
- [x] `I18nStore` multilanguage support — `t()` helper, 8 supported locales, `LanguageSwitcher` component (Decision 25)
- [x] `CartStore` — in-memory cart, submits to online order endpoint
- [x] Production deployment: `ghcr.io/dishuoberoi/cheflogik-landing`, `landing.cheflogik.com`
- [x] Jenkinsfile + `terraform/staging.yaml` + `terraform/production.yaml`

### Production deployment (Jenkins + Terraform)
- [x] Dockerfile — API (multi-stage: Composer vendor + PHP-FPM/Nginx/Supervisor)
- [x] Dockerfile — Web (multi-stage: Node/Vite build + Nginx static)
- [x] Jenkinsfile — API (shared library: build, scan, push, terraform deploy, migrations)
- [x] Jenkinsfile — Web (shared library: build, scan, push, terraform deploy)
- [x] terraform/staging.yaml — API (web + 4 workers + scheduler + reverb)
- [x] terraform/production.yaml — API
- [x] terraform/staging.yaml — Web
- [x] terraform/production.yaml — Web
- [x] Dockerfile — Admin (multi-stage: Node/Vite build + Nginx static)
- [x] Jenkinsfile — Admin (shared library: build, scan, push, terraform deploy)
- [x] terraform/staging.yaml — Admin
- [x] terraform/production.yaml — Admin
- [x] Dockerfile — Landing (multi-stage: Node/Vite build + Nginx static)
- [x] Jenkinsfile — Landing (shared library: build, scan, push, terraform deploy)
- [x] terraform/staging.yaml — Landing
- [x] terraform/production.yaml — Landing
- [x] Infisical project created + project IDs filled in staging/production YAMLs
- [ ] Jenkins pipelines configured for all four repos
- [ ] Staging environment verified end-to-end

### Acceptance criteria for Phase 3
- All 5 dashboards display accurate data based on test fixtures
- RFM segments correctly classify test customers into all 8 segments
- A scheduled weekly report is delivered via email at the configured time
- Uber Eats webhook order appears on dashboard within 2 seconds
- Dynamic custom role can be created, assigned to a staff member, and permission changes take effect within 5 minutes
