# Skill: External Integrations

## Per-Tenant API Keys (Never in .env)
```php
// Integration credentials are per-tenant, stored encrypted in tenant_integrations
$integration = TenantIntegration::where('tenant_id', $tenantId)
    ->where('integration_type', 'uber_eats')
    ->where('is_active', true)
    ->first();

if (!$integration) {
    // This tenant hasn't configured Uber Eats — skip silently
    return;
}

$credentials = decrypt($integration->credentials);
// credentials = { client_id, client_secret, store_id, webhook_secret }
```

## Stripe Webhook — The Full Pattern
```php
// Always verify FIRST, then idempotency, then dispatch job, then return 200
public function handleStripe(Request $request): JsonResponse
{
    // 1. Verify signature — abort 403 on failure
    try {
        $event = Webhook::constructEvent(
            $request->getContent(),
            $request->header('Stripe-Signature'),
            config('services.stripe.webhook_secret')
        );
    } catch (SignatureVerificationException) {
        abort(403, 'Invalid signature');
    }

    // 2. Idempotency check
    if (cache()->has("wh:stripe:{$event->id}")) {
        return response()->json(['status' => 'already_processed']);
    }
    cache()->put("wh:stripe:{$event->id}", 1, now()->addHours(72));

    // 3. Dispatch job (return 200 within 5 seconds)
    match ($event->type) {
        'payment_intent.succeeded'      => ProcessStripePaymentJob::dispatch($event->toArray())->onQueue('critical'),
        'payment_intent.payment_failed' => ProcessStripeFailureJob::dispatch($event->toArray())->onQueue('critical'),
        'charge.refunded'               => ProcessStripeRefundJob::dispatch($event->toArray())->onQueue('critical'),
        'charge.dispute.created'        => ProcessStripeDisputeJob::dispatch($event->toArray())->onQueue('high'),
        default                         => null,
    };

    return response()->json(['status' => 'accepted']);
}
// Same pattern for Uber Eats and DoorDash webhooks
```

## Retry Pattern for External API Calls
```php
// All external API calls use retry with exponential backoff
retry(3, function() use ($uberEatsService, $itemId, $available) {
    $uberEatsService->setItemAvailability($itemId, $available);
}, backoff: [5000, 30000, 120000]);  // 5s, 30s, 120s

// On 429 (rate limit): back off 60 seconds
// On 4xx (client error): do NOT retry — log for review
// On 5xx (server error): retry with backoff
```

## Platform Pause (Uber Eats + DoorDash simultaneously)
```php
class PausePlatformsJob implements ShouldQueue
{
    public string $queue = 'critical';  // Must execute fast

    public function handle(): void
    {
        // Uber Eats
        $uberIntegration = TenantIntegration::active($this->tenantId, 'uber_eats')->first();
        if ($uberIntegration) {
            retry(3, fn() => $this->uberEats->pauseStore(decrypt($uberIntegration->credentials)));
        }

        // DoorDash
        $ddIntegration = TenantIntegration::active($this->tenantId, 'doordash')->first();
        if ($ddIntegration) {
            retry(3, fn() => $this->doorDash->pauseStore(decrypt($ddIntegration->credentials)));
        }

        // Broadcast to all connected dashboards
        broadcast(new DeliveryPlatformsPaused($this->tenantId, $this->branchId));
    }
}
// Must complete within 60 seconds per NF-OD-11
```

## Twilio SMS — Rate Limiting
```php
// Max 3 automated messages per customer per 24 hours
private function canSendSMS(string $customerId): bool
{
    $key = "sms_rate:{$customerId}:" . now()->format('Y-m-d');
    $count = cache()->get($key, 0);

    if ($count >= 3) return false;

    cache()->put($key, $count + 1, now()->endOfDay());
    return true;
}

// Transactional messages (booking confirmation) bypass this limit
// Marketing messages respect it
```

## Reverb Channel Auth (Always Verify Tenant + Branch)
```php
Broadcast::channel('tenant.{tenantId}.branch.{branchId}.orders',
    function (User $user, string $tenantId, string $branchId) {
        // Must verify BOTH tenant AND branch
        return $user->tenant_id === $tenantId
            && $user->can('orders.view')
            && ($user->hasAllBranchAccess() || in_array($branchId, $user->branch_ids));
    }
);
```
