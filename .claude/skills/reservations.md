# Skill: Table & Reservation Management

## Table State Machine
```php
enum TableStatus: string {
    case Free = 'free';
    case Reserved = 'reserved';
    case Occupied = 'occupied';
    case NeedsCleaning = 'needs_cleaning';
    case Blocked = 'blocked';
}

// Valid transitions
const VALID_TRANSITIONS = [
    'free'           => ['reserved', 'occupied', 'blocked'],
    'reserved'       => ['occupied', 'free', 'blocked'],        // free = no-show/cancellation
    'occupied'       => ['needs_cleaning', 'free'],
    'needs_cleaning' => ['free'],
    'blocked'        => ['free'],
];
```

## Availability Algorithm
```php
public function getAvailableSlots(string $branchId, Carbon $date, int $partySize): Collection
{
    // 1. Get operating hours — special hours take precedence
    $hours = SpecialOperatingHour::where('branch_id', $branchId)
        ->where('date', $date->toDateString())
        ->first()
        ?? Branch::find($branchId)->operatingHoursFor($date->dayOfWeek);

    if (!$hours || $hours->is_closed) return collect();

    // 2. Find eligible tables
    $tables = Table::where('branch_id', $branchId)
        ->where('is_active', true)
        ->where('capacity_min', '<=', $partySize)
        ->where('capacity_max', '>=', $partySize)
        ->whereNotIn('status', ['blocked'])
        ->get();

    // 3. For each slot, remove tables with overlapping reservations
    return $this->generateSlots($hours)
        ->map(fn($slot) => [
            'time'   => $slot,
            'tables' => $this->filterAvailable($tables, $date, $slot),
        ])
        ->filter(fn($slot) => $slot['tables']->isNotEmpty());
}
```

## Walk-in Profile Matching — 500ms SLA
`CustomerProfile` is platform-level (Decision 3): match on phone only, no `tenant_id`. Normalise via `App\Support\Phone` (the same path profile storage and the Twilio webhook use — B8). See `WalkInMatchingService::match`.
```php
public function match(string $tenantId, string $rawPhone): array
{
    $normalised = Phone::normalise($rawPhone) ?? $rawPhone;  // App\Support\Phone — E.164

    $matches = CustomerProfile::where('phone', $normalised)->get();  // platform-wide, UNIQUE (phone)

    return match($matches->count()) {
        0 => ['action' => 'create', 'profile' => null],
        1 => ['action' => 'match', 'profile' => $matches->first()],
        default => ['action' => 'multiple', 'profiles' => $matches],
    };
}
```

## WebSocket Broadcasts
Channel: `tenant.{tenantId}.branch.{branchId}.tables`
Events: TableStateChanged { tableId, status, occupiedSince?, reservationId? }
All connected FOH devices must reflect state changes within 3 seconds.
```

## Reminder Job Pattern — branch-local triggers + flags + reconcile sweep (Decision 26, B3/B4)
Reminder trigger times are computed in `branches.timezone`, NOT server time. Jobs carry a `scheduledFor` guard and self-skip when stale; the reservation tracks `reminder_sent_24h_at` / `reminder_sent_2h_at` so a rescheduled booking (`ReservationService::update`) resets the flags and re-dispatches. A `ReconcileReservationRemindersCommand` runs every 15 min and re-dispatches reminders ≥20 min overdue with the sent-flag unset — this is the source of truth, not long RabbitMQ `->delay()`.
```php
// trigger time is branch-local:
$triggerAt = Carbon::parse($reservation->reservation_date.' '.$reservation->reservation_time, $branch->timezone);

SendReservationReminder24h::dispatch($reservation)->delay($triggerAt->copy()->subHours(24));
SendReservationReminder2h::dispatch($reservation)->delay($triggerAt->copy()->subHours(2));
// Jobs no-op if reminder_sent_*_at is already set or $scheduledFor no longer matches the booking.
```
Other shipped reservation facts: `confirmation_code` is persisted and returned (B1); `deposit_required` is set when tenant-scoped `no_show_count` minus per-tier loyalty forgiveness ≥ the `reservations.no_show_deposit_threshold` setting; no-show counts increment on `customer_tenant_profiles.no_show_count` (tenant-scoped, B2).
