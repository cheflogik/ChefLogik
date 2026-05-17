# Module: Landing / Customer Website App

A tenant-configurable customer-facing website per restaurant. Each tenant gets a public landing page where customers can browse the menu, make online orders, create reservations, and manage their loyalty account.

**Architecture decision:** Decision 23 — separate Vite/React 19 app (`/landing`, port 5700), NOT part of the staff app or admin app.

---

## App Architecture

| Aspect | Detail |
|---|---|
| App directory | `/landing` |
| Dev port | 5700 |
| Production domain | `landing.cheflogik.com` |
| Staging domain | `landing-staging.cheflogik.com` |
| Auth guard | `customer` (Sanctum) |
| Token key | `landing_token` (localStorage) |
| WebSocket | None |
| Styling | Inline styles — no Tailwind (template isolation) |
| i18n | `I18nStore` — see Decision 25 |

---

## Visual Templates

Three interchangeable visual templates. The active template is configured per tenant in `landing_template_settings.template`:

| Key | Aesthetic |
|---|---|
| `v1-maison` (default) | Upscale dark editorial — dark backgrounds, warm amber/copper accents, serif typography |
| `v2-editorial` | Clean magazine layout — light background, structured grid, strong typographic hierarchy |
| `v3-cinematic` | Full-bleed cinematic — large imagery, dramatic typography, high contrast |

Templates are React components in `/landing/src/templates/`. All three receive identical props and render the complete page (navigation, hero, menu section, reservation CTA, account links, footer).

Switching templates requires only a backend config change — no frontend deploy needed.

---

## Database — `landing_template_settings`

Platform-level table (one row per tenant via `tenant_id` FK):

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK tenants |
| `template` | VARCHAR(30) | `v1-maison` \| `v2-editorial` \| `v3-cinematic` |
| `custom_css` | TEXT | nullable — raw CSS injected into `<style>` tag |
| `is_custom_css_enabled` | BOOLEAN | default false |
| `content_blocks` | JSONB | flexible content sections (hero text, about, gallery, etc.) |
| `social_feeds` | JSONB | social media links and embeds |
| `featured_items` | JSONB | pinned menu items (overrides auto-selection) |
| `seo` | JSONB | `{ meta_title, meta_description, og_image_url, canonical_url }` |
| `supported_locales` | JSONB | list of locale strings, e.g. `["en-US", "fr-FR"]` |
| `created_at / updated_at` | TIMESTAMPTZ | |

---

## Backend API Endpoints

The landing app consumes these API endpoints:

```
GET  /api/v1/landing/config                     ← template + content config for this restaurant
GET  /api/v1/translations/{locale}?app=landing  ← flat key→value translation map
GET  /api/v1/customer/menu/{branchId}           ← public menu (86-filtered, dietary-filtered if logged in)
POST /api/v1/customer/auth/login                ← customer login → token
POST /api/v1/customer/auth/register             ← customer registration
GET  /api/v1/customer/auth/me                   ← rehydrate session
POST /api/v1/customer/auth/logout               ← revoke token
GET  /api/v1/customer/orders                    ← order history (auth required)
POST /api/v1/orders                             ← place online order (auth required, source: 'online')
```

---

## MST Stores

| Store | Key Fields / Actions |
|---|---|
| `AuthStore` | `isLoggedIn`, `name`, `email`, `loyaltyPoints`, `initials`; `login()`, `register()`, `logout()`, `fetchMe()` |
| `LandingConfigStore` | `template`, `customCss`, `contentBlocks`, `socialFeeds`, `featuredItems`, `seo`; `fetchConfig()` |
| `RestaurantStore` | Branch name, operating hours, contact info, menu categories |
| `CartStore` | In-memory cart items and totals; `addItem()`, `removeItem()`, `submit()` → POST /orders |
| `CustomerStore` | Full customer profile and order history for account area |
| `I18nStore` | `locale`, `supportedLocales`, `translations`; `t(key, vars?)`, `setLocale(locale)` |

---

## Routes

| Route | Auth Required | Description |
|---|---|---|
| `/` | No | Home page — renders active template |
| `/auth/login` | No | Customer login form |
| `/auth/register` | No | Customer registration form |
| `/account` | Yes | Account layout shell (redirects to /auth/login if not logged in) |
| `/account/orders` | Yes | Order history |
| `/menu` | No | Redirects to `/#menu` (menu section within home) |
| `/reserve` | No | Redirects to `/` (reservation via home template) |

---

## Multilanguage

Configured per tenant via `landing_template_settings.supported_locales`. The `LanguageSwitcher` component renders available locales. The `I18nStore` fetches translations lazily on locale switch.

Supported locale codes: `en-US`, `en-GB`, `fr-FR`, `es-ES`, `de-DE`, `de-AT`, `pl-PL`, `it-IT`

`en-US` is always included as the fallback. Missing translation keys fall back to the key string itself.

---

## Deployment

Same Jenkins + Terraform pattern as all other apps. See `.claude/skills/jenkins-terraform.md`.

Image: `ghcr.io/dishuoberoi/cheflogik-landing`  
Two-stage Docker build: `node:20-alpine` (Vite build) → `nginx:alpine` (static serve)  
`VITE_API_URL` baked in at build time. No `VITE_REVERB_*` needed.
