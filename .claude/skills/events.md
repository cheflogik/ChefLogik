# Skill: Events & Functions

## Event State Machine
```php
enum EventStatus: string {
    case Enquiry = 'enquiry';
    case Proposal = 'proposal';
    case Confirmed = 'confirmed';
    case PreEvent = 'pre_event';
    case DayOf = 'day_of';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
}
// enquiry → proposal (send proposal) → confirmed (deposit paid) → pre_event → day_of → completed
```

## Deposit Collection
```php
public function collectDeposit(Event $event, int $amountCents): string
{
    $intent = $this->stripe->createPaymentIntent($amountCents, $event->branch->currency, $event->id);

    $event->update([
        'deposit_amount'             => $amountCents / 100,
        'stripe_payment_intent_id'   => $intent->id,
    ]);

    // Status changes to 'confirmed' via webhook (payment_intent.succeeded)
    // NOT synchronously here

    return $intent->client_secret;  // Send to frontend
}
```

## Recurring Events (Decision 43)
Rule shape is `{ frequency: weekly|monthly, occurrences: 1–52 }` — no `day_of_month`. Wired via `POST /events/{event}/recurrence` (`events.manage`) → `EventService::applyRecurrence`, which **regenerates**: deletes upcoming non-completed children, persists the rule on the parent, then calls `generateRecurringChildren`. Only a top-level event (`parent_event_id === null`) can start a series. Children inherit package/pricing/space/organiser and are created as `confirmed`.
```php
public function applyRecurrence(Event $parent, array $rule): Collection
{
    return DB::transaction(function () use ($parent, $rule) {
        $parent->childEvents()->where('status', '!=', EventStatus::Completed)->delete();  // keep completed
        $parent->update(['recurrence_rule' => $rule]);
        $this->generateRecurringChildren($parent, $rule);   // addWeeks($i) / addMonths($i) per occurrence
        return $parent->childEvents()->orderBy('event_date')->get();
    });
}
// Cancel parent → cascades to future non-completed children. Cancel a child → parent rule unchanged.
```

## Per-Event Custom Menu (Decision 49) & Linked Orders (Decision 42)
- `events.custom_menu` (JSONB) is a priced line-item builder: `{ id, name, pricing_mode: per_item|per_head, unit_price, quantity|null, notes|null, menu_item_id|null }`. Subtotal (`custom_menu_subtotal`) is **display-only** — it does NOT feed `actual_spend` or minimum-spend compliance. Edit via `UpdateEventRequest` (update-only); all event-returning controller methods flow through `EventResource`.
- Orders link to an event via nullable `orders.event_id` (manual attach/detach): `GET/POST/DELETE /events/{event}/orders` (read `events.view`, mutate `events.manage`, same-branch guard). `actual_spend` / minimum-spend are driven by these linked POS orders.

## Corporate Account Credit Check
```php
public function canBookWithNetTerms(CorporateAccount $account, float $newEventValue): bool
{
    $outstanding = Event::where('corporate_account_id', $account->id)
        ->whereIn('status', ['confirmed', 'pre_event', 'day_of'])
        ->where('payment_status', '!=', 'paid')
        ->sum('actual_spend');

    if (($outstanding + $newEventValue) > $account->credit_limit) {
        // Requires Owner authorisation — flag in the response
        return false;
    }
    return true;
}
```

## Pre-Event Task Auto-Generation
On event confirmation, generate tasks based on occasion_type:
```php
class PreEventTaskSeeder {
    const TASK_TEMPLATES = [
        'birthday' => [
            ['title' => 'Confirm final guest count', 'days_before' => 3],
            ['title' => 'Confirm dietary requirements', 'days_before' => 3],
            ['title' => 'Order birthday cake', 'days_before' => 5],
            ['title' => 'Arrange table decorations', 'days_before' => 1],
        ],
        'corporate' => [
            ['title' => 'Send AV equipment checklist', 'days_before' => 7],
            ['title' => 'Confirm invoice details', 'days_before' => 5],
            ['title' => 'Confirm dietary requirements', 'days_before' => 3],
        ],
    ];
}
```
