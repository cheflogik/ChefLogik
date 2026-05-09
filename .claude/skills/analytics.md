# Skill: Analytics & Reporting

## The Golden Rule: Never Write to Source Tables
```php
// Analytics jobs only INSERT to analytics_* tables and READ from source tables
// Never: Order::where(...)->update([...])  in analytics jobs
// Always: AnalyticsDailyRevenue::upsert([...])

class AggregateHourlySnapshotJob implements ShouldQueue
{
    public string $queue = 'analytics';  // Lowest priority queue

    public function handle(): void
    {
        $branchIds = Branch::where('tenant_id', $this->tenantId)->pluck('id');

        foreach ($branchIds as $branchId) {
            $revenue = Order::where('branch_id', $branchId)
                ->where('status', OrderStatus::Completed)
                ->where('completed_at', '>=', now()->startOfHour())
                ->sum('total');

            AnalyticsHourlySnapshot::upsert([
                'tenant_id'  => $this->tenantId,
                'branch_id'  => $branchId,
                'snapshot_at' => now()->startOfHour(),
                'metric_key' => 'revenue',
                'metric_value' => ['amount' => $revenue, 'currency' => 'GBP'],
            ], ['tenant_id', 'branch_id', 'snapshot_at', 'metric_key']);
        }
    }
}
```

## RFM Scoring Algorithm
```php
private function calculateRFMScores(CustomerProfile $profile, Carbon $calculatedAt): array
{
    $daysSinceLastVisit = $profile->last_visit_at
        ? $profile->last_visit_at->diffInDays($calculatedAt) : 999;

    $recency = match(true) {
        $daysSinceLastVisit <= 7   => 5,
        $daysSinceLastVisit <= 30  => 4,
        $daysSinceLastVisit <= 90  => 3,
        $daysSinceLastVisit <= 180 => 2,
        default                    => 1,
    };

    $frequency = match(true) {
        $profile->lifetime_visits >= 20 => 5,
        $profile->lifetime_visits >= 10 => 4,
        $profile->lifetime_visits >= 5  => 3,
        $profile->lifetime_visits >= 2  => 2,
        default                         => 1,
    };

    // Monetary is quintile-based PER TENANT (not global)
    $monetary = $this->getMonetaryQuintile($profile->tenant_id, $profile->lifetime_spend);

    return ['r' => $recency, 'f' => $frequency, 'm' => $monetary,
            'segment' => $this->classifySegment($recency, $frequency, $monetary)];
}

private function classifySegment(int $r, int $f, int $m): string
{
    return match(true) {
        $r >= 5 && $f >= 4 && $m >= 4                => 'champion',
        $r >= 3 && $f >= 3 && $m >= 3                => 'loyal',
        $r >= 4 && $f <= 2                            => 'potential_loyalist',
        $r <= 2 && $f >= 4 && $m >= 4                => 'high_value_at_risk',
        $r <= 3 && $f >= 3                            => 'at_risk',
        $r <= 2 && $f >= 2                            => 'about_to_churn',
        $f === 1                                       => 'new',
        default                                        => 'lost',
    };
}
```

## Churn Risk Detection
```php
// Churn risk: time since last visit > 2× expected visit interval
// Expected interval: avg days between visits

$churnRiskScore = function(CustomerProfile $profile, AnalyticsCustomerSegment $segment): int {
    if (!$profile->avg_visit_interval_days) return 0;

    $daysSinceLast = $profile->last_visit_at->diffInDays(now());
    $expectedInterval = $profile->avg_visit_interval_days;

    if ($daysSinceLast < $expectedInterval) return 0;

    $ratio = $daysSinceLast / $expectedInterval;  // 1.0 = just hit threshold
    return (int) min(100, ($ratio - 1) * 50);     // 100 = 3× overdue
};
```

## Dashboard Permission Gates
```php
// Always check the dashboard-specific permission, not just auth
public function ownerDashboard(Request $request): JsonResponse
{
    $this->authorize('analytics.owner_dashboard');
    // Owner dashboard includes cross-branch data
    $data = $this->analyticsService->getOwnerDashboard($request->user()->tenant_id);
    return response()->json(['data' => $data]);
}

public function branchDashboard(Request $request): JsonResponse
{
    $this->authorize('analytics.branch_dashboard');
    // Branch manager only sees their branch
    $branchId = $this->getBranchId($request);
    $data = $this->analyticsService->getBranchDashboard($branchId);
    return response()->json(['data' => $data]);
}
```

## Menu Engineering Matrix Calculation
```php
// Uses category-level averages, NOT restaurant-wide averages
// This prevents starters from always appearing as low-margin relative to mains

foreach ($categories as $category) {
    $items = $categoryItems[$category->id] ?? collect();
    if ($items->count() < 2) continue;

    $avgPopularity  = $items->avg('popularity_index');
    $avgMargin      = $items->avg('gross_margin');

    foreach ($items as $item) {
        $quadrant = match(true) {
            $item->popularity_index >= $avgPopularity && $item->gross_margin >= $avgMargin => 'star',
            $item->popularity_index >= $avgPopularity && $item->gross_margin < $avgMargin  => 'plowhorse',
            $item->popularity_index < $avgPopularity  && $item->gross_margin >= $avgMargin => 'puzzle',
            default                                                                         => 'dog',
        };
        // Update analytics_dish_performance
    }
}
```
