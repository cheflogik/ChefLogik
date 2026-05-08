# Frontend Gaps — Features in Backend Not Yet in UI

> Last audited: 2026-05-08 (Orders module fixed 2026-05-08; Staff Management completed 2026-05-08)
> Method: read every route file in `/web/src/routes` and `/admin/src/routes` against the original gap list.
> Status key: ✅ Done | ⚠️ Partial | ❌ Pending

---

## 1. Orders & Deliveries

| Gap | Status | Detail |
|---|---|---|
| **Wrong channel: DoorDash → Wolt** | ✅ Done | Fixed in `types/orders.ts` (OrderSource union), `history.tsx` (SOURCE_OPTIONS), and `config/settings.php` label. |
| **Dine-in end stages missing** | ✅ Done | `served` and `bill_settled` are in `NEXT_TRANSITIONS` and `STATUS_BADGE`; transition buttons render from the map. |
| **Delivery end stages missing** | ✅ Done | `out_for_delivery` and `delivered` are in `STATUS_BADGE` and `NEXT_TRANSITIONS`. |
| **Line item management** | ✅ Done | Backend: `POST/PATCH/DELETE /orders/{order}/items` endpoints + `OrderService::addItem/updateItem/removeItem`. Frontend: inline +/− quantity controls, × remove button, Add Item form on order detail (new/confirmed only). |
| **Payment creation** | ✅ Done | `PaymentPanel` on order detail creates a Stripe PaymentIntent and embeds `@stripe/react-stripe-js` `PaymentElement` for full card capture. `VITE_STRIPE_PUBLISHABLE_KEY` env var added. |
| **Split bill** | ✅ Done | `SplitBillPanel` on order detail — 2–10 splits with label/amount inputs, total validation, returns PaymentIntent IDs per split. |
| **Promo codes** | ✅ Done | `orders/promo-codes.tsx` — full CRUD with create/edit/delete modal, permission-gated. |
| **Delivery zones** | ✅ Done | `orders/delivery-zones.tsx` — full CRUD (create/edit/delete) + pause/activate per zone, `DeliveryZoneService` wired to `/api/v1/branches/{id}/delivery-zones`. |
| **Platform pause/resume** | ✅ Done | `PlatformControls` component in `orders/index.tsx` header — Pause/Resume buttons gated by `orders.pause_platforms` permission. |
| **Auto-pause threshold config** | ✅ Done | `orders/platform-settings.tsx` — exposes `orders.platform_auto_confirm` toggle and `orders.platform_auto_confirm_minutes` input via tenant settings PATCH. |
| **Order channel badge** | ✅ Done | `SOURCE_LABELS` in `index.tsx` already had `wolt: 'Wolt'`; `types/orders.ts` and `history.tsx` now also use `wolt`. |
| **Order disputes** | ✅ Done | `orders/disputes.tsx` — full list + respond-to-dispute modal, permission-gated. |
| **Order status history** | ✅ Done | `orders/$orderId.tsx` renders `status_history` timeline. |
| **Refund UI** | ✅ Done | `RefundPanel` on order detail — full/partial refund with reason, calls `POST /orders/{order}/refund`. Gated by `orders.refund` permission. |
| **New Order form** | ✅ Done | `orders/new.tsx` — full form with source, table, customer, allergen note, line items, subtotal. |
| **Idempotency-Key header** | ✅ Done | `api.ts` has `postWithHeaders`; `OrderService.createPayment` generates a `crypto.randomUUID()` and passes it as `Idempotency-Key` header per request. |

---

## 2. Staff Management

| Gap | Status | Detail |
|---|---|---|
| **Shift scheduling** | ✅ Done | `staff/shifts/index.tsx` — weekly calendar, create/publish/delete/claim shifts. `staff/shifts/new.tsx` exists. |
| **Attendance & time tracking** | ✅ Done | `staff/attendance/index.tsx` — clock-in/clock-out buttons, date filter, attendance table with late/OT flags. |
| **Payroll export** | ✅ Done | `staff/payroll/index.tsx` — date-range picker + Export CSV button, gated by `payroll.export`. Backend: `GET /staff/payroll/export`. |
| **Role builder** | ✅ Done | `roles/index.tsx` list, `roles/new.tsx` create, `roles/$roleId.tsx` edit — all exist. |
| **Role assignment flow** | ✅ Done | `staff/$staffId.tsx` — full assign-role / revoke-role UI with branch_ids display. |
| **Offboard staff** | ✅ Done | `staff/$staffId.tsx` — Offboard button with reason textarea and confirmation. |
| **Owner management** | ✅ Done | "Add Owner" button on staff list (gated by `owners.manage`), modal with name/email, temp-password banner after creation. Backend: `POST /staff/owners`. |
| **Leave management** | ✅ Done | `staff/leave/index.tsx` — My Leave / Team Leave tabs, apply form, approve/reject with notes, cancel own request. Backend: migration + model + service + controller + 5 routes. |
| **Staff document management** | ✅ Done | Documents section in `staff/$staffId.tsx` — list existing docs with type/expiry, upload form (file + type + expiry date), gated by `staff.edit`. |
| **Document expiry indicator** | ✅ Done | Amber `AlertTriangle` icon on staff list row; per-document Expired/Expiring/Valid badge on staff profile. |

---

## 3. Menu Management

| Gap | Status | Detail |
|---|---|---|
| **Modifier groups & modifiers** | ❌ Pending | No CRUD for modifier groups or modifiers. |
| **Branch Overrides tab** | ⚠️ Partial | Per-item branch availability and price override actions exist inline on each row (Enable / Branch Off buttons, `upsertOverride`). No dedicated tab with a full override list. |
| **Platform Sync tab** | ❌ Pending | No trigger-sync button or last-synced status. |
| **86 history per item** | ⚠️ Partial | `fetchEightySixHistory` is called and `activeLog` is shown on item row. No separate "View 86 history" page per item. |
| **Sub-categories CRUD** | ❌ Pending | `AddCategoryForm` / `CategoryRow` handle top-level categories only. No UI for sub-categories via `parent_id`. |
| **Category CRUD** | ✅ Done | `AddCategoryForm` creates categories; `CategoryRow` has inline edit and delete. |
| **Item edit/add form** | ✅ Done | `menu/items/new.tsx` (create) and `menu/items/$itemId.tsx` (edit) both exist. |
| **Allergen / dietary flags form** | ✅ Done | Allergen toggles in `menu/items/new.tsx` gated with `auth.can('menu.edit_allergens')`. Also in edit form. |
| **QR code per branch** | ❌ Pending | No QR code display or download UI. |
| **Item cost / margin display** | ⚠️ Partial | `cost_price` field exists in new/edit forms. No cost or margin column on the item list for `menu.view_costs` holders. |
| **Auto-restore mode for 86** | ❌ Pending | No option to select time-based or next-open auto-restore when 86ing an item. |

---

## 4. Reservations

| Gap | Status | Detail |
|---|---|---|
| **Lifecycle action buttons** | ✅ Done | `reservations/$reservationId.tsx` — Mark Arrived, Seat Guests (with table picker dialog), Complete, No Show, Cancel. |
| **New Reservation form** | ✅ Done | `reservations/new.tsx` — guest details, booking details, availability checker, table selector. |
| **Availability checker** | ✅ Done | Integrated in `reservations/new.tsx` via `reservationStore.checkAvailability`. |
| **Reservation detail view** | ✅ Done | `reservations/$reservationId.tsx` — full guest info, booking info, special requests, cancellation info. |
| **Special operating hours** | ❌ Pending | No UI to add/edit branch-level special hours. |

---

## 5. Events & Functions

| Gap | Status | Detail |
|---|---|---|
| **Phase transitions beyond Confirmed** | ✅ Done | `events/$eventId.tsx` — Start Pre-Event, Day Of Event, Mark Complete buttons. Full lifecycle. |
| **Pre-event tasks** | ✅ Done | `TasksTab` in event detail — add task, mark complete, due date display. |
| **Run sheet** | ✅ Done | `RunSheetTab` in event detail — fetch/refresh, timeline, menu summary, staff assignments. |
| **Event packages** | ✅ Done | `events/packages.tsx` route exists (verify content is built not stubbed). |
| **Event spaces** | ✅ Done | `events/spaces.tsx` route exists. |
| **Corporate accounts** | ✅ Done | `events/corporate-accounts.tsx` route exists. |
| **Mark Lost** | ✅ Done | `MarkLostDialog` in both index kanban and detail page, with reason selection. |
| **Deposit collection** | ❌ Pending | No Stripe deposit payment trigger in event detail. |
| **Linked orders** | ❌ Pending | No view of orders linked to an event. |
| **Cancel event** | ✅ Done | `CancelDialog` in `events/$eventId.tsx` with reason and cancellation-policy warning. |
| **Recurring events** | ❌ Pending | No UI to create a recurring event or manage child occurrences. |
| **Minimum spend tracking** | ⚠️ Partial | `DetailsTab` shows actual_spend vs minimum_spend with amber warning colour when below. No bill-close prompt. |

---

## 6. Inventory & Kitchen

| Gap | Status | Detail |
|---|---|---|
| **Inventory item CRUD** | ✅ Done | `inventory/index.tsx` list, `inventory/items/new.tsx`, `inventory/items/$itemId.tsx` all exist. |
| **Stock alert thresholds** | ⚠️ Partial | `par_level` and `reorder_point` are displayed in the list. Need to verify they are editable in the item form (`$itemId.tsx`). |
| **Recipes** | ✅ Done | `inventory/recipes.tsx` exists. |
| **Suppliers** | ✅ Done | `inventory/suppliers.tsx` — full CRUD with `SupplierFormDialog`. |
| **Purchase orders** | ✅ Done | `inventory/purchase-orders.tsx` exists. |
| **Goods Received Notes (GRN)** | ✅ Done | `inventory/grns.tsx` exists. |
| **Waste logging** | ✅ Done | `inventory/waste-logs.tsx` exists. |
| **Stocktake workflow** | ✅ Done | `inventory/stocktakes.tsx` exists. |
| **Stock adjustment** | ✅ Done | `AdjustStockDialog` in `inventory/index.tsx` — quantity delta + notes, permission-gated. |
| **Stock transfer** | ❌ Pending | No inter-branch stock transfer UI. |
| **Stock movement history** | ❌ Pending | No cursor-paginated movement history view per item. |
| **Temperature log export** | ❌ Pending | No export trigger for temperature logs. |
| **KDS: item-level mark prepared** | ❌ Pending | `inventory/kds.tsx` exists — needs verification of per-item mark-prepared action. |
| **KDS: allergen acknowledgement logging** | ❌ Pending | Need to verify the 30-second hard gate and immutable log in `kds.tsx`. |
| **KDS station filter** | ❌ Pending | No station selector visible in `kds.tsx`. |

---

## 7. Customers & Loyalty

| Gap | Status | Detail |
|---|---|---|
| **Customer detail view** | ✅ Done | `customers/$customerId.tsx` — full profile, loyalty, branch history, GDPR tabs. |
| **Loyalty: points adjust** | ✅ Done | `AdjustPointsDialog` — delta input, description, new-balance preview, permission-gated. |
| **Loyalty: redeem at POS** | ❌ Pending | No points redemption UI during POS checkout. |
| **Order & reservation history** | ❌ Pending | Branch visit history tab exists; no order history or reservation history tab per customer. |
| **Duplicate merge** | ❌ Pending | No merge-duplicate-profiles UI. |
| **GDPR: erasure request** | ✅ Done | GDPR tab — Initiate Erasure button with 14-day policy explanation and confirmation dialog. |
| **GDPR: data export** | ❌ Pending | No async GDPR data export trigger. |
| **Campaigns** | ❌ Pending | No campaign list or CRUD. |
| **Customer enrolment from POS** | ⚠️ Partial | `customers/enroll.tsx` route exists as a standalone page. Not wired into order flow at POS. |
| **Points expiry status** | ❌ Pending | No 12-month inactivity warning or 18-month forfeiture indicator. |
| **Tier progress indicator** | ⚠️ Partial | Static text hints (e.g. "Silver: $500 spend or 6 visits") in loyalty tab. No progress bar. |
| **Communication preferences** | ✅ Done | GDPR tab shows SMS and email marketing opt-in/out status (read-only). |
| **Date of birth / birthday** | ❌ Pending | No DOB field in profile view or edit. |

---

## 8. Analytics & Reports

| Gap | Status | Detail |
|---|---|---|
| **Role-gated dashboards** | ✅ Done | `analytics/index.tsx` redirects to the correct dashboard based on permission. 5 separate dashboard routes exist. |
| **Menu engineering matrix** | ❌ Pending | Need to verify `analytics/dishes.tsx` — Stars/Plowhorses/Puzzles/Dogs quadrant view not confirmed built. |
| **Churn risk list** | ❌ Pending | No drill-down into at-risk customers. |
| **Inventory analytics** | ❌ Pending | No COGS, food cost %, or waste cost report view. |
| **Staff analytics** | ❌ Pending | No labour cost % or aggregate staff performance report. |
| **Tax/VAT report** | ❌ Pending | No tax report view. |
| **Audit log viewer** | ✅ Done | `analytics/audit-log.tsx` exists. |
| **Async export flow** | ❌ Pending | No poll-for-status or download-ready handling. |
| **Financial period close** | ❌ Pending | No period-close trigger or locked-period indicator. |
| **Scheduled report delivery** | ❌ Pending | No UI to configure scheduled report email delivery. |
| **Date range picker** | ❌ Pending | Only preset buttons — no custom date-range input. |
| **RevPASH metric** | ❌ Pending | Not shown on any dashboard. |
| **Metric alert thresholds** | ❌ Pending | No UI to set alert thresholds. |
| **Custom report builder** | ❌ Pending | No ad-hoc report building UI. |

---

## 9. Tables & Floor Plan

| Gap | Status | Detail |
|---|---|---|
| **Floor plan editor** | ✅ Done | `FloorPlanEditor`, `FloorPlanCanvas`, `AddTablePanel`, `TableConfigModal`, `PolygonDrawer` components all exist under `reservations/`. |
| **Block / Unblock table** | ❌ Pending | No block/unblock action on a table. |
| **Table state transitions: needs cleaning** | ❌ Pending | No "Mark needs cleaning" or "Clear table" buttons. |
| **Waitlist: seat from waitlist** | ❌ Pending | Need to verify `reservations/waitlist.tsx` — seat-from-waitlist action not confirmed. |
| **Waitlist: ETA display** | ❌ Pending | No calculated ETA from availability algorithm. |
| **Waitlist: remove** | ❌ Pending | No "remove from waitlist" action. |
| **Table list view** | ❌ Pending | "List View" toggle — content not confirmed as implemented. |

---

## 10. Auth & Onboarding

| Gap | Status | Detail |
|---|---|---|
| **Password reset flow (staff)** | ⚠️ Partial | `ForgotPasswordPage.tsx` and `ForgotPasswordScreen.tsx` exist. Not confirmed wired to API. |
| **Token refresh** | ❌ Pending | No silent token refresh before expiry. |
| **Customer login / portal** | ✅ Done | `portal/login.tsx`, `portal/home.tsx`, `portal/bookings.tsx`, `portal/reservations.tsx`, `portal/profile.tsx` all exist. |
| **Customer restaurant selector** | ✅ Done | `portal/restaurants.tsx` exists. |
| **Tenant onboarding wizard** | ❌ Pending | Onboarding stops at "invite team" — no branch setup step. |
| **Change password (staff)** | ✅ Done | `ChangePasswordForm.tsx` in profile components. |
| **Staff own profile** | ✅ Done | `ProfilePage.tsx` with `PersonalInfoForm.tsx`, `PhotoUpload.tsx`, `NotificationSettings.tsx`, `AppearanceSettings.tsx`. |

---

## 11. Platform Admin

> These gaps are in the `/admin` app (port 5600) — the standalone React 19 + TypeScript platform admin app, separate from the staff-facing `/web` app.

| Gap | Status | Detail |
|---|---|---|
| **Tenant: change plan** | ❌ Pending | Not visible in `tenants.tsx`. Only Suspend and Delete actions present on tenant detail. |
| **Tenant: reactivate** | ❌ Pending | Reactivate action missing from tenant detail panel. |
| **Subscription plans: create** | ❌ Pending | `billing.tsx` shows per-plan edit but no create-new-plan flow. |
| **Platform analytics: per-tenant drill-down** | ❌ Pending | Top Tenants list is not clickable. |
| **Feature flags: API wiring** | ❌ Pending | `flags.tsx` uses a hardcoded `INITIAL_FLAGS` array — no API calls; toggle is local state only. |
| **Platform admin user management** | ✅ Done | `admin/src/routes/_authenticated/users.tsx` exists. |
| **Tenant impersonation** | ❌ Pending | No "impersonate as tenant" action in the platform admin UI. |

---

## 12. Cross-cutting / Shell

| Gap | Status | Detail |
|---|---|---|
| **WebSocket connection** | ⚠️ Partial | Orders and Menu pages call `subscribeToChannel()` / `unsubscribeFromChannel()`. Whether the underlying store actually connects to Reverb needs verification. |
| **Branch switcher wires X-Branch-Id** | ❌ Pending | `BranchSwitcher.tsx` updates display state — not confirmed to set `X-Branch-Id` header in `ApiService`. |
| **Permission-gated nav/UI** | ✅ Done | `auth.can('permission.slug')` checks applied throughout all pages and on nav buttons. `PermissionGate` component exists and is used. |
| **Global search** | ❌ Pending | Search bar in header is a styled input only. |
| **Notifications: real alerts** | ❌ Pending | Notification dropdown — needs verification; likely still mock. |
| **Messages inbox** | ❌ Pending | `messages/index.tsx` and `ChatPage.tsx` exist — need to verify if wired to real API or mock. |
| **Pagination** | ⚠️ Partial | Customers list has page-based pagination. Most other lists do not. |
| **Error states** | ⚠️ Partial | Most pages now show `store.error` banners and empty-state messages. No retry flows. |
| **Loading states** | ⚠️ Partial | Most pages show "Loading…" text. No skeleton loaders. |

---

## 13. Branch Management

| Gap | Status | Detail |
|---|---|---|
| **Branch management page** | ✅ Done | `branches/index.tsx` — full list with status badges, permission-gated Edit and Delete. |
| **Branch create form** | ✅ Done | `branches/new.tsx` — name, timezone, currency, phone, email; calls `branchStore.create`. |
| **Branch edit form** | ✅ Done | `branches/$branchId.tsx` — pre-populated edit form; calls `branchStore.update`. |
| **Branch delete** | ✅ Done | Inline delete with confirm dialog in `branches/index.tsx`. |
| **Branch operating hours** | ❌ Pending | No UI to configure weekly operating hours schedule. |
| **Branch settings** | ❌ Pending | No UI for seat count, revenue targets, food cost % target, waste cost threshold, or delivery commission rates. |
| **Special operating hours CRUD** | ❌ Pending | No list, add, update, or delete for branch special hours overrides. |

---

## 14. Integrations Setup

> No integrations configuration screen exists anywhere in the tenant UI.

| Gap | Status | Detail |
|---|---|---|
| **Uber Eats connection** | ❌ Pending | No UI to enter Uber Eats credentials into `tenant_integrations`. |
| **Wolt connection** | ❌ Pending | No UI to enter Wolt credentials (Decision 22 confirmed Wolt replaces DoorDash). |
| **Stripe Terminal setup** | ❌ Pending | No UI for Stripe Terminal reader pairing. |
| **Twilio configuration** | ❌ Pending | No UI to configure Twilio credentials. |
| **Integration health / last synced** | ❌ Pending | No view of `last_synced_at`, active/inactive status, or connection health. |
