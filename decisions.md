# Architectural Decisions Log

> This file is the authoritative record of all decisions made before and during development.
> If it's not here, it wasn't decided.

---

## Decision 1 — Tenancy Strategy

**Date decided:** 2026-04-07
**Decision:** Option A — Single database, `tenant_id` column on every tenant-scoped table
**Implementation:** Manual Global Scope — `TenantScope` class + `HasTenantScope` trait + `TenantMiddleware`. No `stancl/tenancy` package.
**Rationale:** Simplest approach for MVP scale (hundreds of tenants, not thousands). Avoids package opinions and stancl/tenancy's database-per-tenant defaults. Full control, easier to debug.
**Implications for migrations:** Every tenant-scoped table gets `tenant_id UUID NOT NULL FK → tenants`. Every Eloquent model uses `HasTenantScope` trait.
**Platform admin bypass:** `Order::withoutGlobalScope(TenantScope::class)` — only in platform-admin controllers/services. Never in tenant-facing code.

---

## Decision 2 — SaaS Billing

**Date decided:** 2026-04-07
**Decision:** Manual billing for MVP. Stripe Billing wired up in a later phase.
**Phase 1 scope:** `subscription_plans` table exists with Starter/Growth/Enterprise plans. All `price_monthly = 0` during MVP — all plans are free to use. Feature restrictions enforced by plan tier via `features` JSONB column.
**Stripe Billing:** Deferred — see Decision 7 (payment gateway pending)
**Plan tiers defined:** Yes — Starter, Growth, Enterprise. Feature flags in `subscription_plans.features` JSONB control access per tier.

---

## Decision 3 — Customer Auth Model

**Date decided:** 2026-04-07
**Decision:** Option A — Platform-level customer accounts
**Rationale:** One login across multiple restaurants. Better UX — customer visits two restaurants and has one account with loyalty data per restaurant.
**Impact on customer schema:**
- `customer_profiles` is platform-level (no `tenant_id`) — holds identity + auth only
- New `customer_tenant_profiles` table holds per-tenant loyalty data (points, tier, lifetime spend, visits)
- `UNIQUE (phone)` at platform level (not per-tenant)
- `loyalty_number` is per-tenant (in `customer_tenant_profiles`)
**Impact on React routing:** Customer auth flow: login → restaurant list → select restaurant → tenant-scoped token
**Customer enrolment:** `customer_tenant_profiles` record auto-created when staff enrolls the customer at a restaurant for the first time.

---

## Decision 4 — Dynamic Roles Timing

**Date decided:** 2026-04-07
**Decision:** Option A — Full dynamic role system built in Phase 1
**Rationale:** Build tables + system role seeds + custom role builder UI all upfront. Avoids painful refactor later. Core architecture should be complete from day one.
**Phase 1 scope:** `permissions`, `roles`, `role_permissions`, `user_roles` tables. 8 system roles seeded. Dynamic role builder API + UI shipped in Phase 1.
**Privilege escalation prevention:** Enforced — users can only assign permissions they personally hold.

---

## Decision 5 — Infrastructure Scope

**Date decided:** 2026-04-07
**Decision:** Option B — Docker Compose for application services only. Kubernetes/Helm/Terraform deferred to Phase 3.
**Rationale:** Move fast during active development. Shared infra already available locally. Kubernetes complexity not justified until Phase 3.
**Who owns infra:** Shared infrastructure team provides Postgres+pgbouncer, RabbitMQ, Redis. Application team owns Docker Compose (app services only).

---

## Decision 6 — Repo Structure

**Date decided:** 2026-04-07
**Decision:** 3 separate repos
**Repo structure:**
- `cheflogik` (this repo) — project documentation, CLAUDE.md, decisions.md, docs/, .claude/skills/. Root `.gitignore` ignores `/api` and `/web`.
- `cheflogik-api` — Laravel 12 backend, lives at `/api` locally
- `cheflogik-web` — React 19 frontend, lives at `/web` locally
**CI/CD approach:** Separate pipelines per repo. Deferred to Phase 3.

---

## Decision 7 — Payment Gateway

**Date decided:** 2026-04-17
**Decision:** Stripe (`stripe/stripe-php ^20`), implemented behind a `PaymentGatewayInterface` contract so it can be swapped for another provider without touching business logic.
**Plugin architecture:**
- `app/Contracts/PaymentGatewayInterface.php` — defines the contract: `createPaymentIntent()`, `capturePayment()`, `cancelPayment()`, `createRefund()`, `constructWebhookEvent()`
- `app/Services/Payments/StripePaymentGateway.php` — Stripe implementation
- `config/payment.php` — `driver` key selects the active implementation
- `AppServiceProvider` binds `PaymentGatewayInterface` → concrete class based on `config('payment.driver')`
- All business logic (OrderService, EventService, RefundEngine) depends on `PaymentGatewayInterface` only — never imports Stripe classes directly
**Unblocked work:** `order_payments` recording, full refund engine, events deposit collection, Stripe webhook endpoint, `subscription_plans.stripe_price_id`

---

## Decision 8 — SMS Provider

**Date decided:** 2026-04-17
**Decision:** Twilio (`twilio/sdk ^8.0`), implemented behind a `SmsProviderInterface` contract so it can be swapped for another provider without touching business logic.
**Plugin architecture:**
- `app/Contracts/SmsProviderInterface.php` — defines the contract: `send(string $to, string $body): void`
- `app/Services/Sms/TwilioSmsProvider.php` — Twilio implementation
- `config/sms.php` — `driver` key selects the active implementation
- `AppServiceProvider` binds `SmsProviderInterface` → concrete class based on `config('sms.driver')`
- All business logic (ReservationReminderJob, CustomerPasswordResetService, LoyaltyCampaignJob) depends on `SmsProviderInterface` only — never imports Twilio classes directly
**Unblocked work:** Reservation reminders (24h + 2h jobs), customer OTP password reset, loyalty campaign SMS dispatch

---

## Decision 9 — Email Provider

**Date decided:** 2026-04-17
**Decision:** Amazon SES via Laravel's built-in `ses` mail driver. No additional package required — `aws/aws-sdk-php` is already a transitive dependency of `league/flysystem-aws-s3-v3` (Decision 12).
**Configuration:** `MAIL_MAILER=ses` in `.env`. Uses the same `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION` credentials as S3. Dedicated `AWS_SES_REGION` override available if SES region differs from S3 region.
**Laravel mail:** All emails are Laravel Mailables (`php artisan make:mail`). The `ses` driver is the transport — switching to another transport (Mailgun, Postmark, SMTP) requires only a `.env` change, no code changes.
**Unblocked work:** Staff password reset email, customer password reset email, booking confirmations, tenant welcome email (currently a no-op stub), loyalty campaign email dispatch

---

## Decision 10 — Queue System

**Date decided:** 2026-04-07
**Decision:** RabbitMQ for all job queues. Redis for cache only.
**Rationale:** Redis loses in-memory queued jobs on restart — unacceptable for critical queue (Stripe webhooks, 86 broadcasts, KDS tickets). RabbitMQ persists messages to disk and provides broker-level acknowledgements. Redis failure = cache miss only, not data loss.
**Package:** `vladimir-yuldashev/laravel-queue-rabbitmq`
**Horizon:** Not used — replaced by RabbitMQ management UI
**Queue priorities:** `critical`, `high`, `default`, `analytics`, `low` — separate queues within the RabbitMQ vhost

---

## Decision 11 — Shared Infrastructure

**Date decided:** 2026-04-07
**Decision:** Use existing shared infrastructure. No Postgres, Redis, or RabbitMQ in Docker Compose.
**Shared services:**
- PostgreSQL 16 with pgbouncer (connection pooling — Laravel connects to pgbouncer, not Postgres directly)
- Redis 7 (cache only)
- RabbitMQ 3 with management UI (queues only)
**Developer setup:** Separate database per developer (`cheflogik_<name>`). Separate RabbitMQ vhost per project. No VPN required — infra is locally accessible.
**Docker Compose services (application only):** `app`, `worker-critical`, `worker-high`, `worker-default`, `worker-background`, `reverb`

---

## Decision 12 — File Storage

**Date decided:** 2026-04-07
**Updated:** 2026-05-25
**Decision:** AWS S3 (`league/flysystem-aws-s3-v3`)
**Used for:** All tenant file uploads and exports.

### Folder convention (mandatory for all uploads)

```
tenants/{tenant_id}/public/{type}/...    ← publicly accessible via bucket policy
tenants/{tenant_id}/private/{type}/...  ← no public access; served via pre-signed URLs
```

**Current public types:** `menu-items`, `menu-categories`, `profile-photos`
**Current private types:** `staff-documents`, `exports`, `gdpr-exports`

### Rules

1. **Always use `App\Support\StoragePath`** to build paths — never hardcode path strings in services or jobs.
2. **DB always stores the path, never the full URL.** Resources resolve path → URL at response time using `StoragePath::publicUrl()` or `StoragePath::privateUrl()`.
3. **Public files** are served via the permanent S3 URL (`StoragePath::publicUrl()`). The bucket policy grants `s3:GetObject` on `tenants/*/public/*` — adding a new public type requires no policy change.
4. **Private files** are served via pre-signed URLs (`StoragePath::privateUrl($path, $ttlMinutes)`). Default TTL: 60 min. Use longer TTLs only for async exports (24 h) and GDPR exports (72 h).
5. **Adding a new upload type:** add a static method to `StoragePath`, choose the zone (public/private), use it in the service, resolve in the resource. No bucket policy change needed for either zone.

---

## Decision 13 — Reverb SSL Termination

**Date decided:** 2026-04-07
**Decision:** Nginx terminates SSL (`wss://`), proxies to Reverb container over plain `ws://` internally
**Local dev:** Plain `ws://localhost:8080` — no SSL needed
**Production:** `wss://` → Nginx (SSL cert) → Reverb container (`ws://reverb:8080`)

---

## Decision 14 — Reverb Channel Authorization

**Date decided:** 2026-04-07
**Decision:** All WebSocket channels are private. Auth endpoint `POST /api/v1/broadcasting/auth` validates:
1. User is authenticated
2. Channel `tenant_id` matches user's `tenant_id`
3. Channel `branch_id` is in user's `branch_ids`
Hard 403 on any mismatch — no silent failure.

---

## Decision 15 — Reverb Scaling

**Date decided:** 2026-04-07
**Decision:** Single Reverb instance for Phase 1 + Phase 2. Horizontal scaling via Redis pub/sub deferred to Phase 3 (Kubernetes).
**Note:** Reverb supports this natively — no architecture changes needed when Phase 3 arrives.

---

## Decision 16 — Logging

**Date decided:** 2026-04-07
**Decision:** AWS CloudWatch for all application logs
**Package:** `maxbanton/cwh` (Monolog CloudWatch handler)
**Log groups:** `/cheflogik/api`, `/cheflogik/worker`, `/cheflogik/reverb`
**Log level:** Production → `error` and above only. Local dev → `daily` file driver (no CloudWatch locally).
**IAM permissions required:** `logs:PutLogEvents`, `logs:CreateLogGroup`, `logs:CreateLogStream`

---

## Decision 17 — Privilege Escalation Prevention

**Date decided:** 2026-04-07
**Decision:** Enforced. Users can only assign permission slugs they personally hold when creating/editing custom roles.
**Implementation:** Validated in `RoleService::validatePermissionEscalation()` before any role is saved.
**Scope:** Branch Managers cannot create roles with permissions beyond their own set. Owners are unrestricted (they hold all permissions).

---

## Decision 18 — Token Expiry

**Date decided:** 2026-04-07
**Decision:**
- Staff tokens: 8-hour expiry + refresh endpoint (`POST /api/v1/auth/refresh`). Aligns with shift-based work patterns.
- Customer tokens: 30-day expiry, revoked on explicit logout.
- Platform admin tokens: No expiry, revoked explicitly only.
**Configuration:** `config/sanctum.php` per guard.

---

## Decision 19 — Customer Auth Flow

**Date decided:** 2026-04-07
**Decision:** After login, customer receives platform-level token. `GET /api/v1/auth/customer/restaurants` returns list of restaurants with `customer_tenant_profiles` records. `POST /api/v1/auth/customer/select` re-scopes the token with selected `tenant_id`.
**First-time enrolment:** `customer_tenant_profiles` record auto-created when a staff member enrolls the customer at a restaurant for the first time.

---

## Decision 20 — Password Reset

**Date decided:** 2026-04-07
**Decision:**
- Staff: Email-based reset only (`StaffPasswordResetMail` via SES).
- Customers: Both email and SMS OTP paths fully implemented. Email path: `CustomerPasswordResetMail`. SMS path: `POST /v1/customer/auth/forgot-password` → Twilio OTP → `POST .../reset-password/sms`. Path selected per `communication_prefs`.

---

## Decision 21 — Test Database

**Date decided:** 2026-04-07
**Decision:** Real Postgres for all tests. No SQLite — schema uses ULID, JSONB, partitioned tables, and partial indexes which SQLite does not support.
**Setup:** Two DB credentials per developer on shared infra:
- `cheflogik_<name>` — main development database
- `cheflogik_<name>_test` — test database, reset between test runs via `RefreshDatabase` trait
**phpunit.xml** overrides `DB_DATABASE` to point to the test database.
Both credentials documented in `.env.example`.

---

## Additional Decisions

_Record any architectural decisions made during development here. Date every entry._

---

## Decision 22 — Delivery Platform Integrations

**Date decided:** 2026-04-19
**Decision:** Uber Eats and Wolt only. DoorDash is not integrated.
**Rationale:** Market fit — DoorDash has minimal presence in the target markets. Wolt replaces DoorDash in scope.
**Implications:**
- `DeliveryPlatform` enum has two cases: `UberEats` and `Wolt`
- `menu_item_platform_mappings.platform` column only accepts `'uber_eats'` and `'wolt'`
- All references to DoorDash in stubs, jobs, and docs are replaced with Wolt
- `SyncMenuItemToPlatformsJob` and `SyncOrderToPlatformsJob` target Uber Eats + Wolt

---

## Decision 23 — Landing / Customer-Facing Website App

**Date decided:** 2026-05-14
**Decision:** Each tenant gets a public-facing customer website hosted as a 4th standalone React app (`/landing`, port 5700). The website is not part of the staff app or customer portal — it is a separate Vite project.
**Rationale:** Restaurants need a branded digital presence (menu browsing, online reservations, loyalty login) that is customer-facing, not staff-facing. Separating it avoids polluting the staff app with public routes.
**Architecture:**
- Separate Vite/React 19 project at `/landing`, port 5700
- Uses the `customer` Sanctum guard for authentication (same guard as the customer portal in `/web`)
- Three visual templates configurable per tenant: `v1-maison`, `v2-editorial`, `v3-cinematic`
- Template selection and content driven by `landing_template_settings` DB table (no tenant_id — per-restaurant config via branch/tenant slug routing)
- Multilanguage support via `I18nStore` — see Decision 25
- Customer auth: `/customer/auth/login` and `/customer/auth/register` endpoints; token stored as `landing_token` in localStorage
- Production domain: `landing.cheflogik.com`; deployed via same Jenkins + Terraform pattern as other apps
- Image: `ghcr.io/dishuoberoi/cheflogik-landing`

---

## Decision 24 — Floor Plan Coordinate System

**Date decided:** 2026-05-15
**Decision:** Table positions in floor plans use a meter-based coordinate system, not pixel-based.
**Rationale:** Pixel coordinates are resolution-dependent and break when the canvas size changes. Meter-based coordinates (e.g., `{x: 2.5, y: 1.0}` meaning 2.5m from left, 1.0m from top) are display-independent — the frontend scales them to pixels based on canvas dimensions at render time.
**Implications:**
- `tables.position` JSONB stores `{x, y, w, h, rotation}` in meters (e.g., a 1m × 0.8m table at position 2.5m, 1.0m)
- Floor plan canvas dimensions are stored separately; the frontend calculates `px = meters × (canvasPx / canvasMeters)`
- Migration `2026_05_15_000002_convert_table_positions_to_meter_based.php` converted existing pixel values (data migration — kept as separate file, not merged into create migration)
- `add_floor_designer_metadata_to_tables.php` migration added: `section`, `server_station`, `seated_at`, `seated_by_user_id`, `last_cleared_at`, `last_cleared_by_user_id`, `merged_table_id`

---

## Decision 25 — Multilanguage Support

**Date decided:** 2026-05-14
**Decision:** The landing app supports multiple languages per restaurant. The staff app and admin app are English-only (MVP).
**Supported locales:** `en-US`, `en-GB`, `fr-FR`, `es-ES`, `de-DE`, `de-AT`, `pl-PL`, `it-IT`

> **Amendment (2026-06-14):** the "English-only (MVP)" clause is **superseded**. The i18n
> string-extraction work (plan `2026-05-25-i18n-string-extraction.md`, sessions 7–20) wired
> **both** the staff app (`/web`) and admin app (`/admin`) with the full 7-locale `I18nStore`,
> fetching from `GET /api/v1/translations/{locale}?app=web` and `?app=admin` respectively
> (backend lang files `lang/{locale}/web.php` and `lang/{locale}/admin.php`). All three apps
> are now multi-locale. **Data-completeness caveat:** only `en-US` is fully translated for
> `web`/`admin`; the other six locales fall back to English (Task 14 of that plan is still open
> — new keys are added to `en-US` only).
**Architecture:**
- Each tenant configures which locales they support via `landing_template_settings.supported_locales` (JSONB array)
- Backend exposes `GET /api/v1/translations/{locale}?app=landing` returning a flat key→value translation map
- Frontend `I18nStore` fetches translations on locale change; `t(key, vars?)` is the translation helper
- Active locale persisted in `localStorage` under key `cl_landing_locale`
- Default locale: `en-US` (always included, cannot be removed)
- The `LanguageSwitcher.tsx` component renders a locale picker in the template header/footer

---

## Decision 26 — Timezone Policy (Branch-Local)

**Date decided:** 2026-06-12
**Decision:** Time-based operations use the branch's timezone (`branches.timezone`), not server time. Tenant-wide operations (analytics daily windows, scheduled reports) use the tenant's **primary branch** timezone. Database timestamps remain stored as-is (UTC/server time) — conversion happens at the application boundary.
**Rationale:** Reservation reminders, operating hours, RevPASH hours, and "daily" aggregation windows are business-local concepts. The `branches.timezone` column existed but was never read, causing reminders and reports to fire at wrong wall-clock times for tenants outside the server timezone (GAPS.md bugs B3/B4).
**Implications:**
- Reservation reminder triggers computed as `Carbon::parse($date . ' ' . $time, $branch->timezone)`
- Analytics daily aggregation and scheduled report cadence checks evaluate "today"/"yesterday" in the tenant's primary branch timezone
- RevPASH (when implemented) uses branch-local operating hours
- New code reading or comparing business times MUST pass the branch timezone explicitly

---

## Decision 27 — Payment Idempotency-Key Strategy (Stable Client Key)

**Date decided:** 2026-06-12
**Decision:** The frontend generates **one** UUID per order payment attempt and reuses it for every retry of that attempt. A new key is generated only when a new payment attempt is explicitly started (e.g., after a failed/cancelled attempt is dismissed).
**Rationale:** The previous implementation generated a fresh `randomUUID()` on every `createPayment()` call, so a double-click created two PaymentIntents — the Idempotency-Key header protected nothing (GAPS.md bug B6).
**Implications:**
- `/web` keeps the key in component/store state keyed by order ID until the payment succeeds or is restarted
- Backend behaviour unchanged: `Idempotency-Key` header remains required on `POST /orders/{id}/payment` and `POST /events/{id}/payment`
- A server-side guard (refuse second active PaymentIntent per order) is a possible future hardening, not in scope now

---

## Decision 28 — Loyalty Points Clawback on Refund (Proportional, Floor at Zero)

**Date decided:** 2026-06-12
**Decision:** When an order that earned loyalty points is refunded (full or partial), points are reversed proportionally: `floor(refunded_amount × earn_rate_applied)`, capped at the points still un-reversed for that order, and floored so the balance never goes below zero.
**Rationale:** Without clawback, a customer could earn points, refund the order, and keep the points (refund-farming). Proportional reversal using the stored `earn_rate_applied` is exact even when tier/birthday multipliers applied at earn time. Flooring at zero matches `adjustPoints()` — no negative-balance UX exists anywhere in the apps.
**Implementation:**
- `LoyaltyService::reversePointsForRefund()` — creates a `reverse` LoyaltyTransaction (the enum case existed, previously unused); repeat partial refunds are capped by summing prior reversals for the order
- `ReverseLoyaltyPointsJob` (counterpart of `IssueLoyaltyPointsJob`) dispatched by `RefundEngine` after both full and partial refunds
- Points the customer already **redeemed** on the refunded order are NOT re-credited, and `lifetime_spend`/`lifetime_visits` recorded at completion are NOT decremented — points clawback only
- Tier is not re-evaluated on reversal — downgrades remain the weekly batch job's responsibility (30-day grace)

---

## Decision 29 — Customer Profile Merge (Platform-Wide, Reversible 30 Days)

**Date decided:** 2026-06-12
**Decision:** Manual profile merge (`POST /v1/customers/merge`) is **platform-wide**: all of the secondary profile's data across every tenant is repointed to the primary, matching the documented outcome "all history, points, notes consolidated into primary; secondary archived (status='anonymised')". Reversible for 30 days via `POST /v1/customers/merge/{id}/revert`.
**Rationale:** Duplicates originate at the platform level (landing OTP signups — Decision 3 makes `customer_profiles` platform-level), so a tenant-scoped merge would leave the duplicate alive and walk-in matching would keep flagging it. The 30-day revert (full pre-merge snapshot in the new `customer_merges` table) is the safety net for the cross-tenant blast radius.
**Implementation (`CustomerMergeService`):**
- Guard: both profiles must be active AND enrolled at the initiating staff member's tenant (`customers.merge` permission)
- Per-tenant `customer_tenant_profiles`: consolidated where both exist (points transferred via `adjustment` loyalty transactions, lifetime spend/visits/no-shows summed, notes concatenated, secondary row anonymised); moved wholesale where only the secondary is enrolled
- Historical `loyalty_transactions` are repointed to the primary (consolidated history outweighs strict row-immutability here; `balance_after` values reflect the original per-profile chains); merge bookkeeping entries use `source_type='merge'`
- Repointed: orders, reservations, waitlist entries, events, landing reviews, customer notifications, referral links; `analytics_customer_segments` rows are deleted (weekly job regenerates)
- Secondary platform profile: `status='anonymised'`, portal tokens revoked (tokens are NOT restored on revert — customer re-logs in)
- Revert restores snapshot values; points the primary legitimately earned after the merge are kept (clawback floored at zero); tiers/RFM left to the weekly recalculation jobs
- Both merge and revert are written to the audit log

---

## Decision 30 — Tenant Integration Credentials UI + Per-Tenant Twilio

**Date decided:** 2026-06-13
**Decision:** The four external integrations (Uber Eats, Wolt, Stripe Terminal, Twilio) are managed by tenant staff through a Settings → Integrations tab backed by `GET /v1/integrations` and `PUT /v1/integrations/{type}`, gated by a new `integrations.manage` permission. The previously-decorative `tenant_integrations.twilio` row now actually drives SMS sending: `TwilioSmsProvider` prefers the tenant's own active credentials and falls back to the platform-level `config('sms.twilio.*')`.
**Rationale:** GAPS.md §4 — the whole integrations UI was missing and the SMS provider ignored per-tenant credentials. A dedicated `integrations.manage` permission keeps credential access auditable and separate from display-preference settings.
**Implementation:**
- `integrations.manage` permission seeded to **Owner** + **Branch Manager** system roles (Branch Manager inherits all-but-`owners.manage`); `TenantIntegrationController` authorizes on it
- `index` returns all four types as rows (configured placeholders when absent); secrets masked in `TenantIntegrationResource` (`••••` + last 4); `update` **merges** provided credential keys over stored ones so the UI never resubmits masked secrets, and ignores any value still containing `••••`
- `SmsProviderInterface::send()` gained an optional `?string $tenantId`; all SMS call sites with tenant context (`SendReservationReminder24h/2h`, `SendCampaignJob`, `ExpireLoyaltyPointsJob`) pass it. Customer OTP (`CustomerOtpService`) stays platform-level (pre-auth, no tenant context)
- Integration create/update written to the audit log (`integration.updated`); credential *values* never logged — only the list of changed keys

### Plan-limit enforcement (same decision, GAPS.md §10 item 13)

**Decision:** Subscription-plan feature flags (`subscription_plans.features` JSONB + `max_branches`) are enforced at the route boundary via a new `plan.feature:<flag>` middleware, plus a `max_branches` guard in `BranchService::create`. The `/v1/modules` endpoint additionally merges plan flags so the `/web` sidebar auto-hides plan-gated items.
**Rationale:** Starter/Growth/Enterprise were functionally identical (Decision 2 left enforcement as a no-op). UI-only gating would violate the "API always re-validates" rule, so the gate lives in middleware; the merged `/modules` response is the UX layer on top.
**Implementation:**
- `App\Support\PlanFeatures` — single source of truth (per-request memoised `Tenant::with('plan')` lookup); tenants with no plan are unrestricted (MVP-safe)
- `plan.feature` middleware → 403 `{code: 'plan_limit', feature}` so the frontend can prompt an upgrade vs. a permission denial
- Gated route groups: `events.*` (`events`), `customers/campaigns` (`loyalty_campaigns`), custom-role **mutations** only — index/show stay open (`custom_roles`), `analytics/reports/export` (`export`)
- `BranchService::create` enforces `max_branches` (counts tenant-scoped branches) → 403 `plan_limit`
- `ModulesController` merges `events`/`inventory` (module-level) and adds `loyalty_campaigns`/`custom_roles`/`export` flags; `/web` Sidebar gains a `module?` field on nav items + `modules.isEnabled()` check; Roles page hides "New role" when `custom_roles` is off

---

## Decision 31 — Customer Order/Reservation History Endpoints

**Date decided:** 2026-06-13
**Decision:** Customer order-history and reservation-history are served by two dedicated nested endpoints — `GET /v1/customers/{customer}/orders` and `GET /v1/customers/{customer}/reservations` — mirroring the existing `/branch-visits` pattern, rather than overloading the branch-dashboard-oriented `/orders` and `/reservations` index endpoints with a `customer_profile_id` filter.
**Rationale:** GAPS.md §4 listed the customer detail order/reservation tabs as "unblocked frontend," but neither index endpoint accepted a customer filter (orders: `branch_id, status, source, payment_status, date_from, date_to`; reservations: `branch_id, date, status`). Dedicated nested endpoints keep the customer's tenant-wide history self-contained, reuse the existing `OrderResource`/`ReservationResource`, and match the established `branch-visits` convention on `CustomerController`.
**Implementation:**
- `{customer}` binds to `CustomerTenantProfile` (tenant-scoped); history is queried by `$customer->customer_id` against the tenant-scoped `Order`/`Reservation` models, so results are tenant-wide (all branches) — consistent with `/branch-visits`
- Both authorized on `customers.view_full`; `abort_if` on tenant mismatch like sibling methods
- Paginated (default 20, max 50): orders reverse-chron by `created_at`; reservations by `reservation_date` then `reservation_time` desc
- Routes registered before the `/customers/{customer}` catch-all (static path precedence)
- `/web` customer detail (`$customerId.tsx`) gains "Orders" and "Reservations" tabs; store holds paginated history keyed by customer id

---

## Decision 35 — Loyalty Tier Thresholds Embedded in Customer-Detail Response

**Date decided:** 2026-06-14
**Decision:** The per-tenant loyalty tier thresholds (`loyalty.tier_silver_spend`, `loyalty.tier_gold_spend`, `loyalty.tier_silver_visits`, `loyalty.tier_gold_visits`) are returned as a `meta.loyalty_config` block on the `GET /v1/customers/{customer}` (show) response, so the customer-detail tier-progress bar can render without requiring the `settings.view` permission.
**Rationale:** GAPS.md §4 — the tier-progress bar was static text because the thresholds were only reachable via `GET /settings/` (gated by `settings.view`). A staff member who can view a customer (`customers.view_full`) does not necessarily hold `settings.view`, so reading the settings endpoint would couple customer-view to a settings permission. The thresholds are tenant-wide and small, so embedding them in the detail response (which the page already fetches) avoids both an extra request and the permission mismatch.
**Implementation:**
- `CustomerController::show` injects `SettingsService` and returns a manual `{data, meta}` body (`ApiResponse::success` nests the resource under `data`, so `Resource::additional()` would not surface) — `meta.loyalty_config` holds the four resolved threshold values (tier rule is `spend ≥ X OR visits ≥ Y`).
- `/web` `CustomerService.get` now returns `{ customer, loyaltyConfig }`; `CustomerStore` holds a single tenant-wide `loyaltyConfig` (frozen, populated by `fetchOne`); the customer-detail loyalty tab renders a progress bar (max of spend-ratio and visits-ratio toward the next tier) replacing the static `tier_*_next` hints. Gold shows the "highest tier" label; missing config falls back to the old static hint.
- DOB capture (same GAPS line): the enroll form gains day + month `Select`s (no year — birthday loyalty perks); `EnrollCustomerRequest`/`CustomerService` already accepted `date_of_birth.{day,month}`, so this was frontend-only.

---

## Decision 36 — RevPASH (Revenue Per Available Seat-Hour)

**Date decided:** 2026-06-14
**Decision:** RevPASH is computed as **`Σ gross_revenue (all order channels) ÷ Σ(seats × open_hours_per_day)`**, evaluated in branch-local time (Decision 26), served by a dedicated `GET /v1/analytics/revpash` gated by the existing `analytics.revenue_branch` permission. No new schema.
**Scope choices (confirmed with product):**
- **Seats** = sum of the branch's table capacities (`Σ tables.capacity_max`), derived from the floor/table layout — e.g. 2 floors × 4 tables × 4 seats = 32. No separate branch seat-count column is introduced (Group C item 9 may add one later; RevPASH will switch to it if so).
- **Open hours** per day come from `branches.operating_hours` for the weekday, overridden by `special_operating_hours` (a closed day from either source contributes 0). Open/close are branch-local wall-clock strings; a close at/after open is treated as crossing midnight. Hour durations are timezone-independent, and a calendar date's weekday is identical in any timezone, so branch-local correctness holds without per-row TZ conversion.
- **Revenue** = `gross_revenue` from the pre-aggregated `analytics_daily_revenue` summed over the date range, **all channels** (dine-in + takeaway + delivery + online + Uber/Wolt), per the product call — not dine-in only. `analytics_daily_revenue.date` is already stored in the tenant primary-branch local day (per `AggregateDailyRevenueJob`), so date-range filtering is consistent.

**Amendment (2026-06-14, Decision 39):** seats now prefer the explicit `branch.seat_count` setting when set (`> 0`), falling back to `Σ tables.capacity_max` otherwise. `RevpashReportService` gained a `SettingsService` dependency and resolves `branch.seat_count` per branch.
**Rationale:** GAPS.md §3 listed RevPASH as not implemented. The seat-hour denominator and revenue are both already derivable (tables, operating/special hours, daily-revenue aggregate), so no valuation snapshot or new column was needed for MVP scale. Reusing `analytics.revenue_branch` keeps it on the existing revenue-report permission.
**Implementation:**
- `App\Services\Analytics\RevpashReportService::generate(tenantId, from, to, ?branchId)` returns overall `revpash`, `revenue`, `seat_hours`, plus a `by_branch` array (`seats`, `open_hours`, `seat_hours`, `revenue`, `revpash`); divide-by-zero (no seats or fully-closed range) yields `null`.
- `ReportController::revpash` (method-injected service, mirrors `cogsReport`); route registered next to `/analytics/revenue`.
- `/web` `/analytics/revpash` page + AnalyticsNav tab (gated `analytics.revenue_branch`): branch + date-range filter, summary cards (RevPASH, gross revenue, seat-hours) and a by-branch table. apiClient + local `useState` (report-page idiom, not MST).

---

## Decision 37 — Per-Staff Analytics (Extend `/analytics/staff`, Attendance-Derived Labour Cost)

**Date decided:** 2026-06-14
**Decision:** The existing `GET /v1/analytics/staff` (gated `analytics.staff_aggregate`) is extended with a `by_staff` breakdown. Per-staff **labour cost** is computed as `attendance_hours × users.employment.hourly_rate`; per-staff **performance** is attendance-based only (overtime shifts, late arrivals) — order revenue is **not** attributed to individual staff because no order-level server/waiter column exists. The previously-null `labour_cost_pct` is fixed to use `Σ(computed labour cost) ÷ Σ gross_revenue`.
**Rationale:** GAPS.md §4 — per-staff metrics were missing/mock. The data to do it exists (`attendance_records.user_id` + clock in/out + is_overtime/is_late; `users.employment.hourly_rate`), but `analytics_daily_revenue.labour_cost` is never populated by `AggregateDailyRevenueJob` (always null), so the old branch-level `labour_cost_pct` was always null — computing labour cost from attendance × rate is the only working basis. There is no `orders.server_id`/`waiter_id`, so sales-per-staff performance is impossible without new schema; attendance-based performance ships now, sales attribution deferred.
**Implementation:**
- `ReportController::staff` now returns `by_branch` (unchanged), `by_staff` (`user_id, name, role, shift_count, total_hours, overtime_shifts, late_arrivals, labour_cost`, sorted by labour cost desc), `total_labour_cost`, `gross_revenue`, and `labour_cost_pct`. Users loaded with `roles:id,name` (first role as the label); `employment` is array-cast so `hourly_rate` reads directly; missing rate ⇒ 0.
- `/web` new `/analytics/staff` page + AnalyticsNav tab (gated `analytics.staff_aggregate`): branch + date-range filter, summary cards (total labour cost, labour-cost %, gross revenue) and a per-staff table. apiClient + local `useState`.
- **Deferred:** if `orders` later gains a staff/server attribution column, sales-based performance (covers/sales per staff, sales-per-labour-hour) can extend `by_staff`.

---

## Decision 41 — Drop Vestigial `customer_profiles.no_show_count`

**Date decided:** 2026-06-14
**Decision:** The platform-level `customer_profiles.no_show_count` column is **dropped** (removed from the `create_customer_profiles` migration — merge-into-create, needs `migrate:fresh`). No-show counts are tenant-scoped and live solely on `customer_tenant_profiles.no_show_count`.
**Rationale:** GAPS.md §9 schema-drift. Bug B2's fix moved all no-show writes to the tenant profile (per Decision 3 / the schema doc), leaving the platform column never written — it was only echoed (always 0) by `CustomerProfileResource`. Removing it eliminates the drift rather than documenting a dead column.
**Implementation:**
- Removed `$table->unsignedSmallInteger('no_show_count')` from `2026_04_07_000006_create_customer_profiles_table.php`.
- Dropped `no_show_count` from `CustomerProfileResource`. Verified no consumer of the **platform** field exists: `/web` and the customer portal read the **tenant** profile's `no_show_count` (`CustomerTenantProfileResource` / `PortalLoyalty`), `CustomerMergeService` consolidates the tenant-profile field, and `ReservationService` reads/increments the tenant-profile field. The `CustomerProfile` model never declared it in `$fillable`/`$casts`.

---

## Decision 40 — 86 Auto-Restore (Manual 86s Only; Inventory-Stockout Always Manual)

**Date decided:** 2026-06-14
**Decision:** A **manual** 86 can carry an auto-restore policy — `auto_restore_mode ∈ {none, end_of_day, scheduled}` with an `auto_restore_at` timestamp. An **inventory_stockout** 86 is **always forced to `none`** and never auto-restores — manual manager confirmation remains mandatory (food-safety rule, CLAUDE.md §5). The two new columns are **merged into the create migration** (`eighty_six_log` is not yet in a live env; needs `migrate:fresh`).
**Rationale:** GAPS.md §3 (Menu) — `auto_restore_mode` was missing and blocked the UI. Letting staff schedule a manual 86 to come back automatically (end of service / a set time) is a real operational need, while the food-safety invariant for stock-driven 86s must be preserved. All three modes were chosen for flexibility.
**Implementation:**
- New enum `EightySixAutoRestoreMode` (none / end_of_day / scheduled). Columns `auto_restore_mode` (default `none`) + `auto_restore_at` on `eighty_six_log`, with CHECK constraints for the enum and a **DB-level food-safety guard** (`trigger_type <> 'inventory_stockout' OR auto_restore_mode = 'none'`) plus a partial index on `auto_restore_at` for the sweep.
- `EightySixService::eightySix()` gained `$autoRestoreMode` + `$autoRestoreAt`; forces `none` for inventory_stockout; resolves `auto_restore_at` for `end_of_day` as the **branch-local** end of the started day (Decision 26). New `autoRestoreDue()` restores due manual 86s as a **system action** (no user, `restored_by` null, note `Auto-restored (mode)`), excluding inventory_stockout at the query level, firing the same `ItemAvailabilityChanged` + platform-sync side-effects as a manual restore.
- `AutoRestoreEightySixJob` runs every 5 min (`high` queue, `withoutOverlapping`). `EightySixItemRequest` validates the mode + `required_if`/`after:now` on the timestamp; `MenuItemController::eightySix` passes them; `EightySixLogResource` exposes both fields.
- `/web` item-detail 86 section: mode `Select` (+ `DatePicker`/`TimePicker` when `scheduled`) before the 86 button; active manual 86s show their pending auto-restore. Quick-86 elsewhere defaults to `none`.

---

## Decision 38 — Branch QR Code (Server-Generated SVG, Landing-Home Target)

**Date decided:** 2026-06-14
**Decision:** `GET /v1/branches/{branch}/qr-code` (gated `branches.view`) returns `{ url, svg }` — the branch's public landing URL and a **server-generated SVG** QR code encoding it. The QR links to the **landing home scoped to the branch**: `{LANDING_URL}/{tenant-slug}?branch={branch_id}`.
**Rationale:** GAPS.md §3 (Menu) — the endpoint was missing and blocked the QR-per-branch UI. Server-side SVG keeps the QR canonical (one source of truth for the encoded URL, no landing host hardcoded in the staff app) and needs no frontend rendering dependency. Landing home (vs menu/reserve) was chosen so a single code reaches menu, reservations, and loyalty.
**New dependency + config (approved):**
- **`endroid/qr-code ^6.1`** (composer) — SVG output via `SvgWriter` (uses ext-dom/XMLWriter, no GD). `bacon/qr-code` was the first choice but did not resolve for this PHP/stability; endroid is the equivalent, more widely used lib.
- **`config('app.landing_url')`** ← new `LANDING_URL` env (`.env.example` defaults to `http://localhost:5700`; `config/app.php` falls back to `https://landing.cheflogik.com`). No new config file — a key on the existing `app` config.
**Implementation:**
- `BranchController::qrCode` — tenant-mismatch `abort_if` + `branches.view`; builds the URL from `app.landing_url` + `$branch->tenant->slug` + `?branch={id}`; `(new SvgWriter())->write(new QrCode(data: $url, size: 320, margin: 8))->getString()`. Route registered next to the branch hours routes.
- `/web` branch edit page (`branches/$branchId.tsx`) gains a `BranchQrSection`: fetches the endpoint (apiClient + local `useState`), renders the SVG inline, shows the URL, and offers SVG download + print (print opens a window with the SVG + URL).

---

## Decision 39 — Branch Business-Target Settings (Settings Registry, No Migration)

**Date decided:** 2026-06-14
**Decision:** Branch business targets — **seat count, monthly revenue target, food-cost-% target, waste threshold %, and per-platform delivery commission rates** — are stored as branch-scoped keys in the **settings registry** (`config/settings.php`), not as new `branches` columns. They surface on the existing `/web` branch settings page (catalogue-driven) via the existing `/settings/branch/{branch}` GET/PATCH endpoints. No migration.
**Rationale:** GAPS.md §4 — these were missing. The settings registry (branch → tenant → platform → default cascade) + the catalogue-driven branch settings page + endpoints already existed, so adding keys is migration-free and immediately editable in the UI. Dedicated columns would add schema rigidity for values that are operator-tunable config.
**Implementation:**
- New keys (group `operations`, permission `branches.edit` — `SettingsService::canEdit` accepts any slug, and these are branch-detail config): `branch.seat_count` (int, branch-scope only, 0 = derive from layout), `branch.revenue_target` (decimal), `branch.food_cost_target_pct` (decimal, default 30), `branch.waste_threshold_pct` (decimal, default 5), `branch.commission_uber_eats` / `branch.commission_wolt` (decimal %, default 30).
- `/web`: added `operations` to `GROUP_LABELS`, the `SettingGroup` union, and the branch page's `BRANCH_GROUPS` whitelist — the catalogue-driven page renders the new fields automatically.
- **RevPASH (Decision 36) amended:** `branch.seat_count` is now the preferred seat source, falling back to `Σ tables.capacity_max` when 0/unset.

---

## Decision 32 — COGS Calculation (Movement-Derived, Dedicated Endpoint)

**Date decided:** 2026-06-13
**Decision:** Cost of Goods Sold (`opening_stock + purchases − closing_stock`) is computed **movement-derived with no new schema**, served by a **dedicated** `GET /v1/analytics/cogs-report` gated by the previously-unused `inventory.view_cogs` permission.
**Rationale:** GAPS.md §3 — only the `inventory.view_cogs` slug existed. The `stock_movements` table (signed `quantity`, `unit_cost` on GRN, `wac_before/after` on all types) plus the live WAC snapshot on `inventory_items` already contain everything needed, so no daily-valuation snapshot table/job was warranted for MVP scale. A dedicated endpoint keeps COGS access on its own permission (auditable, separate from the broader `analytics.inventory_analytics` dashboard) and cleanly feeds the `/web` inventory-analytics view.
**Implementation (`App\Services\Analytics\CogsReportService`):**
- Per-movement value = `quantity × COALESCE(unit_cost, wac_after, 0)` — GRN carries the purchase `unit_cost`; every other type (sale_deduction, waste, adjustment, stocktake_correction, transfer, cancellation_return) leaves `unit_cost` null and stores the per-unit WAC in `wac_after`, so the COALESCE selects the right cost basis. (Critical: deductions/waste do **not** set `unit_cost`, so the older `inventory` report's `quantity × unit_cost` undercounts — COGS must use the COALESCE.)
- `closing = (Σ current_stock × wac) − Σ value(movements after `to`)` (rolls the live valuation back to period end); `opening = closing − Σ value(movements in [from,to])`; `purchases = Σ value(GRN in [from,to])`; `cogs = opening + purchases − closing`.
- Also returns `waste_cost` (reported separately though already inside COGS), `gross_revenue` + `food_cost_pct` (= cogs/gross from `analytics_daily_revenue`), and a `by_category` COGS breakdown (`−Σ` non-GRN value grouped by `inventory_items.category`).
- Branch filter optional (tenant-wide when omitted); WAC roll-back is an accepted approximation for arbitrary historical `to`.
- `/web` Inventory analytics view (Group B item 5) consumes this; the existing `/analytics/inventory` report is left untouched.

---

## Decision 33 — SMS STOP Is a Hard Opt-Out of All SMS (Centrally Enforced)

**Date decided:** 2026-06-13
**Decision:** A customer's STOP reply opts them out of **all** SMS — transactional (reservation reminders, OTP, loyalty-expiry warnings) and marketing alike — not just marketing. The opt-out is recorded as a new `sms_opted_out` boolean inside the existing `customer_profiles.communication_prefs` JSONB (no migration) and enforced **centrally in `TwilioSmsProvider::send()`**.
**Rationale:** GAPS.md §2 — the STOP webhook only flipped `sms_marketing`, so transactional sends kept being attempted to opted-out numbers. A carrier-level STOP blocks every SMS from the sender anyway (Twilio error 21610), so continuing to attempt transactional sends both violates the opt-out and fails. Central enforcement guarantees every call site (including future ones) honours the opt-out without each having to remember the check; the per-send phone lookup is cheap at this scale.
**Implementation:**
- Twilio webhook (`TwilioWebhookController`): STOP/STOPALL/UNSUBSCRIBE/CANCEL/END/QUIT → `sms_opted_out=true` (+ `sms_marketing=false`); START/UNSTOP/YES → `sms_opted_out=false` (+ `sms_marketing=true`). Applied to all profiles sharing the normalised number.
- `TwilioSmsProvider::send()` normalises the recipient (`Phone::normalise`) and skips + logs the send if any platform-level `CustomerProfile` with that phone has `sms_opted_out=true`. `NullSmsProvider` (local) is unaffected.
- Marketing still additionally honours `sms_marketing` at its call sites (`SendCampaignJob` already gates on it). OTP/registration to a non-opted-out number is unchanged.

---

## Decision 34 — GDPR Export Status Endpoint (Dedicated, Nested, `customers.gdpr`-gated)

**Date decided:** 2026-06-13
**Decision:** The async GDPR data-export poll is served by a **dedicated nested** endpoint `GET /v1/customers/{customer}/gdpr/export/{jobId}/status` gated by `customers.gdpr`, rather than reusing the analytics export poller `GET /v1/exports/{jobId}/status` (gated by `analytics.export`).
**Rationale:** `GdprDataExportJob` already writes its result to the shared `export:{tenant}:{jobId}` cache convention, and the existing analytics poller reads that exact key — but it is gated by `analytics.export`. A staff member who manages GDPR (holds `customers.gdpr`) does not necessarily hold `analytics.export`, so reusing the analytics endpoint would couple GDPR access to an unrelated analytics permission. A dedicated nested endpoint keeps the permission scoping correct and matches the Decision 31/32 dedicated-endpoint precedent.
**Implementation:**
- `CustomerController::gdprExportStatus(Request, CustomerTenantProfile $customer, string $jobId)` — `authorize('customers.gdpr')`, `abort_if` on tenant mismatch (mirrors `gdprExport`/`branchVisits`), reads `cache()->get("export:{$customer->tenant_id}:{$jobId}")`, 404 when the key is absent/expired. No new cache key or job change — the existing `GdprDataExportJob` status shape (`processing` / `ready`+`url`+`expires_at` / `failed`+`message`) is returned as-is.
- Route registered **before** the `/customers/{customer}/gdpr/export` and `/customers/{customer}` wildcards (static-path precedence).
- `/web` customer detail GDPR tab: a "Data Export (Portability)" card (gated `customers.gdpr`) triggers `GET .../gdpr/export` (202 + `job_id`), then polls the status endpoint every 2.5 s via a `useEffect` keyed on the job id (transient UI state with local `useState`, not MST — consistent with the report-page idiom); renders a 72 h download link when `ready`. Download URL is the job's 72 h pre-signed S3 URL (Decision 12).

---

## Decision 42 — Event ↔ Order Linkage (`orders.event_id`, Manual Attach/Detach)

**Date decided:** 2026-06-14
**Decision:** An order may be linked to at most one function/event via a new nullable `orders.event_id` FK. Linking is **manual**: staff attach/detach existing POS orders from the event detail's "Orders" section. There is no automatic association (by table/time) and no order-creation-time event picker in this iteration. Read access is gated by `events.view`; attach/detach by `events.manage`.
**Rationale:** GAPS.md §4 "Linked orders view per event" was mis-tagged as a frontend-only gap. The codebase had **no** event↔order linkage at all — orders carried no `event_id`, the `Event` model had no `orders()` relation, and events bill independently (deposit + final-spend via `EventService`), not through the orders table. So the feature required new backend. Manual attach is the smallest mechanism that delivers the "see the orders that belong to this function's tab" view without inventing an auto-association heuristic (which table+time windows would get wrong for shared spaces). A same-branch guard prevents linking an order from a different branch than the event.
**Implementation:**
- Migration: `event_id` (`foreignUuid`, nullable, `nullOnDelete`) **merged into** `2026_04_07_000044_create_orders_table` (table never deployed → merge-into-create per `fix-migrations.md`; needs `migrate:fresh`), plus index `['tenant_id','event_id']`. `events` (000030) precedes `orders` (000044) so the FK resolves on fresh.
- Models: `Order::event()` belongsTo; `Event::orders()` hasMany. `event_id` added to `Order::$fillable` and `OrderResource` (so the UI can tell which orders are already linked).
- Endpoints (in the `plan.feature:events` group): `GET /events/{event}/orders` (paginated, newest-first; `meta.total_value` = `Σ total` of all linked orders), `POST /events/{event}/orders/{order}` (attach; same-tenant + same-branch guard, else 422), `DELETE /events/{event}/orders/{order}` (detach; 404 if the order isn't linked to this event). Tenant isolation via `abort_if` on `resolved_tenant_id`, mirroring the existing task sub-resource methods.
- `/web` event detail: an "Orders" section lists linked orders with the running total and a detach control, plus an attach flow that searches recent same-branch orders (`GET /orders?branch_id=…`) and links the chosen one. Transient state via local `useState` + `apiClient` (report-page idiom).
