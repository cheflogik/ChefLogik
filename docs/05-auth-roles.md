# Auth, Roles & Permissions

## Three Auth Guards

Laravel Sanctum is configured with three separate guards. Each guard has its own token table scope, its own middleware, and its own permission resolution logic.

```php
// config/auth.php
'guards' => [
    'staff' => [
        'driver' => 'sanctum',
        'provider' => 'users',        // users table (staff)
    ],
    'customer' => [
        'driver' => 'sanctum',
        'provider' => 'customers',    // customer_profiles table
    ],
    'platform' => [
        'driver' => 'sanctum',
        'provider' => 'platform_admins',
    ],
],
```

| Guard | Who uses it | Tenant scoped? | Permissions |
|---|---|---|---|
| `staff` | Restaurant staff and managers | Yes — tenant_id from token | Role-based dynamic permissions |
| `customer` | Restaurant customers (loyalty portal) | Yes — tenant_id from token | Fixed: view own profile, manage own data |
| `platform` | SaaS operator (us) | No — bypasses tenant scoping | Full platform access |

---

## JWT / Token Claims

Sanctum tokens carry custom abilities. On login, the system generates a token with these abilities encoded:

```json
{
  "user_id": "uuid",
  "user_type": "staff",
  "tenant_id": "uuid",
  "role_id": "uuid",
  "role_slug": "branch_manager",
  "branch_ids": ["uuid1", "uuid2"],   // "all" for Owner scope
  "permissions": [
    "orders.view",
    "orders.create",
    "orders.cancel",
    "menu.view",
    "menu.86_item",
    "reservations.view",
    "reservations.create"
    // ... resolved from role_permissions at login time
  ]
}
```

The `permissions` array is the resolved, flat list of all permission slugs this user currently has. It is cached in Redis (`perms:{tenant_id}:{user_id}`, TTL 5 minutes) and used on every request. If a role changes, the cache key is invalidated immediately — the user's next request gets fresh permissions.

---

## TenantMiddleware

Runs on every `/api/v1/` request. Must run before any business logic.

```php
class TenantMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (!$user || !$user->tenant_id) {
            abort(401);
        }

        // Set tenant context for the entire request lifecycle
        // Manual TenantScope (no stancl/tenancy — Decision 1)
        app()->instance('current_tenant_id', $user->tenant_id);

        // Make tenant_id and branch_ids available throughout
        $request->merge([
            'resolved_tenant_id' => $user->tenant_id,
            'resolved_branch_ids' => $user->branch_ids,
        ]);

        return $next($request);
    }
}
```

---

## Permission System

### Permission slugs (defined in config/permissions.php)

All permission slugs are constants defined in code. They never change. What changes is which roles are granted which slugs — that lives in the database.

```php
// config/permissions.php
return [
    // Orders module
    'orders.view'           => 'View orders and live dashboard',
    'orders.create'         => 'Place and confirm orders',
    'orders.modify'         => 'Modify orders before preparation',
    'orders.modify_post_prep' => 'Modify orders after preparation (manager override)',
    'orders.cancel'         => 'Cancel orders',
    'orders.refund'         => 'Process refunds',
    'orders.view_payment'   => 'View payment details',
    'orders.manage_disputes' => 'Manage delivery platform disputes',
    'orders.pause_platforms' => 'Pause delivery platform acceptance',

    // Menu module
    'menu.view'             => 'View menu items and categories',
    'menu.edit_master'      => 'Create and edit master menu items',
    'menu.delete_master'    => 'Delete master menu items',
    'menu.edit_allergens'   => 'Edit allergen and dietary flags (owner only)',
    'menu.branch_override'  => 'Create branch-level price and availability overrides',
    'menu.86_item'          => 'Mark items as 86d',
    'menu.restore_item'     => 'Restore 86d items',
    'menu.sync_platforms'   => 'Trigger platform menu sync',
    'menu.view_costs'       => 'View cost prices and margins',

    // Reservations module
    'reservations.view'     => 'View floor plan and reservations',
    'reservations.create'   => 'Create and edit reservations',
    'reservations.cancel'   => 'Cancel reservations',
    'reservations.seat'     => 'Seat guests and manage table states',
    'reservations.manage_waitlist' => 'Manage waitlist',
    'reservations.edit_floor_plan' => 'Edit floor plan layout',
    'reservations.block_tables' => 'Block and unblock tables',

    // Events module
    'events.view'           => 'View event enquiries and bookings',
    'events.manage'         => 'Create and edit enquiries, proposals, bookings',
    'events.view_financials' => 'View event financial details',
    'events.manage_packages' => 'Create and manage event packages',
    'events.create_menus'   => 'Create and edit event menus',
    'events.issue_credits'  => 'Issue goodwill credits',
    'events.manage_corporate' => 'Manage corporate accounts',

    // Inventory module
    'inventory.view_stock'  => 'View stock levels and movements',
    'inventory.edit_items'  => 'Create and edit inventory items',
    'inventory.edit_recipes' => 'Create and edit recipes',
    'inventory.log_waste'   => 'Log waste events',
    'inventory.create_po'   => 'Create purchase orders',
    'inventory.receive_grn' => 'Receive goods (GRN)',
    'inventory.conduct_stocktake' => 'Conduct stocktakes',
    'inventory.view_costs'  => 'View cost prices and food cost %',
    'inventory.view_cogs'   => 'View COGS reports',
    'inventory.configure_alerts' => 'Configure stock alert thresholds',

    // Staff module
    'staff.view_own_branch' => 'View staff at own branch',
    'staff.view_all'        => 'View staff across all branches',
    'staff.manage'          => 'Add, edit, offboard staff',
    'staff.manage_schedules' => 'Create and publish schedules',
    'staff.view_attendance' => 'View attendance records',
    'staff.view_individual_performance' => 'View individual staff performance',
    'staff.manage_roles'    => 'Create and edit custom roles',
    'staff.manage_leave'    => 'Approve and manage leave requests',
    'staff.view_labour_costs' => 'View labour cost analytics',

    // Customer & Loyalty module
    'customers.view_basic'  => 'View customer name, tier, dietary at check-in',
    'customers.view_full'   => 'View full customer profile and history',
    'customers.edit'        => 'Edit customer profiles',
    'customers.merge'       => 'Merge duplicate profiles',
    'customers.adjust_points' => 'Manually adjust loyalty points',
    'customers.manage_campaigns' => 'Create and send loyalty campaigns',
    'customers.gdpr'        => 'Process GDPR data requests',
    'customers.view_analytics' => 'View customer analytics',

    // Analytics module
    'analytics.owner_dashboard'   => 'View owner cross-branch dashboard',
    'analytics.branch_dashboard'  => 'View branch manager dashboard',
    'analytics.kitchen_dashboard' => 'View kitchen dashboard',
    'analytics.events_dashboard'  => 'View events dashboard',
    'analytics.customer_dashboard' => 'View customer analytics dashboard',
    'analytics.revenue_all'       => 'View revenue reports across all branches',
    'analytics.revenue_branch'    => 'View revenue reports for own branch',
    'analytics.dish_analytics'    => 'View dish and menu analytics',
    'analytics.inventory_analytics' => 'View inventory and cost analytics',
    'analytics.staff_aggregate'   => 'View aggregate staff performance',
    'analytics.staff_individual'  => 'View individual staff performance',
    'analytics.export'            => 'Export reports',
    'analytics.custom_reports'    => 'Create custom reports',
    'analytics.configure_alerts'  => 'Configure metric alert thresholds',
    'analytics.tax_reports'       => 'View tax and VAT reports',
    'analytics.period_close'      => 'Run financial period close',
    'analytics.audit_log'         => 'View audit log',

    // KDS
    'kds.view'              => 'View KDS tickets',
    'kds.mark_prepared'     => 'Mark items as prepared on KDS',
    'kds.acknowledge_allergen' => 'Acknowledge allergen alerts on KDS',
];
```

### Checking permissions in Laravel

```php
// In Form Requests (preferred — validates before controller runs)
public function authorize(): bool
{
    return $this->user()->can('orders.cancel');
}

// In Controllers (for complex conditional logic)
$this->authorize('orders.cancel');         // Throws 403 if not permitted
Gate::check('orders.cancel');              // Returns bool

// In Policies
class OrderPolicy
{
    public function cancel(User $user, Order $order): bool
    {
        return $user->can('orders.cancel')
            && $order->tenant_id === $user->tenant_id;  // Always check tenant
    }
}

// WRONG — never check role name directly
if ($user->role === 'branch_manager') { ... }  // ❌

// CORRECT — always check permission slug
if ($user->can('orders.cancel')) { ... }       // ✅
```

### Permission resolution and caching

```php
// On login — build and cache the permission list
class AuthService
{
    public function buildPermissionList(User $user): array
    {
        return cache()->remember(
            "perms:{$user->tenant_id}:{$user->id}",
            now()->addMinutes(5),
            fn() => $user->role->permissions()->pluck('slug')->toArray()
        );
    }
}

// On role change — invalidate immediately
class RoleService
{
    public function assignRole(User $user, Role $role): void
    {
        DB::transaction(function() use ($user, $role) {
            $user->roles()->sync([$role->id]);
            cache()->forget("perms:{$user->tenant_id}:{$user->id}");
        });
    }
}

// Gate registration (AppServiceProvider)
Gate::before(function (User $user, string $ability) {
    $permissions = cache()->get("perms:{$user->tenant_id}:{$user->id}", []);
    return in_array($ability, $permissions, true) ?: null;
});
```

---

## System Roles — Default Permissions

System roles are seeded once and are immutable (is_system = true). Custom roles inherit from these as a starting point.

| System Role | Key permissions granted |
|---|---|
| `platform_admin` | All — bypasses tenant gate entirely |
| `owner` | All permissions within their tenant (including `owners.manage`) |
| `branch_manager` | All permissions scoped to their branch **except `owners.manage`** — branch managers cannot create co-owners |
| `events_manager` | events.*, reservations.*, customers.view_basic, analytics.events_dashboard |
| `head_chef` | inventory.*, menu.view, menu.86_item, kds.*, analytics.kitchen_dashboard |
| `chef_de_partie` | inventory.view_stock, inventory.log_waste, inventory.receive_grn, menu.view, kds.* |
| `waiter` | orders.view, orders.create, orders.modify, reservations.view, reservations.seat, customers.view_basic |
| `host` | reservations.view, reservations.create, reservations.cancel, reservations.seat, reservations.manage_waitlist, customers.view_basic |
| `kitchen_porter` | inventory.log_waste, inventory.receive_grn, kds.view, kds.mark_prepared |

---

## Dynamic Role Builder

Owner and Branch Manager can create custom roles via the `/api/v1/staff/roles` endpoints.

```
GET    /api/v1/staff/roles                   → list tenant's roles
POST   /api/v1/staff/roles                   → create custom role
GET    /api/v1/staff/roles/{id}
PATCH  /api/v1/staff/roles/{id}              → edit custom role (not system roles)
DELETE /api/v1/staff/roles/{id}              → delete (only if no users assigned)
GET    /api/v1/staff/permissions             → list all available permission slugs (grouped by module)
```

Rules:
- Only roles with `is_system = false` can be edited or deleted
- Cannot delete a role that has active users assigned to it
- Custom roles are scoped to the tenant — one tenant cannot see another's custom roles
- The permissions list endpoint returns the full slug list from `config/permissions.php`, grouped by module, with their human-readable labels

---

## Branch Scoping Within a Role

A staff member's access is scoped at two levels:
1. **Permission level** — what actions they can perform
2. **Branch level** — which branch's data they can access

```php
// user_roles.branch_ids:
// NULL array → all branches (Owner)
// ["uuid1", "uuid2"] → specific branches only

// The TenantMiddleware checks branch access:
public function canAccessBranch(Request $request): bool
{
    $branchId = $request->header('X-Branch-Id');
    $allowed = $request->user()->branch_ids;

    if ($allowed === null) return true;  // Owner — all branches
    return in_array($branchId, $allowed, true);
}
```

---

## Leave Management Authorization

Leave requests use a two-tier access model. Any authenticated staff member can apply; only holders of `staff.manage_leave` can approve or reject.

### Endpoints

```
GET    /api/v1/staff/leave                           → list requests (own or all, see below)
POST   /api/v1/staff/leave                           → apply for leave
PATCH  /api/v1/staff/leave/{leaveRequest}/approve    → approve a pending request
PATCH  /api/v1/staff/leave/{leaveRequest}/reject     → reject a pending request
PATCH  /api/v1/staff/leave/{leaveRequest}/cancel     → cancel own pending or approved request
```

### Authorization rules

| Action | Who may perform it | Backend guard |
|---|---|---|
| Apply for leave | Any authenticated staff member | `StoreLeaveRequest::authorize()` — non-null actor |
| View all leave (team view) | Holders of `staff.manage_leave` | `LeaveController::index` — `$canManage` flag; non-managers receive their own records only |
| Approve | `staff.manage_leave` | `$this->authorize('staff.manage_leave')` |
| Reject | `staff.manage_leave` | `$this->authorize('staff.manage_leave')` |
| Cancel | The request owner only | `LeaveService::cancel` — enforced by `user_id === actor->id` check |

**System roles with `staff.manage_leave`:** `owner`, `branch_manager`.  
All other system roles (`waiter`, `host`, `head_chef`, etc.) can only apply and cancel their own requests.

### Leave status lifecycle

```
pending → approved   (manager approves)
pending → rejected   (manager rejects)
pending → cancelled  (staff member cancels before decision)
approved → cancelled (staff member cancels after approval)
```

Rejected and cancelled requests are terminal — they cannot transition to any other state.

### Data model

`leave_requests` table:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `tenant_id` | uuid | FK tenants — tenant scoped via `HasTenantScope` |
| `user_id` | uuid | FK users — the staff member applying |
| `branch_id` | uuid | FK branches — branch the staff member works at |
| `leave_type` | varchar(20) | `annual` \| `sick` \| `unpaid` \| `other` |
| `start_date` | date | |
| `end_date` | date | must be ≥ start_date |
| `reason` | text | nullable |
| `status` | varchar(20) | `pending` \| `approved` \| `rejected` \| `cancelled` |
| `reviewed_by` | uuid | nullable FK users — the manager who decided |
| `reviewed_at` | timestamp | nullable — set on approve/reject |
| `notes` | text | nullable — reviewer's note |

### Frontend

- `staff/leave/index.tsx` — two tabs: **My Leave** (all staff) and **Team Leave** (managers only, gated by `staff.manage_leave`)
- Apply for Leave form: `leave_type` select, `start_date`, `end_date`, optional `reason`
- Manager review panel: inline Approve / Reject buttons with optional note field
- Status filter chips: All / Pending / Approved / Rejected / Cancelled
- `useLeaveStore()` from `stores/context.tsx` — MST store with `fetchLeave`, `applyLeave`, `approveLeave`, `rejectLeave`, `cancelLeave` actions
