# GAPS.md — Single Source of Truth for Outstanding Work

> **This file supersedes all previous gap trackers:** `NextSteps.md`, `.claude/pending.md`,
> `.claude/frontend-gaps.md`, `.claude/new-ui/plan-gap.md`, `.claude/landing-cms-missing-features.md`.
> Those files are archived (banner at top of each) and must not be updated.
>
> Every entry below was **verified against the code on 2026-06-12** — not copied from older docs.
> When an item is fixed, update it here in the same commit.

---

## 1. Verified Bugs (code review 2026-06-12)

| # | Bug | Location | Detail |
|---|---|---|---|
| B1 | ✓ FIXED 2026-06-12 — confirmation code now persisted | `reservations.confirmation_code` column (merged into create migration); generated in `ReservationService::create`, returned from persisted value, exposed in `ReservationResource`. | Tests not yet run — shared test Postgres was down. |
| B2 | ✓ FIXED 2026-06-12 — no-show count now tenant-scoped | `markNoShow` increments `customer_tenant_profiles.no_show_count` (per schema doc); platform-level column no longer written. | Platform-level `customer_profiles.no_show_count` column is schema drift — consider dropping later. |
| B3 | ✓ FIXED 2026-06-12 — reschedule re-dispatches reminders | `ReservationService::update` resets `reminder_sent_*` and calls `scheduleReminders()` on date/time change; jobs carry a `scheduledFor` guard and self-skip when stale. | |
| B4 | ✓ FIXED 2026-06-12 (fully) — reminders + crons branch-local | Reminder triggers in `branches.timezone`; analytics daily windows + scheduled-report cadence now evaluate "today/yesterday" in tenant primary-branch TZ (Decision 26). `Tenant::primaryTimezone()` defines primary branch = **oldest branch** (no `is_primary` column). | Scheduler still *fires* at server 02:00/07:00 — only the evaluated dates/windows are branch-local. |
| B5 | ✓ FIXED 2026-06-12 — processed-mark moved into job | `ProcessStripeWebhookJob` marks `stripe_event:{id}` only after successful handling; controller no longer pre-marks; job also self-skips replays already processed. | |
| B6 | ✓ FIXED 2026-06-12 — stable client key (Decision 27) | `web/OrderService.createPayment` keeps one UUID per order in a module map, reused on retry, dropped on success. | |
| B7 | ✓ FIXED 2026-06-12 — token refresh now `everyThirtyMinutes()` | `routes/console.php` | Refresh gap (30 min) stays safely under the 55-min token cache TTL; cron cannot express a true 50-min interval. |
| B8 | ✓ FIXED 2026-06-12 — E.164 normalisation centralised | `app/Support/Phone` + `CustomerProfile` set-mutator; landing OTP path normalises explicitly (raw attrs bypass mutator); webhook normalises `From` and updates **all** matches. | Pre-existing rows saved in non-E.164 formats are NOT backfilled — needs a data migration/command (ask before creating). WalkInMatchingService's UK 07/08→+44 inference was dropped for consistency. |

## 2. Security / Abuse Edge Cases

- [x] ~~`POST /v1/landing/reservations` has no throttle~~ — ✓ FIXED 2026-06-12: `throttle:5,1` added in `routes/landing.php`.
- [x] ~~Staff login has no per-IP rate limit~~ — ✓ FIXED 2026-06-12: per-IP throttles on all five unauthenticated staff auth endpoints in `routes/api.php` (`throttle:10,1` on login + otp/verify; `throttle:5,1` on otp/send, forgot-password, reset-password).
- [x] ~~Reminders use long `->delay()` on RabbitMQ with no reconciliation sweep~~ — ✓ FIXED 2026-06-12: `ReconcileReservationRemindersCommand` runs every 15 min, re-dispatches reminder jobs ≥20 min overdue with sent-flag unset (branch-local triggers per Decision 26; jobs' own guards prevent duplicates).
- [ ] STOP opt-out only flips `sms_marketing`; transactional SMS (reminders, OTP) still attempted to opted-out numbers.
- [x] ~~No loyalty points clawback on order refund~~ — ✓ FIXED 2026-06-12 per **Decision 28**: proportional clawback (`floor(refunded × earn_rate_applied)`, capped at un-reversed earn, balance floored at 0) via `ReverseLoyaltyPointsJob` dispatched by `RefundEngine` on full + partial refunds; uses the previously-unused `reverse` transaction type.

## 3. Backend Feature Gaps

### Reservations
- [x] ~~No-show deposit requirement flag~~ — ✓ FIXED 2026-06-12: `reservations.deposit_required` (merged into create migration — migrate:fresh needed) set in `ReservationService::create` when tenant-scoped `no_show_count` minus per-tier forgiveness ≥ `reservations.no_show_deposit_threshold` setting (default 2); exposed in `ReservationResource`.
- [x] ~~Loyalty member no-show forgiveness~~ — ✓ FIXED 2026-06-12: `loyalty.no_show_forgiveness_{bronze,silver,gold}` settings (default 1 each) subtracted from the count before the threshold check; counts stay accurate, forgiveness applies at flag time only.

### Customers & Loyalty
- [x] ~~Event booking 2× loyalty multiplier~~ — ✓ FIXED 2026-06-12: `EventService::complete` dispatches `IssueEventLoyaltyPointsJob` → `LoyaltyService::awardPointsForEvent` (actual_spend × rate × tier × `loyalty.event_multiplier` setting, default 2.0; idempotent per event).
- [x] ~~Points expiry mechanics~~ — ✓ FIXED 2026-06-12: daily `ExpireLoyaltyPointsJob` (03:40, analytics queue). 18-month inactivity → immutable `expire` transaction zeroes the balance; 12-month → email warning (SMS fallback) tracked in `customer_tenant_profiles.points_expiry_warned_at` (merged into create migration), re-armed by new activity. Activity = earn/redeem/bonus/adjustment (system expire/reverse excluded).
- [ ] 30-day downgrade grace period **warning notification** (downgrade scheduling itself works)
- [x] ~~Manual profile merge endpoint~~ — ✓ FIXED 2026-06-12 (backend) per **Decision 29**: `POST /v1/customers/merge` + `POST /v1/customers/merge/{id}/revert` (`customers.merge` permission). Platform-wide merge, snapshot in new `customer_merges` table, reversible 30 days, audit-logged. The §4 merge **UI** remains open (now unblocked).

### Analytics
- [x] ~~COGS calculation (`opening_stock + purchases − closing_stock`)~~ — ✓ FIXED 2026-06-13 (**Decision 32**): `CogsReportService` (movement-derived, no new schema) + `GET /analytics/cogs-report` gated by `inventory.view_cogs`. Per-movement value `quantity × COALESCE(unit_cost, wac_after, 0)`; returns opening/purchases/closing/cogs, waste_cost, food_cost_pct, and by-category breakdown.
- [ ] RevPASH — **not implemented anywhere** (the old "must respect special hours" framing understated this)
- [x] ~~Branch-local time for analytics daily windows + scheduled report cadence~~ — ✓ FIXED 2026-06-12 (see B4)

### Menu
- [ ] `GET /branches/{id}/qr-code` endpoint (blocks QR-per-branch UI)
- [ ] `auto_restore_mode` on 86 (blocks UI; inventory-triggered 86 must stay manual-restore per food-safety rule)

> Corrected from older docs: **CLV formula** (`RecalculateRfmSegmentsJob::calculateClv`) and the
> **tax collected report** (`GET /analytics/tax-report`) are implemented — NextSteps.md and CLAUDE.md
> previously listed them as missing.

## 4. Frontend Gaps (`/web` unless noted)

### Analytics & Reports
- [x] ~~Inventory analytics view (COGS / food-cost % / waste cost)~~ — ✓ FIXED 2026-06-13: `/analytics/inventory` page + AnalyticsNav tab (gated `inventory.view_cogs`), consumes `GET /analytics/cogs-report` — summary cards (COGS, food-cost %, waste, opening/purchases/closing, gross revenue) + COGS-by-category table.
- [ ] Staff analytics view (labour cost %, performance) — backend per-staff metrics also missing (mock data per new-ui plan)
- [x] ~~Tax/VAT report view~~ — ✓ FIXED 2026-06-13: `/analytics/tax` page (gated by `analytics.tax_reports`) + AnalyticsNav tab. Date-range + branch filter, gross-revenue-by-tax-category table with totals row, consuming `GET /analytics/tax-report`. (Endpoint returns gross revenue per `menu_items.tax_category`, not a computed tax amount — view reflects that.)
- [ ] Async export poll/download flow
- [x] ~~Financial period close trigger + locked-period indicator~~ — ✓ FIXED 2026-06-13: `PeriodClosePanel` on the inventory analytics page (gated `analytics.period_close`) — branch + period-end form posts `POST /analytics/period-close` (surfaces the backend "locked stocktake required" 422); closed-period history read from `GET /analytics/audit-log?action=analytics.period_close` (shown when the user also holds `analytics.audit_log`).
- [x] ~~Scheduled report delivery config UI~~ — ✓ FIXED 2026-06-13: Analytics → Scheduled Reports tab (`analytics/scheduled-reports.tsx`); CRUD over `reporting.scheduled_reports` via dedicated `GET/PUT /v1/analytics/scheduled-reports` (`ScheduledReportController`, validates report config shape + lets you clear all). Fixed latent bug: setting was gated by non-existent `analytics.view_reports` slug → now `analytics.export`.
- [ ] Custom date-range picker (presets only)
- [ ] Metric alert thresholds UI; custom report builder
- [ ] Churn-risk drill-down list (count stat exists on customers dashboard)

### Events
- [x] ~~Deposit collection trigger~~ — ✓ FIXED 2026-06-13: deposit panel on event detail (Financials section) for proposal/confirmed events not yet paid; Stripe PaymentElement flow via `POST /events/{id}/payment`, stable idempotency key per attempt (Decision 27).
- [ ] Linked orders view per event
- [ ] Recurring events UI

### Customers
- [ ] Loyalty redemption at POS checkout
- [x] ~~Order history + reservation history tabs on customer detail~~ — ✓ FIXED 2026-06-13 (**Decision 31**): two new tabs on customer detail (gated by `customers.view_full`), backed by new nested endpoints `GET /customers/{customer}/orders` + `/reservations` (paginated, tenant-wide, reverse-chron) — needed backend, was mis-scoped as unblocked. Load-more paging like the loyalty tab.
- [x] ~~Duplicate merge UI~~ — ✓ FIXED 2026-06-13: `/customers/merge` route (gated by `customers.merge`) — two search-driven profile pickers (primary/secondary, mutually excluded), ConfirmModal, then a success panel with an in-session 30-day Undo (`POST /customers/merge/{id}/revert`). Merge button added to customers header. Sends platform `customer_profiles.id` (= `tenant_profile.customer_id`). Note: no merge-list/duplicate-detection endpoint exists, so revert is only actionable immediately after the merge in the same session.
- [ ] GDPR data export trigger
- [x] ~~Campaign list/CRUD UI~~ — ✓ FIXED 2026-06-13: `/customers/campaigns` route (list + create/edit/cancel/send-now) wired to existing campaign routes; gated by `customers.manage_campaigns` + `loyalty_campaigns` plan flag; Campaigns button on customers header.
- [ ] Points expiry indicators (blocked by missing backend mechanics)
- [ ] Tier progress bar (static text hints only); DOB field on profile

### Branches
- [x] ~~Operating hours editor (weekly schedule)~~ — ✓ FIXED 2026-06-13: weekly operating-hours editor on branch edit page (per-day open/closed Switch + open/close TimePickers), saved via `operating_hours` on `PATCH /branches/{id}`.
- [x] ~~Special operating hours CRUD~~ — ✓ FIXED 2026-06-13: special-hours section (list + add date/closed/times/reason + delete) wired to `GET/POST/DELETE /branches/{id}/hours`.
- [ ] Branch settings (seat count, revenue targets, food-cost % target, waste threshold, delivery commission rates)

### Integrations (entire section missing)
- [x] ~~Uber Eats / Wolt credential entry into `tenant_integrations`~~ — ✓ FIXED 2026-06-13: `GET/PUT /v1/integrations[/{type}]` (`TenantIntegrationController`, `integrations.manage` permission per **Decision 30**); `/web` Settings → Integrations tab (`settings/integrations.tsx`) with masked-secret credential forms + per-platform settings (auto-accept, menu-sync, commission %).
- [x] ~~Stripe Terminal reader pairing~~ — ✓ FIXED 2026-06-13: Stripe Terminal credential entry (publishable/secret key, location ID) + capture-method setting in the same Integrations tab.
- [x] ~~Twilio configuration~~ — ✓ FIXED 2026-06-13: Twilio credential entry (account SID, auth token, from number) + per-tenant SMS rewire — `TwilioSmsProvider` now prefers active tenant credentials, falls back to platform config (**Decision 30**); SMS call sites pass `tenant_id`.
- [x] ~~Integration health view (`last_synced_at`, status)~~ — ✓ FIXED 2026-06-13: each card shows configured/active/inactive status badge + last-synced timestamp; secrets masked in `TenantIntegrationResource`.

### i18n (remainder of `.claude/plans/2026-05-25-i18n-string-extraction.md` Task 15)
- [x] ~~15a — `orders/disputes.tsx` not wired with `useT()`~~ — ✓ FIXED 2026-06-13: wired (title, columns, respond modal, status badges); `orders.disputes_*` keys added.
- [x] ~~15b — messaging components hardcoded strings~~ — ✓ FIXED 2026-06-13: `ConversationList`, `ChatPage`, `MessageInput` wired; `messages.search_placeholder/input_placeholder/not_enabled_subtitle/section_recent/section_all_staff/no_staff` added.
- [x] ~~15c — landing-cms route pages~~ — ✓ FIXED 2026-06-13: `seo/featured-items/social-feeds/reviews` headings + permission messages wired; `landing_cms.{no_permission,seo_*,featured_*,social_*,reviews_*}` added.

> Note: only `en-US` translations were added (other locales fall back to English, per the plan's known data-completeness gap — Task 14).
- 15d (nutrition panel) and 15e (order detail) are **done** — commit f528892's "plan complete" overstated only these three.

### Cross-cutting
- [ ] Global search (header input is static)
- [ ] Pagination on most lists (customers list has it)
- [ ] Retry flows on error states; skeleton loaders

> Corrected from frontend-gaps.md (all verified implemented): X-Branch-Id header (`api.ts:22`),
> admin impersonation + tenant reactivate (`PlatformStore`, `tenants.tsx`), feature flags API wiring
> (`flags.tsx`), messages inbox (`MessagesStore` → `/messaging/*`), notification dropdown
> (`NotifDropdown` → `notificationStore`), waitlist seat/remove (`waitlist.tsx`), table
> block/needs-cleaning (`TableStore`, `TablePopup`), menu engineering quadrant (`analytics/dishes.tsx`),
> events packages/spaces/corporate-accounts (built, 220–300 lines each).

## 5. Platform Admin (`/admin`)
- [ ] Tenant: change plan action
- [ ] Subscription plans: create-new-plan flow (`billing.tsx` has edit only)
- [ ] Platform analytics: per-tenant drill-down (Top Tenants not clickable)

## 6. Deferred (tracked, not scheduled)
- Course tracking on floor view (`orders.current_course` enum + bump control) — per CLAUDE.md
- Landing Phase 3 wave: review submission form, promotional banners, order tracking on landing, loyalty redemption at checkout, landing analytics events
- Stripe Billing (manual billing for MVP — Decision 2). Plan-limit enforcement now has teeth: ✓ 2026-06-13 (Decision 30) — `plan.feature` middleware gates events/campaigns/custom-roles/export, `BranchService` enforces `max_branches`, `/modules` merges plan flags so `/web` nav auto-hides gated items.

## 7. Open Decisions

| ID | Decision needed | Context |
|---|---|---|
| D-TZ | ✓ RESOLVED 2026-06-12 → **Decision 26** (branch-local timezone) in `decisions.md` | Was blocking B3/B4 fixes, analytics windows, scheduled reports, RevPASH. |
| D-IDEM | ✓ RESOLVED 2026-06-12 → **Decision 27** (stable client key per payment attempt) in `decisions.md` | Was blocking B6 fix. |

## 8. Infrastructure
- ✓ Infisical project IDs configured in `terraform/staging.yaml` + `terraform/production.yaml` (pending.md was stale)
- ✓ Jenkins pipelines configured for all repos
- [ ] Staging environment end-to-end verification (confirm and tick)

## 9. Doc Drift Watchlist
- [ ] **Decision 25 is stale**: it says staff (`/web`) and admin apps are "English-only (MVP)", but the i18n
  work (sessions 7–20, plan `2026-05-25-i18n-string-extraction.md`) wired both apps with 7 locales.
  Update Decision 25 or append an amendment when convenient.
- [ ] Platform-level `customer_profiles.no_show_count` column exists in code but not in
  `docs/03-database-schema.md` — schema drift; consider dropping the column (needs migration decision).

## 10. Recommended Order of Attack

**Wave 1 — close the bug list (small, ~hours):**
1. B7 — token-refresh cron: replace `cron('*/50 * * * *')` with an explicit schedule that matches the 55-min cache TTL
2. B8 — Twilio STOP: normalize phone to E.164 on profile save + match accordingly; update all matched duplicates, not `first()`
3. B4 remainder — analytics daily windows + scheduled report cadence in tenant primary-branch TZ (Decision 26)

**Wave 2 — abuse/robustness:**
4. Per-IP throttle on staff login
5. Reminder reconciliation sweep job (replaces reliance on long RabbitMQ delays)
6. Decide + implement refund→loyalty-points clawback

**Wave 3 — unblocked features:**
7. No-show deposit flag + loyalty no-show forgiveness (unblocked by B2 fix)
8. Event 2× loyalty multiplier
9. Points expiry job (12-month warning, 18-month forfeiture)
10. Customer profile merge endpoint + UI

**Wave 4 — operational SaaS gaps (biggest business payoff):**
11. Integrations setup UI (Uber Eats / Wolt / Twilio / Stripe Terminal credentials)
12. Scheduled-report config UI (backend already complete)
13. Plan-limit enforcement (Starter/Growth/Enterprise currently identical)
14. Event deposit collection button; campaigns UI; branch hours editors; i18n Task 15a–c
