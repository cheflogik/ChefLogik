# Skill: Orders & Deliveries

## Order Model Key Fields
order_ref: ORD-YYYYMMDD-NNNN (unique per tenant)
source: dine_in_pos | dine_in_qr | takeaway_counter | takeaway_phone | online | uber_eats | doordash
status: OrderStatus enum (9 stages + cancelled)
items: JSONB array of line items (snapshot at order time — never reference menu table for historical orders)
platform_commission: stored for net revenue analytics (NOT charged here — informational)

## 9 Lifecycle Status Machine
```
new → confirmed → preparing → ready → out_for_delivery → delivered → served → bill_settled → completed
                                                                             ↕
                                                                         cancelled
```
Valid transitions are enforced. On invalid transition: 409 response with current + attempted status.

## Critical: Stock Deduction on Confirmation
```php
// Event listener chain — do NOT deduct stock in the controller
class OrderEventServiceProvider {
    protected $listen = [
        OrderConfirmed::class => [
            DeductStockJob::class,        // 'critical' queue
            BroadcastOrderUpdate::class,  // immediate
            SyncToKDS::class,             // immediate
        ],
    ];
}
```

## Stripe Payment Flow
1. POST /api/v1/orders/{id}/payment → StripeService::createPaymentIntent() → return client_secret
2. Frontend: Stripe.js uses client_secret to collect card (card data never hits our server)
3. Stripe sends payment_intent.succeeded webhook → ProcessStripePaymentJob → order.payment_status = 'paid'
4. Never poll for payment status — webhook is the source of truth

## Cancellation Rule
```php
class CancellationService {
    public function cancel(Order $order, string $trigger, string $reason): void
    {
        $prepStarted = $order->items_preparing_count > 0;

        $refundAmount = match($trigger) {
            'customer' => $prepStarted ? $this->managerDecision($order) : $order->total,
            'restaurant' => $order->total,  // capacity/technical cancellations
            'delivery_failure' => $this->assessDeliveryFailure($order, $reason),
        };

        // Restore stock for unprepared items only
        RestoreStockForUnpreparedItemsJob::dispatch($order)->onQueue('high');

        $this->refundEngine->process($order, $refundAmount);
    }
}
```

## WebSocket Events to Broadcast
All on channel: `tenant.{tenantId}.branch.{branchId}.orders`
- OrderStatusChanged: { orderId, status, updatedAt }
- NewOrderReceived: { order: OrderResource }
- OrderModified: { orderId, changes: [] }
- KitchenCapacityChanged: { branchId, indicator: 'low'|'medium'|'high'|'at_limit' }
