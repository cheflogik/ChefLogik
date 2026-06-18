# Wave 2 Design — Orders + Notifications (Native Apps Gate)

**Date:** 2026-06-17
**Status:** Approved (design); pending implementation plan
**Program:** Decision 50 (native iOS + Android employee apps). Builds on Wave 0 (backend prereqs) + Wave 1 (foundations), both complete.
**Spec author context:** parity source of truth is `/web` (`OrderService`, `OrderStore`, `NotificationStore`, `notificationChannel`/`orderChannel`), the live API (`api/routes/api.php` staff group), and `decisions.md` 50/51.

---

## 1. Purpose & gate

Wave 2 is the **foundation-proving gate**: implement a vertical slice that exercises every cross-cutting concern **once** on both platforms before the module waves (3–7) scale out. Originally specced as Orders + KDS + Notifications; **KDS is now removed from the native apps entirely** (see §9, Decision 50 amendment). The gate is therefore **Orders + Notifications**.

### Cross-cutting matrix (all must be proven on iOS AND Android)

| Concern | Proven by |
|---|---|
| List + filter | Orders list (branch / status / source) |
| Detail | Order detail |
| Mutations (online) | Status transition, cancel, create order, payment/refund display |
| Offline outbox + idempotent replay | Status transition + cancel (queued) |
| Food-safety hard rule | Outbox carve-out: `out_of_stock` cancels + any stock-driven mutation never auto-replay (manual confirm) |
| `/sync` offline cache (reads survive airplane mode) | Orders + Notifications → SwiftData/Room, cursors, `deleted_ids` |
| Real-time (Pusher) | `tenant.{tid}.branch.{bid}.orders`, `user.{uid}.notifications` |
| Push + deep-link | Notification tap → Order detail |
| Permission gating | `orders.view` / `orders.*`, mirrors `/web` (UI gating UX-only; API re-validates) |

### In-slice screens
- **Orders list** — filter by branch / status / source.
- **Order detail** — line items, totals, status history, payment/refund display, status-transition actions, cancel.
- **New order** — thin picker (see §4).
- **Notifications** — list + unread badge + mark-read / mark-all-read + push deep-link.

### Deferred (later orders-parity pass, NOT this gate)
order history, disputes, promo-codes, delivery-zones, platform-settings.

---

## 2. Decisions resolved during brainstorming

1. **Real-time:** add Pusher client libs — **PusherSwift** (iOS, SPM), **pusher-java-client** (Android) — wire `/broadcasting/auth` with the bearer token. True real-time; falls back to a `/sync` catch-up when a channel drops. (New dependencies, user-approved.)
2. **Orders scope:** core slice only (list / detail / transitions / cancel / create / payment+refund display). Ancillary order screens deferred.
3. **Offline writes:** status transitions + cancel are queueable offline; **create-order and payment stay online-only** (no temp-ID reconciliation in the gate; payment is inherently online via Stripe).
4. **New-order depth:** thin picker — flat searchable `menu_items` list, qty + free-text note, no modifier-group UI / combos.
5. **KDS:** removed from native apps entirely (not deferred). The 30s allergen-ack rule is KDS-only and therefore leaves mobile scope.

---

## 3. Architecture

One repository per module — `OrderRepository`, `NotificationRepository` — over the existing `APIClient` + local DB (SwiftData / Room). The view model observes the local DB; **the UI never reads the network directly.**

### 3.1 Read path (local cache is source of truth)
- **Cold start / foreground / branch switch:** `SyncService.page("orders" | "notifications", cursor)` loops until `meta.has_more == false`, upserting rows into the local DB, deleting `meta.deleted_ids`, and persisting `meta.next_cursor` per resource. Delta only — never full-table reads.
- **Live:** Pusher channel events upsert a single row into the local DB; the UI updates reactively.
- **Reconciliation:** Pusher is the live feed, `/sync` is cold-start + gap-fill. On Pusher (re)connect, run one `/sync` catch-up so events missed while disconnected are pulled by cursor delta.

### 3.2 Write path (optimistic + outbox)
1. Update the local DB optimistically; enqueue an `Outbox` row (`method`, `path`, `body`, `idempotencyKey`, `requiresManualReplay`).
2. **Online:** `OutboxReplayer.drain()` fires immediately → `APIClient.replay(...)` with `Idempotency-Key`. On success the server response / next `/sync` reconciles canonical state; the row is removed.
3. **Offline:** the row waits; the connectivity monitor triggers `drain()` (FIFO) on reconnect.
4. **Food-safety carve-out:** a cancel with `reason_code == out_of_stock` (and any stock-driven mutation) is enqueued with `requiresManualReplay = true` → `autoReplayable()` excludes it → it surfaces a manual-confirm prompt and is **never** auto-drained.

### 3.3 Idempotency = the order state machine (no server key needed)
`POST /orders/{id}/status` is not idempotency-keyed server-side. Re-delivering an already-applied transition (e.g. `new→confirmed` when already `confirmed`) returns a permanent `422 invalid transition` — so there is no double-effect; the state machine is the guard.

**Required refinement to `OutboxReplayer` (both platforms):** split failure handling — **permanent 4xx (incl. 422) → drop the row** (log + optionally flag for user visibility); **retryable network error / 5xx → halt and retry later**. The current "stop on first failure" must not let a stale queued write wedge the queue.

This means **no `/api` migration or endpoint change is required for the gate** — every endpoint already exists.

---

## 4. Screen detail

### 4.1 Orders list
- Source: local DB, ordered newest-first. Filters: branch (`X-Branch-Id` + `branch_id`), status (`OrderStatus`), source (`OrderSource`). Active vs terminal grouping mirrors `ACTIVE_STATUSES` / `TERMINAL_STATUSES`.
- Pull-to-refresh = `/sync` catch-up. Live updates via the orders channel.
- Permission: `orders.view`.

### 4.2 Order detail
- Shows line items (+ modifiers, item notes), totals, payment status/method, refund display, status history.
- **Status transitions:** drive the action buttons from `NEXT_TRANSITIONS` (mirror `web/src/types/orders.ts`). `POST /orders/{id}/status` `{status, notes}`. Queueable offline.
- **Cancel:** `POST /orders/{id}/cancel` `{reason_code, reason_note}`; `reason_code` from `CANCEL_REASON_CODES`. `out_of_stock` → food-safety manual-replay path.
- **Payment / refund:** display only in this wave. Payment creation (`POST /orders/{id}/payment` with `Idempotency-Key`, per Decision 27) and refund (`POST /orders/{id}/refund`) are online-only; surfaced if `orders.*` permits, but never queued.
- Permission gating per action slug; API re-validates.

### 4.3 New order (thin picker)
- Read `menu_items` from the `/sync` cache (flat, searchable). Pick item → qty → optional free-text note. No modifier-group UI, no combos.
- `POST /orders` with `CreateOrderPayload` (branch, source, items). Online-only (no offline create).
- Source defaults appropriate to on-floor staff (`dine_in_pos` / `takeaway_counter`); selectable from `OrderSource`.
- Permission: `orders.create` (verify exact slug against `/web`).

### 4.4 Notifications
- List: `GET /notifications?page=` (paginated); unread badge: `GET /notifications/unread-count`; `PATCH /notifications/{id}/read`; `POST /notifications/mark-all-read`.
- Cached via `/sync/notifications` (scoped to `recipient_id = user`, no permission slug). Live via `user.{uid}.notifications`.
- **Push deep-link:** APNs/FCM payload carries `data` (`type`, `order_id`). Tap → route to Order detail; if the order isn't cached, detail fetches it on demand (`GET /orders/{id}`). The registrar + `PushBridge` (iOS) / messaging service (Android) already exist; this wave wires the tap→route handler.

---

## 5. Real-time (Pusher)

- Replace the no-op `RealtimeClient` protocol with a concrete Pusher implementation behind the same interface.
- Auth: private channels via `POST /broadcasting/auth` with `Authorization: Bearer <token>`.
- Channels this wave: `tenant.{tid}.branch.{bid}.orders` (re-subscribe on branch switch), `user.{uid}.notifications`.
- Events map to repository upserts (see `web/src/websocket/orderChannel.ts` + `notificationChannel.ts` for payload shapes: `OrderStatusChanged`, `NewOrderReceived`, notification-created).
- Lifecycle: subscribe on session bootstrap / branch change; unsubscribe on logout / background as appropriate; `/sync` catch-up on reconnect.

---

## 6. Permissions
Gate UI with the existing `can("slug")` helper (mirrors `authStore.can()`). Slugs: `orders.view` (list/detail), order action slugs for transition/cancel/create/payment/refund (verify exact slugs against `/web` + `auth-permissions.md`). UI gating is UX-only; the API always re-validates.

---

## 7. Per-platform mapping

**iOS (build first):** MVVM, `@Observable` view models, `OrderRepository`/`NotificationRepository` over `APIClient` + SwiftData models (`OrderEntity`, `NotificationEntity`, decode `/sync` rows). Add **PusherSwift** via SPM. Replace placeholder Orders tab + add Notifications surface in `RootTabView`. Regenerate project with `xcodegen generate` after adding files.

**Android (mirror):** `@HiltViewModel` + Compose screens + Retrofit services + Room DAOs/entities mirroring the iOS models. Add **pusher-java-client** to the version catalog. Mirror `OutboxReplayer` 4xx-drop refinement. User compiles.

Local DB models decode the resource-specific `/sync` row shapes (orders, menu_items for the picker, notifications).

---

## 8. Backend
**No changes required for the gate.** All endpoints exist (orders CRUD + status/cancel/payment/refund/items, notifications, `/devices`, `/sync/{resource}`, `/broadcasting/auth`). Idempotency is provided by the order state machine (§3.3). If, during implementation, an endpoint or payload gap is found, **ask before any migration** (CLAUDE.md rule) and record it here.

---

## 9. Decision records to write (on implementation)
- **`decisions.md` — amend Decision 50:** W2 gate is **Orders + Notifications** (KDS removed from native apps entirely — not deferred; the 30s allergen-ack rule is KDS-only and stays web-only). Record Pusher client libs (PusherSwift / pusher-java-client) as the chosen real-time stack; offline-queueable writes limited to status transition + cancel; new-order is a thin picker.
- **Memory:** update `native-mobile-apps-program.md` (KDS dropped, Wave 2 scope, Pusher libs, outbox 4xx-drop refinement) + `MEMORY.md` pointer as pieces land.

---

## 10. Verification / gate criteria (done only when ALL hold on both platforms)
- Orders list + detail + status transition + cancel + create + payment/refund display work against the real API.
- Permission gating matches `/web`.
- `/sync` populates the local cache; cached orders + notifications are readable in airplane mode.
- Queued status/cancel writes replay idempotently on reconnect; `out_of_stock`/stock-driven writes do **not** auto-replay (manual confirm); stale queued writes 4xx-drop without wedging the queue.
- Push arrives and tapping it deep-links to the correct Order detail.
- Real-time: an order changed on `/web` updates the native list/detail live; a new notification updates the badge live.
- iOS: `xcodegen generate` + `xcodebuild … test` green + simulator screenshots of real screens. Android: code + JVM unit tests written; user compiles (`./gradlew :app:assembleDebug :app:testDebugUnitTest`).

Do **not** start Waves 3–7 until this slice is solid on iOS and Android.

---

## 11. Handoff
Each later wave is its own brainstorm → spec → plan → implement cycle. This spec + the implementation plan (next, via writing-plans) are the authoritative Wave 2 references. iOS-first then Android-mirror is the established pattern.
