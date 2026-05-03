# UI Design → Web App Implementation Plan

## Context
Port the complete React UI prototype from /UI/*.jsx (vanilla React + inline styles) into the existing Vite + **React 19.2** + TypeScript ~6.0 + Tailwind v4 + MST web app at /web (dev server port **5500**). Every screen must match the design visually. Global shared components must be created. Existing boilerplate assets replaced.

Backend gaps must be filled before or in parallel with the relevant frontend tasks. Backend tasks are prefixed **B**; frontend tasks are prefixed **T**.

---

## Pre-Implementation Review Protocol

**Before starting any task — B or T — follow this checklist:**

1. **Read the relevant backend files first.**
   - For every frontend screen, read its controller(s), service(s), and route registration in `/api`.
   - Confirm the expected request/response shape before writing a single line of frontend code.
   - If the endpoint is missing or the response shape differs from what the UI needs, raise it before starting frontend work — don't mock then forget.

2. **Read the relevant frontend files first.**
   - For every backend task, read the existing MST store(s) and any existing component(s) in `/web/src` that will consume the new endpoint.
   - Understand what shape of data the store expects so the API resource matches.

3. **Check the route file.**
   - `/api/routes/api.php` is the single source of truth for registered routes.
   - Before adding a new endpoint, confirm the route doesn't already exist under a different name.

4. **Document any new decision in `decisions.md` before writing code.**
   - If you discover a choice not covered by the existing 21 decisions (e.g. how to store OTP codes, message channel model design), record the decision first.

5. **Run existing tests before touching a file.**
   - `php artisan test --filter <RelatedTest>` before and after changes. A green suite before your change confirms you have a clean baseline.

---

## Critical Rules

### Visual fidelity (non-negotiable)
Every screen and component MUST be an exact port of its `UI/*.jsx` counterpart:
- Read the design source before writing a single line. Copy colours, sizes, padding, font weights, copy, layout, and spacing verbatim — do NOT invent values.
- After implementing a component, do a side-by-side diff against the design source and fix every discrepancy before marking the task done.
- Zero tolerance for placeholder icons, wrong copy, wrong colours, or layout changes.

---

## Execution Waves

```
Wave 0 ── B0                           (backend exploration — read all relevant code, produce gap list) ✓ DONE
Wave 1 ── T1  B1  B2  B3  B4  B5      (parallel: CSS tokens + all backend implementations)            ✓ DONE (T1 B1 B2 B4 complete; B3 B5 deferred to Phase 5)
Wave 2 ── T2  T3  T5  T7              (frontend shell + login + shared components; all need T1)        ✓ DONE
Wave 3 ── T4                           (AppShell rewrite; needs T2 + T3)                               ✓ DONE
Wave 4 ── T6                           (new /kds route stub; needs T4)                                 ← NEXT (Phase 3)
Wave 5 ── T8  T9  T10 T11 T12         (all screens in parallel)                                       ← Phase 3 (T8 done; T9 T10 T11 T12 next)
           T13 T14 T15 T16 T17                                                                          ← Phase 4
Wave 6 ── T18                          (asset cleanup; needs all screens)                              ← Phase 6
```

### Phase / Wave mapping (implementation schedule)

| Phase | Waves | Tasks | Status |
|---|---|---|---|
| **Phase 1 — Auth** | Wave 1 (partial) | T1, B1, B4 (partial) | ✅ Complete |
| **Phase 2 — Layout & Dashboard** | Wave 1 (partial) + Wave 2 + Wave 3 | B2, B4, T2, T3, T4, T5, T7, T8 | ✅ Complete |
| **Phase 3 — Operations screens** | Wave 4 + Wave 5 (partial) | T6, T9, T10, T11, T12 | ⏳ Next |
| **Phase 4 — Management screens** | Wave 5 (partial) | T13, T14, T15, T16 | ⏳ Planned |
| **Phase 5 — Insights + Integrations** | Wave 5 (partial) | T17, B3, B5 | ⏳ Planned |
| **Phase 6 — Cleanup** | Wave 6 | T18 | ⏳ Planned |

---

## Codebase Quick-Reference

| What | Where |
|---|---|
| CSS tokens + themes | `web/src/index.css` (`:root` cl-* at lines 108-119; theme blocks 182-239) |
| Theme type + cookie | `web/src/lib/theme.ts` (ThemeId line 3; THEMES line 13; getThemeCookie line 24) |
| Root MST store | `web/src/stores/root.ts` (add new stores here) |
| Store hooks | `web/src/stores/context.tsx` (add `useXxxStore()` hooks here) |
| ApiService singleton | `web/src/services/api.ts` — `api.get/post/put/patch/delete(url, ...)` |
| Auth store | `web/src/stores/AuthStore.ts` — `login()` at line 60, `logout()` at line 93 |
| Notification store | `web/src/stores/NotificationStore.ts` — `fetchNotifications`, `markAllRead`, `receiveNotification` |
| Notification WS | `web/src/websocket/notificationChannel.ts` — channel: `user.{userId}.notifications` |
| WS echo init | `web/src/websocket/echo.ts` |
| Existing AppShell | `web/src/components/layout/AppShell.tsx` — impersonation banner 122-140, WS init 95-106 |
| Login page | `web/src/components/auth/LoginPage.tsx` — basic sign-in only (188 lines) |
| Auth controller | `api/app/Http/Controllers/Api/V1/Auth/StaffAuthController.php` — login 27, me 137 |
| Notification controller | `api/app/Http/Controllers/Api/V1/Notifications/NotificationController.php` |
| Notification resource | `api/app/Http/Resources/Notifications/NotificationResource.php` — add `icon_type` |
| Notification event | `api/app/Events/Notifications/NotificationCreated.php` — broadcasts `.notification.created` |
| Dashboard controller | `api/app/Http/Controllers/Api/V1/Analytics/DashboardController.php` — add `operationalSummary()` |
| Routes file | `api/routes/api.php` |

---

## Wave 1 — Complete (Phase 1 + Phase 2 done)

### B0 Findings (complete)
- **Notifications**: all 4 endpoints registered and `NotificationStore` fully wired — B4 is a verification pass only
- **Auth**: login/logout/forgot/reset exist; OTP and account-lock are absent — B1 needed
- **Dashboard**: analytics dashboards exist (historical); no operational live-counts endpoint — B2 needed
- **Messages**: nothing exists at all — B3 is new from scratch
- **Onboarding**: signup + branch setup exist; team-invite step absent — B5 needed
- **Theme**: `data-theme="orange"` must become `"sunrise"`; `ThemeId = 'orange'` must become `'sunrise'`

### T1 — CSS tokens + theme rename
`web/src/index.css`, `web/src/lib/theme.ts`
- Add `--cl-bg/card/danger/warning/success/muted/border/text/text-soft` to `:root`
- Add `--cl-primary` + `--cl-dark` to each `[data-theme]` block (hex values from design)
- Add keyframes `pulse`, `slideIn`, `fadeIn`
- Rename `[data-theme="orange"]` → `[data-theme="sunrise"]`
- `theme.ts`: `ThemeId 'orange'` → `'sunrise'`; update THEMES id; update cookie fallback guard

### B1 — Staff OTP + account lock + 2FA (always-on)
`new StaffOtpService.php`, `new StaffOtpMail.php`, `AuthService.php`, `StaffAuthController.php`, new migration
- Migration: add `failed_login_attempts smallint default 0`, `locked_until timestamp null` to `users`
- `StaffOtpService`: mirrors platform-admin OTP — Redis key `staff_otp:{challengeToken}`, TTL 600s, max 5 attempts
- `AuthService::loginStaff()`: now returns `{requires_2fa: true, challenge_token, email_hint}` — no direct token
- `POST /api/v1/auth/staff/otp/send` (public) — for password reset; returns `{challenge_token, email_hint}`
- `POST /api/v1/auth/staff/otp/verify` (public) — mode `2fa` returns auth token; mode `reset` returns `{reset_token}`
- `resetPassword` accepts both OTP-issued reset tokens (Redis) and legacy email-link tokens

### B2 — Dashboard operational endpoint
`DashboardController.php`, `api/routes/api.php`
- `GET /api/v1/dashboard/operational?branch_id={uuid}`
- Returns: `active_orders`, `tables_occupied`, `tables_total`, `waitlist_count`, `revenue_today`
- Single DB pass; permission gate `analytics.branch_dashboard`

### B3 — Messages/Chat
3 new migrations + 3 models + controller + Reverb event + routes
- Tables: `message_channels`, `messages`, `message_reads` (all tenant-scoped)
- Seed 3 system channels (kitchen/managers/foh) in `OnboardingService::setupBranch()`
- `GET /api/v1/messages/channels` — list with last message + per-user unread count
- `POST /api/v1/messages/channels/{id}/messages` — post + broadcast `MessageSent` on `messages.{tenantId}`

### B4 — Notifications verify + broadcast
`NotificationResource.php`, any `Notification*` event
- Confirm `title`, `body`, `type`, `data`, `read_at`, `created_at` in resource (add if missing)
- Confirm or create `NotificationCreated` broadcast event on `notifications.{userId}` Reverb channel

### B5 — Onboarding team invite
`OnboardingController.php`, `OnboardingService.php`, routes
- `POST /api/v1/onboarding/invite-staff` — `invites: [{email, role_slug}]` max 10
- Creates users with `status=invited`, dispatches invite email; "Skip for now" calls existing `/onboarding/complete`

---

## Task Summary

### Backend Tasks

| ID | Task | Key Files | Status |
|---|---|---|---|
| **B0** | Backend exploration — read all controllers, services, routes; produce gap list | `/api/routes/api.php`, all controllers | ✅ Done |
| **B1** | Auth gaps — staff OTP (2FA + password reset), account-lock detection | `StaffAuthController`, new `StaffOtpService`, migration | ✅ Done |
| **B2** | Dashboard operational summary endpoint (live counts: orders, tables, waitlist, revenue) | `DashboardController::operationalSummary()`, routes | ✅ Done |
| **B3** | Messages/Chat — new feature (channels, messages, WebSocket broadcast) | New `Conversation`, `Message` models + controller + Reverb channel | ⏳ Phase 5 |
| **B4** | Notifications — verify routes + WebSocket broadcast payload shape | `NotificationResource` (icon_type added) | ✅ Done |
| **B5** | Onboarding — team invite step (step 3 of wizard) | `OnboardingController.inviteStaff()`, new request + service method | ⏳ Phase 5 |

### Frontend Tasks

| ID | Task | Key Files | Status |
|---|---|---|---|
| **T1** | CSS tokens + theme rename (orange→sunrise) | `web/src/index.css`, `web/src/lib/theme.ts` | ✅ Done |
| **T2** | Sidebar component (fixed, 4 nav groups, branch selector) | `web/src/components/layout/Sidebar.tsx` | ✅ Done |
| **T3** | Header + 3 dropdowns (Notif, Messages, User+theme-switcher) | `Header.tsx`, `NotifDropdown.tsx`, `MessagesDropdown.tsx`, `UserDropdown.tsx` | ✅ Done (MessagesDropdown uses mock data until B3) |
| **T4** | AppShell rewrite (compose Sidebar + Header, fixed layout) | `web/src/components/layout/AppShell.tsx` | ✅ Done |
| **T5** | Login: full 6-screen flow (SignIn, OTP, Forgot, Locked, Onboarding) | `LoginPage.tsx` + `screens/` folder (5 screens) | ✅ Done |
| **T6** | New /kds top-level route | `web/src/routes/_authenticated/kds.tsx` | ⏳ Phase 3 |
| **T7** | Global shared UI components (StatCard, TabBar, FilterBar, Kanban, DataTable, etc.) | `web/src/components/ui/*.tsx`, `web/src/components/shared/*.tsx` | ✅ Done |
| **T8** | Dashboard screen | `web/src/components/dashboard/DashboardScreen.tsx` | ✅ Done |
| **T9** | Live Orders Kanban screen | `web/src/components/orders/*.tsx` | ⏳ Phase 3 |
| **T10** | KDS screen (dark mode, allergen banner, 86 overlay) | `web/src/components/kds/*.tsx` | ⏳ Phase 3 |
| **T11** | Tables & Reservations screen (floor canvas + detail panel) | `web/src/components/reservations/*.tsx` | ⏳ Phase 3 |
| **T12** | Events & Functions Kanban screen | `web/src/components/events/*.tsx` | ⏳ Phase 3 |
| **T13** | Menu Management screen (4 tabs, 86 manager) | `web/src/components/menu/*.tsx` | ⏳ Phase 4 |
| **T14** | Inventory screen (stats bar + table) | `web/src/components/inventory/*.tsx` | ⏳ Phase 4 |
| **T15** | Customers & Loyalty screen | `web/src/components/customers/*.tsx` | ⏳ Phase 4 |
| **T16** | Staff Management screen (master-detail, 3-tab profile) | `web/src/components/staff/*.tsx` | ⏳ Phase 4 |
| **T17** | Analytics & Reports screen (SVG charts) | `web/src/components/analytics/*.tsx` | ⏳ Phase 5 |
| **T18** | Asset cleanup (delete boilerplate, run lint + tests) | Various | ⏳ Phase 6 |

---

## Key Design Decisions (already confirmed)

- **Theme rename**: orange → sunrise everywhere (CSS data-attr, ThemeId type, cookie)
- **Sidebar nav**: 4 groups — Operations / Management / Insights / Settings (adds Shifts, Attendance, Branches, Roles, Settings beyond the 9-item design)
- **Admin screens** (cl-admin-*.jsx): out of scope for /web
- **Platform Sync tab**: stub "integration pending" placeholder
- **Login**: full 6-screen flow from cl-login.jsx (not just basic sign-in)
- **KDS route**: new top-level /kds; old /inventory/kds redirects
- **Tables**: /reservations index becomes combined floor+list+waitlist (view toggle)

---

## Backend Gaps (known at plan time)

| Feature | Gap | Resolution |
|---|---|---|
| Staff OTP / 2FA | No OTP flow for staff — only customers have `CustomerOtpService`. Backend uses email-link reset. | B1: `StaffOtpService` (centralises platform-admin pattern), two new public endpoints; 2FA is always-on — login now returns challenge token instead of auth token |
| Account lock | No failed-login tracking; no 423 response | B1: `failed_login_attempts` + `locked_until` on `users` table; login returns 423 + `locked_until` after 5 failures |
| Dashboard live counts | `DashboardController` serves historical analytics only. No endpoint for active orders, occupied tables, waitlist, revenue today | B2: new `/api/v1/dashboard/operational` endpoint |
| Messages/Chat | No model, controller, WebSocket channel, or migration | B3: build from scratch with stub channels |
| Notifications broadcast shape | Endpoints exist; need to verify event payload matches what `NotificationStore` expects | B4: read and align |
| Onboarding team-invite step | Signup + branch setup exist; no invite-staff step | B5: add `OnboardingController::inviteStaff()` |
| Staff Performance analytics | No per-staff metric aggregation | T17: mock data; deferred |
| Table Merge/Split | No backend implementation | T11: buttons disabled; deferred |
| RFM / Monthly revenue | Models exist; no shaped endpoints | T17: mock data; deferred |

---

## B0 — Backend Exploration
**No dependencies. Run before any other task.**

Read and map the following before writing any code. Produce a short findings note inline or in a comment on this task:

| Area | Files to read |
|---|---|
| Auth routes + middleware | `/api/routes/api.php` (auth section), `StaffAuthController`, `AuthService`, `StaffPasswordResetService` |
| Notification routes + event | `NotificationController`, `NotificationResource`, any `Notification*` event/listener, routes registration |
| Dashboard controllers | `DashboardController`, `AnalyticsService` (owner + branch dashboard methods) |
| Onboarding flow | `SignupController`, `OnboardingController`, `OnboardingService` |
| Messages (check if anything exists) | Search `app/` for `message`, `chat`, `thread` — confirm nothing exists |
| Shifts + Attendance routes | `ShiftController`, `AttendanceController`, confirm routes registered |
| Existing MST stores | `/web/src/stores/` — read `AuthStore`, `NotificationStore`, any existing `DashboardStore`; map expected API shape |

---

## B1 — Auth: Staff OTP + Account Lock + 2FA
**Depends on: B0.**

### What exists
- `POST /api/v1/auth/staff/login` — email + password + tenant_slug → 8-hour Sanctum token **directly** (no 2FA)
- `POST /api/v1/auth/staff/forgot-password` — sends email reset **link** (token-based, not OTP code)
- `POST /api/v1/auth/staff/reset-password` — verifies link-based reset token, updates password
- `AuthService::initiateAdminMfa()` + `verifyAdminMfa()` — fully-working OTP/MFA implementation for platform admins (Redis-backed, email-delivered, 5-attempt limit)
- `PlatformAdminMfaCodeMail` + `mail.platform-admin-mfa` blade view — existing OTP mail
- No 2FA for staff. No failed-login tracking. No account lock.

### Decisions from design review
- **2FA is always-on for staff** — every login triggers an email OTP (same as platform admin). No per-user toggle for MVP.
- **Login endpoint response changes** — `POST /auth/staff/login` no longer returns a token directly; returns `{requires_2fa: true, challenge_token, email_hint}` after valid credentials.
- **OTP endpoints are public routes** — go in the unauthenticated public block alongside existing login/forgot-password routes.
- **Dual-token reset** — `resetPassword` accepts both OTP-issued reset tokens (Redis) and old email-link tokens (Laravel `password_reset_tokens` table) for backwards compatibility.
- **Captcha in ForgotPassword** — visual placeholder only for MVP; backend stub comment added.

### OTP Redis structure (mirrors platform admin pattern)

| Key | Value | TTL |
|---|---|---|
| `staff_otp:{challengeToken}` | `{user_id, mode, email, otp_hash, attempts: 0}` | 600s |
| `staff_reset_token:{uuid}` | `{user_id}` | 600s |

### Subtasks

| # | Subtask |
|---|---|
| B1.1 | **Migration**: `2026_05_02_000001_add_login_lock_to_users_table.php` — add `failed_login_attempts smallint unsigned default 0`, `locked_until timestamp null` to `users` table |
| B1.2 | **New `StaffOtpService`** (`app/Services/Auth/StaffOtpService.php`) — centralises OTP pattern from `AuthService::initiateAdminMfa()`. `generate(User $user, string $mode): array` → generates 6-digit code, stores `staff_otp:{challengeToken}` in Redis (TTL 600s), queues `StaffOtpMail` (or logs code in dev with `// TODO Decision 9` comment), returns `[challenge_token, email_hint]`. `verify(string $challengeToken, string $code): array` → checks attempts (max 5), validates `hash_equals`, consumes on success, returns `[user_id, mode]`; throws `ValidationException` on failure/expiry/too many attempts |
| B1.3 | **New `StaffOtpMail`** (`app/Mail/StaffOtpMail.php`) — mirrors `PlatformAdminMfaCodeMail`; constructor takes `staffName`, `staffEmail`, `otp`, `mode`; subject differs per mode (`'Sign-in verification code'` vs `'Password reset code'`); uses new blade view `mail.staff-otp` |
| B1.4 | **Modify `AuthService::loginStaff()`** — signature changes from `NewAccessToken` to `array`; new flow: (1) check `locked_until > now()` → abort 423 `{message, locked_until}`; (2) verify password → if wrong: increment `failed_login_attempts`, if ≥ 5 set `locked_until = now()+30min`; (3) if correct: reset `failed_login_attempts = 0, locked_until = null`; (4) call `StaffOtpService::generate(user, '2fa')` → return `{requires_2fa: true, challenge_token, email_hint}`. Extract **`issueStaffToken(User $user): NewAccessToken`** helper (existing token-building logic at lines 40–62) — reused by `verifyOtp` after 2FA passes |
| B1.5 | **Modify `StaffAuthController::login()`** — update to handle new `loginStaff()` return shape; catch 423 abort and return `JsonResponse(status: 423)` with `{message, locked_until}` |
| B1.6 | **New `StaffAuthController::verifyOtp()`** — `POST /api/v1/auth/staff/otp/verify` (public); validates `{challenge_token, code, mode}`; calls `StaffOtpService::verify()`; on `mode='2fa'` calls `issueStaffToken(user)` and returns `{token, expires_at, user}` (same shape as old login response); on `mode='reset'` generates UUID reset token, stores `staff_reset_token:{uuid}` in Redis TTL 600s, returns `{reset_token}` |
| B1.7 | **New `StaffAuthController::sendOtp()`** — `POST /api/v1/auth/staff/otp/send` (public); validates `{email, tenant_slug}`; finds user; calls `StaffOtpService::generate(user, 'reset')`; always returns 200 `{challenge_token, email_hint}` (prevents enumeration) |
| B1.8 | **Modify `StaffAuthController::resetPassword()`** (line 116) — dual-token: try Redis `staff_reset_token:{token}` first → get `user_id`, update password, `Cache::forget`; fallback: existing `StaffPasswordResetService->resetPassword()` (email-link tokens) |
| B1.9 | **Route additions** — in public block (alongside existing login/forgot at `api.php:74-76`): `Route::post('/auth/staff/otp/send', ...)` + `Route::post('/auth/staff/otp/verify', ...)` |
| B1.10 | **Frontend wire-up** (do in T5) — see T5 AuthStore section |
| B1.11 | **Tests** (`php artisan test --filter StaffAuthTest`): `locked_after_5_failures`, `auto_unlock_after_lock_window_passes`, `login_returns_2fa_challenge_not_token`, `otp_send_generates_redis_entry`, `otp_verify_2fa_issues_token`, `otp_verify_reset_issues_reset_token`, `otp_verify_wrong_code_fails`, `otp_verify_expired_fails`, `otp_verify_too_many_attempts_fails`, `reset_password_with_otp_reset_token`, `reset_password_backwards_compat_email_link_token` |

**Key files:**
- New: `api/app/Services/Auth/StaffOtpService.php`, `api/app/Mail/StaffOtpMail.php`, `resources/views/mail/staff-otp.blade.php`, migration `2026_05_02_000001_*`
- Modified: `api/app/Services/Auth/AuthService.php` (loginStaff + new issueStaffToken helper), `api/app/Http/Controllers/Api/V1/Auth/StaffAuthController.php` (login, resetPassword, + new verifyOtp + sendOtp), `api/routes/api.php`
- Frontend: `web/src/stores/AuthStore.ts`

---

## B2 — Dashboard: Operational Summary Endpoint
**Depends on: B0.**

### What exists
- `GET /api/v1/analytics/branch-dashboard` — revenue trend, top dishes, menu engineering (historical)
- `GET /api/v1/analytics/owner-dashboard` — cross-branch revenue, customer segments (historical)
- `GET /api/v1/analytics/customer-dashboard` — RFM segment breakdown, churn risk list, total projected CLV (historical)
- No live operational counts endpoint.

### What the UI needs (T8 Dashboard screen)
Four live stat cards: **Active Orders**, **Tables Seated**, **Walk-in Waitlist**, **Revenue Today**

### Subtasks

| # | Subtask |
|---|---|
| B2.1 | **Review**: Read `DashboardController`, `AnalyticsService` — confirm no operational summary method already exists |
| B2.2 | **New endpoint**: `GET /api/v1/dashboard/operational?branch_id={uuid}` |
| B2.3 | Response shape: `{ active_orders: int, tables_occupied: int, tables_total: int, waitlist_count: int, revenue_today: { amount: int, currency: string } }` |
| B2.4 | **Implementation**: Single controller action, direct DB queries (not via AnalyticsService — this is live data, not aggregated): count orders where status not in (completed, cancelled), count tables where status = occupied, count waitlist entries, sum order totals for today |
| B2.5 | **Permission**: gate on `analytics.branch_dashboard` (same as existing branch dashboard) |
| B2.6 | **Frontend wire-up** (do in T8): `DashboardStore.fetchOperationalSummary(branchId)` calls this endpoint; stats bar reads from store |
| B2.7 | **Tests**: counts correct for tenant scope, zero state (no orders/tables), multi-tenant isolation |

**Key files:** `api/app/Http/Controllers/Api/V1/Analytics/DashboardController.php` (add `operationalSummary()` method after `kitchenDashboard()` at line 54), `api/routes/api.php`

**New frontend store required:** `DashboardStore` does not yet exist in `root.ts`. Create `web/src/stores/DashboardStore.ts` with `operational` map + `fetchOperationalSummary(branchId)` flow action. Add to `root.ts`: `dashboard: types.optional(DashboardStore, {})`. Add `useDashboardStore()` hook to `web/src/stores/context.tsx` following existing hook pattern (e.g. `useAnalyticsStore` at line 58).

---

## B3 — Messages / Chat (New Feature)
**Depends on: B0.**

### Architecture decision (resolved)
All messages are **direct messages between two users** within the same tenant. There are no system/group channels. The UI "channel" label displayed in the dropdown is the **recipient's Branch + Role** (e.g. "Main Branch / Chef") — a derived display label, not a stored channel type. Conversations are created on demand; no seeder required. Reverb broadcast is **per conversation** (`private-messages.{conversationId}`). Record this in `decisions.md` before writing code (B3.1).

### What exists
Nothing — no model, migration, controller, route, or WebSocket channel.

### What the UI needs (T3 MessagesDropdown)
- Dropdown lists the authenticated user's active conversations ordered by most recent message
- Each item: gradient avatar initials + recipient name + **"{Branch} / {Role}"** label (uppercase) + last message body preview + timestamp + unread dot
- **"New message"** button in dropdown header → user picker (list of tenant users) → calls `findOrCreate` → opens conversation
- Clicking a conversation → "Open inbox →" (full inbox UI is deferred; stub the route)
- Real-time: `MessageSent` event on `private-messages.{conversationId}` updates unread badge and last message preview

### Scope for this plan
Conversation list + find-or-create + send message + per-conversation Reverb broadcast. Full inbox UI is deferred.

### Data model

| Table | Columns |
|---|---|
| `conversations` | `id uuid pk`, `tenant_id uuid index`, `participant_1_id uuid FK users`, `participant_2_id uuid FK users`, `last_message_at timestamp null`, `created_at`, `updated_at`. Unique: `(tenant_id, participant_1_id, participant_2_id)`. Participants always stored in sorted UUID order (lower UUID = participant_1) to guarantee uniqueness regardless of who initiates. |
| `messages` | `id uuid pk`, `tenant_id uuid index`, `conversation_id uuid FK conversations`, `sender_id uuid FK users`, `body text`, `created_at`, `updated_at` |
| `message_reads` | `id uuid pk`, `tenant_id uuid index` *(A1 resolved)*, `message_id uuid FK messages`, `user_id uuid FK users`, `read_at timestamp` |

### Subtasks

| # | Subtask |
|---|---|
| B3.1 | **Decision**: Record in `decisions.md` — messaging is DM-only (no group channels), per-conversation Reverb broadcast, conversation uniqueness via sorted UUID participants |
| B3.2 | **Migration** `conversations` table — columns per data model above; composite unique index on `(tenant_id, participant_1_id, participant_2_id)` |
| B3.3 | **Migration** `messages` table — columns per data model above; index on `(conversation_id, created_at)` for message history queries |
| B3.4 | **Migration** `message_reads` table — columns per data model above; unique index on `(message_id, user_id)` |
| B3.5 | **Models**: `Conversation` (HasTenantScope; `belongsTo User, 'participant_1_id'`; `belongsTo User, 'participant_2_id'`; `hasMany Message`); `Message` (HasTenantScope; `belongsTo Conversation`; `belongsTo User, 'sender_id'`; `hasMany MessageRead`); `MessageRead` (HasTenantScope; `belongsTo Message`; `belongsTo User`) |
| B3.6 | **No seeder** — conversations are created on demand via find-or-create. Remove any reference to system channel seeding from `OnboardingService`. |
| B3.7 | **`ConversationController::index()`** — `GET /api/v1/messages/conversations`; returns auth user's conversations ordered by `last_message_at desc`; each includes: `id`, `recipient` (name, branch, role from user→branch relationship), `last_message` (`body`, `sent_at`, `is_mine`), `unread_count` (messages in conversation not in `message_reads` for auth user); gate: `messages.send` permission seeded to all system roles |
| B3.8 | **`ConversationController::findOrCreate()`** — `POST /api/v1/messages/conversations/find-or-create`; body: `{ recipient_id: uuid }`; validate recipient exists and belongs to same tenant; normalize pair: `sort([$authId, $recipientId])` → `[$p1, $p2]`; `firstOrCreate(['tenant_id'=>..., 'participant_1_id'=>$p1, 'participant_2_id'=>$p2])`; returns full `ConversationResource`; same permission gate |
| B3.9 | **`MessageController::store(Conversation $conversation)`** — `POST /api/v1/messages/conversations/{id}/messages`; body: `{ body: string }`; authorize auth user is a participant; create `Message`; touch `conversation.last_message_at = now()`; broadcast `MessageSent` on `private-messages.{$conversation->id}`; return `MessageResource` |
| B3.10 | **`MessageSent` event** — implements `ShouldBroadcast`; broadcast on `PrivateChannel("messages.{$conversationId}")`; payload: `{ conversation_id, message: { id, body, sent_at, sender: { id, name } }, unread_count_for_recipient }` |
| B3.11 | **Channel auth route** in `routes/channels.php`: `Broadcast::channel('messages.{conversationId}', fn(User $user, string $conversationId) => Conversation::where('id', $conversationId)->where(fn($q) => $q->where('participant_1_id', $user->id)->orWhere('participant_2_id', $user->id))->exists())` |
| B3.12 | **Permission seed** — add `messages.send` to the permissions seeder; assign to all 8 system roles |
| B3.13 | **User list endpoint** for "New message" picker — `GET /api/v1/messages/users` — returns tenant staff list (id, name, branch, role) excluding auth user; used by dropdown's user picker; same `messages.send` gate |
| B3.14 | **Frontend wire-up** (do in T3): see MessagesStore spec below |
| B3.15 | **Tests**: `conversation_list_scoped_to_tenant`, `find_or_create_returns_existing`, `find_or_create_normalises_participant_order`, `unread_count_correct`, `cross_tenant_recipient_rejected`, `non_participant_cannot_post`, `broadcast_fires_on_message_post` |

**Key files:**
- New: `api/database/migrations/2026_05_02_000002_create_conversations_table.php`, `*_create_messages_table.php`, `*_create_message_reads_table.php`
- New: `api/app/Models/Conversation.php`, `Message.php`, `MessageRead.php`
- New: `api/app/Http/Controllers/Api/V1/Messages/ConversationController.php`, `MessageController.php`
- New: `api/app/Events/MessageSent.php`
- Modified: `api/routes/api.php`, `api/routes/channels.php`, permissions seeder

**New frontend store required:** `MessagesStore` — create `web/src/stores/MessagesStore.ts`:

```typescript
// ConversationSummary type (matches ConversationResource)
interface ConversationSummary {
  id: string;
  recipient: { id: string; name: string; branch: string; role: string };
  last_message: { body: string; sent_at: string; is_mine: boolean } | null;
  unread_count: number;
}

// MessagesStore MST model
// conversations: types.map(ConversationModel)
// volatile subscriptions: Map<string, () => void>  ← per-conversation unsubscribe fns
// fetchConversations(): flow — GET /api/v1/messages/conversations; subscribes each conversation's Reverb channel
// findOrCreate(recipientId): flow — POST find-or-create; subscribes to new channel; returns conversation id
// receiveMessage(conversationId, data): action — updates last_message + increments unread_count
// subscribeToConversation(conversationId): subscribes to private-messages.{conversationId}
// unsubscribeAll(): called on logout
// totalUnread: computed — sum of all conversation unread_count values
```

Add to `root.ts`: `messages: types.optional(MessagesStore, {})`. Add `useMessagesStore()` hook to `context.tsx`.

**New WebSocket helper:** Create `web/src/websocket/messagesChannel.ts`:
```typescript
// subscribeToConversation(conversationId: string, onMessage: (data) => void): () => void
// → Echo.private(`messages.${conversationId}`).listen('.message.sent', onMessage)
// → returns unsubscribe fn
```

**Mock data** (used in T3 when B3 not yet complete — shape must match `ConversationSummary`):
```typescript
const MOCK_CONVERSATIONS: ConversationSummary[] = [
  { id: 'mock-1', recipient: { id: 'u1', name: 'Marco Rossi', branch: 'Main Branch', role: 'Chef' },
    last_message: { body: 'Table 4 needs the allergen check done now', sent_at: '2026-05-02T10:42:00Z', is_mine: false }, unread_count: 2 },
  { id: 'mock-2', recipient: { id: 'u2', name: 'Sarah Chen', branch: 'Main Branch', role: 'Floor Manager' },
    last_message: { body: 'Walk-in party of 8 just arrived', sent_at: '2026-05-02T10:15:00Z', is_mine: true }, unread_count: 0 },
];
```

---

## B4 — Notifications: Route Verification + Broadcast Payload
**Depends on: B0.**

> **Status note**: B4 is ~90% complete already. All routes, the broadcast event, and the frontend subscription exist. Only remaining gap: `icon_type` missing from `NotificationResource`.

### What exists (verified)
- `GET /api/v1/notifications` — registered ✓ (`api/routes/api.php:407`)
- `GET /api/v1/notifications/unread-count` — registered ✓
- `PATCH /api/v1/notifications/{notification}/read` — registered ✓ (**not** POST — plan was wrong)
- `POST /api/v1/notifications/mark-all-read` — registered ✓
- `NotificationResource` (`api/app/Http/Resources/Notifications/NotificationResource.php`) returns: `id`, `type`, `title`, `body`, `data`, `read_at`, `created_at` ✓ — **`icon_type` missing**
- `NotificationCreated` event (`api/app/Events/Notifications/NotificationCreated.php`) exists ✓ — broadcasts on `user.{recipientId}.notifications` private channel ✓ with event name `.notification.created` ✓
- Frontend WebSocket subscription: `web/src/websocket/notificationChannel.ts` subscribes to `user.${userId}.notifications` ✓ — already wired in `AppShell.tsx:95-106` via `subscribeToStaffNotifications()`
- `NotificationStore` (`web/src/stores/NotificationStore.ts`): fully implemented with `fetchNotifications`, `markAllRead`, `receiveNotification` ✓
- `NotificationService.ts` correctly uses `api.patch('/notifications/{id}/read')` ✓

### Subtasks

| # | Subtask |
|---|---|
| B4.1 | ~~**Review routes**~~ **Already confirmed** (see above) |
| B4.2 | ~~**Review NotificationResource fields**~~ **Already confirmed** — `title`, `body`, `type`, `data`, `read_at`, `created_at` all present |
| B4.3 | **Gap fix**: Add `icon_type` to `NotificationResource::toArray()` — read from `$this->data['icon_type'] ?? null`; valid values match the icon map in `NotifDropdown` | `api/app/Http/Resources/Notifications/NotificationResource.php` |
| B4.4 | ~~**Review broadcast event**~~ **Already confirmed** — `NotificationCreated` at `api/app/Events/Notifications/NotificationCreated.php` broadcasts correct payload |
| B4.5 | ~~**Create broadcast event**~~ **Not needed** — already exists |
| B4.6 | **Frontend wire-up** (do in T3): `NotifDropdown` reads `useNotificationStore()` (hook at `context.tsx:82`); "Mark all read" calls `notifications.markAllRead()`. **Decision D1 resolved**: WebSocket subscription stays in `AppShell.tsx` — `Header`/`NotifDropdown` are read-only consumers of `NotificationStore`. |

**Key files:** `api/app/Http/Resources/Notifications/NotificationResource.php:12-29` (add `icon_type`), `web/src/stores/NotificationStore.ts`, `web/src/services/NotificationService.ts`, `web/src/websocket/notificationChannel.ts`

---

## B5 — Onboarding: Team Invite Step
**Depends on: B0.**

### What exists
- `POST /api/public/signup` — creates tenant + owner user, returns token (Step 0: Account)
- `POST /api/v1/onboarding/branch` — creates first branch (Step 1: Restaurant)
- `POST /api/v1/onboarding/complete` — marks onboarding done
- No endpoint for Step 2: Team (invite staff)

### What the UI needs (T5 OnboardingScreen Step 2)
A list of up to N email + role pairs → creates pending staff invitations or direct accounts; "Skip for now" is always available.

### Subtasks

| # | Subtask |
|---|---|
| B5.1 | **Review**: Read `OnboardingController`, `OnboardingService`, `StaffController` — understand how staff accounts are created to reuse the pattern |
| B5.2 | **New endpoint**: `POST /api/v1/onboarding/invite-staff` — accepts `invites: [{ email, role_slug }]` array (max 10); creates `User` records with `status = invited` and sends password-set emails; advances onboarding to `invites_sent` step |
| B5.3 | **Service method**: `OnboardingService::inviteStaff(array invites, Tenant tenant): void` — loops invites, creates users via existing `StaffController` creation logic, dispatches `StaffInvitedNotification` queued job. **Email dispatch blocked by Decision 9** — add `// TODO Decision 9` stub; create users with `status = invited` so invite still registers even without email |
| B5.4 | **Validation**: each invite must have valid email + role_slug that exists in tenant's roles; duplicates silently skipped |
| B5.5 | **Frontend wire-up** (do in T5): Step 2 of `OnboardingScreen` — `const auth = useAuth()`; calls `auth.inviteStaff(invites)`; "Skip for now" calls `POST /api/v1/onboarding/complete` directly |
| B5.6 | **Tests**: invites create users, skip-for-now completes onboarding, duplicate email skipped, invalid role rejected |
| B5.7 | **New stub job** `app/Jobs/Staff/StaffInvitedNotification.php` — constructor takes `User $staff, string $inviterName`; `handle()` body: `// TODO Decision 9 — dispatch staff invite email via SES when provider confirmed`; implements `ShouldQueue`; dispatched on queue `'low'`. Created as stub so B5.3's `OnboardingService::inviteStaff()` can reference and dispatch it without a missing-class error. |

**Key files:** `api/app/Http/Controllers/Api/V1/Onboarding/OnboardingController.php`, `api/app/Services/Tenants/OnboardingService.php`, `api/routes/api.php`

---

## T1 — Foundation: CSS tokens + theme system
**No dependencies.**

> **Status note**: `--cl-bg`, `--cl-card`, `--cl-danger`, `--cl-warning`, `--cl-success`, `--cl-muted`, `--cl-border`, `--cl-text`, `--cl-text-soft`, `--cl-primary`, `--cl-dark` are **already present** in `:root` at `index.css:108-119`. Subtask 1.1 below is effectively done — verify and skip if tokens match design values.

| # | Subtask | File |
|---|---|---|
| 1.1 | ~~Add `--cl-bg` … `--cl-text-soft` to `:root`~~ **Already done** (`index.css:108-119`). Verify hex values match design; update if different. | `web/src/index.css` |
| 1.2 | Add `--cl-primary` + `--cl-dark` **per-theme override** to each `[data-theme]` block — the block-level overrides are missing. Ocean block: `index.css:182-199`; Forest: `200-219`; Sunrise/orange: `221-239`. Values: Ocean `--cl-primary:#4A7FA7 --cl-dark:#1A3D63`, Forest `--cl-primary:#68BA7F --cl-dark:#2E6F40`, Sunrise `--cl-primary:#F97316 --cl-dark:#C2410C` | `web/src/index.css` |
| 1.3 | Add keyframes: `pulse` (opacity 1→0.5→1), `slideIn` (translateY(-8px)→0 + opacity), `fadeIn` (opacity 0→1) | `web/src/index.css` |
| 1.4 | Rename `[data-theme="orange"]` (line 222) → `[data-theme="sunrise"]`; update comment line 221 "Sunrise (Moniex Orange)" → "Sunrise" | `web/src/index.css` |
| 1.5 | `ThemeId` (line 3): `'orange'` → `'sunrise'`; `THEMES[2].id` (line 16): `'orange'` → `'sunrise'`; `getThemeCookie` guard (line 28) auto-handles via `THEMES.some()` but verify after rename | `web/src/lib/theme.ts` |

---

## T2 — Shell: Sidebar component
**Depends on: T1.**

| # | Subtask |
|---|---|
| 2.1 | Create `Sidebar.tsx` — fixed `left:16px top:16px bottom:16px width:224px`, white card, `borderRadius:16px`, shadow |
| 2.2 | Logo: gradient CL box (`linear-gradient(135deg, --cl-primary, --cl-dark)`) + "ChefLogik" text |
| 2.3 | Nav groups with uppercase muted group headers (10px, 0.08em tracking): **Operations** (Dashboard, Live Orders+badge, Kitchen Display `/kds`, Tables & Reservations, Events & Functions) · **Management** (Menu Management, Inventory, Staff, Shifts, Attendance, Customers & Loyalty) · **Insights** (Analytics & Reports) · **Settings** (Branches, Roles, Settings). ⚠ **Implementation obstacle (D2)**: Shifts, Attendance, Branches, and Roles nav items have no corresponding screen tasks in this plan. Link them to their existing routes but do not remove them. What should render when clicked (existing page, coming-soon stub, or new task) requires further clarification before T2 is finalised. |
| 2.4 | Active item: `var(--cl-dark)` bg, white text, `borderRadius:10px`; hover: `rgba(--cl-primary, 0.2)` |
| 2.5 | Branch selector at bottom: MapPin icon + branch name + ChevronDown; opens upward popover with branch list from `useBranchStore().list`. Branches are guaranteed loaded by the time the popover opens — `AppShell` calls `branchStore.fetchAll()` on mount (see T4 §4.6). Active branch = `auth.user.branch_id`; show its name as the selector label. |
| 2.6 | Permission gate each nav item: `const auth = useAuth()` (hook from `context.tsx`); then `auth.can()` / `auth.canAny()` — **not** `useAuthStore()` (that hook does not exist; the correct hook is `useAuth()`) |

**File:** `web/src/components/layout/Sidebar.tsx`

**Code to migrate from AppShell:** Nav items currently defined as `NAV_ITEMS` array at `AppShell.tsx:63-76`; `SidebarNavItem` sub-component at `AppShell.tsx:250-277`. Move + expand these. Branch selector is `BranchSwitcher.tsx` at `components/layout/BranchSwitcher.tsx` — replace with inline branch popover reading from `useBranchStore()` (`context.tsx:22`).

---

## T3 — Shell: Header + three dropdowns
**Depends on: T1. Wire to B3 (messages) + B4 (notifications) when those backend tasks are done.**

| # | Subtask |
|---|---|
| 3.1 | `Header.tsx` — fixed `top:0 left:256px right:0 height:64px`, transparent bg; breadcrumb left, search centre (max-width 380px, rounded-xl, shadow), actions right |
| 3.2 | Right actions: LIVE pill (pulsing green dot + "LIVE") → Messages btn (badge) → Bell btn (badge) → User pill (gradient avatar + name + role + chevron) |
| 3.3 | `NotifDropdown.tsx` — header (title + unread count + "Mark all read"), items (icon box + title + body + time + unread dot + optional action btn), footer ("See all →"); reads `NotificationStore`; calls `POST /api/v1/notifications/mark-all-read` |
| 3.4 | `MessagesDropdown.tsx` — header (title + total unread count + **"New message" btn**), items (gradient avatar initials from recipient name + **"{Branch} / {Role}" label uppercase** + last_message body preview + time + unread dot), empty state ("No conversations yet"), footer ("Open inbox →"); reads `MessagesStore.conversations`; **"New message" btn** opens inline user-picker panel (scrollable list of tenant staff from `GET /api/v1/messages/users`, each row: avatar + name + branch/role; click calls `MessagesStore.findOrCreate(recipientId)`); **fallback: `MOCK_CONVERSATIONS` (defined in B3) if B3 not yet complete** — mock shape matches `ConversationSummary` so no rework needed when B3 lands |
| 3.5 | `UserDropdown.tsx` — user info (name + email + role badge), 3-swatch palette picker (Ocean/Forest/Sunrise) updating `data-theme` + cookie, My Profile link, Sign out btn (danger) |
| 3.6 | Click-outside handler: only one dropdown open at a time |

**Files:** `web/src/components/layout/Header.tsx`, `NotifDropdown.tsx`, `MessagesDropdown.tsx`, `UserDropdown.tsx`

**Existing components to replace:** `NotificationBell.tsx` at `components/layout/NotificationBell.tsx` → replaced by `NotifDropdown.tsx`. `UserMenu.tsx` at `components/layout/UserMenu.tsx` → replaced by `UserDropdown.tsx`. `MessagesDropdown` is new (no existing component). `NotificationStore` accessed via `useNotificationStore()` (hook at `context.tsx:82`). `MessagesStore` accessed via `useMessagesStore()` (new hook, created as part of B3).

---

## T4 — Shell: AppShell rewrite
**Depends on: T2, T3.**

| # | Subtask |
|---|---|
| 4.1 | Rewrite `AppShell.tsx` to compose `Sidebar` + `Header` |
| 4.2 | Content area: `marginLeft:256px; paddingTop:72px; paddingRight:20px; paddingBottom:20px; minHeight:100vh; background:var(--cl-bg)` |
| 4.3 | Content inner card: white, `borderRadius:16px`, shadow, `minHeight:calc(100vh - 92px)`, `overflow:hidden` |
| 4.4 | Footer inline below card (centred, 12px muted): "© 2026 ChefLogik Ltd · Terms · Privacy · Contact" |
| 4.5 | Keep impersonation banner (amber strip, `z-index:150`, pushes header down when visible) — preserve logic from `AppShell.tsx:122-140`; `handleEndImpersonation()` at `AppShell.tsx:113-118` (reads `VITE_ADMIN_URL` env var) |
| 4.6 | Keep `useEffect` notification WebSocket subscription from `AppShell.tsx:95-106` in `AppShell.tsx` (**Decision D1 resolved** — subscription stays here; `Header`/`NotifDropdown` are read-only store consumers). In the **same `useEffect`** also call `branchStore.fetchAll()` on mount if `branches.list.length === 0` (**P3 resolved** — guarantees branches are loaded before Sidebar branch popover can be opened). Preserve `notifications.setUnsubscribe()` + cleanup on unmount. |
| 4.7 | Remove: `BranchSwitcher` import, `AppFooter` import, `UserMenu` import, `NotificationBell` import — all replaced by new Sidebar/Header sub-components |

**File:** `web/src/components/layout/AppShell.tsx`

---

## T5 — Login: Full 6-screen flow
**Depends on: T1. B1 must be complete before wiring OTP and lock screens to live endpoints.**

### Screen state machine

```
signin   --[login 200, requires_2fa=true]--> otp-2fa  --[verified]--> /dashboard
signin   --[login 423]--------------------> locked
signin   --[forgot password]--------------> forgot
forgot   --[OTP sent]---------------------> otp-reset --[verified]--> signin (reset_token held in store)
signin   --[first time setup]-------------> onboard   --[done]------> /dashboard
locked   --[back]-------------------------> signin
```

### Subtasks

| # | Subtask |
|---|---|
| 5.1 | Rewrite `LoginPage.tsx` as flow controller managing `screen` state (`'signin' \| 'otp-2fa' \| 'forgot' \| 'otp-reset' \| 'locked' \| 'onboard'`); also holds `resetTenantSlug` string (passed from ForgotPasswordScreen so OTPScreen can call resend without re-asking the user). Shared primitives defined inline (only used here): `BrandPanel`, `Field`, `PrimaryBtn`, `SSORow`, `Divider`, `BackLink`, `SlidePanel` (fade+slide transition), `EyeToggle` |
| 5.2 | `BrandPanel` — left 52% fixed-width panel; `linear-gradient(145deg, #0F2744 0%, #1A3D63 45%, #2A5A8A 80%, #1E4A7A 100%)`; 3 decorative rings (absolute positioned circles with `border: 1px solid rgba(255,255,255,0.12)`); 2 rotated squares (absolute, 28deg + 12deg, opacity 0.3-0.4); centred content: CL logo box (`rgba(255,255,255,0.14)` backdrop-blur) + "ChefLogik" + h1 tagline + body copy + 5-item feature row |
| 5.3 | `SignInScreen.tsx` — SSO row (Google + Microsoft buttons, UI-only, no handler) + `Divider` + email field + password field (eye toggle) + Restaurant ID field (`tenant_slug`) + custom remember-me checkbox + error banner; calls `auth.login(email, password, tenantSlug)`; after call: if `auth.lockedUntil` → `setScreen('locked')`; if `auth.otpChallengeToken` → `setScreen('otp-2fa')` |
| 5.4 | `OTPScreen.tsx` — shared component used for both 2FA and reset modes; props: `mode: '2fa' \| 'reset'`, `emailHint: string`, `tenantSlug: string` (for resend in reset mode); 6 individual `<input type="text" inputMode="numeric" maxLength={1}>` refs; auto-advance on digit, backspace-retreat, paste handler (6-digit paste → auto-submit after 80ms), auto-submit when 6th digit filled; resend countdown 30s (resets on resend click); mode `'2fa'` calls `auth.verifyLoginOtp(code)`; mode `'reset'` calls `auth.verifyResetOtp(code)`; on verify success: 2FA → navigate `/dashboard`; reset → `setScreen('signin')` (user now has `auth.otpResetToken` to pass to a future reset-password step) |
| 5.5 | `ForgotPasswordScreen.tsx` — Work email field + Restaurant ID field (`tenant_slug`) + **CAPTCHA placeholder** (non-functional reCAPTCHA-style widget: bordered box, checkbox, "I'm not a robot" label, grey reCAPTCHA logo — marked `{/* TODO: integrate CAPTCHA provider */}`); "Send reset code" primary btn; calls `auth.requestPasswordReset(email, tenantSlug)`; on success: `setScreen('otp-reset')` |
| 5.6 | `AccountLockedScreen.tsx` — red icon box (56px, `#FEE2E2` bg) + "Account locked" h2 + body text (5 failed attempts + 30-minute suspension); countdown tile (`#FFF5F5` border `#FCA5A5`): reads `auth.lockedUntil` (ISO8601), computes `remainingMs` via `useEffect` 1s interval, formats as `MM:SS`, shows auto-unlock time; "Contact administrator" outline btn + `BackLink` |
| 5.7 | `OnboardingScreen.tsx` — `OnboardProgress` stepper (steps: Account / Restaurant / Team / Done); Step 0: first + last name + email + password (eye toggle) → `POST /api/public/signup` → store token; Step 1: restaurant name + slug + branch count selector (1 / 2–5 / 6–20 / 20+) + cuisine dropdown → `POST /api/v1/onboarding/branch`; Step 2: invite rows (email + role dropdown, + "Add another" dashed btn, max 10) → `POST /api/v1/onboarding/invite-staff` (B5) or "Skip for now" → `POST /api/v1/onboarding/complete`; Done: green check icon + "You're all set!" + "Enter ChefLogik →" btn → navigate `/dashboard` |
| 5.8 | Move `web/src/components/auth/ForgotPasswordPage.tsx` — keep file but replace contents with `<Navigate to="/login" replace />` redirect (do not delete — route is registered in `routeTree.gen.ts`); do full cleanup in T18 |

### File structure

```
web/src/components/auth/
  LoginPage.tsx                     ← flow controller + BrandPanel + all shared primitives
  screens/
    SignInScreen.tsx
    OTPScreen.tsx
    ForgotPasswordScreen.tsx
    AccountLockedScreen.tsx
    OnboardingScreen.tsx
```

### AuthStore changes (implement alongside T5)

New model fields in `AuthStore.ts`:
```typescript
lockedUntil: types.maybeNull(types.string),        // ISO8601 from 423 response
otpChallengeToken: types.maybeNull(types.string),  // held after login or otp/send
otpEmailHint: types.maybeNull(types.string),       // e.g. "j***@domain.com"
otpResetToken: types.maybeNull(types.string),      // short-lived token after reset OTP verified
```

Updated and new flow actions:

| Action | Endpoint | Behaviour |
|---|---|---|
| `login(email, pw, tenantSlug)` *(modified)* | `POST /auth/staff/login` | On 200: set `otpChallengeToken` + `otpEmailHint` (no token yet, `isAuthenticated` stays false). On 423: set `lockedUntil`. On 401: set `error`. |
| `verifyLoginOtp(code)` *(new)* | `POST /auth/staff/otp/verify` mode=`2fa` | On success: receives `{token, user}` → `localStorage.setItem(TOKEN_KEY, token)` (use existing `TOKEN_KEY = 'cl_token'` constant — **not** `'auth_token'`), `api.setToken(token)`, `_applyUser(user)`, clear `otpChallengeToken`. |
| `requestPasswordReset(email, tenantSlug)` *(new)* | `POST /auth/staff/otp/send` | On success: set `otpChallengeToken` + `otpEmailHint`. |
| `verifyResetOtp(code)` *(new)* | `POST /auth/staff/otp/verify` mode=`reset` | On success: set `otpResetToken`, clear `otpChallengeToken`. |
| `resetPassword(email, token, password)` *(new)* | `POST /auth/staff/reset-password` | Uses `otpResetToken` as `token`. Clears `otpResetToken` on success. |
| `inviteStaff(invites)` *(new)* | `POST /onboarding/invite-staff` | Accepts `invites: Array<{email: string, role_slug: string}>`. On success: no state change (fire-and-forget). Called from OnboardingScreen step 2 before navigating to Done. |
| `completeOnboarding()` *(new)* | `POST /onboarding/complete` | Called from OnboardingScreen "Skip for now" path (step 2 skip) and after Done step. |

**Key files:**
- Rewrite: `web/src/components/auth/LoginPage.tsx`
- New: `web/src/components/auth/screens/SignInScreen.tsx`, `OTPScreen.tsx`, `ForgotPasswordScreen.tsx`, `AccountLockedScreen.tsx`, `OnboardingScreen.tsx`
- Modified: `web/src/stores/AuthStore.ts`, `web/src/components/auth/ForgotPasswordPage.tsx` (redirect only)
- Reference routes: `web/src/routes/login.tsx`, `web/src/routes/forgot-password.tsx`

---

## T6 — New /kds top-level route
**Depends on: T4. Completed by T10.**

> **Stub pattern**: T6 creates the route file with an inline placeholder so the route resolves immediately and T2's sidebar link works. T10 replaces the placeholder with the real `KdsScreen` import. This avoids a compile-time circular dependency (T6 Wave 4 cannot import a component built in T10 Wave 5).

| # | Subtask |
|---|---|
| 6.1 | Create `web/src/routes/_authenticated/kds.tsx` — renders an inline stub: `export default function KdsPage() { return <div className="p-6 text-muted-foreground">KDS — loading…</div> }` (T10 replaces this body with `<KdsScreen />`) |
| 6.2 | Update `web/src/routes/_authenticated/inventory/kds.tsx` — replace with redirect to `/kds` |
| 6.3 | Sidebar: Kitchen Display item already points to `/kds` (set in T2) — verify route match |

**Files:** `web/src/routes/_authenticated/kds.tsx`, `web/src/routes/_authenticated/inventory/kds.tsx`

---

## T7 — Global shared UI components
**Depends on: T1.**

**`web/src/components/ui/`**

| # | Component | Spec |
|---|---|---|
| 7.1 | `StatCard.tsx` | Props: `icon`, `value`, `label`, `color` (icon bg hex), `bg` (card bg hex) — icon box (42px, borderRadius 11px) + value (22px bold) + label (12px muted) |
| 7.2 | `PageHeader.tsx` | Props: `title`, `subtitle?`, `actions?` (ReactNode) — flex row: h1 (22px bold) + p (13.5px muted) + right slot |
| 7.3 | `StatusBadge.tsx` | Props: `status` string → coloured pill. Covers: Confirmed/Pending/Cancelled/No-show/Preparing/Ready/Dispatched/Completed/Active/Inactive/Valid/Expiring |
| 7.4 | `ChannelBadge.tsx` | Props: `channel` string → coloured pill. Covers: Dine-in/QR/Online/POS/Phone/Uber Eats/DoorDash |
| 7.5 | `AllergenBadge.tsx` | Props: `allergen` string → red-bordered pill with per-allergen colour from ALLERGEN_COLORS map |
| 7.6 | `FilterBar.tsx` | Props: `options: string[]`, `active: string`, `onChange` — toggle button row; active = `--cl-dark` bg + white; channel filter variant accepts colour override |
| 7.7 | `ConfirmModal.tsx` | Props: `open`, `title`, `body`, `confirmLabel`, `onConfirm`, `onCancel` — fixed overlay + centred white card, Cancel + Confirm buttons |
| 7.8 | `TabBar.tsx` | Props: `tabs: {id, label, badge?}[]`, `active`, `onChange` — underline tabs; active = `--cl-dark` colour + 2px solid border-bottom |
| 7.9 | `SectionHeader.tsx` | Props: `title`, `count?`, `action?` — small h2 + optional count badge + optional right action |

**`web/src/components/shared/`**

| # | Component | Spec |
|---|---|---|
| 7.10 | `KanbanBoard.tsx` | Props: `children` — horizontal-scroll flex row, gap 14px, full-height |
| 7.11 | `KanbanColumn.tsx` | Props: `label`, `count`, `color`, `bg` — column header pill (coloured dot + label + count badge) + scrollable card slot |
| 7.12 | `DataTable.tsx` | Props: `headers: string[]`, `children` — `<table>` with styled `<thead>` (uppercase, 11.5px, muted, 0.06em tracking) + `<tbody>` slot |

---

## T8 — Dashboard screen
**Depends on: T4, T7. Wire live stats to B2 when backend task is done.**

| # | Subtask |
|---|---|
| 8.1 | `DashboardScreen.tsx` — page wrapper `padding:28px`; `PageHeader` (title, date+branch+service subtitle, "New Walk-in" outline btn + "New Reservation" primary btn) |
| 8.2 | `StatsBar.tsx` — 4-col `StatCard` grid: Active Orders, Tables Seated, Walk-in Waitlist, Revenue Today; reads from `DashboardStore.operational` (calls `GET /api/v1/dashboard/operational` from B2); **fallback: mock counts if B2 not yet done** |
| 8.3 | `LiveOrdersFeed.tsx` — section header + pulsing LIVE dot + "View all →" link to `/orders`; order rows: id + `ChannelBadge` + items (truncated) + total + clock timer + `StatusBadge`; reads `OrderStore.activeOrders` (existing view — add `recentOrders` computed slice capped at 10, sorted newest-first, as part of this task if a shorter feed is preferred) |
| 8.4 | `AlertsPanel.tsx` — right column 340px; "Alerts" header + danger count badge; alert cards with left-border (danger=red / warning=amber), icon + title + subtitle + time. **Data source: static mock data for MVP** — define `MOCK_ALERTS: Alert[]` inline (3–4 entries mixing danger/warning types). No backend endpoint or store wiring. Add `// TODO: replace with real alerts endpoint` comment. Interface: `Alert { id: string; severity: 'danger' \| 'warning'; icon: string; title: string; subtitle: string; time: string }` |
| 8.5 | `QuickActions.tsx` — 2×2 grid: Open Table / New Walk-in / View KDS / Floor Plan; hover: border-color → `--cl-primary` |
| 8.6 | Two-col layout: orders feed (flex-1) + alerts+actions (340px fixed right) |
| 8.7 | Update `web/src/routes/_authenticated/dashboard.tsx` |

**Files:** `web/src/components/dashboard/*.tsx`, `web/src/routes/_authenticated/dashboard.tsx`

**Store dependency:** `DashboardStore` created as part of B2. Access via `useDashboardStore()` hook. Existing route at `routes/_authenticated/dashboard.tsx` renders current placeholder — replace component reference here.

---

## T9 — Live Orders screen (Kanban)
**Depends on: T4, T7.**

| # | Subtask |
|---|---|
| 9.1 | `OrdersScreen.tsx` — flex column `height:calc(100vh - 92px)`; `PageHeader` + "New Order" primary btn |
| 9.2 | `ChannelFilter.tsx` — `FilterBar` prefix with "Filter" pill; All + 7 channels; active channel gets its own channel colour (not `--cl-dark`) |
| 9.3 | `OrderCard.tsx` — white card `borderRadius:12px`; red border when `col=preparing && time>15m`; header: id + `ChannelBadge` + clock (red if alert); items dot-list; footer: total + action btn (`OrderStore.advanceStatus`) |
| 9.4 | `OrderKanban.tsx` — `KanbanBoard` with 6 `KanbanColumn` instances; cards from `OrderStore.byStatus` (existing view — **not** `ordersByStatus`); horizontal scroll |
| 9.5 | Update `web/src/routes/_authenticated/orders/index.tsx` |

**Files:** `web/src/components/orders/*.tsx`, `web/src/routes/_authenticated/orders/index.tsx`

---

## T10 — Kitchen Display (KDS) screen
**Depends on: T4, T6, T7.**

| # | Subtask |
|---|---|
| 10.1 | `KdsScreen.tsx` — dark wrapper `#0D1520`, `borderRadius:16px`, `padding:20px`; header: title + LIVE dot + clock + branch/service + "⚠ 86 Alert" btn |
| 10.2 | `KdsStatsStrip.tsx` — 4 dark stat tiles (`#1A2840`): Active Tickets / Avg Time / Overdue >15m (red value) / Completed Today; reads `KdsStore` |
| 10.3 | `KdsTicket.tsx` — bg/border/time-colour all switch by elapsed (normal/≥10m/≥15m); header: id + table·channel + elapsed; divider; items: name + mod (↳) + `AllergenBadge` row in `rgba(255,255,255,0.04)` sub-card; action btn ("Acknowledge" or "✓ Mark Ready" green) |
| 10.4 | `AllergenBanner.tsx` — absolute bottom; red `#7F1D1D` bg, `#EF4444` border; countdown 30s → auto-dismiss; calls `KdsStore.acknowledgeAllergenAlert()` |
| 10.5 | `EightySixOverlay.tsx` — absolute full-screen overlay; red modal card: 🚫 + "86 ALERT" + item name + instruction + "Dismiss Alert" btn; triggered by `KdsStore.active86Event` |
| 10.6 | 3-col grid for tickets |
| 10.7 | Update `web/src/routes/_authenticated/kds.tsx` |

**Files:** `web/src/components/kds/*.tsx`, `web/src/routes/_authenticated/kds.tsx`

---

## T11 — Tables & Reservations screen
**Depends on: T4, T7.**

| # | Subtask |
|---|---|
| 11.1 | `TablesScreen.tsx` — two-panel flex: left (flex-1) + right sidebar (280px); header: title + subtitle (occupied/available counts) + Floor Plan / List View toggle + "Seat Walk-in" btn |
| 11.2 | `StateLegend.tsx` — row of state pills (Available/Occupied/Reserved/Cleaning/Blocked each with dot + count from `TableStore`) |
| 11.3 | `FloorCanvas.tsx` — scrollable `#FAFBFC` area; room label dividers (Main Dining / Bar Area / Private Dining); renders `TableNode` for each table in `TableStore` |
| 11.4 | `TableNode.tsx` — absolute positioned; round or rect based on shape; bg/border from TABLE_STATES; shows id + covers + guest name (truncated); selected: `scale(1.04)` + ring shadow |
| 11.5 | `TableDetailPanel.tsx` — top of right sidebar; table id + covers + state + guest info (name, seated time, bill total); 2×2 action grid (Seat, Clear, Merge [disabled], Split [disabled]) |
| 11.6 | `UpcomingReservations.tsx` — right sidebar section; time + name + covers·table + `StatusBadge`; reads `ReservationStore.upcomingToday` |
| 11.7 | `WalkInWaitlist.tsx` — right sidebar bottom; numbered circles + name + covers + wait time + "Seat" btn. **Endpoint**: `GET /api/v1/branches/{branchId}/waitlist` (already registered; requires `reservations.manage_waitlist` permission). Response fields used: `id`, `guest_name`, `party_size`, `joined_at` (elapsed = now − joined_at), `estimated_wait_minutes`, `status`. "Seat" btn calls `POST /api/v1/branches/{branchId}/waitlist/{id}/seat`. **Add to `ReservationStore`**: `waitlistEntries: types.optional(types.frozen<WaitlistEntry[]>(), [])` + `fetchWaitlist(branchId: string)` flow action (calls the index endpoint, stores result). `WalkInWaitlist` reads `useReservationStore().waitlistEntries`. |
| 11.8 | List view: inline `DataTable` (Guest / Date+Time / Covers / Table / Notes / Deposit / Status / actions) |
| 11.9 | Update `web/src/routes/_authenticated/reservations/index.tsx` |

**Files:** `web/src/components/reservations/TablesScreen.tsx`, `FloorCanvas.tsx`, `TableNode.tsx`, `StateLegend.tsx`, `TableDetailPanel.tsx`, `UpcomingReservations.tsx`, `WalkInWaitlist.tsx`; route index

---

## T12 — Events & Functions screen
**Depends on: T4, T7.**

| # | Subtask |
|---|---|
| 12.1 | `EventsScreen.tsx` — `TabBar` (Events Pipeline / Spaces / Packages / Corporate Accounts); `PageHeader` + "New Event" btn |
| 12.2 | `EventPipeline.tsx` — `KanbanBoard` + `KanbanColumn` ×4 (Enquiry grey / Proposal Sent indigo / Deposit Paid amber / Confirmed green); reads `EventStore.byPipelineStage` (existing view — **not** `eventsByStage`) |
| 12.3 | `EventCard.tsx` — white card: event name + date + guest count + contact + value (bold) + event id (small muted); hover shadow |
| 12.4 | Spaces / Packages / Corporate tabs: stub card "Coming soon" |
| 12.5 | Update `web/src/routes/_authenticated/events/index.tsx` |

**Files:** `web/src/components/events/*.tsx`, route index

---

## T13 — Menu Management screen
**Depends on: T4, T7.**

| # | Subtask |
|---|---|
| 13.1 | `MenuScreen.tsx` — flex column; `PageHeader` + "Add Item" btn; `TabBar` (Master Menu / Branch Overrides / 86 Manager / Platform Sync); "86 Manager" tab badge = count of 86'd items |
| 13.2 | `CategorySidebar.tsx` — 160px left column; category buttons with item count right-aligned; active: `--cl-dark` tinted bg; reads `MenuStore` |
| 13.3 | `MenuItemGrid.tsx` — search input + `auto-fill minmax(210px,1fr)` grid; filtered by category + search; reads `MenuStore.filteredItems` |
| 13.4 | `MenuItemCard.tsx` — 86'd: red-tinted bg + red border + "86'd" overlay badge on striped image placeholder; body: name + price + `AllergenBadge` row + status pill + Edit btn + Restore btn (86'd only) |
| 13.5 | `EightyManager.tsx` — alert banner + list of 86'd items (name + category + allergens + "Restore to Menu" btn); Restore opens `ConfirmModal`; on confirm: calls `MenuService.restore86(itemId)` |
| 13.6 | Platform Sync tab: stub card "Platform Sync — integration pending" |
| 13.7 | Branch Overrides tab: stub card (full feature is separate work) |
| 13.8 | Update `web/src/routes/_authenticated/menu/index.tsx` |

**Files:** `web/src/components/menu/*.tsx`, route index

---

## T14 — Inventory screen
**Depends on: T4, T7.**

| # | Subtask |
|---|---|
| 14.1 | `InventoryScreen.tsx` — `PageHeader` + "Add Item" btn |
| 14.2 | `InventoryStatsBar.tsx` — 4 plain-border stat tiles (not StatCard — no coloured bg): Total SKUs / Low Stock (amber) / Out of Stock (red) / Stock Value; reads `InventoryStore`. **Add these computed views to `InventoryStore.views()` as part of this task:** `totalSKUs` → `self.items.size`; `lowStockCount` → count where `stockStatus === 'below_reorder'`; `outOfStockCount` → count where `stockStatus === 'critical'`; `totalStockValue` → `sum(current_stock * wac)` across all items (display as currency). (`InventoryItemModel.stockStatus` already exists.) |
| 14.3 | `InventoryTable.tsx` — `DataTable` cols: Ingredient / Category / Unit / Current Stock / Par Level / WAC Cost / Status; row bg: red-tinted for `out`, amber-tinted for `low`; name cell appends "AUTO 86" red badge when `out`; stock cell coloured by status; status cell: `StatusBadge` |
| 14.4 | Update `web/src/routes/_authenticated/inventory/index.tsx` |

**Files:** `web/src/components/inventory/InventoryScreen.tsx`, `InventoryStatsBar.tsx`, `InventoryTable.tsx`; route index

---

## T15 — Customers & Loyalty screen
**Depends on: T4, T7.**

| # | Subtask |
|---|---|
| 15.1 | `CustomersScreen.tsx` — `PageHeader` + "Add Customer" btn |
| 15.2 | `CustomersStatsBar.tsx` — 3-col plain-border stat tiles: Total Customers / Active Loyalty Members / Avg Points Balance; reads `CustomerStore`. **Add these computed views to `CustomerStore.views()` as part of this task:** `totalCustomers` → `self.customers.size`; `activeLoyaltyMembers` → count where `customer.tenant_profile != null` (tenant_profile is set when customer has been enrolled in this tenant's loyalty programme); `avgPointsBalance` → average of `(tenant_profile as CustomerTenantProfile).loyalty_points` across enrolled customers (0 if none). Import `CustomerTenantProfile` from `@/types/customers`. |
| 15.3 | `CustomersTable.tsx` — `DataTable` cols: Customer (gradient avatar initials + name) / Email / Loyalty Tier (`StatusBadge` variant: 🥇 Gold / 🥈 Silver / 🥉 Bronze) / Points / Visits / Last Visit; hover row tint |
| 15.4 | Update `web/src/routes/_authenticated/customers/index.tsx` |

**Files:** `web/src/components/customers/*.tsx`, route index

---

## T16 — Staff Management screen
**Depends on: T4, T7.**

| # | Subtask |
|---|---|
| 16.1 | `StaffScreen.tsx` — master-detail flex: left panel `width: selected ? 400px : 100%` with `transition:width 0.2s`; right: `StaffProfilePanel` when row selected |
| 16.2 | Left header: `PageHeader` (active count + doc warning count, "Add Staff" btn) + `FilterBar` (All / Active / Inactive) |
| 16.3 | `StaffTable.tsx` — `DataTable` cols: Staff Member (avatar + name) / Role (badge from ROLE_COLORS) / Branch / Status badge / Docs (⚠ amber or ✓ green) / chevron; row click selects; selected row gets `--cl-dark` tinted bg; hover uses inline opacity (fixes `t.hover` design bug) |
| 16.4 | `StaffProfilePanel.tsx` — right panel: avatar (56px gradient) + name + role badge + X close btn; `TabBar` (Profile / Documents / Permissions) |
| 16.5 | Profile tab: 2×2 info tiles (Branch / Status / Joined / Email) — `#FAFAFA` bordered tiles |
| 16.6 | `DocumentList.tsx` — items: clipboard icon + name + expiry + `StatusBadge` (Valid/Expiring) + Upload btn; expiring row: amber bg + amber border; "Add Document" dashed btn |
| 16.7 | `PermissionsPanel.tsx` — list of permission rows: label + visual toggle switch (read-only display — permissions are role-driven); green=granted, grey=not granted. **Data derivation**: (1) call `staffStore.fetchAssignments(staffId)` (already done for role tab) — `getAssignmentsFor(staffId)` returns `RoleAssignment[]` each with `role.permissions: string[]`; (2) call `staffStore.fetchAllPermissions()` — `allPermissions: PermissionsGrouped` gives the full catalogue grouped by module; (3) build `grantedSlugs = new Set(assignments.flatMap(a => a.role?.permissions ?? []))`; (4) render `allPermissions` grouped by module, each entry showing the permission label + read-only toggle (`grantedSlugs.has(slug)`). No additional API call needed beyond `fetchAssignments` + `fetchAllPermissions` (both already exist on `StaffStore`). |
| 16.8 | Update `web/src/routes/_authenticated/staff/index.tsx` |

**Files:** `web/src/components/staff/*.tsx`, route index

---

## T17 — Analytics & Reports screen
**Depends on: T4, T7.**

| # | Subtask |
|---|---|
| 17.1 | `AnalyticsScreen.tsx` — scrollable `height:calc(100vh - 92px)`; `PageHeader` + range toggle (1M/3M/6M/1Y) + "Export" outline btn |
| 17.2 | `KpiCards.tsx` — 3-col: Total Revenue / Total Covers / Avg Spend per Cover; each: label + value (28px bold) + delta (↑/↓ % green/red); reads `AnalyticsStore` (calls `GET /api/v1/analytics/branch-dashboard`) |
| 17.3 | `RevenueChart.tsx` — pure SVG `viewBox="0 0 100 {h}" preserveAspectRatio="none"`; `<linearGradient>` fill (colour at 15% → transparent) + `<polygon>` fill + `<polyline>` stroke; month labels row below |
| 17.4 | `ChannelDonut.tsx` — SVG donut `r=38 cx=50 cy=50 strokeWidth=18`; grey bg circle + coloured stroke-dasharray segments with cumulative rotation; "Orders" centre text; legend list beside |
| 17.5 | `TopDishes.tsx` — ranked list: # + name + revenue + progress bar (5px, gradient `--cl-primary`→`--cl-dark` at `pct%`); reads `AnalyticsStore` |
| 17.6 | `RfmSegments.tsx` — 2×2 grid of segment cards: value + label + description + delta; reads `AnalyticsStore` (calls `GET /api/v1/analytics/customer-dashboard` — confirmed registered); response field `segment_breakdown` provides per-segment `{ rfm_segment, count, avg_clv }` array; gate: `analytics.customer_dashboard` permission |
| 17.7 | `StaffPerformance.tsx` — list: gradient avatar + name + role + covers + ★ rating + revenue; mock data (no per-staff analytics endpoint yet) |
| 17.8 | Update `web/src/routes/_authenticated/analytics/index.tsx` |

**Files:** `web/src/components/analytics/*.tsx`, route index

---

## T18 — Asset cleanup
**Depends on: T4, T5, T8–T17 (all screens complete).**

| # | Subtask |
|---|---|
| 18.1 | Delete `web/src/assets/hero.png` |
| 18.2 | Delete `web/src/assets/vite.svg` |
| 18.3 | Delete or clear `web/public/login-bg.png` (login uses CSS gradient now) — remove all references; currently referenced at `LoginPage.tsx:34` |
| 18.4 | Delete `web/src/components/layout/UserMenu.tsx` — replaced by `UserDropdown.tsx` |
| 18.5 | Delete `web/src/components/layout/BranchSwitcher.tsx` — integrated into `Sidebar.tsx` |
| 18.6 | Delete `web/src/components/layout/AppFooter.tsx` — inline in AppShell |
| 18.7 | Delete `web/src/components/auth/ForgotPasswordPage.tsx` — folded into `LoginPage.tsx` |
| 18.8 | Delete `web/src/components/layout/NotificationBell.tsx` — replaced by `NotifDropdown.tsx` in T3 |
| 18.9 | Update `web/src/routes/forgot-password.tsx` — replace with redirect to `/login` (route still registered in `routeTree.gen.ts`; do not delete) |
| 18.10 | Run `npm run lint` — verify no broken imports |
| 18.11 | Run `npm run test` — verify no regressions |

---

## Verification

1. `npm run dev` in /web — visually compare each screen against UI/*.jsx
2. `npm run lint` — zero TypeScript errors
3. `npm run test` — existing tests pass
4. `php artisan test` in /api — all backend tests pass including new B1–B5 tests
5. Theme switch (Ocean/Forest/Sunrise) updates sidebar + header colours
6. Cookie value `sunrise` read back correctly after rename
7. KDS dark bg `#0D1520` independent of theme
8. Login: all 6 screens reachable; OTP send → verify flow works end-to-end (B1)
9. Dashboard stat cards show live counts from `GET /api/v1/dashboard/operational` (B2)
10. Messages dropdown shows channel list from API, unread badge updates on new message (B3)
11. Notifications dropdown pulls from API; mark-all-read clears badge (B4)
12. Onboarding wizard: all 3 steps complete; "Skip for now" on step 2 works (B5)
