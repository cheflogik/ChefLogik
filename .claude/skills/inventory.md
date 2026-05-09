# Skill: Inventory & Kitchen

## WAC Recalculation — Every GRN Line Item
```php
public function recalculateWAC(InventoryItem $item, float $receivedQty, float $unitCost): void
{
    DB::transaction(function() use ($item, $receivedQty, $unitCost) {
        $oldWAC   = $item->wac;
        $oldStock = $item->current_stock;

        $newWAC = ($oldStock > 0)
            ? (($oldStock * $oldWAC) + ($receivedQty * $unitCost)) / ($oldStock + $receivedQty)
            : $unitCost;

        $item->update([
            'wac'           => round($newWAC, 4),
            'current_stock' => $oldStock + $receivedQty,
        ]);

        // Propagate new WAC to menu_items.cost_price via recipes
        $this->updateRecipeCosts($item);
    });
}
```

## Stock Deduction Job
```php
class DeductStockJob implements ShouldQueue
{
    public string $queue = 'critical';

    public function handle(): void
    {
        foreach ($this->order->items as $lineItem) {
            $recipe = Recipe::approved()
                ->where('menu_item_id', $lineItem['item_id'])
                ->where(fn($q) => $q->whereNull('branch_id')
                    ->orWhere('branch_id', $this->order->branch_id))
                ->first();

            if (!$recipe) {
                // Log warning — do NOT rollback order
                Log::warning("No approved recipe for item {$lineItem['item_id']}");
                continue;
            }

            foreach ($recipe->ingredients as $ingredient) {
                $qty = $ingredient->quantity * $lineItem['quantity'];
                $this->deduct($ingredient->inventory_item_id, $qty, $this->order);

                // Check for zero stock → trigger 86
                if ($ingredient->inventoryItem->current_stock <= 0) {
                    event(new InventoryStockDepleted($ingredient->inventoryItem, $this->order->branch_id));
                }
            }
        }
    }
}
```

## KDS Allergen Gate — Hard Stop
```php
public function markPrepared(KDSTicketItem $item): void
{
    if ($item->has_allergen_alert && !$item->allergen_acknowledged_at) {
        throw new AllergenNotAcknowledgedException(
            'Allergen alert must be acknowledged before marking this item as prepared.'
        );
    }

    $item->update(['prepared_at' => now()]);
    broadcast(new KDSItemPrepared($item));
}

public function acknowledgeAllergen(KDSTicketItem $item): void
{
    $item->update([
        'allergen_acknowledged_at' => now(),
        'allergen_acknowledged_by' => auth()->id(),
    ]);
    // This log entry is immutable — never updated
    AuditLogger::log('kds.allergen_acknowledged', 'kds_ticket_item', $item->id);
}
```

## Inventory-Linked 86 — Restore Check
```php
public function restore(string $menuItemId, string $branchId): void
{
    $log = EightySixLog::where('menu_item_id', $menuItemId)
        ->where('branch_id', $branchId)
        ->whereNull('ended_at')
        ->firstOrFail();

    // CRITICAL: inventory-linked 86 requires manager confirmation
    if ($log->trigger_type === EightySixTriggerType::InventoryStockout) {
        if (!request()->boolean('manager_confirmed')) {
            throw new \Exception('Manager confirmation required to restore inventory-linked 86.');
        }
        // Verify ingredient actually has stock now
        $item = InventoryItem::where('menu_item_id', $menuItemId)
            ->where('branch_id', $branchId)->first();
        if ($item && $item->current_stock <= 0) {
            throw new \Exception('Cannot restore: ingredient still has zero stock.');
        }
    }

    $log->update(['ended_at' => now(), 'restored_by' => auth()->id()]);
    broadcast(new ItemAvailabilityChanged(...));
}
```
