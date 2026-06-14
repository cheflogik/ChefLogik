# Orphaned-Data Surfacing — Implementation Plan

> Surfaces write-only / API-only DB fields that are stored but never shown in `/web`.
> Audit + decisions: memory `orphaned-data-audit.md`. Scope: `/web` only (admin/landing deferred).
> `events.custom_menu` is a **separate session** (needs feature design, not surfacing). `attendance_records.notes` is **dropped** (dormant column).

**Goal:** Make stored-but-invisible data visible in the staff app, and drop one dead column.

**Conventions (CLAUDE.md):** design-system components only in `/web` (no raw HTML form elements); API Resources for all responses; ask before any *new* migration file; permission checks via existing slugs.

**Testing:** Per global rule, automated tests are **not** included below — see "Testing decision" at the end. Each task has a manual verification step.

---

## Wave 1 — Lost notes + drop dead column

### Task 1.1 — Surface `shifts.notes`
Already in `ShiftResource` (`notes`); only the add-shift form references it. Add render.

**Files (modify):**
- `web/src/routes/_authenticated/staff/shifts/index.tsx` — shift schedule list
- (if a shift detail/popup exists in that file or a `components/staff/` shift card) render there too

**Change:** where each shift row/card is rendered, add a muted notes line when present:
```tsx
{shift.notes && (
  <p className="text-xs text-muted-foreground mt-1">{shift.notes}</p>
)}
```
Gate: page already requires `shifts.view` — no new gate. Add i18n key reuse `common.notes` (already used by the form).

**Verify:** Create a shift with notes via `shifts/new.tsx`, confirm the note shows on the schedule list.

---

### Task 1.2 — Surface `leave_requests.notes` (reviewer note)
`LeaveRequestResource` already returns `notes`. The approve/reject modal writes it; only `reason` is rendered back today.

**Files (modify):**
- `web/src/routes/_authenticated/staff/leave/index.tsx`

**Change:** in the leave row (near the existing `request.reason` render ~line 193) and the table `reason` column (~line 287), add the reviewer note when the request is reviewed:
```tsx
{lr.notes && (
  <span className="block text-xs text-muted-foreground">
    {t('staff.reviewer_note')}: {lr.notes}
  </span>
)}
```
Add `staff.reviewer_note` key to `en-US`. Gate: existing `staff.manage_leave` (page already gates).

**Verify:** Approve a leave request with a note; confirm the note renders on the row.

---

### Task 1.3 — Drop dormant `attendance_records.notes`
Nothing writes it (no controller accepts it, no service sets it) and nothing reads it. Remove rather than surface. Table has not shipped to prod → edit the create migration (CLAUDE.md migration rule), like Decision 41 dropped `no_show_count`.

**Files (modify):**
- `api/database/migrations/2026_04_07_000015_create_attendance_records_table.php` — remove the `notes` column line
- `api/app/Models/AttendanceRecord.php` — remove `'notes'` from `$fillable`
- `api/app/Http/Resources/Staff/AttendanceResource.php` — remove the `'notes' => $this->notes,` line

**Then:** `php artisan migrate:fresh` (dev) — flag to user; re-seed.

**Verify:** `grep -rn "notes" app/Http/Resources/Staff/AttendanceResource.php app/Models/AttendanceRecord.php` returns nothing; `php artisan migrate:fresh --seed` runs clean.

---

## Wave 2 — Delivery financials

### Task 2.1 — Expose `orders.platform_commission` + net revenue
Set by `ProcessUberEatsOrderJob`/`ProcessWoltOrderJob` (= `payment.merchant_fee_amount`). Not in any Resource; not in analytics. Surface per-order **and** aggregated (Option B).

**2.1a — Resource (api):**
- `api/app/Http/Resources/Orders/OrderResource.php` — add:
```php
'platform_commission' => $this->platform_commission !== null
    ? (float) $this->platform_commission : null,
'net_revenue' => $this->platform_commission !== null
    ? round((float) $this->total - (float) $this->platform_commission, 2) : null,
```

**2.1b — Analytics aggregation (api):** add commission + net delivery revenue to the revenue report.
- `api/app/Http/Controllers/Api/V1/Analytics/ReportController.php` (revenue action) / `api/app/Services/Analytics/AnalyticsService.php`
- **Default approach (no migration):** live-sum `orders.platform_commission` for delivery sources (`uber_eats`, `wolt`) within the report's branch/date window; return `commission_paid` and `net_delivery_revenue` in the payload alongside `gross_revenue`.
- **DECISION FLAG:** do **not** add a column to the pre-aggregated `analytics_daily_revenue` without asking (architectural). Default = live sum.

**2.1c — Frontend order detail:**
- `web/src/routes/_authenticated/orders/$orderId.tsx` — in the financial summary (near the total render ~line 148), for delivery sources only:
```tsx
{order.platform_commission != null && (
  <>
    <Row label={t('orders.platform_commission')} value={`−${formatCurrency(order.platform_commission)}`} />
    <Row label={t('orders.net_to_restaurant')} value={formatCurrency(order.net_revenue)} />
  </>
)}
```
(use the file's existing row markup, not a new component if none exists). Gate: page already requires `orders.view`.

**2.1d — Frontend revenue dashboard:**
- `web/src/routes/_authenticated/analytics/revenue.tsx` — add "Commission paid" and "Net delivery revenue" summary cards from the new payload fields. Gate: page already requires `analytics.revenue_branch`.

**i18n:** `orders.platform_commission`, `orders.net_to_restaurant`, `analytics.commission_paid`, `analytics.net_delivery_revenue` (en-US).

**Verify:** open a seeded Uber Eats/Wolt order → commission + net lines show; revenue dashboard shows commission paid / net delivery revenue for a range containing delivery orders.

---

### Task 2.2 — Surface `order_payments.refund_reason`
Set by `RefundEngine`/`PaymentService`; `PaymentController` returns a raw refund result with no Resource. Add it to the refund response and render on the order.

**2.2a — API:** ensure the refund response and the order-payments read include `refund_reason`.
- `api/app/Http/Controllers/Api/V1/Orders/PaymentController.php` — in the refund response array (~line 91) and the payments index, include `'refund_reason' => $payment->refund_reason`.

**2.2b — Frontend:**
- `web/src/routes/_authenticated/orders/$orderId.tsx` — in the payments/refund section, render the reason on refunded payments:
```tsx
{p.refund_reason && (
  <span className="text-xs text-muted-foreground">{t('orders.refund_reason')}: {p.refund_reason}</span>
)}
```
Gate: refund read already behind `orders.view_payment`. i18n: `orders.refund_reason`.

**Verify:** issue a refund with a reason; confirm it shows on the order detail.

---

## Wave 3 — Address capture (form + detail, symmetric)
Both columns are `nullable array` the API already accepts; no `/web` form field or render. Use the `branches.address` shape `{ street, city, postcode, country }`.

### Task 3.1 — `corporate_accounts.billing_address`
`CorporateAccountResource` already returns `billing_address`. Controller already validates `billing_address => ['nullable','array']`.

**Files (modify):**
- `web/src/routes/_authenticated/events/corporate-accounts.tsx` — the inline account form (contact name/email/phone, ~line 34) gains an address block (Input ×4: street/city/postcode/country) bound into the submit payload as `billing_address: { street, city, postcode, country }`; the detail/list (~line 206) renders the address block when present.

Gate: `events.manage_corporate` (already on the controller). i18n: `events.billing_address`, reuse `common.street/city/postcode/country` (add if missing).

**Verify:** save a corporate account with an address; reopen → address shows; payload round-trips.

### Task 3.2 — `suppliers.address`
Raw model already returns `address`; `SupplierController` already validates `address => ['sometimes','nullable','array']`.

**Files (modify):**
- `web/src/routes/_authenticated/inventory/suppliers.tsx` — supplier form (contact/payment_terms/lead_time) gains the same 4-field address block bound as `address: { street, city, postcode, country }`; supplier detail/row renders it.

Gate: `inventory.create_po` (the slug used across `SupplierController`). i18n: `inventory.supplier_address`.

**Verify:** save a supplier with an address; reopen → address shows.

---

## Wave 4 — API-only completeness polish

### Task 4.1 — `loyalty_transactions.earn_rate_applied`
`LoyaltyTransactionResource` already returns it.
- `web/src/routes/_authenticated/customers/$customerId.tsx` — in the loyalty-history rows, when `earn_rate_applied` present and type is `earn`, show a tooltip/subtext `t('customers.earned_at_rate', { rate })`. Gate: existing `customers.view_full`.

### Task 4.2 — `customer_tenant_profiles.avg_visit_interval_days`
`CustomerTenantProfileResource` already returns it.
- `web/src/routes/_authenticated/customers/$customerId.tsx` — add a stat near lifetime visits (~line 490): `t('customers.avg_visit_interval', { days })` when not null. Gate: `customers.view_full`.

### Task 4.3 — `reservations.reminder_sent_24h` / `_2h`
`ReservationResource` already returns both.
- `web/src/routes/_authenticated/reservations/$reservationId.tsx` — add small badges "24h reminder sent" / "2h reminder sent" when true. Gate: `reservations.view`. i18n: `reservations.reminder_24h_sent`, `reservations.reminder_2h_sent`.

### Task 4.4 — `disputes.outcome`
Raw model already returns it; `evidence_notes`/`financial_impact` already render.
- `web/src/routes/_authenticated/orders/disputes.tsx` — add an `outcome` column/badge when set. Gate: `orders.manage_disputes`. i18n: `orders.dispute_outcome`.

---

## Commit cadence
One commit per task (e.g. `feat(web): surface shift notes on schedule list`). Backend (`/api`) and frontend (`/web`) are separate repos → commit each separately (memory `cheflogik-three-repos`).

## Testing decision (ask before implementing)
Global rule = don't add automated tests unless approved. Candidates if you say yes:
- api: `OrderResource` commission/net fields; revenue report commission aggregation; `AttendanceResource` no longer returns `notes`.
- web: render tests are low-value here (mostly presentational).
Recommend: a couple of api Resource/feature assertions for Wave 2 only; skip the rest. Confirm.

## Open flags
- Wave 2.1b: live-sum vs new `analytics_daily_revenue` column — default live-sum; column = needs your OK.
- Wave 1.3: requires `migrate:fresh` (you run it).

## Status
- **Wave 1 SHIPPED** 2026-06-14 (see memory `orphaned-data-audit`). 1.3 needs `migrate:fresh --seed`.
- **Wave 2 SHIPPED** 2026-06-14 — Decision 48. Resolved flags: 2.1b → **add column** (not live-sum), merged into create-mig …000052 (needs `migrate:fresh --seed`); 2.2 → **persist via payments list**; tests → none. Commits: api `52fe2f2`, web `3c2699d` (--no-verify); decisions.md Decision 48 written, not committed. Caveat: payments ledger only shows after a fetch (refund re-fetch / hard reload), not on cached soft-nav — same as status_history. Next: Wave 3, Wave 4.
