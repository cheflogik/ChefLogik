# Skill: Menu Management

## 86 Trigger Types — CRITICAL DISTINCTION
```php
enum EightySixTriggerType: string {
    case Manual = 'manual';
    case InventoryStockout = 'inventory_stockout';
}

// On restore — ALWAYS check trigger type
public function restore(MenuItem $item, Branch $branch): void
{
    $activeLog = EightySixLog::where('menu_item_id', $item->id)
        ->where('branch_id', $branch->id)
        ->whereNull('ended_at')
        ->firstOrFail();

    // Inventory-linked 86 ALWAYS requires manual confirmation
    if ($activeLog->trigger_type === EightySixTriggerType::InventoryStockout) {
        // This endpoint requires explicit manager confirmation
        // Cannot be triggered by auto-restore modes
        throw_unless(request()->input('manager_confirmed'), ValidationException::class);
    }

    $activeLog->update(['ended_at' => now(), 'restored_by' => auth()->id()]);
    broadcast(new ItemAvailabilityChanged($item, $branch, true));
    SyncItemRestoreToPlatformsJob::dispatch($item, $branch)->onQueue('high');
}
```

## Branch Override Resolution Order
When fetching a menu item for a specific branch:
1. Start with master menu_item
2. Apply branch override if exists (price_override, is_available, description_override, photo_override)
3. Check eighty_six_log for active 86 on this branch
4. Return merged result

```php
public function getForBranch(string $itemId, string $branchId): array
{
    $item = MenuItem::find($itemId);
    $override = MenuItemBranchOverride::where('menu_item_id', $itemId)
        ->where('branch_id', $branchId)->first();
    $is86d = EightySixLog::where('menu_item_id', $itemId)
        ->where('branch_id', $branchId)->whereNull('ended_at')->exists();

    return array_merge($item->toArray(), $override?->toArray() ?? [], ['is_eighty_six' => $is86d]);
}
```

## Allergen Safety — Owner Only
Permission: `menu.edit_allergens`
System role Owner is the only system role with this permission by default.
No override possible for branch managers — this is a food safety requirement.
Allergen changes trigger a full menu re-sync to all connected delivery platforms.

## Platform Sync Job
```php
class SyncMenuItemToPlatformsJob implements ShouldQueue
{
    public string $queue = 'high';
    public int $tries = 3;
    public array $backoff = [5, 30, 120];  // seconds

    public function handle(UberEatsService $uber, DoorDashService $dd): void
    {
        $integration = TenantIntegration::forTenant($this->tenantId)
            ->where('integration_type', 'uber_eats')->first();

        if ($integration?->is_active) {
            $uber->updateItem($this->item, $integration->credentials);
        }
        // Same for DoorDash
    }
}
```
