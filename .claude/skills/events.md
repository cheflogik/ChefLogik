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

## Recurring Events
```php
// Parent event with recurrence_rule
$parent = Event::create([
    'recurrence_rule' => [
        'frequency'  => 'monthly',
        'day_of_month' => 15,
        'occurrences' => 12,
    ],
    'parent_event_id' => null,  // Is the parent
]);

// Generate child events
for ($i = 1; $i <= 12; $i++) {
    Event::create([
        'parent_event_id' => $parent->id,
        'event_date'      => $parent->event_date->addMonths($i),
        // Inherits package, pricing, space from parent
    ]);
}

// Cancel parent → cancel all future (non-completed) children
// Cancel individual child → leave recurrence_rule unchanged on parent
```

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
