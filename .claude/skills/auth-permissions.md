# Skill: Auth Guards & Permission Checking

## Staff Login — Two-Step OTP/2FA Flow

Login is **always two steps**. No endpoint issues a token directly from credentials.

```
Step 1 — credentials → challenge
POST /api/v1/auth/staff/login
Body: { email, password, tenant_slug }   ← tenant_slug NOT tenant_id
Response: { challenge_token, email_hint }
  → OTP emailed to the staff member (6-digit code, 10 min TTL, max 5 attempts)

Step 2 — OTP → token
POST /api/v1/auth/staff/otp/verify
Body: { challenge_token, code, mode: "2fa" }
Response: { token, expires_at, user: { id, name, email, tenant_id, role_slug, branch_ids, permissions } }
```

The `StaffOtpService` stores the challenge in Redis: key `staff_otp:{challengeToken}`.
The OTP hash (SHA-256) is compared — never stored in plain text.
Brute-force guard: after 5 failed attempts the challenge entry is deleted and the user must log in again.

### Password Reset via OTP
```
Step 1 — request OTP
POST /api/v1/auth/staff/otp/send
Body: { email, tenant_slug }
Response: { challenge_token, email_hint }   ← always 200 to prevent enumeration

Step 2 — verify OTP
POST /api/v1/auth/staff/otp/verify
Body: { challenge_token, code, mode: "reset" }
Response: { reset_token }   ← short-lived (10 min, Redis key staff_reset_token:{uuid})

Step 3 — set new password
POST /api/v1/auth/staff/password/reset
Body: { email, token, password, password_confirmation }
```

### Other Auth Endpoints
```
GET  /api/v1/auth/staff/me      ← return user profile + permissions from current token
POST /api/v1/auth/staff/refresh ← refresh token (re-reads permissions from DB, returns new token)
POST /api/v1/auth/staff/logout  ← revoke current token
```

### Frontend AuthStore Login Flow
```typescript
// Step 1: credentials
const { challenge_token, email_hint } = await auth.startLogin(email, password, tenantSlug)
// Step 2: show OTP input, then:
await auth.verifyOtp(challenge_token, otpCode)
// verifyOtp() calls POST /auth/staff/otp/verify with mode='2fa'
// On success: stores token, applies user to MST model
```

---

## Three Guards — Which One to Use
```php
// In routes/api.php
Route::middleware(['auth:staff', 'tenant', 'permission:orders.view'])
    ->group(function () { ... });

Route::middleware(['auth:customer', 'tenant'])
    ->prefix('customer')
    ->group(function () { ... });

Route::middleware(['auth:platform'])
    ->prefix('/api/platform')
    ->group(function () { ... });
```

## Checking Permissions — Always Use Slugs
```php
// ✅ Correct
$this->authorize('orders.cancel');
Gate::check('orders.cancel');
$user->can('orders.cancel');

// In Form Requests (preferred — runs before controller)
public function authorize(): bool {
    return $this->user()->can('orders.cancel');
}

// ❌ WRONG — never check role name
if ($user->role_slug === 'branch_manager') { ... }
```

## Permission Cache Pattern
```php
// Permissions are cached per user per tenant (5 min TTL)
// Key: "perms:{tenant_id}:{user_id}"
// Never query role_permissions on every request

// Invalidate on role change:
cache()->forget("perms:{$user->tenant_id}:{$user->id}");

// Gate is registered in AppServiceProvider:
Gate::before(function (User $user, string $ability) {
    $permissions = cache()->remember(
        "perms:{$user->tenant_id}:{$user->id}",
        300,
        fn() => $user->activeRole->permissions()->pluck('slug')->toArray()
    );
    return in_array($ability, $permissions, true) ?: null;
});
```

## All Permission Slugs (grouped by module)
See config/permissions.php for the canonical list. Key ones:
- orders.*: view, create, modify, modify_post_prep, cancel, refund, view_payment, manage_disputes, pause_platforms
- menu.*: view, edit_master, delete_master, edit_allergens, branch_override, 86_item, restore_item, sync_platforms, view_costs
- reservations.*: view, create, cancel, seat, manage_waitlist, edit_floor_plan, block_tables
- events.*: view, manage, view_financials, manage_packages, create_menus, issue_credits, manage_corporate
- inventory.*: view_stock, edit_items, edit_recipes, log_waste, create_po, receive_grn, conduct_stocktake, view_costs, view_cogs, configure_alerts
- staff.*: view_own_branch, view_all, manage, manage_schedules, view_attendance, view_individual_performance, manage_roles, manage_leave, view_labour_costs
- customers.*: view_basic, view_full, edit, merge, adjust_points, manage_campaigns, gdpr, view_analytics
- analytics.*: owner_dashboard, branch_dashboard, kitchen_dashboard, events_dashboard, customer_dashboard, revenue_all, revenue_branch, dish_analytics, export, custom_reports, configure_alerts, tax_reports, period_close, audit_log
- kds.*: view, mark_prepared, acknowledge_allergen
- messaging.*: access
- settings.*: edit_tenant, edit_branch, edit_notifications

## Dynamic Role Builder
```php
// List available permissions (grouped by module)
GET /api/v1/staff/permissions
// Returns: { orders: [{slug, label}, ...], menu: [...], ... }

// Create custom role
POST /api/v1/staff/roles
// Body: { name, description, permission_slugs: ['orders.view', 'menu.view'] }

// Validation: permission_slugs must exist in config/permissions.php
// Cannot create roles with permissions the creator doesn't themselves have (privilege escalation prevention)
```
