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
```php
public function matchWalkIn(string $tenantId, string $phone): array
{
    $normalised = $this->phoneNormaliser->toE164($phone);

    $matches = CustomerProfile::where('tenant_id', $tenantId)
        ->where('phone', $normalised)
        ->get();

    return match($matches->count()) {
        0 => ['action' => 'create', 'profile' => null],
        1 => ['action' => 'match', 'profile' => $matches->first()],
        default => ['action' => 'multiple', 'profiles' => $matches],
    };
    // This query must be indexed: UNIQUE (tenant_id, phone)
}
```

## WebSocket Broadcasts
Channel: `tenant.{tenantId}.branch.{branchId}.tables`
Events: TableStateChanged { tableId, status, occupiedSince?, reservationId? }
All connected FOH devices must reflect state changes within 3 seconds.
```

## Reminder Job Pattern
```php
// When creating a reservation, schedule both reminders:
SendReservationReminder24h::dispatch($reservation)
    ->delay($reservation->datetime->subHours(24));

SendReservationReminder2h::dispatch($reservation)
    ->delay($reservation->datetime->subHours(2));

// If reservation is cancelled: cancel pending jobs
// Use job IDs stored on the reservation record
```
