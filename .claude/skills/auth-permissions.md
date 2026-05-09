# Skill: Auth Guards & Permission Checking

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
