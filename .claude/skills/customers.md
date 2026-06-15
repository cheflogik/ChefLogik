# Skill: Customer Profiles & Loyalty

## Profile Deduplication — Phone is Platform-Level (Decision 3)
`CustomerProfile` is **platform-level**: NO `tenant_id`, NO `HasTenantScope`, `UNIQUE (phone)` across the whole platform. Per-tenant loyalty data (`loyalty_number`, `loyalty_tier`, `loyalty_points`, `lifetime_*`) lives on `CustomerTenantProfile`. Dedup matches on phone only; enrolment then gets-or-creates the tenant profile. (See `CustomerService::enroll` / `getOrCreateTenantProfile`.)
```php
public function enroll(string $tenantId, string $phone, array $profileAttrs = []): CustomerTenantProfile
{
    $normalised = Phone::normalise($phone) ?? $phone;  // App\Support\Phone — always E.164 (B8)

    $matches = CustomerProfile::where('phone', $normalised)->get();  // platform-wide, no tenant_id

    $platformProfile = match($matches->count()) {
        0 => CustomerProfile::create(array_merge(['phone' => $normalised, 'status' => CustomerStatus::Active], $profileAttrs)),
        1 => tap($matches->first(), fn($p) => $profileAttrs ? $p->update($profileAttrs) : null),
        default => throw new DuplicateProfileException($matches),
    };

    // loyalty_number is generated on the tenant profile here, per-tenant (not on the platform profile)
    return $this->getOrCreateTenantProfile($platformProfile, $tenantId, $channel, $referredById);
}
```

## Loyalty Points — Always Atomic Transactions (on the tenant profile)
Points live on `CustomerTenantProfile`, never on the platform `CustomerProfile`. `LoyaltyService::awardPoints` takes a `CustomerTenantProfile`. Related flows: `awardPointsForOrder`, `awardPointsForEvent` (2× via `loyalty.event_multiplier`, Decision-era), `redeemPoints`, `reversePointsForRefund` (proportional clawback, Decision 28).
```php
// NEVER do this:
$tenantProfile->increment('loyalty_points', 50);  // ❌ Race condition, no audit trail

// ALWAYS do this:
public function awardPoints(CustomerTenantProfile $tenantProfile, int $points, string $sourceType, string $sourceId, float $earnRate): LoyaltyTransaction
{
    return DB::transaction(function() use ($tenantProfile, $points, $sourceType, $sourceId, $earnRate) {
        $newBalance = $tenantProfile->loyalty_points + $points;

        $txn = LoyaltyTransaction::create([
            'tenant_id'              => $tenantProfile->tenant_id,
            'customer_id'            => $tenantProfile->customer_id,  // platform customer id, not the tenant-profile id
            'transaction_type'       => 'earn',
            'points_delta'           => $points,
            'balance_after'          => $newBalance,
            'source_type'            => $sourceType,
            'source_id'              => $sourceId,
            'earn_rate_applied'      => $earnRate,
        ]);

        $tenantProfile->update(['loyalty_points' => $newBalance]);
        return $txn;
    });
}
```

## Tier Recalculation Job (weekly) — operates on `CustomerTenantProfile`
Tier is per-tenant, so the job iterates `CustomerTenantProfile` (tenant-scoped), not the platform profile. Tier rule is `spend ≥ silver_spend OR visits ≥ silver_visits` (per-tenant thresholds from settings, surfaced to the UI via Decision 35's `meta.loyalty_config`). Downgrades carry a **30-day grace**: `RecalculateLoyaltyTiersJob` dispatches `SendTierDowngradeWarningJob` once when a downgrade is first scheduled (email + SMS fallback, honouring the Decision 33 opt-out).
```php
class RecalculateLoyaltyTiersJob implements ShouldQueue
{
    public string $queue = 'analytics';

    public function handle(): void
    {
        CustomerTenantProfile::withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $this->tenantId)
            ->chunk(500, function ($tenantProfiles) {
                foreach ($tenantProfiles as $tp) {
                    $newTier = $this->computeTier($tp);          // spend OR visits, per-tenant thresholds
                    if ($newTier !== $tp->loyalty_tier->value) {
                        // upgrade applies immediately; downgrade is scheduled with 30-day grace +
                        // a one-shot SendTierDowngradeWarningJob (self-skips if cleared before it runs)
                        $this->applyTierChange($tp, $newTier);
                    }
                }
            });
    }
}
```
Points expiry is a separate daily `ExpireLoyaltyPointsJob`: 12-month inactivity → email/SMS warning (tracked on `customer_tenant_profiles.points_expiry_warned_at`); 18-month → immutable `expire` transaction zeroes the balance. Activity = earn/redeem/bonus/adjustment.

## GDPR Erasure — Anonymise, Don't Delete
Identity/PII lives on the platform `CustomerProfile`; loyalty balances are per-tenant on `CustomerTenantProfile`. Erasure anonymises the platform identity and zeroes per-tenant points.
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
            'status'        => 'anonymised',
            'communication_prefs' => ['sms_marketing' => false, 'email_marketing' => false, 'sms_opted_out' => true],
        ]);

        // Points forfeited on every tenant profile (loyalty_points is per-tenant, not on CustomerProfile)
        $profile->tenantProfiles()->update(['loyalty_points' => 0]);

        // Revoke customer portal tokens
        $profile->tokens()->delete();

        // loyalty_transactions, order history: KEPT but profile no longer identifies a person
        AuditLogger::log('gdpr.erasure_completed', 'customer_profile', $profile->id);
    });
}
```
GDPR data **export** (portability) is async: `GET /customers/{customer}/gdpr/export` → 202 + `job_id`, polled via `GET /customers/{customer}/gdpr/export/{jobId}/status` (Decision 34, gated `customers.gdpr`). Manual profile **merge** is platform-wide and reversible 30 days: `POST /customers/merge` + `/customers/merge/{id}/revert` (Decision 29, `customers.merge`).
