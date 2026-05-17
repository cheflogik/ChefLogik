# Infrastructure — Docker + Terraform + Jenkins CI/CD

## Overview

Each application repo (`cheflogik-api`, `cheflogik-web`, `cheflogik-admin`) ships its own CI/CD pipeline. Jenkins builds the Docker image, runs security scanning, pushes to GHCR, and deploys via Terraform. Terraform calls the shared Kubernetes module which provisions namespaced deployments on the shared cluster.

No separate Kubernetes manifests are maintained — the shared Terraform module owns all K8s resource creation.

---

## Repository Layout (per repo)

```
Dockerfile              ← Multi-stage production build
Jenkinsfile             ← Pipeline config using jenkins-shared-library
docker/
  nginx.conf            ← Nginx server config (included in Docker image)
  supervisord.conf      ← Supervisor config (API only — runs nginx + php-fpm)
terraform/
  staging.yaml          ← Deployment config for staging environment
  production.yaml       ← Deployment config for production environment
```

---

## Docker Images

| Repo | Image | Registry |
|---|---|---|
| `cheflogik-api` | `ghcr.io/dishuoberoi/cheflogik-api` | GHCR |
| `cheflogik-web` | `ghcr.io/dishuoberoi/cheflogik-web` | GHCR |
| `cheflogik-admin` | `ghcr.io/dishuoberoi/cheflogik-admin` | GHCR |
| `cheflogik-landing` | `ghcr.io/dishuoberoi/cheflogik-landing` | GHCR |

### API image (`cheflogik-api`)

Three-stage build:

1. **vendor** (`php:8.3-cli-alpine`) — Composer installs production dependencies, generates optimised autoloader
2. **production** (`php:8.3-fpm-alpine`) — PHP-FPM + Nginx + Supervisor in a single image

The same image is reused for all API process types. The default `CMD` runs `supervisord` (Nginx + PHP-FPM). Workers, scheduler, and Reverb override `CMD` via their Kubernetes deployment config:

| Process | CMD |
|---|---|
| API (default) | `supervisord` → nginx + php-fpm |
| worker-critical | `php artisan queue:work rabbitmq --queue=critical ...` |
| worker-high | `php artisan queue:work rabbitmq --queue=high ...` |
| worker-default | `php artisan queue:work rabbitmq --queue=default ...` |
| worker-background | `php artisan queue:work rabbitmq --queue=analytics,low ...` |
| scheduler | `php artisan schedule:work` |
| reverb | `php artisan reverb:start --host=0.0.0.0 --port=8080` |

Exposed port: **8080** (Nginx listens here; PHP-FPM on 9000 internally).

### Web image (`cheflogik-web`)

Two-stage build:

1. **builder** (`node:20-alpine`) — `npm run build` compiles the React/TypeScript app via Vite
2. **production** (`nginx:alpine`) — Nginx serves the static `dist/` assets

**Important:** `VITE_*` environment variables (`VITE_API_URL`, `VITE_REVERB_HOST`, `VITE_ADMIN_URL`, etc.) are baked in at build time by Vite. These must be passed as Docker build args in the Jenkins pipeline for each environment — they cannot be injected at runtime.

Exposed port: **8080**.

### Admin image (`cheflogik-admin`)

Same two-stage pattern as the web image:

1. **builder** (`node:20-alpine`) — `npm run build` compiles the admin Vite app
2. **production** (`nginx:alpine`) — Nginx serves the static `dist/` assets

**Important:** `VITE_*` environment variables (`VITE_API_URL`, `VITE_STAFF_APP_URL`) are baked in at build time.

Exposed port: **8080**.

### Landing image (`cheflogik-landing`)

Same two-stage pattern:

1. **builder** (`node:20-alpine`) — `npm run build` compiles the landing Vite app
2. **production** (`nginx:alpine`) — Nginx serves the static `dist/` assets

**Important:** `VITE_API_URL` is baked in at build time as a build arg. No `VITE_REVERB_*` needed — the landing app has no WebSocket.

Exposed port: **5700** (Nginx listens on the app's Vite port for consistency with local dev).

---

## CI/CD — Jenkins Shared Library

All pipeline logic lives in `jenkins-shared-library@main`. The `Jenkinsfile` in each repo calls `buildAndDeployApp()` with application-specific parameters only.

```
staging branch    → build → scan → push → terraform apply (staging.yaml)
production branch → build → scan → push → terraform apply (production.yaml)
```

The shared library handles:
- Docker image build
- Trivy security scan (`HIGH,CRITICAL` severity)
- Push to GHCR
- Terraform deployment (reads `terraform/{environment}.yaml`)
- Post-deploy tasks: migrations, config/route cache refresh
- Rollout verification
- Automatic rollback on failure

### API pipeline parameters

| Parameter | Value |
|---|---|
| `appName` | `cheflogik-api` |
| `imageRepo` | `dishuoberoi/cheflogik-api` |
| `enableMigrations` | `true` |
| `autoMigrateProduction` | `false` (manual approval required) |
| `healthCheckPath` | `/api/health` |
| `clearCache` | `true` |
| `workers` | 6 entries (4 queues + scheduler + reverb) |

### Web pipeline parameters

| Parameter | Value |
|---|---|
| `appName` | `cheflogik-web` |
| `imageRepo` | `dishuoberoi/cheflogik-web` |
| `enableMigrations` | `false` |
| `healthCheckPath` | `/health` |
| `clearCache` | `false` |

### Admin pipeline parameters

| Parameter | Value |
|---|---|
| `appName` | `cheflogik-admin` |
| `imageRepo` | `dishuoberoi/cheflogik-admin` |
| `enableMigrations` | `false` |
| `healthCheckPath` | `/health` |
| `clearCache` | `false` |

### Landing pipeline parameters

| Parameter | Value |
|---|---|
| `appName` | `cheflogik-landing` |
| `imageRepo` | `dishuoberoi/cheflogik-landing` |
| `enableMigrations` | `false` |
| `healthCheckPath` | `/health` |
| `clearCache` | `false` |

---

## Terraform Deployment Config (YAML)

Each environment's deployment is described in `terraform/staging.yaml` and `terraform/production.yaml`. The Terraform module (`wpconsulate/Kubernetes-Jenkins-Setup`) reads these and creates the Kubernetes resources.

### API config sections

```yaml
image:          # Docker image + pull secret
env:            # Non-secret environment variables
domains:        # Ingress hostnames (TLS via cert-manager)
secrets:        # Infisical secret injection config
postgres:       # enabled: true → module provisions DB on shared infra
redis:          # enabled: true → module provisions Redis on shared infra
web:            # Main API container — resources, HPA, health probes
workers:        # List of worker deployments — each gets its own CMD override
scheduler:      # Single-replica Laravel scheduler deployment
reverb:         # Laravel Reverb WebSocket server deployment
```

### Web config sections

```yaml
image:          # Docker image + pull secret
env:            # NODE_ENV only (VITE_* are build-time, not runtime)
domains:        # Ingress hostnames
secrets:        # Infisical secret injection config
web:            # Nginx container — resources, HPA, health probes
```

### Admin config sections (same shape as web)

```yaml
image:          # Docker image + pull secret
env:            # NODE_ENV only
domains:        # Ingress hostnames (admin.cheflogik.com)
secrets:        # Infisical secret injection config
web:            # Nginx container — resources, HPA, health probes
```

---

## Environments and Domains

| Environment | API | Staff app | Admin app | Landing app |
|---|---|---|---|---|
| Staging | `api-staging.cheflogik.com` | `app-staging.cheflogik.com` | `admin-staging.cheflogik.com` | `landing-staging.cheflogik.com` |
| Production | `api.cheflogik.com` | `app.cheflogik.com` | `admin.cheflogik.com` | `landing.cheflogik.com` |

TLS certificates are provisioned automatically by cert-manager:
- Staging: `letsencrypt-staging` issuer
- Production: `letsencrypt-prod` issuer

---

## Secrets Management — Infisical

All sensitive values (database credentials, Stripe keys, Twilio keys, AWS keys, APP_KEY, Reverb secrets) are stored in Infisical and injected into pods at runtime by the Terraform module. Nothing sensitive goes into `staging.yaml` / `production.yaml` or Jenkins build config.

Update the `secrets.projectId` field in each YAML after creating the Infisical project for ChefLogik.

---

## Shared Infrastructure

Postgres, Redis, and RabbitMQ are provisioned on shared cluster infrastructure. Setting `postgres: enabled: true` and `redis: enabled: true` in the YAML instructs the Terraform module to allocate per-app databases/namespaces on the shared instances. RabbitMQ vhost configuration is done manually.

---

## Health Check Endpoints

```
GET /api/health        → { status: "ok", version: "1.0.0" }   — liveness (lightweight)
GET /api/health/ready  → checks DB + Redis connection          — readiness probe
GET /api/health/live   → lightweight ping                      — liveness probe
GET /health            → nginx returns 200 "ok"                — web liveness + readiness
```
