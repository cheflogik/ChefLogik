# Skill: Customer Profiles & Loyalty

## Profile Deduplication — Phone is Primary Key
```php
public function findOrCreate(string $tenantId, string $phone, array $attrs = []): CustomerProfile
{
    $normalised = $this->normalisePhone($phone);  // Always E.164

    $matches = CustomerProfile::where('tenant_id', $tenantId)
        ->where('phone', $normalised)
        ->get();

    return match($matches->count()) {
        0 => CustomerProfile::create([
                'tenant_id'      => $tenantId,
                'phone'          => $normalised,
                'loyalty_number' => $this->generateLoyaltyNumber(),
                ...$attrs,
            ]),
        1 => tap($matches->first(), fn($p) => $p->update($attrs)),
        default => throw new DuplicateProfileException($matches),
    };
}

private function generateLoyaltyNumber(): string
{
    do {
        $number = 'LYL-' . str_pad(random_int(0, 99999), 5, '0', STR_PAD_LEFT);
    } while (CustomerProfile::where('loyalty_number', $number)->exists());
    return $number;
}
```

## Loyalty Points — Always Atomic Transactions
```php
// NEVER do this:
$profile->increment('loyalty_points', 50);  // ❌ Race condition, no audit trail

// ALWAYS do this:
public function awardPoints(CustomerProfile $profile, int $points, string $sourceType, string $sourceId, float $earnRate): void
{
    DB::transaction(function() use ($profile, $points, $sourceType, $sourceId, $earnRate) {
        $newBalance = $profile->loyalty_points + $points;

        LoyaltyTransaction::create([
            'tenant_id'          => $profile->tenant_id,
            'customer_profile_id' => $profile->id,
            'transaction_type'   => 'earn',
            'points_delta'       => $points,
            'balance_after'      => $newBalance,
            'source_type'        => $sourceType,
            'source_id'          => $sourceId,
            'earn_rate_applied'  => $earnRate,
        ]);

        $profile->update(['loyalty_points' => $newBalance]);
    });
}
```

## Tier Recalculation Job (weekly)
```php
class RecalculateLoyaltyTiersJob implements ShouldQueue
{
    public string $queue = 'analytics';

    public function handle(): void
    {
        $silverThreshold = config('loyalty.silver_spend_threshold', 500);
        $goldThreshold   = config('loyalty.gold_spend_threshold', 1500);
        $silverVisits    = config('loyalty.silver_visit_threshold', 6);
        $goldVisits      = config('loyalty.gold_visit_threshold', 15);
        $window          = now()->subMonths(12);

        CustomerProfile::active()->chunk(500, function ($profiles) use (...) {
            foreach ($profiles as $profile) {
                $spend  = $this->getTrailingSpend($profile->id, $window);
                $visits = $this->getTrailingVisits($profile->id, $window);

                $newTier = match(true) {
                    $spend >= $goldThreshold || $visits >= $goldVisits   => 'gold',
                    $spend >= $silverThreshold || $visits >= $silverVisits => 'silver',
                    default                                               => 'bronze',
                };

                if ($newTier !== $profile->loyalty_tier) {
                    $profile->update(['loyalty_tier' => $newTier]);
                    // Send tier change notification
                    SendTierChangeNotificationJob::dispatch($profile, $newTier);
                }
            }
        });
    }
}
```

## GDPR Erasure — Anonymise, Don't Delete
```php
public function processErasureRequest(CustomerProfile $profile): void
{
    DB::transaction(function() use ($profile) {
        $profile->update([
            'phone'         => 'ANONYMISED-' . $profile->id,
            'email'         => null,
            'first_name'    => 'Anonymised',
            'last_name'     => 'User',
            'date_of_birth' => null,
            'allergen_notes' => null,
            'staff_notes'   => null,
            'loyalty_points' => 0,  // Points forfeited
            'status'        => 'anonymised',
            'communication_prefs' => ['sms_marketing' => false, 'email_marketing' => false],
        ]);

        // Revoke customer portal tokens
        $profile->tokens()->delete();

        // loyalty_transactions, order history: KEPT but profile no longer identifies a person
        AuditLogger::log('gdpr.erasure_completed', 'customer_profile', $profile->id);
    });
}
```
