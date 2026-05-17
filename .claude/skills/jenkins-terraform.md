# Skill: Jenkins + Terraform Deployment

## Overview

All four application repos (`cheflogik-api`, `cheflogik-web`, `cheflogik-admin`, `cheflogik-landing`) deploy via the same pattern:
1. Jenkins builds the Docker image
2. Trivy security scan (`HIGH,CRITICAL` severity)
3. Push to GHCR
4. Terraform apply (reads `terraform/{environment}.yaml`)
5. Post-deploy: migrations (API only), config/route cache refresh, rollout verification
6. Automatic rollback on failure

The shared library (`jenkins-shared-library@main`) owns all this logic. Each repo's `Jenkinsfile` only provides app-specific parameters.

---

## Jenkinsfile Pattern

```groovy
@Library('jenkins-shared-library@main') _

buildAndDeployApp(
    appName:         'cheflogik-api',
    imageRepo:       'dishuoberoi/cheflogik-api',
    registry:        'ghcr.io',
    enableMigrations: true,
    autoMigrateProduction: false,   // manual approval for prod migrations
    healthCheckPath: '/api/health',
    clearCache:      true,
    workers: [...]   // API only — worker deployment configs
)
```

**Branch → environment mapping:**
- `staging` branch → deploys to staging namespace, reads `terraform/staging.yaml`
- `production` branch → deploys to production namespace, reads `terraform/production.yaml`

---

## Terraform YAML Structure

Each app has `terraform/staging.yaml` and `terraform/production.yaml`. The Terraform module (`wpconsulate/Kubernetes-Jenkins-Setup`) reads these and creates Kubernetes resources.

### API YAML sections
```yaml
namespace: cheflogik-staging       # or cheflogik (production)
manage_namespace: true

image:
  repository: ghcr.io/dishuoberoi/cheflogik-api
  pullSecret: ghcr-secret

env:                               # non-secret runtime env vars
  APP_ENV: staging
  LOG_CHANNEL: cloudwatch

domains:                           # Ingress hostnames (TLS via cert-manager)
  - api-staging.cheflogik.com

secrets:                           # Infisical injection config
  provider: infisical
  projectId: "FILL_IN_AFTER_INFISICAL_SETUP"
  environment: "staging"
  secretPath: "/"
  tags: ["api"]

postgres:
  enabled: true                    # allocates DB on shared infra

redis:
  enabled: true                    # allocates Redis namespace on shared infra

web:                               # Main API container (nginx + php-fpm via supervisor)
  resources: { requests: ..., limits: ... }
  hpa: { minReplicas: 2, maxReplicas: 10 }
  livenessProbe: { path: /api/health/live }
  readinessProbe: { path: /api/health/ready }

workers:                           # One entry per worker type
  - name: worker-critical
    command: ["php", "artisan", "queue:work", "rabbitmq", "--queue=critical", "--tries=3"]
    replicas: 3
  - name: worker-high
    command: [...]
    replicas: 2
  # ... worker-default, worker-background

scheduler:
  replicas: 1                      # ALWAYS exactly 1 — never scale this
  strategy: Recreate               # NOT RollingUpdate — prevents duplicate cron execution

reverb:
  command: ["php", "artisan", "reverb:start", "--host=0.0.0.0", "--port=8080"]
  replicas: 1
```

### Web / Admin / Landing YAML sections
```yaml
namespace: cheflogik-staging

image:
  repository: ghcr.io/dishuoberoi/cheflogik-web   # or cheflogik-admin / cheflogik-landing
  pullSecret: ghcr-secret

env:
  NODE_ENV: staging                # Only runtime var — VITE_* are baked in at build time

buildArgs:                         # Passed as Docker build args (bakes VITE_* into the bundle)
  VITE_API_URL: https://api-staging.cheflogik.com/api/v1
  VITE_REVERB_HOST: api-staging.cheflogik.com    # API only; omit for admin/landing

domains:
  - app-staging.cheflogik.com      # or admin-staging / landing-staging

secrets:
  provider: infisical
  projectId: "FILL_IN_AFTER_INFISICAL_SETUP"
  environment: "staging"
  tags: ["web"]                    # or ["admin"] / ["landing"]

web:                               # Nginx static server
  resources: { ... }
  hpa: { minReplicas: 2, maxReplicas: 5 }
  livenessProbe: { path: /health }
  readinessProbe: { path: /health }
```

---

## Secrets — Infisical

All sensitive values (DB credentials, Stripe keys, Twilio keys, AWS keys, APP_KEY, Reverb secrets) are stored in Infisical and injected into pods at runtime. **Nothing sensitive goes into the YAML files or Jenkins config.**

After creating the Infisical project, fill in `secrets.projectId` in each environment YAML. Until then it's a placeholder string.

---

## Health Check Endpoints

```
GET /api/health        → { status: "ok", version: "1.0.0" }   — combined liveness check (lightweight)
GET /api/health/live   → { status: "ok" }                      — Kubernetes liveness probe
GET /api/health/ready  → checks DB + Redis                      — Kubernetes readiness probe
GET /health            → nginx 200 "ok"                         — web/admin/landing liveness + readiness
```

---

## Critical: Scheduler Replica Count

The Laravel scheduler (`php artisan schedule:work`) must **always run as exactly 1 replica** with `strategy: Recreate` (not `RollingUpdate`). Running two schedulers simultaneously causes duplicate cron job execution.

```yaml
scheduler:
  replicas: 1          # Never change this to > 1
  strategy: Recreate   # Not RollingUpdate
```

---

## Post-Deploy Steps (API only)

After a successful deploy, the shared library runs:
```bash
php artisan migrate --force      # only if enableMigrations: true AND not production
# (production migrations require manual approval step in Jenkins)
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## Domains Summary

| Environment | API | Staff | Admin | Landing |
|---|---|---|---|---|
| Staging | `api-staging.cheflogik.com` | `app-staging.cheflogik.com` | `admin-staging.cheflogik.com` | `landing-staging.cheflogik.com` |
| Production | `api.cheflogik.com` | `app.cheflogik.com` | `admin.cheflogik.com` | `landing.cheflogik.com` |

TLS via cert-manager (`letsencrypt-staging` issuer for staging, `letsencrypt-prod` for production).
