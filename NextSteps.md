# ChefLogik — Next Steps

## Current State
- **Backend:** 423+ tests passing
- **Frontend:** All 12 modules complete (React 19 + TypeScript + MST)
- **Phase 1 Foundation:** ✓ Complete
- **Phase 2 Core Modules:** ✓ Complete
- **Phase 3 Intelligence & Platform:** ✓ Complete (except External Integrations)

---

## External Integrations Progress

### ✓ 1. Stripe Payments — COMPLETE
- `PaymentGatewayInterface` contract + `StripePaymentGateway` implementation (`stripe/stripe-php ^20`)
- `config/payment.php` driver config
- `PaymentService` — creates PaymentIntents, collects event deposits, delegates refunds
- `POST /api/v1/orders/{id}/payment` — creates PaymentIntent, returns `client_secret`
- `POST /api/v1/orders/{id}/refund` — partial or full refund via `RefundEngine`
- `POST /api/v1/events/{id}/payment` — event deposit PaymentIntent (was stub)
- `POST /api/webhooks/stripe` — signature verification + dispatches `ProcessStripeWebhookJob` to `critical` queue
- `ProcessStripeWebhookJob` handles: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
- RefundEngine: real Stripe Refunds API call with fallback-to-manual-record on gateway failure
- Platform admin toggle: `platform.stripe_enabled` (PATCH /api/platform/settings) → returns 503 when disabled
- 22 tests covering all flows

### ✓ 2. SMS — Twilio — COMPLETE
- `SmsProviderInterface` contract + `TwilioSmsProvider` + `NullSmsProvider` (`SMS_DRIVER=null` for local dev)
- `config/sms.php` driver config; `AppServiceProvider` binding
- Reservation reminders 24h + 2h — real SMS sent, `reminder_sent_*` flags set
- Customer OTP password reset (`POST /v1/customer/auth/forgot-password` → SMS OTP → `POST .../reset-password/sms`)
- Loyalty campaign SMS dispatch via `SendCampaignJob` (target_segment filtering)
- 10 tests

### ✓ 3. Email — Amazon SES — COMPLETE
- `MAIL_MAILER=log` locally, `MAIL_MAILER=ses` in production (existing AWS credentials, no new package)
- `StaffPasswordResetMail` — `POST /v1/auth/staff/forgot-password` + `POST .../reset-password`
- `CustomerPasswordResetMail` — `POST /v1/customer/auth/forgot-password` (email path) + `POST .../reset-password/email`
- `BookingConfirmationMail` — dispatched by `ReservationService::create` via `SendBookingConfirmationJob`
- `LoyaltyCampaignMail` — `SendCampaignJob` now sends both SMS and email per `communication_prefs`
- `OwnerWelcomeMail` was already wired; stubs removed
- Tests in `tests/Feature/Email/`

### ✓ 4. Uber Eats + Wolt — COMPLETE
- `tenant_integrations` table + `TenantIntegration` model (encrypted credentials, settings for lookup)
- `DeliveryPlatformInterface` contract + `UberEatsService` + `WoltService` + `DeliveryPlatformFactory`
- `POST /api/webhooks/uber-eats` — HMAC-SHA256 sig verify → idempotency check → `ProcessUberEatsOrderJob` on critical queue
- `POST /api/webhooks/wolt` — HMAC-SHA256 sig verify → idempotency check → `ProcessWoltOrderJob` on critical queue
- `ProcessUberEatsOrderJob` + `ProcessWoltOrderJob` — normalise payload, upsert Order, broadcast `NewOrderReceived`
- `SyncOrderToPlatformsJob` — pushes order status updates back to Uber Eats / Wolt
- `SyncMenuItemToPlatformsJob` — syncs item availability to all mapped platforms
- `SyncEightySixToPlatformsJob` — syncs 86 (unavailable) and restore events to all platforms
- `RefreshDeliveryPlatformTokensCommand` — scheduled every 50 min to refresh OAuth tokens
- 13 tests covering webhook ingestion (valid/invalid sig, idempotency, unknown store) and sync job logic

### ✓ 5. Kubernetes / Helm Charts — NOT REQUIRED
- Deployment handled via Jenkinsfile + Terraform config per repo (no separate K8s manifests needed)
- See `docs/07-infrastructure.md` for the deployment architecture

---

## Module Gaps — From Full Audit (2026-04-18)

Gaps identified by comparing all `docs/modules/` specs against the implementation.

### Orders
- [x] ~~**Stripe PaymentIntent creation + webhook handler**~~ *(done)*
- [x] ~~**Pre-paid online orders auto-confirmation after successful PaymentIntent**~~ *(done)*
- [x] ~~**Delivery platform 5-min auto-confirmation SLA job**~~ *(done)*
- [x] ~~**`SyncOrderToPlatformsJob`** stub → real Uber Eats / Wolt API calls~~ *(done)*
- [x] ~~**Stock restoration on pre-preparation cancellations**~~ *(done)*

### Menu
- [x] ~~**Sub-categories (Category → Sub-category → Item)**~~ *(done — `GET /menu/categories` returns nested tree)*
- [x] ~~**`SyncMenuItemToPlatformsJob`** stub → real Uber Eats / Wolt sync~~ *(done)*
- [x] ~~**SKU ↔ platform item_id mapping table**~~ *(done — `menu_item_platform_mappings`, Uber Eats + Wolt per Decision 22)*
- [x] ~~**Price verification on incoming platform orders**~~ *(done — `order_price_flags` table; Uber Eats + Wolt jobs flag when abs(platform_price − our_price) > £0.10)*
- [x] ~~**Dietary filters on public QR menu for logged-in customers**~~ *(done — `GET /api/v1/customer/menu/{branchId}`, AND logic)*

### Reservations
- [ ] No-show deposit requirement flag when `no_show_count >= configurable threshold`
- [ ] Loyalty member no-show forgiveness (configurable per tier)

### Events
- [x] ~~**Stripe deposit collection**~~ *(done)*
- [x] ~~**Non-refundable booking fee policy per occasion type**~~ *(done — `branch_event_policies` table, percentage-based per branch + occasion type, partial Stripe refund on cancel)*
- [x] ~~**Credit limit enforcement — block new bookings for over-limit net-30 corporate accounts**~~ *(done — enforced at confirmation, `POST /events/{id}/approve-credit` for owner override)*
- [x] ~~**Run sheet PDF export**~~ *(done — `GET /events/{id}/run-sheet/pdf`, works at any lifecycle stage)*
- [x] ~~**Overdue pre-event task alerts via Reverb + push notification**~~ *(done — `events:alert-overdue-tasks` command, daily at 08:00, FCM/APNS hook left as TODO)*
- [x] ~~**Minimum spend charge prompt at bill close**~~ *(done — `complete` returns 422 with shortfall; pass `force=true` to override)*

### Inventory
- [x] ~~**KDS station assignment**~~ *(done — `menu_items.kds_station` column; `resolveStation()` reads it; null defaults to pass)*
- [x] ~~**Temperature log export**~~ *(done — `GET /api/v1/inventory/temperature-logs/export?format=pdf|csv`; `barryvdh/laravel-dompdf` added)*
- [x] ~~**Manager alert for draft-only recipe**~~ *(done — `DeductStockJob` notifies branch managers via `NotificationService` when item has only draft recipes)*

### Customers & Loyalty
- [ ] Event booking 2× loyalty multiplier — link event confirmation to `LoyaltyService`
- [ ] 30-day downgrade grace period warning before tier downgrade
- [ ] Points expiry warning notification at 12-month inactivity mark
- [ ] Manual profile merge endpoint (exception raised on duplicate, but no merge action exists)

### Analytics
- [ ] CLV formula: `avg_spend_per_visit × avg_visits_per_year × estimated_lifespan_years` — field exists, formula not coded
- [ ] COGS calculation: `opening_stock + purchases - closing_stock`
- [ ] Tax collected report endpoint (net_sales, tax_rate, tax_amount per category per period)
- [ ] RevPASH calculation must respect special operating hours for affected dates

### Staff
- [x] ~~**Document expiry alert job**~~ *(done — `staff:alert-expiring-documents` command, daily at 09:00; also fixed `uploadDocument` to store `type` + `expiry_date` per schema spec; 5 tests)*
- [x] ~~**Staff push notification when Branch Manager publishes the weekly schedule**~~ *(done — `ShiftService::publishBulk` notifies assigned staff via `NotificationService`; 3 tests)*

### Notifications — all unblocked items now complete
- [x] ~~Reservation reminder SMS (24h + 2h)~~ *(done)*
- [x] ~~Customer OTP / password reset SMS~~ *(done)*
- [x] ~~Loyalty campaign SMS dispatch~~ *(done)*
- [x] ~~Booking confirmation email~~ *(done)*
- [x] ~~Staff / customer password reset email~~ *(done)*
- [x] ~~Tenant welcome email in `TenantProvisioningService`~~ *(was already wired)*

---

## Decisions — All Locked ✓

| Decision | Status | Choice |
|---|---|---|
| Decision 7 — Payment gateway | ✓ Confirmed | Stripe behind `PaymentGatewayInterface` |
| Decision 8 — SMS provider | ✓ Confirmed | Twilio behind `SmsProviderInterface` |
| Decision 9 — Email provider | ✓ Confirmed | Amazon SES via Laravel `ses` mail driver |
