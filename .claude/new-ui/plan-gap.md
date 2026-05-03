# Plan Gap Tracker

Gaps identified during review of `.claude/new-ui/plan.md`. Each item has a status and the plan location it affects.

---

## Critical Correctness Issues

| # | Status | Gap | Plan location |
|---|---|---|---|
| C1 | ✅ Fixed | Hook naming: plan used `useAuthStore()` / `authStore.` but the correct hook is `useAuth()` (exported from `context.tsx`). Fixed in T2 §2.6 and B5.5. | T2 §2.6, B5.5 |
| C2 | ✅ Fixed | localStorage key: `verifyLoginOtp` action said `localStorage.setItem` without specifying the key. Fixed to use existing `TOKEN_KEY = 'cl_token'` constant — not `'auth_token'`. | T5 AuthStore changes table |
| C3 | ✅ Fixed | Wrong computed view names would cause TypeScript compile errors: `OrderStore.recentOrders` → `activeOrders`; `OrderStore.ordersByStatus` → `byStatus`; `EventStore.eventsByStage` → `byPipelineStage`. | T8 §8.3, T9 §9.4, T12 §12.2 |
| C4 | ✅ Fixed | T6 circular dependency: Wave 4 route file imported `KdsScreen` which is built in Wave 5 (T10). Fixed: T6 now creates an inline stub; T10 replaces it with the real component. Wave diagram updated. | T6, Wave diagram |

---

## Missing Task Scope

| # | Status | Gap | Plan location |
|---|---|---|---|
| M1 | ✅ Fixed | `inviteStaff` action added to AuthStore changes table in T5. Signature: `inviteStaff(invites: Array<{email, role_slug}>)` → `POST /onboarding/invite-staff`; fire-and-forget (no state change). | T5 AuthStore changes table |
| M2 | ✅ Fixed | Added computed view specs to T14 §14.2: `totalSKUs` (items.size), `lowStockCount` (stockStatus==='below_reorder'), `outOfStockCount` (stockStatus==='critical'), `totalStockValue` (sum current_stock×wac). Implemented as part of T14 using existing `InventoryItemModel.stockStatus`. | T14 §14.2 |
| M3 | ✅ Fixed | Added computed view specs to T15 §15.2: `totalCustomers` (customers.size), `activeLoyaltyMembers` (count where tenant_profile≠null), `avgPointsBalance` (avg loyalty_points of enrolled customers). Uses `CustomerTenantProfile` type from `@/types/customers`. | T15 §15.2 |
| M4 | ✅ Fixed | Resolved as **static mock data for MVP**. `AlertsPanel` defines `MOCK_ALERTS: Alert[]` inline (3–4 entries). Interface documented. `// TODO: replace with real alerts endpoint` comment. No backend task needed. | T8 §8.4 |
| M5 | ✅ Fixed | Endpoint confirmed: `GET /api/v1/branches/{branchId}/waitlist` (already registered in api.php, `WaitlistController.index()`, requires `reservations.manage_waitlist`). Response fields documented. Added `waitlistEntries` + `fetchWaitlist(branchId)` spec to `ReservationStore`. Seat action: `POST /api/v1/branches/{branchId}/waitlist/{id}/seat`. | T11 §11.7 |
| M6 | ✅ Fixed | `PermissionsPanel` data derivation documented: uses existing `staffStore.fetchAssignments(staffId)` + `staffStore.fetchAllPermissions()` (both already on `StaffStore`). Derive `grantedSlugs` from `assignments.flatMap(a => a.role?.permissions ?? [])`. No new API call needed. | T16 §16.7 |
| M7 | ✅ Fixed | Added B5.7 to B5 subtask list: create stub `app/Jobs/Staff/StaffInvitedNotification.php` (ShouldQueue, queue='low', handle() is TODO Decision 9 comment). Resolves missing-class error in `OnboardingService::inviteStaff()`. | B5.3, B5.7 |

---

## Unresolved Decisions

| # | Status | Gap | Plan location |
|---|---|---|---|
| D1 | ✅ Resolved | WebSocket subscription stays in `AppShell.tsx`. `Header` and `NotifDropdown` are read-only consumers of `NotificationStore`. Decision recorded in B4.6 and T4 §4.6. | B4.6, T4 §4.6 |
| D2 | ⚠ Obstacle | Shifts / Attendance / Branches / Roles screens: sidebar lists these nav items (T2 §2.3) but no screen tasks exist for them (T8–T17 don't cover them). **Marked as implementation obstacle in T2 §2.3.** Nav items link to existing routes but behaviour when clicked (existing page, coming-soon stub, or new task) requires further clarification before T2 is finalised. | T2 §2.3 |

---

## Architecture / Data Integrity Gaps

| # | Status | Gap | Plan location |
|---|---|---|---|
| A1 | ✅ Resolved | `message_reads` includes `tenant_id`. `HasTenantScope` applies directly — no join-based tenant scoping needed. Added to B3.4 migration spec. | B3 §B3.4 |
| A2 | ✅ Resolved | Architecture redesigned: all messages are DMs between two users within the same tenant. No system channels (Kitchen/Managers/FOH) — these were dropped. No seeder. The UI "channel" label is the recipient's Branch + Role (derived display label). Conversations created on demand via `POST /api/v1/messages/conversations/find-or-create`. Reverb broadcast is per-conversation (`private-messages.{conversationId}`). B3 fully rewritten to reflect this. T3 §3.4 updated to show conversation list + user picker for new DM. | B3 (full rewrite), T3 §3.4 |

---

## Minor / Precision Issues

| # | Status | Gap | Plan location |
|---|---|---|---|
| P1 | ✅ Resolved | `GET /api/v1/analytics/customer-dashboard` confirmed registered (`DashboardController::customerDashboard`, gate `analytics.customer_dashboard`). Returns `segment_breakdown` array used by `RfmSegments`. Also corrected wrong URL format in B2 "What exists" and T17 §17.2/17.6 — plan had `/analytics/dashboard/branch` but real routes are `/analytics/branch-dashboard`, `/analytics/customer-dashboard`. | B2 "What exists", T17 §17.2, T17 §17.6 |
| P2 | ✅ Resolved | Mock data shape defined in B3 as `ConversationSummary` interface + `MOCK_CONVERSATIONS` constant. Shape matches `ConversationResource` exactly — no component rework needed when B3 lands. | B3 (mock data section), T3 §3.4 |
| P3 | ✅ Resolved | `AppShell` calls `branchStore.fetchAll()` on mount inside the same `useEffect` as the WS subscription (T4 §4.6), guarded by `branches.list.length === 0`. `BranchStore.isLoading` and `list` view are already present. T2 §2.5 updated: Sidebar reads `useBranchStore().list` — branches are guaranteed loaded before the popover can be opened. | T2 §2.5, T4 §4.6 |
| P4 | ✅ Resolved | `StaffPerformance` mock data already documented in plan (T17 §17.7) and already present in Backend Gaps table ("Staff Performance analytics — no per-staff metric aggregation — T17: mock data; deferred"). `GET /api/v1/analytics/staff` exists but is a report export (`ReportController`), not per-staff dashboard metrics. Gap was already correctly captured; gap tracker entry was a false alarm. | T17 §17.7, Backend Gaps table |
