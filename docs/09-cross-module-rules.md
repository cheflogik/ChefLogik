# Cross-Module Rules

Rules that span multiple modules. When in doubt, these rules take precedence over module-specific logic.

---

## 1. 86 Propagation — Two SLAs

**Local channels** (QR menu, POS display, online ordering page): 86 must propagate within **5 seconds** via WebSocket broadcast.

**Delivery platforms** (Uber Eats, Wolt): 86 must propagate within **60 seconds** via queued API call.

```php
// When an 86 event is created:
event(new ItemEightySixed($item, $branch, $triggerType));

// Listener 1 — immediate WebSocket broadcast (5s SLA)
class BroadcastEightySix {
    public function handle(ItemEightySixed $event): void {
        broadcast(new ItemAvailabilityChanged($event->item, $event->branch, false));
        // Reverb delivers this within seconds
    }
}

// Listener 2 — queued platform sync (60s SLA, 'high' queue)
class SyncEightySixToPlatforms {
    public function handle(ItemEightySixed $event): void {
        SyncMenuItemToPlatformsJob::dispatch($event->item, $event->branch)
            ->onQueue('high');
    }
}
```

**Inventory-linked 86 events NEVER auto-restore.** Only manually-triggered 86 events respect the auto-restore modes (time-based, next-open) configured in Menu Management. See `docs/modules/inventory.md` IK-18 and `docs/modules/menu.md` MM-65.

---

## 2. WAC — Weighted Average Cost is the Authority

All ingredient cost calculations across all modules use WAC. WAC is owned and calculated by the Inventory module.

- WAC recalculated on every GRN line item confirmed
- `inventory_items.wac` is the source of truth
- `menu_items.cost_price` is derived from `inventory_items.wac` via the recipe ingredients — updated when WAC changes
- Analytics COGS uses `menu_items.cost_price` at the time of the order (snapshotted in the order's `items` JSONB)
- Events billing uses the same cost_price snapshot

**Formula:** `new_wac = (existing_stock × old_wac + received_qty × unit_cost) / (existing_stock + received_qty)`

---

## 3. Cover Definition — Analytics is Authoritative

| Channel | Cover count |
|---|---|
| Dine-in | Party size (number of individual guests seated) |
| Delivery order | 1 per order (regardless of party size — typically unknown) |
| Event | Confirmed guest count |

Analytics module owns this definition. If any module calculates covers differently, it must be corrected to match.

---

## 4. Tenant Data Isolation — Absolute Rules

1. Every Eloquent model with tenant data MUST have `TenantScope` applied as a global scope.
2. Never call `withoutGlobalScope(TenantScope::class)` outside of platform-admin contexts.
3. The `tenant_id` on every record is SET by the application on creation using `Auth::user()->tenant_id` — it is NEVER taken from the request body.
4. Cross-tenant tests: every new model must have a test that creates data for Tenant A and asserts Tenant B cannot retrieve it.

---

## 5. Notification Rules

All outbound notifications must:
1. Check the recipient's `communication_prefs` before sending (customer) or the notification type's channel config (staff alerts)
2. Respect GDPR opt-outs — a customer with `sms_marketing: false` must never receive an SMS marketing message
3. Transactional messages (booking confirmation, order receipt) bypass marketing opt-out but respect the channel being active (no SMS if phone number invalid)
4. Be logged in the notification audit log regardless of delivery success/failure
5. Rate-limit customer communications: max 3 automated messages per customer per 24 hours (transactional excluded)

---

## 6. Audit Log — Write-Only Immutable

Every significant action must produce an audit log entry. The audit log is write-only — no UPDATE or DELETE, ever.

```php
// AuditLogger service — call this from listeners, not controllers
class AuditLogger {
    public function log(
        string $action,           // e.g. 'order.cancelled'
        string $resourceType,     // e.g. 'order'
        string $resourceId,       // UUID
        array $changes = [],      // { before: {}, after: {} }
        ?string $tenantId = null,
    ): void {
        AuditLog::create([
            'tenant_id'     => $tenantId ?? Auth::user()?->tenant_id,
            'actor_id'      => Auth::id(),
            'actor_type'    => Auth::user()?->userType() ?? 'system',
            'actor_role'    => Auth::user()?->roleSlug,
            'action'        => $action,
            'resource_type' => $resourceType,
            'resource_id'   => $resourceId,
            'changes'       => $changes,
            'ip_address'    => request()->ip(),
        ]);
    }
}
```

Actions that MUST produce audit log entries:
- Any cancellation or refund
- Any 86 event (creation and restoration)
- Any stock adjustment or stocktake completion
- Any permission or role change
- Any GDPR data action (access request, erasure)
- Any profile merge
- Any loyalty points manual adjustment
- Any financial period close
- Any tenant suspension or plan change (platform-admin)

---

## 7. Financial Data Retention

Minimum retention periods (enforced by soft-deletes or archival, never hard deletes):
- Orders, payments, refunds, invoices: **7 years**
- Loyalty transactions: **7 years**
- Audit log: **7 years**
- Customer PII: anonymised on erasure request, financial history retained anonymised
- Analytics aggregations (daily): 3 years
- Analytics aggregations (monthly): 7 years

---

## 8. Stock Deduction Timing

Stock deductions happen on order confirmation (`confirmed` status), not on dish completion. This is enforced by the `OrderConfirmed` event → `DeductStockJob` listener chain. The job runs on the `critical` queue.

If the deduction fails (ingredient not found in inventory), it is logged but the order is NOT rolled back — operational continuity takes priority. A manager alert is generated.

---

## 9. Payment — Stripe is Exclusive

No payment processor other than Stripe. No raw card data ever enters the application. All refunds go through `Stripe::refunds()->create()` against the original `PaymentIntent`. Cash is recorded as a transaction type but never processed through the application — it is a manager record only.
