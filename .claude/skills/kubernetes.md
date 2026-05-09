# Skill: Kubernetes / Helm / Terraform

## Pod Architecture
5 deployments, each with a distinct responsibility:
1. `rms-api` — PHP-FPM + Nginx serving /api/* routes (stateless, scalable)
2. `rms-worker` — Laravel Horizon consuming Redis queues (stateless, scalable)
3. `rms-scheduler` — Laravel scheduler running cron (MUST be exactly 1 replica)
4. `rms-reverb` — Laravel Reverb WebSocket server (stateful connections, careful scaling)
5. `rms-web` — Nginx serving static React build (stateless, highly scalable)

## Critical: Scheduler Must Have Exactly 1 Replica
```yaml
# scheduler-deployment.yaml
spec:
  replicas: 1  # NEVER scale this — one scheduler running cron jobs
  strategy:
    type: Recreate  # Not RollingUpdate — avoid duplicate job execution
```

## Environment from Kubernetes Secrets (Never from values.yaml)
```yaml
# In deployment template — reference secrets, never embed values
env:
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: rms-secrets
        key: db-password
  - name: STRIPE_SECRET
    valueFrom:
      secretKeyRef:
        name: rms-secrets
        key: stripe-secret
```

## Health Check Endpoints (Required for K8s Probes)
```php
// routes/api.php — outside auth middleware
Route::get('/health/live', fn() => response()->json(['status' => 'ok']));
Route::get('/health/ready', function() {
    DB::connection()->getPdo();  // Throws if DB is down
    Redis::ping();               // Throws if Redis is down
    return response()->json(['status' => 'ok', 'db' => 'ok', 'redis' => 'ok']);
});
```

## Horizon Worker Configuration
```php
// config/horizon.php — queue priority order is critical
'environments' => [
    'production' => [
        'supervisor-1' => [
            'queue'      => ['critical', 'high', 'default', 'analytics', 'low'],
            'balance'    => 'auto',
            'processes'  => 10,
            'tries'      => 3,
        ],
    ],
],
```

## Local Development docker-compose Cheatsheet
```bash
# Start all services
docker-compose up -d

# Run migrations
docker-compose exec api php artisan migrate

# Seed permissions + system roles
docker-compose exec api php artisan db:seed --class=PermissionSeeder
docker-compose exec api php artisan db:seed --class=SystemRoleSeeder

# Watch Horizon dashboard
open http://localhost:8000/horizon

# Tail logs
docker-compose logs -f api worker reverb

# Run tests with tenant isolation
docker-compose exec api php artisan test --parallel
```

## Helm Deployment Commands
```bash
# Install to cluster
helm install rms ./helm/rms -f helm/rms/values-production.yaml -n rms-production

# Upgrade (rolling deploy)
helm upgrade rms ./helm/rms -f helm/rms/values-production.yaml -n rms-production \
  --set api.image.tag=v1.2.0 \
  --set web.image.tag=v1.2.0

# Rollback
helm rollback rms 1 -n rms-production
```
