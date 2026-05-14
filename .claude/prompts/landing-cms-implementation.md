# Landing Page + CMS Management System — Implementation Prompt

> **READ THIS ENTIRE FILE BEFORE WRITING ANY CODE.**
> This is the master prompt for building the customer-facing landing page and CMS management
> interface. All architectural decisions are locked. Do not redesign — implement what is specified.

---

## Executive Summary

Two interconnected systems:

1. **`/landing` (new React + Vite app, port 5700)** — Customer-facing restaurant discovery platform
   - Multi-tenant: each restaurant has its own domain
   - 3 customizable templates (Maison, Editorial, Cinematic from `landing-ui/`)
   - Customer authentication (OTP 2-step registration), menu browsing, reservations, ordering
   - Loyalty program display (view-only in MVP)

2. **CMS Management Interface (in existing `/web` app)** — Restaurant owner content management
   - Routes under `_authenticated/landing-cms/`
   - Manage templates, CSS, galleries, featured items, social feeds, SEO, content blocks
   - Review moderation (approve/unpublish)

Both integrate with the existing Laravel backend at `/api`.

---

## Part 1: Architecture

### Multi-Tenant Domain Flow

```
Customer visits: myrestaurant.com
        ↓
/landing app calls GET /api/v1/landing/domain-lookup?domain=myrestaurant.com
        ↓
Backend queries landing_domains → returns { tenant_id, tenant_name, tenant_slug }
        ↓
Frontend stores tenant context; all subsequent calls include tenant context via Host header
        ↓
LandingDomainResolver middleware resolves tenant_id from Host header on every request
```

**Local dev:** `APP_ENV=local` → skip domain lookup; use `LANDING_TENANT_ID` env var instead.
Landing app runs on port **5700**.

### Controller Namespace

All landing controllers live under:
```
app/Http/Controllers/Api/V1/Landing/
```

### Route File

All landing routes are registered in `routes/landing.php` under the `/api/v1/landing` prefix.

### Middleware Scoping

- `LandingDomainResolver` — applied to all `/api/v1/landing/*` routes **except** `/cms/*`
- CMS routes (`/api/v1/landing/cms/*`) — use staff JWT `tenant_id` directly (no domain lookup)

### Customer Authentication

**Reuse the existing `CustomerAuthController`** at `Api/V1/Auth/CustomerAuthController`.
Customers are platform-level (Decision 3). The landing page uses the same auth as the customer
portal. New OTP methods (`registerInitiate`, `registerVerify`) are added to that controller.

Existing auth routes (`routes/customer.php`) already expose:
- `POST /api/v1/customer/auth/login`
- `POST /api/v1/customer/auth/logout`
- `GET  /api/v1/customer/auth/me`
- `POST /api/v1/customer/auth/forgot-password`
- `POST /api/v1/customer/auth/reset-password/email`

New OTP routes added to `routes/customer.php`:
- `POST /api/v1/customer/auth/register/initiate`
- `POST /api/v1/customer/auth/register/verify`

### Services

```
app/Services/Landing/
  LandingConfigService.php     ← aggregates all CMS data; Redis cache wrapper
  DomainResolverService.php    ← Host header → tenant_id lookup
```

### Frontend Architecture (`/landing`)

Same conventions as `/web`:
```
/landing
  src/
    routes/        TanStack Router (file-based)
    stores/        MST models (RootStore pattern)
    components/
    services/      ApiService (typed)
    styles/
    templates/     3 template components
  vite.config.ts   ← port 5700
  tsconfig.json    ← strict: true
  package.json
```

**MST RootStore:**
```
RootStore
  ├── AuthStore         (customer JWT, tenant context, login/logout/OTP)
  ├── RestaurantStore   (tenant metadata, branches, menu, hours, reviews)
  ├── CartStore         (items, total, checkout)
  ├── LandingConfigStore (template choice, custom CSS, content blocks)
  └── CustomerStore     (profile, loyalty points, order history)
```

---

## Part 2: API Endpoints

### Domain Lookup (No Auth)

```
GET /api/v1/landing/domain-lookup?domain=myrestaurant.com
  Returns: { tenant_id, tenant_name, tenant_slug }
```

### Customer Auth (existing CustomerAuthController — add OTP methods)

```
POST /api/v1/customer/auth/register/initiate
  Body:    { name, email, phone, password }
  Action:  Save to landing_pending_customer_registrations; send OTP via Laravel mailer (SES)
  Returns: { message: "OTP sent to email" }

POST /api/v1/customer/auth/register/verify
  Body:    { email, otp_code }
  Action:  Verify OTP (expires 15 min); create customer_profile + customer_tenant_profile;
           delete pending record
  Returns: { access_token, customer: { id, name, email, phone } }

POST /api/v1/customer/auth/login            (existing)
POST /api/v1/customer/auth/logout           (existing, auth:customer)
GET  /api/v1/customer/auth/me               (existing, auth:customer)
POST /api/v1/customer/auth/forgot-password  (existing)
POST /api/v1/customer/auth/reset-password/email (existing)
```

**Rate limiting:** Apply `throttle:5,1` (5 req/min per IP) to all `auth/*` endpoints.

### Public Landing Endpoints (LandingDomainResolver resolves tenant from Host header)

```
GET  /api/v1/landing/restaurant
  Returns: { name, description, phone, address, cuisine, neighborhood }

GET  /api/v1/landing/branches
  Returns: [{ id, name, address, phone, hours, features }]

GET  /api/v1/landing/menu
  Returns: [{ id, name, subtitle, items: [{ id, name, desc, price, tags, is_eighty_six }] }]

GET  /api/v1/landing/opening-hours
  Returns: [{ day, open, close, special_notes }]

GET  /api/v1/landing/events
  Returns: [{ id, title, date, time, description, image_url, capacity, price }]

GET  /api/v1/landing/reviews
  Query:   ?branch_id=&limit=10&offset=0
  Returns: [{ id, customer_name, rating, review_text, branch_name, created_at }]
  Note:    Only is_published = true records

GET  /api/v1/landing/config
  Returns: { template, customCss, contentBlocks, socialFeeds, featuredItems, seo }
  Note:    Redis cached — key: landing_config:{tenant_id}, TTL 5 min
```

### Guest Reservation (No Auth — uses existing reservations table)

```
POST /api/v1/landing/reservations
  Body:    { branch_id, date, time, party_size, name, email, phone, special_requests? }
  Action:  Creates record in existing reservations table with customer_profile_id = null,
           source = 'landing'. Visible immediately in /web reservations list.
  Returns: { reservation_id, confirmation_code }
```

**Controller:** `Api/V1/Landing/ReservationController` → calls existing `ReservationService`.

### Customer-Authenticated Endpoints (auth:customer + tenant-scoped token)

```
POST /api/v1/landing/orders
  Body:    { branch_id, items: [{ menu_item_id, quantity, notes? }],
             type: 'pickup'|'delivery', delivery_address? }
  Returns: { order_id, status, estimated_time }

GET  /api/v1/landing/orders
  Returns: [{ id, status, total, created_at }]

GET  /api/v1/landing/orders/{id}
  Returns: { id, status, items, total, estimated_time }
```

**Controller:** `Api/V1/Landing/OrderController` → delegates to existing `OrderService`.
Do NOT duplicate order business logic. Call `OrderService` directly.

### CMS Endpoints (auth:staff + `landing.manage_content` permission)

All CMS writes must:
1. Invalidate `Cache::forget("landing_config:{$tenant->id}")`
2. Write to `audit_log` via `AuditLog::record(...)`

```
-- Restaurant metadata --
PUT  /api/v1/landing/cms/restaurant
  Body: { description, cuisine, neighborhood }

-- Galleries --
GET    /api/v1/landing/cms/gallery
POST   /api/v1/landing/cms/gallery
  Body: { title, images: [{ url, caption, alt }] }
PUT    /api/v1/landing/cms/gallery/{id}
DELETE /api/v1/landing/cms/gallery/{id}

-- Featured Items --
GET    /api/v1/landing/cms/featured-items
POST   /api/v1/landing/cms/featured-items
  Body: { menu_item_id, sort_order }
PUT    /api/v1/landing/cms/featured-items/{id}
  Body: { sort_order }
DELETE /api/v1/landing/cms/featured-items/{id}

-- Social Feeds --
GET    /api/v1/landing/cms/social-feeds
POST   /api/v1/landing/cms/social-feeds
  Body: { platform: 'instagram'|'facebook', account_handle, embed_code }
PUT    /api/v1/landing/cms/social-feeds/{id}
DELETE /api/v1/landing/cms/social-feeds/{id}

-- Template & CSS --
GET  /api/v1/landing/cms/template-settings
PUT  /api/v1/landing/cms/template-settings
  Body: { template: 'v1-maison'|'v2-editorial'|'v3-cinematic', custom_css, is_custom_css_enabled }
  Note: CSS sanitized via sabberworm/php-css-parser BEFORE writing to DB (see Part 7)

-- SEO --
GET  /api/v1/landing/cms/seo
PUT  /api/v1/landing/cms/seo
  Body: { meta_title, meta_description, og_image_url, canonical_url }

-- Content Blocks --
GET    /api/v1/landing/cms/content-blocks
POST   /api/v1/landing/cms/content-blocks
  Body: { section: string, type: 'html'|'gallery'|'promo', content, sort_order }
PUT    /api/v1/landing/cms/content-blocks/{id}
DELETE /api/v1/landing/cms/content-blocks/{id}

-- Review Moderation --
GET    /api/v1/landing/cms/reviews              all reviews (published + pending)
PATCH  /api/v1/landing/cms/reviews/{id}/publish
PATCH  /api/v1/landing/cms/reviews/{id}/unpublish
DELETE /api/v1/landing/cms/reviews/{id}
```

---

## Part 3: Database Schema (10 new tables)

All tables: UUID primary keys (`gen_random_uuid()`), `tenant_id UUID NOT NULL FK → tenants`,
composite index on `(tenant_id, id)`. Use `TEXT` not `LONGTEXT`. Use `$table->enum(...)` in
Laravel migrations for enum columns (PostgreSQL-compatible CHECK constraint).

### `landing_domains`
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
domain      VARCHAR(255) UNIQUE NOT NULL
is_active   BOOLEAN DEFAULT true
created_at  TIMESTAMPTZ
updated_at  TIMESTAMPTZ

INDEX (tenant_id, id)
```

### `landing_galleries`
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
title       VARCHAR(255)
created_at  TIMESTAMPTZ
updated_at  TIMESTAMPTZ

INDEX (tenant_id, id)
```

### `landing_gallery_images`
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
gallery_id  UUID NOT NULL REFERENCES landing_galleries(id) ON DELETE CASCADE
image_url   VARCHAR(2048)
caption     TEXT
alt_text    VARCHAR(255)
sort_order  INT DEFAULT 0
created_at  TIMESTAMPTZ

INDEX (tenant_id, gallery_id)
```

### `landing_featured_items`
```sql
id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE
sort_order   INT DEFAULT 0
created_at   TIMESTAMPTZ
updated_at   TIMESTAMPTZ

INDEX (tenant_id, id)
UNIQUE (tenant_id, menu_item_id)
```

### `landing_social_feeds`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
platform        VARCHAR(20) NOT NULL     -- 'instagram' | 'facebook'
account_handle  VARCHAR(255)
embed_code      TEXT
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ

INDEX (tenant_id, id)
```

### `landing_template_settings`
```sql
id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
template_name         VARCHAR(30) NOT NULL DEFAULT 'v1-maison'
custom_css            TEXT                         -- sanitized before storage
is_custom_css_enabled BOOLEAN DEFAULT false
created_at            TIMESTAMPTZ
updated_at            TIMESTAMPTZ

UNIQUE (tenant_id)
```

### `landing_seo_metadata`
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
meta_title        VARCHAR(255)
meta_description  TEXT
og_image_url      VARCHAR(2048)
canonical_url     VARCHAR(2048)
created_at        TIMESTAMPTZ
updated_at        TIMESTAMPTZ

UNIQUE (tenant_id)
```

### `landing_content_blocks`
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
section     VARCHAR(100)   -- e.g. 'hero', 'about', 'features'
type        VARCHAR(20)    -- 'html' | 'gallery' | 'promo'
content     TEXT
sort_order  INT DEFAULT 0
is_active   BOOLEAN DEFAULT true
created_at  TIMESTAMPTZ
updated_at  TIMESTAMPTZ

INDEX (tenant_id, id)
```

### `landing_pending_customer_registrations`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
name            VARCHAR(255)
email           VARCHAR(255)
phone           VARCHAR(20)
password_hash   VARCHAR(255)
otp_code        VARCHAR(6)
otp_expires_at  TIMESTAMPTZ
created_at      TIMESTAMPTZ

INDEX (email, tenant_id)
INDEX (otp_expires_at)    -- for cleanup job
```

### `landing_reviews`
```sql
id             UUID PRIMARY KEY DEFAULT gen_random_uuid()
tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
branch_id      UUID REFERENCES branches(id) ON DELETE SET NULL
customer_id    UUID REFERENCES customer_profiles(id) ON DELETE SET NULL
customer_name  VARCHAR(255)    -- denormalized for display
rating         SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5)
review_text    TEXT
is_published   BOOLEAN DEFAULT false
created_at     TIMESTAMPTZ
updated_at     TIMESTAMPTZ

INDEX (tenant_id, is_published)
INDEX (tenant_id, branch_id)
```

---

## Part 4: Implementation Checklist

### Backend (`/api`)

**Dependencies:**
- [ ] `composer require sabberworm/php-css-parser`

**Migrations (run in this order):**
- [ ] `create_landing_domains_table`
- [ ] `create_landing_galleries_table`
- [ ] `create_landing_gallery_images_table`
- [ ] `create_landing_featured_items_table`
- [ ] `create_landing_social_feeds_table`
- [ ] `create_landing_template_settings_table`
- [ ] `create_landing_seo_metadata_table`
- [ ] `create_landing_content_blocks_table`
- [ ] `create_landing_pending_customer_registrations_table`
- [ ] `create_landing_reviews_table`

**Models** (all use `HasTenantScope` trait):
- [ ] `LandingDomain`, `LandingGallery`, `LandingGalleryImage`
- [ ] `LandingFeaturedItem`, `LandingSocialFeed`
- [ ] `LandingTemplateSettings`, `LandingSeoMetadata`
- [ ] `LandingContentBlock`, `LandingPendingCustomerRegistration`
- [ ] `LandingReview`

**Services:**
- [ ] `Services/Landing/LandingConfigService.php`
  - `getConfig(string $tenantId)` — Redis `Cache::remember("landing_config:{$tenantId}", 300, ...)`
  - `invalidateConfig(string $tenantId)` — `Cache::forget(...)`
- [ ] `Services/Landing/DomainResolverService.php`
  - `resolve(string $host): ?string` — returns `tenant_id` or null

**Middleware:**
- [ ] `LandingDomainResolver.php` — extracts Host header, calls `DomainResolverService`, sets `$request->attributes->set('tenant_id', ...)`

**Controllers:**
- [ ] `Api/V1/Landing/RestaurantController.php` — `restaurant()`, `branches()`, `menu()`, `openingHours()`, `events()`, `reviews()`, `config()`
- [ ] `Api/V1/Landing/ReservationController.php` — `store()` → calls `ReservationService`
- [ ] `Api/V1/Landing/OrderController.php` — `index()`, `store()`, `show()` → calls `OrderService`
- [ ] `Api/V1/Landing/CmsController.php` — all CMS CRUD (restaurant, gallery, featured items, social feeds, template, SEO, content blocks)
- [ ] `Api/V1/Landing/CmsReviewController.php` — `index()`, `publish()`, `unpublish()`, `destroy()`
- [ ] `Api/V1/Auth/CustomerAuthController.php` — ADD `registerInitiate()` and `registerVerify()` methods

**Routes:**
- [ ] `routes/landing.php` — register all `/api/v1/landing/*` routes; apply `LandingDomainResolver` middleware to all except `/cms/*`
- [ ] Add OTP routes to `routes/customer.php` — `register/initiate` and `register/verify`

**Permissions:**
- [ ] Add `landing.manage_content` to `PermissionSeeder`

**Tests:**
- [ ] Feature tests for all public endpoints
- [ ] Feature tests for CMS endpoints (assert 403 without permission)
- [ ] Tenant isolation tests (Tenant A data invisible to Tenant B)
- [ ] OTP flow test (initiate → verify → customer created)
- [ ] Domain resolution test
- [ ] Redis cache invalidation test (CMS write → config re-fetched fresh)

### Frontend `/landing` (new app)

**Setup:**
- [ ] Scaffold Vite + React 19 + TypeScript app at `/landing`
- [ ] Configure port 5700 in `vite.config.ts`
- [ ] `npm install mobx mobx-state-tree @tanstack/react-router css-tree`
- [ ] Copy `ApiService` pattern from `/web/src/services/api.ts`

**Stores:**
- [ ] `AuthStore.ts` — customer JWT, OTP flow actions, tenant context
- [ ] `RestaurantStore.ts` — fetch restaurant info, branches, menu, hours, reviews
- [ ] `LandingConfigStore.ts` — fetch config (template, customCss, contentBlocks, socialFeeds)
- [ ] `CartStore.ts` — add/remove items, quantity, checkout
- [ ] `CustomerStore.ts` — profile, loyalty balance, order history
- [ ] `RootStore.ts` — compose all stores

**Templates (convert from `landing-ui/`):**
- [ ] `templates/MaisonTemplate.tsx` ← from `landing-ui/v1-maison-app.jsx`
- [ ] `templates/EditorialTemplate.tsx` ← from `landing-ui/v2-editorial-app.jsx`
- [ ] `templates/CinematicTemplate.tsx` ← from `landing-ui/v3-cinematic-app.jsx`
- All 3 templates receive same data shape as props from MST stores
- All 3 are mobile-first responsive (mobile/tablet/desktop breakpoints)

**Components:**
- [ ] `Navigation.tsx` — cart icon, login/account link, loyalty points display
- [ ] `Menu.tsx` — categories, items, filters, add to cart
- [ ] `ReservationForm.tsx` — date/time/party size picker; calls POST /api/v1/landing/reservations
- [ ] `OtpVerificationForm.tsx` — 2-step: collect info → enter OTP → account created
- [ ] `Gallery.tsx` — lightbox, carousel
- [ ] `SocialFeeds.tsx` — render embed_code safely (sanitize before dangerouslySetInnerHTML)
- [ ] `Reviews.tsx` — paginated list; branch filter if multi-branch tenant
- [ ] `FeaturedItems.tsx` — carousel from LandingConfigStore
- [ ] `Cart.tsx` — slide-out panel, quantity controls, checkout button

**Routes:**
- [ ] `src/routes/index.tsx` — homepage; resolves domain, loads template from LandingConfigStore
- [ ] `src/routes/auth.login.tsx`
- [ ] `src/routes/auth.register.tsx` — OTP 2-step flow
- [ ] `src/routes/menu.tsx`
- [ ] `src/routes/reserve.tsx`
- [ ] `src/routes/account.tsx` — customer profile + loyalty
- [ ] `src/routes/account.orders.tsx`

**CSS sanitizer (client-side, defense-in-depth):**
- [ ] Use `css-tree` to sanitize `customCss` before injecting `<style>` tag (see Part 7)

### Frontend `/web` (CMS additions)

**New store:**
- [ ] `src/stores/LandingCmsStore.ts` — CRUD actions for all CMS resources
- [ ] Add to `src/stores/root.ts`: `landingCms: types.optional(LandingCmsStore, {})`

**New routes** (under `src/routes/_authenticated/landing-cms/`):
- [ ] `index.tsx` — redirect to template-settings
- [ ] `template-settings.tsx` — template selector + CSS editor
- [ ] `gallery.tsx` — gallery albums list + image manager
- [ ] `featured-items.tsx` — searchable menu item selector with sort_order
- [ ] `social-feeds.tsx` — platform + embed code form
- [ ] `seo.tsx` — meta title/description/og:image/canonical form
- [ ] `content-blocks.tsx` — HTML content block editor
- [ ] `reviews.tsx` — review moderation table (approve / unpublish / delete)

**New components** (under `src/components/LandingCms/`):
- [ ] `TemplateSettings.tsx`
- [ ] `GalleryManager.tsx` — drag-drop image upload
- [ ] `FeaturedItemsSelector.tsx`
- [ ] `SocialFeedForm.tsx`
- [ ] `SeoForm.tsx`
- [ ] `ContentBlockEditor.tsx`
- [ ] `ReviewModerationTable.tsx`

**Permission guard:** All `/landing-cms/*` pages check `authStore.can('landing.manage_content')`.

---

## Part 5: File Structure

```
/api (Laravel)
  app/Http/Controllers/Api/V1/Landing/
    ├── RestaurantController.php
    ├── ReservationController.php
    ├── OrderController.php
    ├── CmsController.php
    └── CmsReviewController.php
  app/Http/Controllers/Api/V1/Auth/
    └── CustomerAuthController.php     ← ADD registerInitiate(), registerVerify()
  app/Http/Middleware/
    └── LandingDomainResolver.php
  app/Services/Landing/
    ├── LandingConfigService.php
    └── DomainResolverService.php
  app/Models/
    ├── LandingDomain.php
    ├── LandingGallery.php
    ├── LandingGalleryImage.php
    ├── LandingFeaturedItem.php
    ├── LandingSocialFeed.php
    ├── LandingTemplateSettings.php
    ├── LandingSeoMetadata.php
    ├── LandingContentBlock.php
    ├── LandingPendingCustomerRegistration.php
    └── LandingReview.php
  routes/
    └── landing.php

/landing (new React app)
  src/
    routes/
      index.tsx
      auth.login.tsx
      auth.register.tsx
      menu.tsx
      reserve.tsx
      account.tsx
      account.orders.tsx
    stores/
      RootStore.ts
      AuthStore.ts
      RestaurantStore.ts
      LandingConfigStore.ts
      CartStore.ts
      CustomerStore.ts
    templates/
      MaisonTemplate.tsx
      EditorialTemplate.tsx
      CinematicTemplate.tsx
    components/
      Navigation.tsx
      Menu.tsx
      ReservationForm.tsx
      OtpVerificationForm.tsx
      Gallery.tsx
      SocialFeeds.tsx
      Reviews.tsx
      FeaturedItems.tsx
      Cart.tsx
    services/
      ApiService.ts
    styles/
      global.css
      templates.css
      theme.css
  vite.config.ts       ← port 5700
  tsconfig.json
  package.json

/web (existing app — additions only)
  src/
    stores/
      LandingCmsStore.ts                     ← NEW
      root.ts                                ← ADD landingCms store
    routes/_authenticated/landing-cms/
      index.tsx
      template-settings.tsx
      gallery.tsx
      featured-items.tsx
      social-feeds.tsx
      seo.tsx
      content-blocks.tsx
      reviews.tsx
    components/LandingCms/
      TemplateSettings.tsx
      GalleryManager.tsx
      FeaturedItemsSelector.tsx
      SocialFeedForm.tsx
      SeoForm.tsx
      ContentBlockEditor.tsx
      ReviewModerationTable.tsx
```

---

## Part 6: Key Implementation Notes

### OTP Registration Flow

```
1. Customer submits: POST /api/v1/customer/auth/register/initiate
   { name, email, phone, password }

2. Backend:
   - Hash password
   - Generate 6-digit OTP
   - Save to landing_pending_customer_registrations
     { tenant_id, name, email, phone, password_hash, otp_code, otp_expires_at: now+15min }
   - Send OTP email via Laravel mailer (SES in production)
   - Return: { message: "OTP sent to email" }

3. Customer submits: POST /api/v1/customer/auth/register/verify
   { email, otp_code }

4. Backend:
   - Find pending record by email + tenant_id
   - Check otp_code matches and otp_expires_at > now()
   - Create customer_profile (name, email, phone, password_hash)
   - Create customer_tenant_profile for this tenant
   - Delete pending record
   - Return: { access_token, customer: { id, name, email } }
```

### Guest Reservation Flow

```
POST /api/v1/landing/reservations
  { branch_id, date, time, party_size, name, email, phone, special_requests }

LandingReservationController:
  - Resolve tenant_id from request (set by LandingDomainResolver middleware)
  - Call ReservationService::create([
      'tenant_id'          => $tenantId,
      'branch_id'          => $request->branch_id,
      'customer_profile_id'=> null,
      'guest_name'         => $request->name,
      'guest_email'        => $request->email,
      'guest_phone'        => $request->phone,
      'reservation_date'   => $request->date,
      'reservation_time'   => $request->time,
      'party_size'         => $request->party_size,
      'special_requests'   => $request->special_requests,
      'source'             => 'landing',
    ])
  - Return: { reservation_id, confirmation_code }

Staff sees this reservation immediately in /web reservations list.
```

### Landing Config Redis Caching

```php
// LandingConfigService
public function getConfig(string $tenantId): array
{
    return Cache::remember("landing_config:{$tenantId}", 300, function () use ($tenantId) {
        return [
            'template'      => LandingTemplateSettings::where('tenant_id', $tenantId)->first(),
            'contentBlocks' => LandingContentBlock::where('tenant_id', $tenantId)->where('is_active', true)->orderBy('sort_order')->get(),
            'socialFeeds'   => LandingSocialFeed::where('tenant_id', $tenantId)->where('is_active', true)->get(),
            'featuredItems' => LandingFeaturedItem::with('menuItem')->where('tenant_id', $tenantId)->orderBy('sort_order')->get(),
            'seo'           => LandingSeoMetadata::where('tenant_id', $tenantId)->first(),
        ];
    });
}

public function invalidateConfig(string $tenantId): void
{
    Cache::forget("landing_config:{$tenantId}");
}
```

Call `$this->landingConfigService->invalidateConfig($tenant->id)` in every CMS controller
write method (PUT, POST, DELETE) before returning the response.

### CSS Sanitization

**Backend (authoritative — runs on save):**
```php
// In CmsController::updateTemplateSettings()
use Sabberworm\CSS\Parser as CssParser;
use Sabberworm\CSS\RuleSet\DeclarationBlock;
use Sabberworm\CSS\AtRule\Import;

$parser = new CssParser($request->custom_css);
$doc = $parser->parse();

// Remove @import at-rules
foreach ($doc->getAllValues() as $value) { ... }
// Strip :root, html, body, * selectors
foreach ($doc->getAllDeclarationBlocks() as $block) {
    $selectors = array_map(fn($s) => trim($s->getSelector()), $block->getSelectors());
    foreach ($selectors as $sel) {
        if (preg_match('/^(:root|html|body|\*)/', $sel)) {
            $doc->remove($block);
            break;
        }
    }
}

$sanitizedCss = $doc->render();
```

**Frontend `/landing` (defense-in-depth — runs on render):**
```typescript
// npm install css-tree
import { parse, generate, walk } from 'css-tree'

export function sanitizeCss(raw: string): string {
  const ast = parse(raw, { parseAtrulePrelude: false })
  walk(ast, (node, item, list) => {
    if (node.type === 'Atrule' &&
        ['import', 'charset', 'namespace'].includes(node.name)) {
      list?.remove(item)
    }
    if (node.type === 'Rule') {
      const sel = generate(node.prelude)
      if (/(?:^|,)\s*(?::root|html|body|\*)\b/.test(sel)) {
        list?.remove(item)
      }
    }
  })
  return generate(ast)
}

// Usage in template component:
const safeCss = useMemo(() => sanitizeCss(config.customCss ?? ''), [config.customCss])

return (
  <>
    <style>{`.landing-container { ${safeCss} }`}</style>
    <div className="landing-container">...</div>
  </>
)
```

### Tenant Isolation

- All landing models use `HasTenantScope` trait
- `LandingDomainResolver` middleware sets `tenant_id` on the request
- CMS controllers verify `auth('staff')->user()->tenant_id` matches the resource's `tenant_id`
- Never query without tenant scope

```php
// In CmsController — all queries
LandingGallery::where('tenant_id', auth('staff')->user()->tenant_id)->get();

// NOT this:
LandingGallery::find($id);  // ← no tenant scope, security risk
```

### Rate Limiting

```php
// In routes/customer.php — wrap auth routes
Route::middleware('throttle:5,1')->group(function () {
    Route::post('/auth/register/initiate', ...);
    Route::post('/auth/register/verify', ...);
    Route::post('/auth/login', ...);
    Route::post('/auth/forgot-password', ...);
});
```

### Audit Logging (All CMS Writes)

```php
// In every CMS write method
AuditLog::record(
    actor: auth('staff')->user(),
    action: 'landing.gallery.created',
    resourceType: 'landing_gallery',
    resourceId: $gallery->id,
    changes: $gallery->getChanges(),
);
```

### Domain Resolution — Local Dev

```php
// In LandingDomainResolver::handle()
if (app()->environment('local')) {
    $tenantId = config('landing.local_tenant_id'); // from LANDING_TENANT_ID env var
    $request->attributes->set('tenant_id', $tenantId);
    return $next($request);
}
// Production: resolve from Host header
```

---

## Part 7: Decisions Reference

| Decision | Choice |
|----------|--------|
| Customer auth | Reuse existing `CustomerAuthController`; add OTP methods |
| Registration flow | OTP 2-step: initiate → email OTP → verify → account created |
| Guest reservation | Existing `reservations` table; `customer_profile_id = null`; `source = 'landing'` |
| Controller namespace | `Api/V1/Landing/` |
| Route file | `routes/landing.php` |
| API version prefix | `/api/v1/landing/*` |
| Landing app port | 5700 |
| Services folder | `app/Services/Landing/` |
| Redis config cache | `landing_config:{tenant_id}`, TTL 5 min, invalidated on every CMS write |
| CSS sanitizer (PHP) | `sabberworm/php-css-parser` — sanitize on save |
| CSS sanitizer (npm) | `css-tree` — sanitize on render (defense-in-depth) |
| Web CMS routes | `src/routes/_authenticated/landing-cms/` directory |
| LandingCmsStore | Create new; add to `root.ts` |
| Review moderation | CMS endpoints + `/web` moderation page; `is_published = false` by default |
| Order endpoints | `LandingOrderController` delegates to existing `OrderService` |
| `order` column name | `sort_order` everywhere |
| Table prefix | All tables prefixed `landing_` |
| `tenant_id` on all tables | Yes — including `landing_gallery_images` |
| `branch_id` on reviews | Yes — nullable UUID |
| Table count | 10 |
| Rate limiting | `throttle:5,1` on all auth endpoints |
| Audit logging | All CMS writes logged to `audit_log` |
| Email | Laravel mailer (SES in production) — no special wiring |

---

## Part 8: Success Criteria

When complete, you must be able to:

- [ ] Access landing page at `localhost:5700`
- [ ] Domain-lookup API resolves tenant from domain string
- [ ] All 3 templates render correctly from same data
- [ ] Browse restaurant info, menu, hours, events, reviews
- [ ] Customer OTP registration: receive email OTP, verify, account created
- [ ] Customer login works; loyalty balance visible
- [ ] Guest reservation submitted → visible immediately in `/web` reservations list
- [ ] Authenticated customer can place an order on landing page
- [ ] Staff can login to `/web`, navigate to Landing CMS section
- [ ] Staff can select template, enable/edit custom CSS
- [ ] Staff can manage galleries, featured items, social feeds, SEO, content blocks
- [ ] Staff can moderate reviews (approve/unpublish/delete)
- [ ] Custom CSS sanitized on save (backend) and render (frontend)
- [ ] Config cached in Redis; CMS write invalidates cache
- [ ] Rate limiting active on auth endpoints
- [ ] All CMS writes audit-logged
- [ ] Tenant A cannot see or edit Tenant B's landing data
- [ ] Tests pass: feature, tenant isolation, OTP flow, cache invalidation
