# Skill: Landing / Customer Website App

## Overview

The landing app (`/landing`, port 5700) is a **customer-facing website per restaurant** — not part of the staff app or admin app. Each tenant gets a public website where customers can browse the menu, make reservations, log in to their loyalty account, and view order history.

- **4th standalone Vite/React 19 app** — fully independent from `/web`, `/admin`
- **No WebSocket** — read/write via REST only (no Laravel Echo, no Pusher)
- **No Tailwind** — templates use inline styles for maximum visual isolation
- **Customer guard** — uses the `customer` Sanctum guard; token stored as `landing_token` in localStorage
- **Port 5700** locally; `landing.cheflogik.com` in production

---

## MST Stores

The landing app has its own `RootStore` that aggregates six domain stores:

| Store | Purpose |
|---|---|
| `AuthStore` | Customer auth (login, register, logout, fetchMe); token: `landing_token` |
| `RestaurantStore` | Branch info (name, hours, address, menu categories) |
| `LandingConfigStore` | Template, customCss, contentBlocks, socialFeeds, featuredItems, SEO config |
| `CartStore` | In-memory cart; calculates totals; submits to `/orders` endpoint |
| `CustomerStore` | Customer profile + loyalty data for the account area |
| `I18nStore` | Locale + translations; `t(key, vars?)` helper |

Access stores via hooks from `@/stores/context`:
```typescript
const auth       = useAuth()
const restaurant = useRestaurant()
const config     = useConfig()
const cart       = useCart()
const customer   = useCustomer()
const i18n       = useI18n()
```

---

## Three Templates

Template is set in `LandingConfigStore.template` (driven by backend config):

| Key | Style |
|---|---|
| `v1-maison` (default) | Upscale dark editorial — dark backgrounds, warm amber/copper accents |
| `v2-editorial` | Clean magazine layout — light, typographic, structured |
| `v3-cinematic` | Full-bleed cinematic — large imagery, dramatic typography |

The `index.tsx` root route switches on `config.activeTemplate`:
```typescript
switch (config.activeTemplate) {
  case 'v2-editorial': return <EditorialTemplate {...props} />
  case 'v3-cinematic': return <CinematicTemplate {...props} />
  default:             return <MaisonTemplate    {...props} />
}
```

All three templates receive the same props: `auth`, `restaurant`, `config`, `cart`, `onLogin`, `onRegister`.

---

## API Endpoints Consumed

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/landing/config` | Fetch template + content config for this restaurant |
| `GET` | `/api/v1/translations/{locale}?app=landing` | Fetch translation strings for a locale |
| `POST` | `/api/v1/customer/auth/login` | Customer login → returns token |
| `POST` | `/api/v1/customer/auth/register` | Customer registration |
| `GET` | `/api/v1/customer/auth/me` | Rehydrate customer session |
| `POST` | `/api/v1/customer/auth/logout` | Revoke token |
| `GET` | `/api/v1/customer/restaurant/menu` | Public menu (filtered by 86 status) |
| `GET` | `/api/v1/customer/orders` | Customer order history (auth required) |
| `POST` | `/api/v1/orders` | Place online order (auth required) |

The `LandingConfigStore` fetches `/landing/config` on boot, which also returns `supported_locales` to seed `I18nStore`.

---

## Multilanguage (I18nStore)

See Decision 25 for the full decision.

```typescript
// i18n.setLocale('fr-FR') — fetches translations from API, stores locale in localStorage
// i18n.t('nav.menu')       — returns translated string, falls back to key if missing
// i18n.t('greeting', { name: 'Marie' }) — supports {placeholder} interpolation

// Supported locales (backend-configured per tenant):
// en-US (always present), en-GB, fr-FR, es-ES, de-DE, de-AT, pl-PL, it-IT

// The LanguageSwitcher component renders available locales as a picker
// Only locales in LandingConfigStore.supported_locales are shown
```

Locale is persisted in `localStorage` under `cl_landing_locale`. On boot, `I18nStore` reads it and calls `setLocale()` to pre-load translations.

---

## AuthStore — Customer Guard

```typescript
// Token stored as 'landing_token' in localStorage (NOT 'cl_token' or 'cl_admin_token')
// Login uses /customer/auth/login — email + password only (no tenant_slug — customer is platform-level)

// Key fields
auth.isLoggedIn       → boolean (isAuthenticated + token not null)
auth.name             → customer full name
auth.email            → customer email
auth.loyaltyPoints    → points balance
auth.initials         → 2-letter initials for avatar

// Actions
auth.login(email, password)
auth.register(name, email, password, phone?)
auth.logout()
auth.fetchMe()        → rehydrates from /customer/auth/me
```

---

## Routes

| Route | Component | Auth? |
|---|---|---|
| `/` | `Index` (renders active template) | No |
| `/auth/login` | `LoginPage` | No |
| `/auth/register` | `RegisterPage` | No |
| `/account` | `AccountLayout` | Yes (redirects to `/auth/login`) |
| `/account/orders` | `OrderHistoryPage` | Yes |
| `/menu` | Redirects to `/#menu` | No |
| `/reserve` | Redirects to `/` | No |

The `AccountLayout` uses a `useEffect` to redirect unauthenticated users to `/auth/login`.

---

## `landing_template_settings` DB Table

Backend table (platform-level, no `tenant_id` — one row per tenant via `tenant_id` FK):

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK tenants |
| `template` | VARCHAR(30) | `v1-maison` \| `v2-editorial` \| `v3-cinematic` |
| `custom_css` | TEXT | nullable — injected into `<style>` tag |
| `is_custom_css_enabled` | BOOLEAN | default false |
| `content_blocks` | JSONB | flexible content sections (hero, about, gallery, etc.) |
| `social_feeds` | JSONB | social media links/embeds |
| `featured_items` | JSONB | pinned menu items |
| `seo` | JSONB | `{ meta_title, meta_description, og_image_url, canonical_url }` |
| `supported_locales` | JSONB | array of locale strings, e.g. `["en-US", "fr-FR"]` |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

The `LandingConfigStore.fetchConfig()` action calls `GET /api/v1/landing/config` which returns this table's data shaped into the store's fields.

---

## Deployment

```
Production: landing.cheflogik.com
Staging:    landing-staging.cheflogik.com
Image:      ghcr.io/dishuoberoi/cheflogik-landing
Port:       5700 (local dev + container)
```

VITE_* env vars baked in at build time. See `.claude/skills/jenkins-terraform.md` for the full deployment pattern.
