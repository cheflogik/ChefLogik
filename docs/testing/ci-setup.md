# CI Test Pipeline — Setup Guide

The staff web app (`/web`) has a two-job GitHub Actions pipeline and a local pre-commit hook.

---

## GitHub Actions workflow

File: `web/.github/workflows/test.yml`

| Job | Trigger | What runs |
|---|---|---|
| `unit-tests` | every push / PR | Vitest + coverage (uploads `coverage/` artifact, 7 days) |
| `e2e-tests` | after `unit-tests` passes | Playwright chromium (uploads `playwright-report/` artifact, 14 days) |

The dev server starts on **port 5500** (configured in `vite.config.ts`). The E2E job starts it with `npm run dev &` and waits via `wait-on`.

---

## Required GitHub secrets

Add these in **Settings → Secrets and variables → Actions** on the `cheflogik-web` repository.

| Secret | Description |
|---|---|
| `TEST_USER_EMAIL` | Email of a dedicated test account (created via DemoSeeder) |
| `TEST_USER_PASSWORD` | Password for that account |
| `TEST_TENANT_SLUG` | Tenant slug the test account belongs to (e.g. `demo`) |
| `TEST_OTP_CODE` | Fixed OTP accepted by the test API seed (`000000` for demo seed) |
| `TEST_API_URL` | Base URL of the API the dev server should proxy to during CI |

Copy `web/.env.test.example` to `web/.env.test` for local runs. Never commit `.env.test`.

---

## Local usage

```bash
# Unit tests with coverage
npm run test:coverage

# E2E tests (dev server must be running separately on :5500)
npm run test:e2e

# Unified summary table (reads test-results/ and coverage/)
npm run test:summary
```

The summary command runs unit tests with a JSON reporter, then prints a per-module table:

```
Module            Unit      Component   E2E       Coverage
──────────────────────────────────────────────────────────
Auth              ✓ 12      ✓ 8         ✓ 6       94%
Orders            ✓ 9       ✓ 14        ✓ 11      87%
...
```

To also include E2E results in the summary, run `npm run test:e2e` first (it writes `test-results/playwright.json`).

---

## Pre-commit hook (husky + lint-staged)

After installing dependencies (`npm install`), husky is wired up via the `prepare` lifecycle script. On each commit, `lint-staged` runs Vitest only against files touched in that commit — fast feedback without the full suite.

Configuration lives in `package.json` under `"lint-staged"`.

To install from scratch on a fresh clone:

```bash
cd web
npm install        # also runs "husky" via the prepare script
```

---

## Artifacts

| Artifact | Path | Retention |
|---|---|---|
| Coverage (HTML + JSON) | `coverage/` | 7 days |
| Playwright HTML report | `playwright-report/` | 14 days |
| Vitest JSON (for summary) | `test-results/vitest.json` | not uploaded — local only |
| Playwright JSON (for summary) | `test-results/playwright.json` | not uploaded — local only |
