# Landing Page + CMS — Full Implementation Plan

## Context
Building two interconnected systems from scratch per the spec in `.claude/prompts/landing-cms-implementation.md`:
1. `/landing` — new React 19 + Vite app (port 5700) for customer-facing restaurant discovery
2. CMS routes in `/web` — staff-facing content management for the landing page
Both integrate with the existing Laravel backend at `/api`.

---

## Implementation Order

### Phase A — Backend (`/api`)

#### A1. Dependency & Config
- `composer require sabberworm/php-css-parser` in `/api`
- Create `config/landing.php`: `['local_tenant_id' => env('LANDING_TENANT_ID')]`
- Add `landing.manage_content` to `config/permissions.php`

#### A2. Migrations (11 new tables/columns, date prefix `2026_05_14`)
Run in this order (FK dependencies):
1. `create_landing_domains_table`
2. `create_landing_galleries_table`
3. `create_landing_gallery_images_table`
4. `create_landing_featured_items_table`
5. `create_landing_social_feeds_table`
6. `create_landing_template_settings_table`
7. `create_landing_seo_metadata_table`
8. `create_landing_content_blocks_table`
9. `create_landing_pending_customer_registrations_table`
10. `create_landing_reviews_table`
11. `add_supported_locales_to_landing_template_settings` — adds `json supported_locales DEFAULT '["en-US"]'`

Schema per spec (Part 3): UUID PKs via `gen_random_uuid()`, `tenant_id UUID NOT NULL FK → tenants`, composite index `(tenant_id, id)`.

Note: `landing_gallery_images` uses `$table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'))` pattern — same as all other migrations.

#### A3. Models (10 models, all with `HasTenantScope` + `HasUuids`)
Under `app/Models/`:
- `LandingDomain`, `LandingGallery`, `LandingGalleryImage`
- `LandingFeaturedItem` (with `menuItem()` belongsTo), `LandingSocialFeed`
- `LandingTemplateSettings`, `LandingSeoMetadata`
- `LandingContentBlock`, `LandingPendingCustomerRegistration`
- `LandingReview`

`LandingPendingCustomerRegistration` — use `HasTenantScope` + `HasUuids` but no `updated_at` (no `timestamps()`; only `created_at`).

#### A4. Services
`app/Services/Landing/DomainResolverService.php`:
```php
public function resolve(string $host): ?string
{
    return Cache::remember("landing_domain:{$host}", 300, function () use ($host) {
        return LandingDomain::withoutGlobalScope(TenantScope::class)
            ->where('domain', $host)
            ->where('is_active', true)
            ->value('tenant_id');
    });
}
```

`app/Services/Landing/LandingConfigService.php`:
- `getConfig(string $tenantId): array` — `Cache::remember("landing_config:{$tenantId}", 300, ...)`
- `invalidateConfig(string $tenantId): void` — `Cache::forget(...)`

#### A5. Middleware
`app/Http/Middleware/LandingDomainResolver.php`:
- Local env: read from `config('landing.local_tenant_id')`, set `resolved_tenant_id` on request attributes
- Production: extract Host header (strip port), call `DomainResolverService::resolve()`, abort 404 if null
- Sets `$request->attributes->set('resolved_tenant_id', $tenantId)` — matches what `HasTenantScope` reads

Register middleware alias in `bootstrap/app.php`:
```php
$middleware->alias(['landing.domain' => LandingDomainResolver::class]);
```

#### A6. Form Requests (under `app/Http/Requests/Landing/`)
- `GuestReservationRequest` — branch_id, date, time, party_size, name, email, phone, special_requests?
- `InitiateRegistrationRequest` — name, email, phone, password
- `VerifyOtpRequest` — email, otp_code
- `StoreOrderRequest` — branch_id, items[], type, delivery_address?
- `CmsGalleryRequest`, `CmsFeaturedItemRequest`, `CmsSocialFeedRequest`
- `CmsTemplateSettingsRequest`, `CmsSeoRequest`, `CmsContentBlockRequest`
- `CmsRestaurantRequest`

#### A7. Controllers (under `app/Http/Controllers/Api/V1/Landing/`)

**RestaurantController** — public methods: `restaurant()`, `branches()`, `menu()`, `openingHours()`, `events()`, `reviews()`, `config()`
- All read `$request->attributes->get('resolved_tenant_id')`
- `config()` delegates to `LandingConfigService::getConfig()`

**ReservationController** — `store()` only
- Calls existing `ReservationService::create()` with `customer_profile_id = null`, `source = 'landing'`
- Returns `{ reservation_id, confirmation_code }`

**OrderController** — `index()`, `store()`, `show()`
- All require `auth:customer`
- Delegates to existing `OrderService`

**CmsController** — all CMS CRUD for restaurant, gallery, featured items, social feeds, template settings, SEO, content blocks
- All require `auth:staff` + `permission:landing.manage_content`
- Every write: `AuditLogger::log(...)` + `LandingConfigService::invalidateConfig($tenantId)`
- CSS sanitization: parse with `sabberworm/php-css-parser`, strip @import and `:root/html/body/*` selectors
- All queries scoped: `LandingGallery::where('tenant_id', auth('staff')->user()->tenant_id)`
- Uses injected `AuditLogger` and `LandingConfigService`

**CmsReviewController** — `index()`, `publish()`, `unpublish()`, `destroy()`
- Same auth requirements + audit + cache invalidation

**ReviewController** — `store()` only (customer-facing review submission)
- Requires `auth:customer` + `landing.domain` middleware
- Body: `{ branch_id?, rating (1-5), review_text? }`
- Sets `tenant_id` from `resolved_tenant_id`, `customer_id` from `auth('customer')->user()->id`, `customer_name` from auth'd customer profile (denormalized), `is_published = false`
- Returns `{ review_id, message: "Review submitted for moderation" }`

**CustomerAuthController additions** — `registerInitiate()`, `registerVerify()`
- `registerInitiate`: hash password, generate 6-digit OTP, save to `landing_pending_customer_registrations`, send email via `Mail::to($email)->send(new OtpEmail($otp))`, return `{message: "OTP sent to email"}`
- `registerVerify`: find pending record by email+tenant_id, check OTP+expiry, create `customer_profile` + `customer_tenant_profile`, delete pending record, return `{access_token, customer}`
- tenant_id resolved from request attribute (set by LandingDomainResolver)

#### A8. Routes
`routes/landing.php`:
```php
Route::prefix('v1/landing')->group(function () {
    // Public — LandingDomainResolver resolves tenant
    Route::middleware('landing.domain')->group(function () {
        Route::get('/domain-lookup', [RestaurantController::class, 'domainLookup']);
        Route::get('/restaurant', [RestaurantController::class, 'restaurant']);
        // ... all public routes

        // Guest reservation (no auth)
        Route::post('/reservations', [ReservationController::class, 'store']);

        // Customer-authenticated endpoints
        Route::middleware('auth:customer')->group(function () {
            Route::get('/orders',      [OrderController::class, 'index']);
            Route::post('/orders',     [OrderController::class, 'store']);
            Route::get('/orders/{id}', [OrderController::class, 'show']);
            Route::post('/reviews',    [ReviewController::class, 'store']);
        });
    });

    // CMS — staff auth, no domain resolver (tenant from JWT)
    Route::prefix('cms')->middleware(['auth:staff', 'tenant', 'permission:landing.manage_content'])->group(function () {
        // ... all CMS routes
    });
});
```

Register in `bootstrap/app.php` `then` callback (same pattern as customer.php).

Add OTP routes to `routes/customer.php` wrapped in `throttle:5,1`:
```php
Route::middleware('throttle:5,1')->group(function () {
    Route::post('/auth/register/initiate', [CustomerAuthController::class, 'registerInitiate']);
    Route::post('/auth/register/verify', [CustomerAuthController::class, 'registerVerify']);
});
```

#### A9. Email
Create `app/Mail/Landing/OtpRegistrationMail.php` (Mailable, plain text + HTML view).
Create `resources/views/emails/landing/otp-registration.blade.php`.

#### A10. OTP Cleanup — Artisan Command + Scheduler
Create `app/Console/Commands/PurgeExpiredLandingRegistrations.php`:
```php
class PurgeExpiredLandingRegistrations extends Command
{
    protected $signature   = 'landing:purge-expired-registrations';
    protected $description = 'Delete expired OTP records from landing_pending_customer_registrations';

    public function handle(): void
    {
        $deleted = LandingPendingCustomerRegistration::where('otp_expires_at', '<', now())->delete();
        $this->info("Purged {$deleted} expired registration(s).");
    }
}
```

Register in `app/Console/Kernel.php` (or `bootstrap/app.php` Schedule facade if Laravel 12 uses that pattern):
```php
Schedule::command('landing:purge-expired-registrations')->daily();
```

---

### Phase B — Frontend `/landing` (new Vite app)

#### B1. Scaffold
Create `/landing/` directory with:
- `package.json` — React 19, TypeScript, Vite 6, MST, TanStack Router, axios, css-tree, tailwindcss
- `vite.config.ts` — port 5700, TanStackRouterVite plugin, `@` alias to `src/`
- `tsconfig.json` — strict: true, paths for `@/*`
- `index.html`
- `src/main.tsx` — createStore(), createRouter(), render

#### B2. ApiService (`src/services/ApiService.ts`)
Copy pattern from `/web/src/services/api.ts`:
- Axios instance, base URL `VITE_API_URL ?? 'http://localhost:8000/api/v1'`
- `setToken()`, `setTenantId()` (sets Host or X-Tenant-Id header for local dev)
- Standard `get/post/put/patch/delete` methods

#### B3. MST Stores (`src/stores/`)

**AuthStore.ts** — customer JWT + OTP flow + tenant context:
- Fields: `customerId`, `token`, `name`, `email`, `phone`, `tenantId`, `tenantName`, `isAuthenticated`, `isLoading`, `error`
- Actions: `login(email, password)`, `logout()`, `initiateRegistration(name, email, phone, password)`, `verifyOtp(email, otpCode)`, `fetchMe()`
- Views: `isLoggedIn`

**RestaurantStore.ts** — restaurant data:
- Fields: restaurant info, branches[], menu[], hours[], events[], reviews[]
- Actions: `fetchRestaurant()`, `fetchBranches()`, `fetchMenu()`, `fetchHours()`, `fetchEvents()`, `fetchReviews(branchId?, limit?, offset?)`

**LandingConfigStore.ts** — template + content:
- Fields: `template` ('v1-maison'|'v2-editorial'|'v3-cinematic'), `customCss`, `isCustomCssEnabled`, `contentBlocks[]`, `socialFeeds[]`, `featuredItems[]`, `seo`
- Actions: `fetchConfig()`
- Views: `activeTemplate`

**CartStore.ts** — shopping cart:
- Fields: `items[]` (menuItemId, name, price, quantity), `branchId`, `type`
- Actions: `addItem(item)`, `removeItem(id)`, `updateQuantity(id, qty)`, `clear()`
- Views: `total`, `itemCount`

**CustomerStore.ts** — profile + orders:
- Fields: `profile`, `orders[]`, `isLoading`
- Actions: `fetchOrders()`, `fetchOrder(id)`, `placeOrder(payload)`, `fetchProfile()`

**I18nStore.ts** — locale + translations:
- Fields: `locale` (default `'en-US'`), `supportedLocales[]` (from config response), `translations` (frozen record), `isLoading`
- Actions: `setLocale(locale)` — fetches `/translations/{locale}?app=landing` via `api.get()`, persists to `localStorage`; `setSupportedLocales(locales)` — called by `LandingConfigStore.fetchConfig()` after receiving `supported_locales` from the config endpoint
- Views: `t(key, vars?)` — interpolated translation lookup with fallback to key
- Locale persistence: on init, read `localStorage.getItem('cl_landing_locale')` and restore if it's in `supportedLocales`
- Note: `supported_locales` column on `landing_template_settings` drives which locales a tenant enables (migration #11)

**RootStore.ts** — compose all stores, `createStore()` + `getStore()` singleton; includes `i18n: types.optional(I18nStore, {})`

**context.tsx** — React context wrapper exporting `StoreProvider` and per-store hooks:
`useAuth`, `useRestaurant`, `useConfig`, `useCart`, `useCustomer`, `useI18n`

#### B4. Templates (`src/templates/`)
Convert from `landing-ui/` JSX → TypeScript React, receive data from MST stores via hooks:

**MaisonTemplate.tsx** (from `v1-maison-app.jsx`):
- Accept `restaurantStore`, `configStore`, `cartStore`, `authStore` as props
- Replace `window.AUBERGINE` data references with store data
- Keep all styling/layout intact
- CSS sanitization: `useMemo(() => sanitizeCss(configStore.customCss ?? ''), [configStore.customCss])`

**EditorialTemplate.tsx** (from `v2-editorial-app.jsx`): same pattern

**CinematicTemplate.tsx** (from `v3-cinematic-app.jsx`): same pattern

Create `src/utils/sanitizeCss.ts` using `css-tree`:
```ts
import { parse, generate, walk } from 'css-tree'
export function sanitizeCss(raw: string): string { ... }
```

#### B5. Components (`src/components/`)
- `Navigation.tsx` — cart icon, login/account link, loyalty points
- `Menu.tsx` — categories, items, add to cart
- `ReservationForm.tsx` — date/time/party size, calls POST /api/v1/landing/reservations
- `OtpVerificationForm.tsx` — 2-step: collect info → OTP → created
- `Gallery.tsx` — lightbox + carousel
- `SocialFeeds.tsx` — sanitized dangerouslySetInnerHTML embeds
- `Reviews.tsx` — paginated, branch filter
- `FeaturedItems.tsx` — carousel from LandingConfigStore
- `Cart.tsx` — slide-out panel, quantity controls, checkout
- `LanguageSwitcher.tsx` — locale selector; reads `i18n.supportedLocales`, calls `i18n.setLocale()`; only renders when tenant has more than one supported locale

#### B6. Routes (`src/routes/`)
TanStack Router file-based:
- `__root.tsx` — domain lookup → hydrate stores, render active template
- `index.tsx` — homepage
- `auth.login.tsx`
- `auth.register.tsx` — OTP flow
- `menu.tsx`
- `reserve.tsx`
- `account.tsx` — customer profile + loyalty
- `account.orders.tsx`

**Note on translations API:** `I18nStore.setLocale()` calls `GET /api/v1/translations/{locale}?app=landing`. This endpoint is registered in `routes/public.php` (not `routes/landing.php`) via a `TranslationController` that serves per-locale, per-app JSON translation strings. It is not part of the landing routes — no changes needed to `routes/landing.php` for i18n.

---

### Phase C — Frontend `/web` CMS additions

#### C1. LandingCmsStore (`src/stores/LandingCmsStore.ts`)
MST store with CRUD actions for all 7 CMS resource types:
- `templateSettings`, `galleries[]`, `featuredItems[]`, `socialFeeds[]`, `seo`, `contentBlocks[]`, `reviews[]`
- Loading/error states per resource
- Actions: `fetchTemplateSettings()`, `updateTemplateSettings(payload)`, `fetchGalleries()`, `createGallery()`, `updateGallery()`, `deleteGallery()`, etc.
- Calls typed `api` service (same pattern as other stores)

Add to `src/stores/root.ts`:
```ts
import { LandingCmsStore } from './LandingCmsStore'
// In RootStore model:
landingCms: types.optional(LandingCmsStore, {}),
```

#### C2. Routes (under `src/routes/_authenticated/landing-cms/`)
- `index.tsx` — redirect to `template-settings`
- `template-settings.tsx` — template selector (3 cards) + CSS editor with enable/disable toggle
- `gallery.tsx` — gallery albums list + image manager
- `featured-items.tsx` — searchable menu item selector with sort order
- `social-feeds.tsx` — platform + embed code form
- `seo.tsx` — meta title/description/og:image/canonical form
- `content-blocks.tsx` — HTML content block editor with section/type/sort_order
- `reviews.tsx` — review moderation table (approve/unpublish/delete)

All pages: check `authStore.can('landing.manage_content')` → show 403 message if false.

#### C3. Components (under `src/components/LandingCms/`)
- `TemplateSettings.tsx`
- `GalleryManager.tsx`
- `FeaturedItemsSelector.tsx`
- `SocialFeedForm.tsx`
- `SeoForm.tsx`
- `ContentBlockEditor.tsx`
- `ReviewModerationTable.tsx`

---

### Phase D — Section Content CMS (addendum — implemented after A–C)

This phase adds owner-managed content for all landing page sections so content survives template switches. All text is locale-keyed JSONB. Media fields (image/video) are locale-neutral.

#### D1. Migrations (continuing date prefix `2026_05_14`, numbers 000012 and 000013)

**`create_landing_sections_table`** — section visibility + page order:
```
id uuid PK, tenant_id FK → tenants CASCADE
section_key varchar(50) NOT NULL  -- 'hero','nav','offers','tasting_menus','loyalty','footer','quick_tabs','events','reservations'
is_visible boolean DEFAULT true
sort_order int DEFAULT 0
timestamps
UNIQUE(tenant_id, section_key), INDEX(tenant_id, sort_order)
```

**`create_landing_section_items_table`** — content JSONB per item:
```
id uuid PK, tenant_id FK → tenants CASCADE
section_key varchar(50) NOT NULL
content jsonb NOT NULL DEFAULT '{}'
sort_order int DEFAULT 0
is_active boolean DEFAULT true
timestamps
INDEX(tenant_id, section_key, sort_order)
```

#### D2. Models

**`app/Models/LandingSection.php`** — `HasTenantScope`, `HasUuids`; fillable: `tenant_id`, `section_key`, `is_visible`, `sort_order`

**`app/Models/LandingSectionItem.php`** — `HasTenantScope`, `HasUuids`; cast `content` as `array`; fillable all cols

#### D3. Content JSONB Schema (per section_key)

Text fields nested under locale keys. Media fields at top level (locale-neutral).

```
hero (singleton):       { media: {type,url,poster_url}, en: {headline,subheadline,cta_text,cta_url,stats[]}, ar: {...} }
nav (singleton):        { logo_url, en: {logo_text,cta_text,cta_url}, ar: {...} }
offers (repeatable):    { media: {url}, en: {title,description,price,badge}, ar: {...} }
tasting_menus (repeat): { en: {number_label,name,description,price,course_count}, ar: {...} }
loyalty (singleton):    { media: {url}, en: {headline,description,benefits[],cta_text,cta_url}, ar: {...} }
footer (singleton):     { en: {copyright, nav_links[{label,href}], social_links[{platform,url}]}, ar: {...} }
quick_tabs (repeat):    { target_section, icon, en: {label}, ar: {...} }
events (singleton):     { en: {headline,subheadline,cta_text,cta_url}, ar: {...} }
                        ← section header only; event cards come from restaurant.events data
reservations (singleton): { media: {url}, en: {headline,description,cta_text,cta_url}, ar: {...} }
```

Singletons: `hero`, `nav`, `loyalty`, `footer`, `events`, `reservations`  
Repeatables: `offers`, `tasting_menus`, `quick_tabs`

Sections managed elsewhere (no item storage): `info` (restaurant/branch data), `menu_browse` (restaurant.categories), `featured_items` (LandingFeaturedItem), `gallery`, `reviews`

#### D4. Update `LandingConfigService`

Add `buildSectionsMap(string $tenantId): array` — queries both tables, returns:
```php
[
  'hero'   => ['is_visible' => true, 'sort_order' => 0, 'item'  => [...content...]],  // singleton → 'item'
  'offers' => ['is_visible' => true, 'sort_order' => 3, 'items' => [...]],             // repeatable → 'items'
]
```

Include in `getConfig()` response as `'sections' => $this->buildSectionsMap($tenantId)`.

#### D5. New Controller

**`app/Http/Controllers/Api/V1/Landing/LandingSectionController.php`**

Inject `LandingConfigService` + `AuditLogger`. Every mutating action calls `invalidateConfig()` + `auditLogger->log()`.

```
GET    /landing/cms/sections                         → index()
PATCH  /landing/cms/sections/{section}/visibility    → toggleVisibility()
POST   /landing/cms/sections/reorder                 → reorder()           [{section_key, sort_order}]
PUT    /landing/cms/sections/{section}/content       → upsertContent()     singleton create-or-update
POST   /landing/cms/sections/{section}/items         → storeItem()         repeatable only
PUT    /landing/cms/sections/{section}/items/{id}    → updateItem()
DELETE /landing/cms/sections/{section}/items/{id}    → destroyItem()
POST   /landing/cms/sections/{section}/items/reorder → reorderItems()      [{id, sort_order}]
```

#### D6. Form Requests

**`CmsSectionContentRequest`** — `content` is array; locale keys contain only whitelisted fields for that section_key; `content.media.type` must be `image` or `video` when present

**`CmsSectionReorderRequest`** — array of `{section_key: string, sort_order: int}` or `{id: uuid, sort_order: int}`

#### D7. Routes addition to `routes/landing.php`

Add inside the existing CMS middleware group:
```php
use App\Http\Controllers\Api\V1\Landing\LandingSectionController;

Route::get('/sections', [LandingSectionController::class, 'index']);
Route::post('/sections/reorder', [LandingSectionController::class, 'reorder']);
Route::patch('/sections/{section}/visibility', [LandingSectionController::class, 'toggleVisibility']);
Route::put('/sections/{section}/content', [LandingSectionController::class, 'upsertContent']);
// items/reorder MUST be registered before items/{id} to avoid 'reorder' matching {id}
Route::post('/sections/{section}/items/reorder', [LandingSectionController::class, 'reorderItems']);
Route::post('/sections/{section}/items', [LandingSectionController::class, 'storeItem']);
Route::put('/sections/{section}/items/{id}', [LandingSectionController::class, 'updateItem']);
Route::delete('/sections/{section}/items/{id}', [LandingSectionController::class, 'destroyItem']);
```

#### D8. Update `LandingConfigStore.ts` (`/landing`)

Add to the MST model:
```typescript
sections: types.optional(types.frozen<Record<string, unknown>>(), {})
```

Update `fetchConfig` to map `res.data.sections → self.sections`.

Add views:
```typescript
sectionItem(key: string)      // sections[key]?.item ?? null
sectionItems(key: string)     // sections[key]?.items ?? []
isSectionVisible(key: string) // sections[key]?.is_visible ?? true
sectionsSortedByOrder(): string[]  // Object.entries(sections).sort((a,b) => (a[1].sort_order??0) - (b[1].sort_order??0)).map(([k]) => k)
```
`sectionsSortedByOrder()` is used by templates to render sections in the owner-defined display order, skipping any where `isSectionVisible(key) === false`. `nav` and `footer` are always pinned first/last by the template regardless of sort_order.

#### D9. Template wiring (`/landing` — all 3 templates)

Replace hardcoded section content with `config.sectionItem / config.sectionItems`, always with hardcoded fallback strings so the page renders correctly before any CMS content is saved.

Pattern:
```typescript
const heroData = config.sectionItem('hero')
const heroMedia = heroData?.media as { type: string; url: string; poster_url?: string } | null
const heroLocale = (heroData?.[locale] ?? heroData?.['en']) as HeroContent | null

// JSX:
<h1>{heroLocale?.headline ?? 'Fine Dining at Its Best'}</h1>
{heroMedia?.type === 'video'
  ? <video autoPlay muted loop playsInline poster={heroMedia.poster_url}><source src={heroMedia.url} /></video>
  : <div style={{ backgroundImage: heroMedia?.url ? `url(${heroMedia.url})` : undefined }} />}
```

Sections wired in all 3 templates: `hero`, `nav`, `offers`, `tasting_menus`, `loyalty`, `footer`, `quick_tabs`

New sections added to all 3 templates (not in original template code):
- `events` — renders section header from CMS + event cards from `restaurant.events`
- `reservations` — full-width CMS-authored block (headline, description, bg image, CTA)

`nav` and `footer` are locked (not user-reorderable). The template renders all sections in `config.sectionsSortedByOrder()` order, skipping any where `isSectionVisible(key) === false`.

#### D10. `/web` — LandingCmsStore additions

Add to `LandingCmsStore.ts`:
```typescript
sections:         types.optional(types.frozen<Record<string, unknown>>(), {})
isLoadingSections: types.optional(types.boolean, false)
```

New actions: `fetchSections`, `toggleSectionVisibility`, `reorderSections`, `upsertSectionContent`, `createSectionItem`, `updateSectionItem`, `deleteSectionItem`, `reorderSectionItems`

#### D10a. `/web` — Add `@dnd-kit` dependency (prerequisite for D11)

`@dnd-kit/core` and `@dnd-kit/sortable` are not in `/web/package.json`. Install before implementing `SectionList.tsx`:
```bash
npm install @dnd-kit/core @dnd-kit/sortable
```
(in the `/web` directory)

#### D11. `/web` — New CMS route + components

**New route: `src/routes/_authenticated/landing-cms/sections.tsx`**
```
<LandingCmsNav />
<div className="flex h-[calc(100vh-theme(spacing.32))]">
  <SectionList />        ← 280px left panel
  <SectionEditorPanel /> ← right panel
</div>
```

**`LandingCmsNav.tsx`** — MODIFY existing file: add `{ to: '/landing-cms/sections', label: 'Sections' }` as second tab (file already exists from Phase C).

**New components (`src/components/LandingCms/`):**

`SectionList.tsx` — sorted section rows with drag-to-reorder via `@dnd-kit/sortable` (`DndContext` + `SortableContext` + `useSortable` per row); eye toggle per section; `nav`/`footer` locked at top/bottom and excluded from DndContext; grayed read-only items for sections managed elsewhere (menu_browse, featured_items, gallery, reviews)

`SectionEditorPanel.tsx` — receives selected section key, dispatches to appropriate editor, wraps in card with `LocaleTabs` header + Save button

`LocaleTabs.tsx` — shared locale switcher reading `supportedLocales` from `landingCmsStore.templateSettings.supported_locales` (the template settings object already contains this field from the API); falls back to `['en-US']` if not set

`HeroSectionEditor.tsx` — media type radio (image/video), media URL, optional poster URL, per-locale fields (headline, subheadline, CTA text/URL), stats key-value array editor

`RepeatableSectionEditor.tsx` — generic for `offers`, `tasting_menus`, `quick_tabs`; item list with drag-reorder + delete; Add item inline form; per-item LocaleTabs for text fields; schema map defines fields per section_key

`SingletonSectionEditor.tsx` — generic for `loyalty`, `footer`, `nav`, `events`, `reservations`; schema map defines fields per section_key; LocaleTabs for text fields

**Section schema (TypeScript constant, co-located with editors):**

| Section | Non-locale fields | Locale fields |
|---------|-------------------|---------------|
| hero | media.type, media.url, media.poster_url | headline, subheadline, cta_text, cta_url, stats[] |
| nav | logo_url | logo_text, cta_text, cta_url |
| offers | media.url | title, description, price, badge |
| tasting_menus | — | number_label, name, description, price, course_count |
| loyalty | media.url | headline, description, benefits[], cta_text, cta_url |
| footer | — | copyright, nav_links[], social_links[] |
| quick_tabs | target_section, icon | label |
| events | — | headline, subheadline, cta_text, cta_url |
| reservations | media.url | headline, description, cta_text, cta_url |

---

## Key Implementation Notes

1. **`resolved_tenant_id`**: `LandingDomainResolver` must set `resolved_tenant_id` (not `tenant_id`) — this is what `HasTenantScope` reads via `request()->get('resolved_tenant_id')`.

2. **AuditLogger**: Inject `App\Services\Platform\AuditLogger` (not static `AuditLog::record()`). Use `$this->auditLogger->log(actorId, 'staff', 'landing.gallery.created', tenantId, null, 'landing_gallery', $gallery->id, [...])`.

3. **`LandingPendingCustomerRegistration`**: No `updated_at` — use `$table->timestamp('created_at')->nullable()` only, not `timestamps()`.

4. **CSS sanitization order**: Backend (sabberworm) runs on save → stored sanitized. Frontend (css-tree) runs on render as defense-in-depth.

5. **Domain lookup route**: `/api/v1/landing/domain-lookup` is outside the `landing.domain` middleware group (it's what initiates lookup; doesn't need the domain resolved first).

6. **OTP tenant_id**: `registerInitiate` and `registerVerify` routes are in `routes/customer.php`. They need the tenant resolved from the Host header. Apply `landing.domain` middleware to these routes OR pass tenant_id in request body. Per spec: use the OTP routes in `routes/customer.php` — since the Host-based middleware won't apply there, the tenant_id should come from the request (or a query param `tenant_id`). **Decision**: add a `tenant_id` field to the initiate/verify request bodies for the landing flow, OR apply `LandingDomainResolver` middleware to these two routes in `routes/customer.php`.

7. **ReservationService compatibility**: Existing `create(Branch $branch, array $data)` — we need to pass branch as first arg. Landing controller fetches the branch after verifying it belongs to the resolved tenant.

8. **Template conversion**: The `landing-ui/` templates use `window.AUBERGINE` mock data. In the TypeScript conversion, replace with props derived from MST stores. Keep all HTML/CSS structure — do not redesign.

---

## Files to Create/Modify

> Items marked ✅ are already implemented. Items with no marker still need to be built.

### `/api` — Phases A ✅ (all implemented)
- `config/landing.php` ✅
- `app/Http/Middleware/LandingDomainResolver.php` ✅
- `app/Services/Landing/DomainResolverService.php` ✅
- `app/Services/Landing/LandingConfigService.php` ✅
- `app/Models/Landing*.php` (10 models) ✅
- `database/migrations/2026_05_14_000001` through `_000011` ✅
- `app/Http/Controllers/Api/V1/Landing/RestaurantController.php` ✅
- `app/Http/Controllers/Api/V1/Landing/ReservationController.php` ✅
- `app/Http/Controllers/Api/V1/Landing/OrderController.php` ✅
- `app/Http/Controllers/Api/V1/Landing/CmsController.php` ✅
- `app/Http/Controllers/Api/V1/Landing/CmsReviewController.php` ✅
- `app/Http/Requests/Landing/*.php` (request classes) ✅
- `app/Mail/Landing/OtpRegistrationMail.php` ✅
- `resources/views/emails/landing/otp-registration.blade.php` ✅
- `routes/landing.php` ✅
- `bootstrap/app.php` — landing.php registered + `landing.domain` alias ✅
- `config/permissions.php` — `landing.manage_content` added ✅
- `app/Http/Controllers/Api/V1/Auth/CustomerAuthController.php` — `registerInitiate()`, `registerVerify()` added ✅
- `routes/customer.php` — OTP routes added ✅

### `/api` — still needed
- `app/Http/Controllers/Api/V1/Landing/ReviewController.php` — customer review submission (`store()`)
- `app/Http/Requests/Landing/LandingReviewRequest.php`
- `app/Console/Commands/PurgeExpiredLandingRegistrations.php`
- Update `routes/landing.php` — add `POST /reviews` under `auth:customer` group
- Update `bootstrap/app.php` — register `PurgeExpiredLandingRegistrations` in scheduler

### `/landing` — Phase B ✅ (all implemented)
- `src/stores/AuthStore.ts` ✅
- `src/stores/RestaurantStore.ts` ✅
- `src/stores/LandingConfigStore.ts` ✅
- `src/stores/CartStore.ts` ✅
- `src/stores/CustomerStore.ts` ✅
- `src/stores/I18nStore.ts` ✅
- `src/stores/RootStore.ts` ✅
- `src/stores/context.tsx` ✅
- `src/services/ApiService.ts` ✅
- `src/templates/MaisonTemplate.tsx` ✅ (STATIC_* still hardcoded — Phase E wires CMS data)
- `src/templates/EditorialTemplate.tsx` ✅ (same)
- `src/templates/CinematicTemplate.tsx` ✅ (same)
- `src/utils/sanitizeCss.ts` ✅
- `src/styles/global.css` ✅
- `src/components/LanguageSwitcher.tsx` ✅
- `src/routes/__root.tsx`, `index.tsx`, `auth.*.tsx`, `menu.tsx`, `reserve.tsx`, `account.*.tsx` ✅

### `/web` — Phase C ✅ (all implemented)
- `src/stores/LandingCmsStore.ts` ✅
- `src/routes/_authenticated/landing-cms/*.tsx` (8 routes) ✅
- `src/components/LandingCms/*.tsx` (7 components + LandingCmsNav) ✅
- `src/stores/root.ts` — `landingCms` store added ✅
- `src/components/layout/Sidebar.tsx` — Landing Page CMS nav entry added ✅

### Phase D — new files (not yet built)
- `api/database/migrations/2026_05_14_000012_create_landing_sections_table.php`
- `api/database/migrations/2026_05_14_000013_create_landing_section_items_table.php`
- `api/app/Models/LandingSection.php`
- `api/app/Models/LandingSectionItem.php`
- `api/app/Http/Controllers/Api/V1/Landing/LandingSectionController.php`
- `api/app/Http/Requests/Landing/CmsSectionContentRequest.php`
- `api/app/Http/Requests/Landing/CmsSectionReorderRequest.php`
- `web/src/routes/_authenticated/landing-cms/sections.tsx`
- `web/src/components/LandingCms/SectionList.tsx`
- `web/src/components/LandingCms/SectionEditorPanel.tsx`
- `web/src/components/LandingCms/LocaleTabs.tsx`
- `web/src/components/LandingCms/HeroSectionEditor.tsx`
- `web/src/components/LandingCms/RepeatableSectionEditor.tsx`
- `web/src/components/LandingCms/SingletonSectionEditor.tsx`

### Phase D — modified files (not yet done)
- `api/app/Services/Landing/LandingConfigService.php` — add `buildSectionsMap()`, include `sections` in `getConfig()`
- `api/routes/landing.php` — add 8 section routes under CMS middleware group (reorder before items/{id})
- `landing/src/stores/LandingConfigStore.ts` — add `sections` field + 4 views (`sectionItem`, `sectionItems`, `isSectionVisible`, `sectionsSortedByOrder`)
- `landing/src/templates/MaisonTemplate.tsx` — wire 9 sections + add Events/Reservations sections
- `landing/src/templates/EditorialTemplate.tsx` — same
- `landing/src/templates/CinematicTemplate.tsx` — same
- `web/src/stores/LandingCmsStore.ts` — add `sections` state + 8 new actions
- `web/src/components/LandingCms/LandingCmsNav.tsx` — add "Sections" tab

---

## Phase E — Template-Aware CMS & Full Static Data Replacement

### Context

After auditing all three templates against Phase D's section schema, four gaps were identified:
1. Several `STATIC_*` constants remain hardcoded in templates — not yet replaceable by the CMS
2. The `info` section (service types, payment methods) is missing from the section schema entirely
3. The CMS section editor has no awareness of which template is active — it shows all fields for all templates
4. Certain fields differ per template (e.g. hero facts/marquee in Cinematic, image caption in Maison)

Phase E addresses all four.

---

### E1. Section Schema Additions & Fixes

No new DB migrations needed — `content` is JSONB. Changes are to the validated field schema in `CmsSectionContentRequest` and to how content is read in the templates.

#### New section: `info` (singleton)
```
info (singleton): {
  en: {
    service_headline: string,
    service_description: string,
    service_types: string[],          ← chips: ['Dine-in', 'Bar', 'Private Dining']
    payment_headline: string,
    payment_description: string,
    payment_methods: string[]         ← chips: ['Visa', 'Mastercard', 'Amex', 'Apple Pay']
  },
  ar: { ... }
}
```

#### Fixes to existing section schemas

| Section | Field(s) to add |
|---|---|
| `hero` | `subheadline` already in plan ✅; add `hero_image_caption` (string) for Maison; add `facts[]` (string array) for Cinematic marquee strip |
| `nav` | Add `nav_links[]` (`{label, target_section}`) to locale content (was only in `footer` before) |
| `tasting_menus` | Add `pairing_price` (string) and `duration` (string, e.g. "~ 2h 45m") to locale fields |
| `offers` | Rename `badge` → split into `tag` (category label, e.g. "Members") and `availability_chip` (context note, e.g. "Reservation required") |
| `quick_tabs` | Add `description` to locale fields (the subtitle line below the tab label) |

#### Sections managed elsewhere (unchanged, no CMS item storage)
`menu_browse`, `featured_items`, `gallery`, `reviews` — sourced from restaurant/config API data.

#### Customer-specific content — NOT CMS
Maison's Loyalty logged-in state shows `STATIC_REORDER` and `STATIC_FAVORITES`. These are customer order-history data, not restaurant CMS content. Wire to `customerStore.orders` when logged in; keep placeholders when order list is empty.

---

### E2. Backend Changes

#### Update `CmsSectionContentRequest`
Extend the whitelist to include `info` as a valid `section_key` with its field schema. Add `pairing_price`, `duration`, `hero_image_caption`, `facts[]`, `nav_links[]`, `description` (quick_tabs), `tag`/`availability_chip` (offers) to the per-section validation rules.

#### Update `LandingConfigService::buildSectionsMap()`
Add `info` to the recognized singleton keys:
```php
private const SINGLETONS = ['hero', 'nav', 'loyalty', 'footer', 'events', 'reservations', 'info'];
private const REPEATABLES = ['offers', 'tasting_menus', 'quick_tabs'];
```

---

### E3. Template Wiring — Replace All STATIC_* Constants

All three templates share the same replacement pattern. Always include fallback literals so the page renders correctly before any CMS content is saved.

#### Replacement map

| Template | Hardcoded | Replace with | Fallback |
|---|---|---|---|
| All 3 | `STATIC_OFFERS` | `config.sectionItems('offers')` | 3 hardcoded offer objects |
| All 3 | `STATIC_TASTING` | `config.sectionItems('tasting_menus')` | 3 hardcoded tasting objects |
| All 3 | `STATIC_SERVICE` chips | `config.sectionLocale('info')?.service_types` | `['Dine-in', 'Bar', 'Private Dining']` |
| All 3 | `STATIC_PAYMENTS` chips | `config.sectionLocale('info')?.payment_methods` | `['Visa', 'Mastercard', 'Amex', 'Apple Pay']` |
| All 3 | Hardcoded nav links | `config.sectionLocale('nav')?.nav_links` | `DEFAULT_NAV_LINKS` per template |
| All 3 | Hardcoded quick_tabs | `config.sectionItems('quick_tabs')` | 4 hardcoded tab objects |
| All 3 | Hero subheadline/lede | `config.sectionLocale('hero')?.subheadline` | template-specific default string |
| All 3 | Hero CTA text/URL | `config.sectionLocale('hero')?.cta_text` | "Reserve a Table" |
| All 3 | Hero media | `config.sectionItem('hero')?.media?.url` | `<Placeholder />` component |
| Maison | Hero image caption | `config.sectionLocale('hero')?.hero_image_caption` | "— Reserve your table tonight —" |
| Cinematic | Rail logo letter | `config.sectionLocale('nav')?.logo_text?.[0]` | `'A'` |
| Cinematic | Marquee facts | `config.sectionLocale('hero')?.facts` | `['Service open · Tue – Sun', 'Cellar · 2,143 bottles', 'Pastry · In-house']` |
| Cinematic | Hero cards (right panel) | First 2 items from `config.sectionItems('tasting_menus')` | hardcoded $185/$295 cards |
| Maison/Editorial | Editorial marquee strip | Platform text — keep hardcoded ("Powered by ChefLogik...") | — |
| Maison | `STATIC_REORDER` | `customerStore.orders.slice(0,2)` when logged in | placeholder rows |
| Maison | `STATIC_FAVORITES` | derived from `customerStore.orders` | hardcoded favorites |

**Pattern for every replacement:**
```typescript
// For singleton text content — use sectionLocale() helper (locale-resolved)
const heroLocale = config.sectionLocale('hero')   // returns locale-resolved object or null
const headline = heroLocale?.headline ?? 'Fine Dining at Its Best'

// For repeatable items — use sectionItems() and resolve locale per-item
const offerItems = config.sectionItems('offers') as OfferItem[]
const offers = offerItems.length > 0 ? offerItems : STATIC_OFFERS_FALLBACK

// JSX:
{offers.map(o => {
  const loc = config.sectionLocale('offers') // note: for repeatable, read locale from the item directly
  // Each item has locale keys directly: o['en'], o['ar'], etc.
  const itemLocale = (o[(getRoot(config) as RootStoreType).i18n.locale.split('-')[0]] ?? o['en']) as OfferLocale | null
  return <article key={o.id ?? itemLocale?.title}>
    <div className="tag">{itemLocale?.tag}</div>
    ...
  </article>
})}
```

---

### E4. Template-Aware CMS Section Editor

#### Constant: `TEMPLATE_SECTION_FIELDS`

Add to `web/src/components/LandingCms/sectionSchema.ts` (shared with editors):

```typescript
export const TEMPLATE_EXTRA_FIELDS: Record<string, Partial<Record<string, string[]>>> = {
  hero: {
    'v1-maison':    ['hero_image_caption'],
    'v2-editorial': [],
    'v3-cinematic': ['facts'],
  },
}
// All other sections have no template-specific extra fields
```

#### Update `SectionEditorPanel.tsx`

Pass `activeTemplate` (read from `landingCmsStore.templateSettings?.template ?? 'v1-maison'`) down to all section editor components:
```typescript
<HeroSectionEditor
  sectionKey="hero"
  activeTemplate={activeTemplate}
  ...
/>
```

#### Update `HeroSectionEditor.tsx`

Show conditional field groups:
```typescript
{activeTemplate === 'v1-maison' && (
  <Field label="Image caption" name="hero_image_caption" type="text" />
)}
{activeTemplate === 'v3-cinematic' && (
  <FactsArrayEditor label="Marquee facts" name="facts" />
)}
```

`FactsArrayEditor` — simple list of text inputs with Add/Remove row controls (add alongside other editor components in `LandingCms/`).

#### Update `SingletonSectionEditor.tsx`

Add `activeTemplate` prop. The `nav` editor always shows `nav_links[]` field (array of `{label, target_section}` pairs) — no template-specific variation needed; Cinematic Rail reads the same nav data.

#### Update `RepeatableSectionEditor.tsx`

Update the section schema map to include new fields:
- `tasting_menus` items: add `pairing_price` (text), `duration` (text) to locale fields
- `offers` items: replace `badge` with `tag` + `availability_chip` 
- `quick_tabs` items: add `description` to locale fields

#### Add `InfoSectionEditor.tsx`

New component for the `info` singleton. Shows two expandable groups:
- **Service** — `service_headline`, `service_description`, `service_types` (tag-input for chips)
- **Payment** — `payment_headline`, `payment_description`, `payment_methods` (tag-input for chips)

`TagInput.tsx` — reusable chip-list editor (type a value, press Enter to add, click × to remove). Add to `web/src/components/LandingCms/`.

#### Update `SectionList.tsx`

- Add `info` to the section list (between `quick_tabs` and `offers`)
- Show a template badge on sections that have template-specific extra fields:
  ```
  ● hero  [v1] [v3]    ← has extra fields for maison and cinematic
  ● nav
  ● info               ← new section
  ```
- `v1-maison` → badge "M", `v2-editorial` → "E", `v3-cinematic` → "C"

---

### E5. `LandingConfigStore.ts` (`/landing`) — Locale-Aware Views

`sectionItem()` and `sectionItems()` views already return raw JSONB. Add a locale-aware helper view:

```typescript
sectionLocale(key: string): Record<string, unknown> | null {
  const item = self.sectionItem(key)
  if (!item) return null
  // locale lives in I18nStore, not LandingConfigStore — access via getRoot()
  const loc = (getRoot(self) as RootStoreType).i18n.locale.split('-')[0]  // 'en' from 'en-US'
  return (item[loc] ?? item['en'] ?? null) as Record<string, unknown> | null
}
```

Import `getRoot` from `mobx-state-tree` and `RootStoreType` from `./RootStore`.

Templates use `config.sectionLocale('hero')?.headline` instead of manually doing `(item?.[locale] ?? item?.['en'])` everywhere.

---

### Phase E — Files to Create/Modify

**`/api` — modified (Phase E):**
- `app/Http/Requests/Landing/CmsSectionContentRequest.php` — add `info` section + new fields per section
- `app/Services/Landing/LandingConfigService.php` — add `info` to `SINGLETONS`

**`/landing` — modified (Phase E):**
- `src/stores/LandingConfigStore.ts` — add `sectionLocale()` view (uses `getRoot(self).i18n.locale`, imports `getRoot` from `mobx-state-tree` and `RootStoreType` from `./RootStore`)
- `src/templates/MaisonTemplate.tsx` — replace all `STATIC_*` + wire hero/nav/quick_tabs to CMS
- `src/templates/EditorialTemplate.tsx` — same
- `src/templates/CinematicTemplate.tsx` — same (+ Rail logo from nav, hero cards from tasting_menus, marquee from hero.facts)

**`/web` — new files (Phase E):**
- `src/components/LandingCms/InfoSectionEditor.tsx`
- `src/components/LandingCms/TagInput.tsx`
- `src/components/LandingCms/FactsArrayEditor.tsx`
- `src/components/LandingCms/sectionSchema.ts` — `TEMPLATE_EXTRA_FIELDS` + field definitions for repeatable editors

**`/web` — modified (Phase E):**
- `src/components/LandingCms/HeroSectionEditor.tsx` — add `activeTemplate` prop + conditional fields
- `src/components/LandingCms/SingletonSectionEditor.tsx` — add `nav_links[]` field to nav schema
- `src/components/LandingCms/RepeatableSectionEditor.tsx` — update schema map for tasting_menus/offers/quick_tabs
- `src/components/LandingCms/SectionEditorPanel.tsx` — pass `activeTemplate` down
- `src/components/LandingCms/SectionList.tsx` — add `info` entry + template badge indicators

---

## OTP Tenant Resolution Decision

The `registerInitiate` / `registerVerify` routes live in `routes/customer.php`. The landing spec requires tenant context for these (to store/look up `landing_pending_customer_registrations`). Two options:
1. Apply `landing.domain` middleware to those routes in `customer.php` — cleanest
2. Accept `tenant_id` in request body — breaks security (client-controlled)

**Choice**: Apply `landing.domain` middleware to just those two new routes in `routes/customer.php`.
