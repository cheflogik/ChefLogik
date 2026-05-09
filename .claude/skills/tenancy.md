# Skill: Multi-Tenant Data Isolation

## The Most Important Rule
Every Eloquent model that holds tenant data MUST have the TenantScope global scope. No exceptions.

## Applying TenantScope to a Model
```php
class Order extends Model
{
    use HasTenantScope;  // Trait applies the global scope automatically

    protected $casts = [
        'status' => OrderStatus::class,
        'source' => OrderSource::class,
        'items'  => 'array',
    ];
}

// The trait
trait HasTenantScope
{
    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope());
        static::creating(function (Model $model) {
            $model->tenant_id ??= auth()->user()?->tenant_id
                ?? request()->get('resolved_tenant_id');
        });
    }
}

// The scope
class TenantScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $tenantId = request()->get('resolved_tenant_id')
            ?? auth()->user()?->tenant_id;

        if ($tenantId) {
            $builder->where($model->getTable() . '.tenant_id', $tenantId);
        }
    }
}
```

## Bypassing Scope (Platform Admin ONLY)
```php
// ONLY in platform-admin controllers/services
Order::withoutGlobalScope(TenantScope::class)->find($id);

// NEVER in tenant-facing code
```

## Setting tenant_id on Creation
tenant_id is NEVER taken from request body. It comes from the authenticated user's token.
The HasTenantScope trait sets it automatically on `creating` hook.

## Branch Scoping Within a Tenant
After tenant_id is confirmed, branch access is checked separately:
```php
// In controllers — validate the X-Branch-Id header
protected function getBranchId(Request $request): string
{
    $branchId = $request->header('X-Branch-Id');
    $user = $request->user();

    // Owner has access to all branches
    if (empty($user->branch_ids)) return $branchId;

    if (!in_array($branchId, $user->branch_ids, true)) {
        abort(403, 'You do not have access to this branch.');
    }

    return $branchId;
}
```

## Testing Tenant Isolation (Required for Every New Model)
```php
// tests/Feature/TenantIsolationTest.php pattern
public function test_tenant_a_cannot_see_tenant_b_orders(): void
{
    $tenantA = Tenant::factory()->create();
    $tenantB = Tenant::factory()->create();

    $orderA = Order::factory()->for($tenantA)->create();

    // Authenticate as Tenant B user
    $userB = User::factory()->for($tenantB)->create();
    $this->actingAs($userB, 'staff');

    $this->getJson('/api/v1/orders/' . $orderA->id)
        ->assertStatus(404);  // Not 403 — should not reveal existence
}
```

## Common Mistakes to Avoid
- Forgetting HasTenantScope on a new model → cross-tenant leak
- Taking tenant_id from request body → tenant spoofing attack
- Using `Order::all()` in a command without tenant context → returns all tenants' data
- Calling withoutGlobalScope in a non-platform context → critical security failure
