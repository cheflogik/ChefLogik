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
| B4 | ⚠️ PARTIAL — reminders fixed; crons still server-time | Reminder triggers now computed in `branches.timezone` (Decision 26). **Still open:** analytics daily windows + scheduled report cadence should use tenant primary-branch TZ. | Follow-up item, see §3 Analytics. |
| B5 | ✓ FIXED 2026-06-12 — processed-mark moved into job | `ProcessStripeWebhookJob` marks `stripe_event:{id}` only after successful handling; controller no longer pre-marks; job also self-skips replays already processed. | |
| B6 | ✓ FIXED 2026-06-12 — stable client key (Decision 27) | `web/OrderService.createPayment` keeps one UUID per order in a module map, reused on retry, dropped on success. | |
| B7 | ✓ FIXED 2026-06-12 — token refresh now `everyThirtyMinutes()` | `routes/console.php` | Refresh gap (30 min) stays safely under the 55-min token cache TTL; cron cannot express a true 50-min interval. |
| B8 | ✓ FIXED 2026-06-12 — E.164 normalisation centralised | `app/Support/Phone` + `CustomerProfile` set-mutator; landing OTP path normalises explicitly (raw attrs bypass mutator); webhook normalises `From` and updates **all** matches. | Pre-existing rows saved in non-E.164 formats are NOT backfilled — needs a data migration/command (ask before creating). WalkInMatchingService's UK 07/08→+44 inference was dropped for consistency. |

## 2. Security / Abuse Edge Cases

- [x] ~~`POST /v1/landing/reservations` has no throttle~~ — ✓ FIXED 2026-06-12: `throttle:5,1` added in `routes/landing.php`.
- [ ] Staff login has no per-IP rate limit — account lockout (5 failures) enables targeted lock-out DoS of known staff emails.
- [ ] Reminders use long `->delay()` on RabbitMQ (up to weeks) with no reconciliation sweep — dropped delayed messages are never retried.
- [ ] STOP opt-out only flips `sms_marketing`; transactional SMS (reminders, OTP) still attempted to opted-out numbers.
- [ ] No loyalty points clawback on order refund (unconfirmed whether intentional).

## 3. Backend Feature Gaps

### Reservations
- [ ] No-show deposit requirement flag when `no_show_count >= threshold` (blocked by B2 — tenant-level count never written)
- [ ] Loyalty member no-show forgiveness (configurable per tier)

### Customers & Loyalty
- [ ] Event booking 2× loyalty multiplier (LoyaltyService PHPDoc says "handled by caller" — no caller does)
- [ ] Points expiry mechanics **do not exist at all** (no 12-month warning, no 18-month forfeiture job) — liability accrues forever
- [ ] 30-day downgrade grace period **warning notification** (downgrade scheduling itself works)
- [ ] Manual profile merge endpoint (duplicates accumulate from landing OTP signups)

### Analytics
- [ ] COGS calculation (`opening_stock + purchases − closing_stock`) — only the permission slug exists
- [ ] RevPASH — **not implemented anywhere** (the old "must respect special hours" framing understated this)
- [ ] Branch-local time for analytics daily windows + scheduled report cadence (Decision 26 — remaining half of bug B4)

### Menu
- [ ] `GET /branches/{id}/qr-code` endpoint (blocks QR-per-branch UI)
- [ ] `auto_restore_mode` on 86 (blocks UI; inventory-triggered 86 must stay manual-restore per food-safety rule)

> Corrected from older docs: **CLV formula** (`RecalculateRfmSegmentsJob::calculateClv`) and the
> **tax collected report** (`GET /analytics/tax-report`) are implemented — NextSteps.md and CLAUDE.md
> previously listed them as missing.

## 4. Frontend Gaps (`/web` unless noted)

### Analytics & Reports
- [ ] Inventory analytics view (COGS / food-cost % / waste cost) — also blocked by backend COGS gap
- [ ] Staff analytics view (labour cost %, performance) — backend per-staff metrics also missing (mock data per new-ui plan)
- [ ] Tax/VAT report view (backend endpoint exists)
- [ ] Async export poll/download flow
- [ ] Financial period close trigger + locked-period indicator
- [ ] Scheduled report delivery config UI (backend setting + command exist — feature unusable without this)
- [ ] Custom date-range picker (presets only)
- [ ] Metric alert thresholds UI; custom report builder
- [ ] Churn-risk drill-down list (count stat exists on customers dashboard)

### Events
- [ ] Deposit collection trigger (no Stripe PaymentIntent flow on event detail; backend `POST /events/{id}/payment` exists)
- [ ] Linked orders view per event
- [ ] Recurring events UI

### Customers
- [ ] Loyalty redemption at POS checkout
- [ ] Order history + reservation history tabs on customer detail (branch-visit tab exists)
- [ ] Duplicate merge UI (blocked by missing backend endpoint)
- [ ] GDPR data export trigger
- [ ] Campaign list/CRUD UI (backend campaign routes exist)
- [ ] Points expiry indicators (blocked by missing backend mechanics)
- [ ] Tier progress bar (static text hints only); DOB field on profile

### Branches
- [ ] Operating hours editor (weekly schedule)
- [ ] Special operating hours CRUD
- [ ] Branch settings (seat count, revenue targets, food-cost % target, waste threshold, delivery commission rates)

### Integrations (entire section missing)
- [ ] Uber Eats / Wolt credential entry into `tenant_integrations`
- [ ] Stripe Terminal reader pairing
- [ ] Twilio configuration
- [ ] Integration health view (`last_synced_at`, status)

### i18n (remainder of `.claude/plans/2026-05-25-i18n-string-extraction.md` Task 15)
- [ ] 15a — `orders/disputes.tsx` not wired with `useT()`
- [ ] 15b — `messaging/ConversationList.tsx`, `ChatPage.tsx`, `MessageInput.tsx` hardcoded strings
- [ ] 15c — `landing-cms/seo.tsx`, `featured-items.tsx`, `social-feeds.tsx`, `reviews.tsx` headings/permission messages
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
- Stripe Billing (manual billing for MVP — Decision 2); plan-limit enforcement has no teeth yet

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
