# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# Restaurant Management SaaS — Claude Code Master Guide

> **READ THIS ENTIRE FILE BEFORE WRITING ANY CODE.**
> The mandatory discussion checklist in Section 2 has been completed — all decisions are in `decisions.md`.

> **CRITICAL OPERATING RULE: DO NOT MAKE ANY DECISIONS WITHOUT CONSULTING THE USER FIRST.**
> This includes (but is not limited to): switching cache drivers, changing test infrastructure, adding new dependencies, changing middleware order, creating new config files, or any architectural choice not explicitly requested. Propose the change and wait for approval before acting.
> Document any new decisions in `decisions.md` before proceeding.

---

## Current Project State

**This repository is the documentation/planning repo. No application code exists here.**

- All 21 architectural decisions are locked in `decisions.md`
- Database schema is fully specified in `docs/03-database-schema.md` (with all DBA improvements applied)
- API design is fully specified in `docs/04-api-design.md`
- Application code lives in three separate repos:
  - `cheflogik-api` — Laravel 12 backend (at `/api` locally, own git repo)
  - `cheflogik-web` — React 19 staff-facing frontend (at `/web` locally, own git repo)
  - `cheflogik-admin` — React 19 platform admin app (at `/admin` locally, own git repo)
- The `/api`, `/web`, and `/admin` directories are ignored by this repo's git

**Before writing any code:** read `decisions.md` in full, then read the relevant module docs and skill files.

---

## Development Commands

> Commands below apply to `cheflogik-api` (Laravel). Run from within the `/api` directory.

### Laravel (Backend)
```bash
composer install                                    # install PHP dependencies
php artisan migrate                                 # run migrations against main DB
php artisan migrate --env=testing                   # run migrations against test DB
php artisan db:seed                                 # seed permissions, system roles, subscription plans
php artisan test                                    # run full test suite (real Postgres, not SQLite)
php artisan test --filter TestClassName             # run a single test class
php artisan test --filter TestClassName::method     # run a single test method
./vendor/bin/pint                                   # PHP code style fixer (Laravel Pint)
./vendor/bin/pint --test                            # check style without fixing
php artisan queue:work rabbitmq --queue=critical    # start critical queue worker
php artisan reverb:start                            # start WebSocket server (port 8080)
```

### Docker Compose (Application services only — DB/Redis/RabbitMQ are on shared infra)
```bash
docker compose up -d           # start app, workers, reverb
docker compose down
docker compose logs -f app     # tail application logs
docker compose logs -f worker-critical
```

### React — Staff app (run from `/web` directory)
```bash
npm install
npm run dev                    # Vite dev server (port 5500)
npm run build                  # production build
npm run test                   # Vitest
npm run lint                   # ESLint
```

### React — Admin app (run from `/admin` directory)
```bash
npm install
npm run dev                    # Vite dev server (port 5600)
npm run build                  # production build
npm run lint                   # ESLint
```

### Database setup (per developer, on shared infra)
```bash
# Create two databases on shared Postgres:
# 1. cheflogik_<your_name>       — main development DB
# 2. cheflogik_<your_name>_test  — test DB (reset between test runs)
# Add both sets of credentials to .env (see .env.example)
```

---

## 1. Project Overview

A multi-tenant SaaS restaurant management platform. Restaurant businesses (tenants) subscribe to the platform and manage their operations — orders, menus, reservations, events, inventory, staff, customers, and analytics — across one or more branches.

**This is not a single-restaurant app.** Every piece of data belongs to a tenant. Every query must be tenant-scoped. Every JWT carries a `tenant_id`. Leaking cross-tenant data is a critical security failure.

### Scale targets
- Tenants: hundreds of restaurant businesses
- Branches per tenant: 1–3 (MVP), unlimited (future)
- Concurrent users per tenant: up to 50 staff + N customers
- Orders per tenant per day: up to 500

### What exists already
All requirements have been fully documented across 12 requirement documents. The system has been designed end-to-end. Claude Code's job is to implement what is specified — not to redesign it. When in doubt, read the relevant docs file before writing code.

---

## 2. Key Architectural Decisions

All 21 decisions are locked in `decisions.md`. The non-obvious ones that affect day-to-day code are summarised here.

### Tenancy (Decision 1)
Single database, `tenant_id` on every table. **Manual** `TenantScope` + `HasTenantScope` trait — `stancl/tenancy` is **not used**. Platform-admin bypass: `withoutGlobalScope(TenantScope::class)` only in `Platform/` controllers.

### Customer auth (Decision 3)
Customers are platform-level (no `tenant_id` on `customer_profiles`). After login, customer selects a restaurant and receives a tenant-scoped token. `customer_tenant_profiles` holds per-tenant loyalty data.

### Queue driver (Decision 10)
**RabbitMQ** for all queues via `vladimir-yuldashev/laravel-queue-rabbitmq`. Redis is cache-only. Laravel Horizon is **not used** — use the RabbitMQ management UI. Five queues: `critical`, `high`, `default`, `analytics`, `low`.

### Roles (Decision 4)
Full dynamic role system in Phase 1. Tables: `permissions`, `roles`, `role_permissions`, `user_roles`. 8 system roles seeded. No `spatie/laravel-permission` — custom implementation. Permission slugs are the only valid authorisation mechanism (no role-name checks).

### Billing (Decision 2)
Manual billing for MVP. `subscription_plans` table exists with Starter/Growth/Enterprise (all free, `price_monthly = 0`). Stripe Billing deferred.

### Infrastructure (Decision 5 & 11)
Docker Compose for app services only. Postgres, Redis, RabbitMQ are on **shared developer infra** — not in Docker Compose. Production deployment uses Jenkins + Terraform (see `docs/07-infrastructure.md`).

### Previously pending decisions — all resolved
Decisions 7 (Stripe), 8 (Twilio), 9 (Amazon SES), and 22 (Wolt replaces DoorDash) are all recorded in `decisions.md`. No pending payment, SMS, email, or delivery-platform decisions remain.

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Backend framework | Laravel 12, PHP 8.3 |
| Database | PostgreSQL 16 |
| Cache | Redis 7 (cache only — NOT used for queues) |
| Queues | RabbitMQ 3 via `vladimir-yuldashev/laravel-queue-rabbitmq` |
| Real-time | Laravel Reverb (self-hosted WebSocket) |
| Staff frontend | React 19 + TypeScript (strict mode) — `/web`, port 5500 |
| Admin frontend | React 19 + TypeScript (strict mode) — `/admin`, port 5600 |
| Frontend state | MobX-State-Tree (MST) |
| Auth | Laravel Sanctum (multiple guards) |
| Payments | Stripe (Decision 7 — `stripe/stripe-php ^13.0`, behind `PaymentGatewayInterface`) |
| Delivery platforms | Uber Eats API, Wolt API (Decision 22) |
| SMS | Twilio (Decision 8 — `twilio/sdk ^8.0`, behind `SmsProviderInterface`) |
| Email | Amazon SES via Laravel `ses` driver (Decision 9) |
| Storage | AWS S3 (`league/flysystem-aws-s3-v3`) |
| Logging | AWS CloudWatch (`maxbanton/cwh`) |
| Container | Docker |
| Orchestration | Kubernetes (via shared Terraform module) |
| Infrastructure as code | Terraform + Jenkins CI/CD |
| Tenancy | Manual `TenantScope` + `HasTenantScope` trait (no stancl/tenancy) |

**See `docs/02-tech-stack.md` for full conventions, folder structure, and coding standards.**

---

## 4. Navigation Guide — Read These Files

### Before writing any code
1. This file (`CLAUDE.md`) — understand the decisions summary in Section 2
2. `decisions.md` — read in full; record any new decisions here before proceeding
3. `docs/01-project-overview.md` — business context and non-negotiable rules
4. `docs/02-tech-stack.md` — Laravel/React conventions and folder structure
5. `docs/03-database-schema.md` — all tables, columns, indexes

### When working on authentication/permissions
- `docs/05-auth-roles.md` — three guards, JWT structure, dynamic roles, Gate/Policy pattern
- `docs/05-access-control.svg` — permission resolution flow diagram
- `.claude/skills/tenancy.md` — tenant isolation patterns
- `.claude/skills/auth-permissions.md` — two-step OTP/2FA login flow, permission checking patterns, all permission slugs

### When working on the database / migrations
- `docs/03-database-schema.md` — authoritative schema
- `docs/03-database-erd.svg` — entity relationships visual

### When working on a specific module
Load the module's skill file and requirement doc:
```
@.claude/skills/orders.md          → when implementing orders
@docs/modules/orders.md            → full requirements reference

@.claude/skills/menu.md            → when implementing menu
@docs/modules/menu.md

@.claude/skills/reservations.md
@docs/modules/reservations.md

@.claude/skills/events.md
@docs/modules/events.md

@.claude/skills/inventory.md
@docs/modules/inventory.md

@.claude/skills/customers.md
@docs/modules/customers.md

@.claude/skills/analytics.md
@docs/modules/analytics.md

@.claude/skills/messaging.md       → when implementing internal staff chat
                                   → no separate module doc; schema + patterns are in the skill file

@.claude/skills/notifications.md   → when implementing in-app notifications
                                   → no separate module doc; schema + patterns are in the skill file
```

### When working on staff scheduling / leave management
- `.claude/skills/auth-permissions.md` — `staff.*` permission slugs
- `docs/modules/staff.md` — shifts, attendance, payroll export, leave management schema and API

### When working on external integrations
- `docs/10-integrations.md` — all external API specs
- `.claude/skills/integrations.md`

### When working on the staff frontend (`/web`)
- `docs/06-frontend-architecture.md` — React + MST conventions
- `docs/06-frontend-store-map.svg` — MST store tree
- `.claude/skills/frontend-mst.md`

### When working on the admin frontend (`/admin`)
- `docs/06-frontend-architecture.md` — shared React/MST conventions apply
- Admin app (`/admin`, port 5600) has a single `PlatformStore` (no `RootStore`); singleton exported from `src/stores/context.ts`
- TanStack Router file-based routing under `src/routes/`; `routeTree.gen.ts` is auto-generated by Vite plugin
- ADM design tokens defined in `src/index.css` with `@theme inline`; dark-indigo sidebar (`#1E293B`), accent `#6366F1`
- Cross-app impersonation: admin calls `window.open()` with `?impersonate_token=&tenant_name=` query params; staff app reads them on load in `_authenticated.tsx`

### When working on infrastructure
- `docs/07-infrastructure.md` — Docker images, Jenkins CI/CD, Terraform deployment config

### Cross-cutting rules (read when anything touches multiple modules)
- `docs/09-cross-module-rules.md` — 86 propagation, WAC authority, tenant isolation, notifications, audit log

---

## 5. Critical Rules — Never Violate These

### Tenant isolation
1. Every Eloquent model that holds tenant data MUST have a `TenantScope` global scope applied.
2. Never write a query without tenant scoping unless you are in a platform-admin context with explicit `withoutGlobalScope(TenantScope::class)`.
3. Test tenant isolation on every new model: create data for Tenant A, assert Tenant B cannot retrieve it.

### Permissions
1. All permission checks use `Gate::check('permission.slug')` or `$this->authorize('permission.slug')` — never check `$user->role === 'branch_manager'` directly.
2. Permission resolution is cached in Redis (key: `perms:{tenant_id}:{user_id}`, TTL 5 min). Invalidate on role change.
3. UI permission gating is UX only. The API always re-validates.

### Payments and card data
1. No raw card numbers, CVV, or magnetic stripe data ever enter the application.
2. All payments via Stripe. No other payment processor.
3. Stripe webhook endpoints verify signature before any business logic runs.
4. All refunds via Stripe Refunds API against the original PaymentIntent.

### Food safety
1. Inventory-linked 86 events (triggered by stockout) NEVER auto-restore. Manual manager confirmation required every time.
2. Allergen notes on KDS tickets must be acknowledged within 30 seconds. The acknowledgement is logged and immutable.

### Audit trail
1. The audit log is write-only. No update or delete operations on `audit_log` records, ever.
2. All audit entries include: `tenant_id`, `actor_id`, `actor_role`, `action`, `resource_type`, `resource_id`, `changes` (JSON), `ip_address`, `created_at`.

### Data retention
1. Financial records (orders, payments, refunds, invoices): 7 years minimum.
2. Customer PII: anonymised on erasure request, financial history retained anonymised.
3. Audit logs: 7 years minimum.

---

## 6. Build Phases

**See `docs/08-build-phases.md` for the detailed per-module phase breakdown.**

### Phase 1 — Foundation (build first, everything else depends on it)
- Tenancy infrastructure (tenant model, Global Scope, middleware)
- Auth system (three guards, JWT, permissions table, system roles seeded)
- Branch & Staff Management (branch CRUD, staff CRUD, role assignment)
- Menu Management (master menu, branch overrides, 86 management)
- Orders & Deliveries (all 7 channels, 9-stage lifecycle, Stripe payments, basic cancellations)
- Laravel Reverb setup (WebSocket for live order dashboard)
- Docker Compose for local development

### Phase 2 — Core modules
- Table & Reservation Management
- Customer Profiles & Loyalty (profile creation, deduplication, basic loyalty earn/redeem)
- Inventory & Kitchen (stock management, KDS, waste logging, WAC costing)
- Events & Functions (enquiry pipeline through billing)
- SaaS tenant onboarding flow (signup, plan selection, branch setup wizard)

### Phase 3 — Intelligence and platform
- Analytics & Reporting (pre-aggregation jobs, 5 dashboards, RFM, CLV, churn risk)
- Dynamic role builder UI (the permissions/roles tables are already there from Phase 1)
- Customer portal (loyalty dashboard, booking history, GDPR self-service)
- **Platform admin app** — COMPLETE (standalone `/admin` Vite app, port 5600, 9 screens, cross-app impersonation)
- External integrations (Uber Eats, Wolt, Twilio, Amazon SES)
- Jenkins pipelines + Terraform deployment (staging + production)

> **Course tracking (deferred):** The occupied table popup on the floor view shows a placeholder "Course: —". This requires adding `current_course` (enum: starters|mains|desserts) to the `orders` table and a UI control for staff to bump the course on the floor view. Implement when KDS course tracking is prioritised.

---

## 7. Coding Standards Summary

**Laravel (backend)**
- PHP 8.3 — use readonly properties, enums, fibers where appropriate
- Strict types declaration on every file: `declare(strict_types=1);`
- Repository pattern for data access (no fat controllers)
- Service classes for business logic (no business logic in models or controllers)
- Form Request classes for all validation
- API Resources for all JSON responses (no `->toArray()` in controllers)
- Events + Listeners for cross-module side effects (order confirmed → deduct stock)
- Queue jobs for all async work (platform sync, email/SMS, aggregation)
- Enums for all status fields (OrderStatus, TableStatus, LoyaltyTier, etc.)
- PHPDoc blocks on all public methods
- Feature tests for all API endpoints; unit tests for all service classes

**React (frontend)**
- TypeScript strict mode (`"strict": true` in tsconfig)
- MST models for all server state (never useState for server data)
- React Query is NOT used — MST handles all data fetching and caching
- Functional components only — no class components
- Props typed with TypeScript interfaces — no `any`
- `authStore.can('permission.slug')` before rendering any privileged UI
- API calls go through the typed `ApiService` class — no direct `fetch` in components
- **Form elements in `/web`:** never use raw `<button>`, `<input>`, `<select>`, `<textarea>`, or `<checkbox>` — always use the design system components from `@/components/ui/` (e.g. `Button`, `IconButton`, `Input`, `Select`, `Textarea`, `Checkbox`, `Switch`, `NumberInput`, `DatePicker`, etc.). This applies when building new forms and when modifying existing ones.

**Full standards in `docs/02-tech-stack.md`.**
