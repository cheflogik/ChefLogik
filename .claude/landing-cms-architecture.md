# Landing Page + CMS Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CUSTOMER JOURNEY                                    │
└─────────────────────────────────────────────────────────────────────────────┘

myrestaurant.com
       │
       ├─→ /landing (React Vite app, port 5700)
       │       │
       │       ├─→ Resolves domain → GET /api/v1/landing/domain-lookup?domain=
       │       │
       │       ├─→ Gets tenant_id + tenant config
       │       │
       │       ├─→ Loads template (v1-maison, v2-editorial, v3-cinematic)
       │       │
       │       ├─→ Makes API calls to api.myrestaurant.com
       │       │   (Host header used for tenant validation)
       │       │
       │       └─→ Customer browses menu → reserves table → orders


┌─────────────────────────────────────────────────────────────────────────────┐
│                        RESTAURANT OWNER CMS                                  │
└─────────────────────────────────────────────────────────────────────────────┘

app.myrestaurant.com/landing-cms (in /web React app, staff only)
       │
       ├─→ Template Settings
       │   ├─ Choose template (v1, v2, v3)
       │   └─ Custom CSS editor
       │
       ├─→ Gallery Management
       │   ├─ Upload photos
       │   ├─ Add captions/alt text
       │   └─ Organize galleries
       │
       ├─→ Featured Items
       │   ├─ Select from master menu
       │   └─ Reorder items (sort_order)
       │
       ├─→ Social Feeds
       │   ├─ Instagram embed widget
       │   ├─ Facebook embed widget
       │   └─ Multiple accounts per platform
       │
       ├─→ SEO Metadata
       │   ├─ Meta title
       │   ├─ Meta description
       │   ├─ OG image
       │   └─ Canonical URL
       │
       ├─→ Content Blocks
       │   ├─ Custom HTML sections
       │   ├─ Promo blocks
       │   └─ Gallery embeds
       │
       └─→ Review Moderation
           ├─ Approve pending reviews
           ├─ Unpublish published reviews
           └─ Delete reviews


┌─────────────────────────────────────────────────────────────────────────────┐
│                       BACKEND API ROUTING                                    │
└─────────────────────────────────────────────────────────────────────────────┘

api.myrestaurant.com
│
├─ /api/v1/customer/auth/*   (existing CustomerAuthController — rate-limited 5 req/min)
│  ├─ POST /register/initiate   (NEW — OTP step 1: saves to landing_pending_customer_registrations)
│  ├─ POST /register/verify     (NEW — OTP step 2: creates customer_profile)
│  ├─ POST /login               (existing)
│  ├─ POST /logout              (existing, auth:customer)
│  ├─ GET  /me                  (existing, auth:customer)
│  ├─ POST /forgot-password     (existing)
│  └─ POST /reset-password/email (existing)
│
├─ /api/v1/landing/*         (public; tenant resolved from Host header by LandingDomainResolver)
│  ├─ GET /domain-lookup?domain=
│  ├─ GET /restaurant
│  ├─ GET /branches
│  ├─ GET /menu
│  ├─ GET /opening-hours
│  ├─ GET /events
│  ├─ GET /reviews              (is_published = true only)
│  ├─ GET /config               ← Redis cached: landing_config:{tenant_id}, TTL 5 min
│  └─ POST /reservations        ← writes to existing reservations table (customer_profile_id = null)
│
├─ /api/v1/landing/*         (auth:customer — tenant-scoped token required)
│  ├─ POST /orders
│  ├─ GET  /orders
│  └─ GET  /orders/{id}
│
└─ /api/v1/landing/cms/*     (auth:staff + permission: landing.manage_content)
   ├─ PUT    /restaurant
   ├─ GET/POST/PUT/DELETE /gallery
   ├─ GET/POST/PUT/DELETE /featured-items
   ├─ GET/POST/PUT/DELETE /social-feeds
   ├─ GET/PUT /template-settings   ← CSS sanitized by sabberworm before DB write
   ├─ GET/PUT /seo
   ├─ GET/POST/PUT/DELETE /content-blocks
   ├─ GET /reviews                 (all: published + pending)
   ├─ PATCH /reviews/{id}/publish
   ├─ PATCH /reviews/{id}/unpublish
   └─ DELETE /reviews/{id}


┌─────────────────────────────────────────────────────────────────────────────┐
│                         DOMAIN RESOLUTION                                    │
└─────────────────────────────────────────────────────────────────────────────┘

Table: landing_domains (PostgreSQL)
┌──────────────┬───────────┬──────────────────────┬──────────┐
│ id           │ tenant_id │ domain               │ is_active│
├──────────────┼───────────┼──────────────────────┼──────────┤
│ 1            │ 123       │ myrestaurant.com     │ true     │
│ 2            │ 456       │ otherrestaurant.com  │ true     │
└──────────────┴───────────┴──────────────────────┴──────────┘

Flow:
  1. Customer visits myrestaurant.com
  2. /landing app calls GET /api/v1/landing/domain-lookup?domain=myrestaurant.com
  3. Backend queries landing_domains table
  4. Returns { tenant_id: 123, tenant_name: "My Restaurant", tenant_slug: "my-restaurant" }
  5. Frontend stores tenant context in AuthStore
  6. All subsequent API calls use tenant_id from JWT or Host header context

Local dev: APP_ENV=local skips domain lookup; LANDING_TENANT_ID env var used instead.


┌─────────────────────────────────────────────────────────────────────────────┐
│                           STATE MANAGEMENT (MST)                             │
└─────────────────────────────────────────────────────────────────────────────┘

RootStore (/landing app)
├── AuthStore
│   ├── currentCustomer (if logged in)
│   ├── accessToken
│   ├── tenant_id
│   ├── loginCustomer()
│   ├── logoutCustomer()
│   ├── registerInitiate()    ← OTP step 1
│   └── registerVerify()      ← OTP step 2
│
├── RestaurantStore
│   ├── info (name, description, cuisine, etc.)
│   ├── branches
│   ├── menu (categories + items)
│   ├── hours
│   ├── events
│   ├── reviews               ← is_published = true records only
│   ├── loadRestaurantInfo()
│   └── loadMenu()
│
├── LandingConfigStore
│   ├── template ('v1-maison' | 'v2-editorial' | 'v3-cinematic')
│   ├── customCss             ← sanitized via css-tree before injection
│   ├── contentBlocks (hero, about, features, etc.)
│   ├── featuredItems
│   ├── socialFeeds
│   ├── seoMetadata
│   └── loadConfig()
│
├── CartStore
│   ├── items
│   ├── total
│   ├── addItem()
│   ├── removeItem()
│   └── checkout()
│
└── CustomerStore (if logged in)
    ├── profile
    ├── loyaltyBalance
    ├── loyaltyTier
    ├── orderHistory
    └── loadProfile()


┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATABASE SCHEMA                                     │
└─────────────────────────────────────────────────────────────────────────────┘

NEW TABLES (10 total — all have tenant_id):

landing_domains
├── id (UUID)
├── tenant_id (FK → tenants, NOT NULL)
├── domain (UNIQUE)
├── is_active (DEFAULT true)
├── created_at, updated_at

landing_galleries
├── id (UUID)
├── tenant_id (FK → tenants, NOT NULL)
├── title
├── created_at, updated_at

landing_gallery_images
├── id (UUID)
├── tenant_id (FK → tenants, NOT NULL)   ← required for HasTenantScope
├── gallery_id (FK → landing_galleries)
├── image_url
├── caption
├── alt_text
├── sort_order (INT DEFAULT 0)            ← not `order` (reserved word)

landing_featured_items
├── id (UUID)
├── tenant_id (FK → tenants, NOT NULL)
├── menu_item_id (FK → menu_items)
├── sort_order (INT DEFAULT 0)            ← not `order`
├── UNIQUE (tenant_id, menu_item_id)
├── created_at, updated_at

landing_social_feeds
├── id (UUID)
├── tenant_id (FK → tenants, NOT NULL)
├── platform (VARCHAR 20: 'instagram' | 'facebook')
├── account_handle
├── embed_code
├── is_active (DEFAULT true)
├── created_at, updated_at

landing_template_settings
├── id (UUID)
├── tenant_id (FK → tenants, UNIQUE)
├── template_name (VARCHAR 30, DEFAULT 'v1-maison')
├── custom_css (TEXT — sanitized before storage)
├── is_custom_css_enabled (DEFAULT false)
├── created_at, updated_at

landing_seo_metadata
├── id (UUID)
├── tenant_id (FK → tenants, UNIQUE)
├── meta_title
├── meta_description
├── og_image_url
├── canonical_url
├── created_at, updated_at

landing_content_blocks
├── id (UUID)
├── tenant_id (FK → tenants, NOT NULL)
├── section (VARCHAR 100: 'hero', 'about', 'features', etc.)
├── type (VARCHAR 20: 'html' | 'gallery' | 'promo')
├── content (TEXT)
├── sort_order (INT DEFAULT 0)            ← not `order`
├── is_active (DEFAULT true)
├── created_at, updated_at

landing_pending_customer_registrations
├── id (UUID)
├── tenant_id (FK → tenants, NOT NULL)
├── name, email, phone
├── password_hash
├── otp_code (VARCHAR 6)
├── otp_expires_at (TIMESTAMPTZ)          ← 15 min from creation
├── created_at
├── INDEX (email, tenant_id)
├── INDEX (otp_expires_at)                ← for cleanup job

landing_reviews
├── id (UUID)
├── tenant_id (FK → tenants, NOT NULL)
├── branch_id (UUID, nullable FK → branches ON DELETE SET NULL)
├── customer_id (nullable FK → customer_profiles)
├── customer_name (VARCHAR 255 — denormalized for display)
├── rating (SMALLINT CHECK 1–5)
├── review_text (TEXT)
├── is_published (DEFAULT false)          ← requires CMS approval to show
├── created_at, updated_at
├── INDEX (tenant_id, is_published)
├── INDEX (tenant_id, branch_id)

NOT CREATED: landing_guest_reservations
  → Guest reservations use the existing `reservations` table with customer_profile_id = null
    and source = 'landing'. Visible immediately in /web reservations list.


┌─────────────────────────────────────────────────────────────────────────────┐
│                       AUTHENTICATION FLOW                                    │
└─────────────────────────────────────────────────────────────────────────────┘

CUSTOMER REGISTRATION — OTP 2-STEP (via landing page):
  1. Customer fills form: name, email, phone, password
  2. POST /api/v1/customer/auth/register/initiate
  3. Backend:
     - Hash password
     - Generate 6-digit OTP
     - Save to landing_pending_customer_registrations (expires 15 min)
     - Send OTP email via Laravel mailer (SES in production)
     - Return: { message: "OTP sent to email" }
  4. Customer enters OTP code
  5. POST /api/v1/customer/auth/register/verify { email, otp_code }
  6. Backend:
     - Verify otp_code + otp_expires_at
     - Create customer_profile + customer_tenant_profile
     - Delete pending record
     - Return: { access_token, customer: { id, name, email } }

GUEST RESERVATION (no account required):
  1. Guest fills form: name, email, phone, date, time, party_size, branch
  2. POST /api/v1/landing/reservations
  3. Backend calls existing ReservationService with customer_profile_id = null, source = 'landing'
  4. Record appears immediately in /web reservations list
  5. Return: { reservation_id, confirmation_code }

STAFF/OWNER CMS ACCESS (via /web):
  1. Staff JWT from existing /api/v1/auth/login (staff guard)
  2. Check permission: landing.manage_content
  3. Access /api/v1/landing/cms/* endpoints
  4. All writes: invalidate Redis config cache + write to audit_log


┌─────────────────────────────────────────────────────────────────────────────┐
│                      TEMPLATE SYSTEM (3 DESIGNS)                            │
└─────────────────────────────────────────────────────────────────────────────┘

All 3 templates receive the same data structure from RootStore:

Template Props Interface:
{
  restaurant: {
    name, description, cuisine, neighborhood, address, phone,
    rating, reviewCount, branches, hours
  },
  menu: [
    { id, name, subtitle, items: [{ id, name, desc, price, tags, pop, eightySix }] }
  ],
  events: [{ id, title, date, time, description, image, capacity, price }],
  reviews: [{ id, customer_name, rating, text, date }],
  featuredItems: [{ id, menuItem, sort_order }],
  galleries: [{ id, title, images: [{ url, caption, alt }] }],
  socialFeeds: [{ id, platform, embedCode }],
  customCss: string,
  onReserve: () => void,
  onBrowse: () => void,
  onLogin: () => void,
  onLogout: () => void,
  currentCustomer: { name, points, tier } | null
}

TEMPLATE 1: V1 — MAISON
├─ Design: Luxury, centered, symmetrical
├─ Colors: Gold (#D4AF37), cream, black
├─ Vibe: Fine dining, high-end
├─ Featured: Ornamental details, rating display, wine pairing options
├─ Mobile: Vertical stacking, elegant spacing

TEMPLATE 2: V2 — EDITORIAL
├─ Design: Magazine-style, asymmetric grid, editorial layout
├─ Colors: Wine tones (#722F37), cream, black
├─ Vibe: Sophisticated, journalistic, storytelling
├─ Featured: Large typography, image grid, press section
├─ Mobile: Single column, block-based layout

TEMPLATE 3: V3 — CINEMATIC
├─ Design: Full-bleed photography, cinematic experience
├─ Colors: Copper/ember (#B87333), dark tones, minimal text
├─ Vibe: Modern, visual-first, immersive
├─ Featured: Large hero images, side rail navigation, video potential
├─ Mobile: Mobile app-like experience, bottom nav


┌─────────────────────────────────────────────────────────────────────────────┐
│                     CSS SANITIZATION (TWO LAYERS)                           │
└─────────────────────────────────────────────────────────────────────────────┘

BACKEND (authoritative — runs on save, PUT /api/v1/landing/cms/template-settings):
  - PHP: sabberworm/php-css-parser
  - Strips @import at-rules
  - Strips rules targeting :root, html, body, * selectors
  - Sanitized value stored in DB

FRONTEND /landing (defense-in-depth — runs on render):
  - npm: css-tree (AST-based)
  - Same stripping rules applied before <style> injection
  - All selectors scoped to .landing-container wrapper

  const safeCss = useMemo(() => sanitizeCss(config.customCss ?? ''), [config.customCss])
  return (
    <>
      <style>{`.landing-container { ${safeCss} }`}</style>
      <div className="landing-container">...</div>
    </>
  )


┌─────────────────────────────────────────────────────────────────────────────┐
│                       REDIS CONFIG CACHE                                     │
└─────────────────────────────────────────────────────────────────────────────┘

Key:   landing_config:{tenant_id}
TTL:   300 seconds (5 min)
Write: LandingConfigService::getConfig() — Cache::remember(...)
Invalidate: LandingConfigService::invalidateConfig() — Cache::forget(...)
           Called in every CMS controller write method (PUT, POST, DELETE)

Cached payload:
  { template, contentBlocks, socialFeeds, featuredItems, seo }


┌─────────────────────────────────────────────────────────────────────────────┐
│                          TENANT ISOLATION CHECKS                             │
└─────────────────────────────────────────────────────────────────────────────┘

FRONTEND:
✅ AuthStore includes tenant_id from JWT
✅ All API calls automatically include tenant context (via Host header)
✅ Components render based on RestaurantStore (tenant-scoped data)
✅ Cannot navigate to another tenant's page (same domain routing)

BACKEND:
✅ LandingDomainResolver middleware sets tenant_id from Host header (public routes)
✅ CMS routes use staff JWT tenant_id directly (no domain lookup)
✅ All landing models use HasTenantScope trait
✅ Staff permission check: staff->tenant_id must match request tenant
✅ Audit log tracks all CMS changes: actor_id, action, resource, changes, ip

TEST CASES:
✅ Create gallery for Tenant A → try to access as Tenant B → should 404
✅ Staff from Tenant B tries to edit Tenant A's gallery → should 403


┌─────────────────────────────────────────────────────────────────────────────┐
│                       DEPLOYMENT CONSIDERATIONS                              │
└─────────────────────────────────────────────────────────────────────────────┘

DOMAINS:
- Each restaurant points custom domain (myrestaurant.com) to our servers
- DNS CNAME or A record points to our load balancer
- Nginx routes all requests to /landing app (port 5700)
- /landing app resolves domain → tenant_id on startup

API CALLS:
- Frontend makes requests to api.myrestaurant.com (tenant-specific domain)
- Backend LandingDomainResolver validates Host header
- If domain not found in landing_domains, return 404

CACHING:
- Cache landing config in Redis (5-min TTL) — active in Phase 2
- Invalidate on every CMS write
- Reduces repeated DB queries per page load

SSL/TLS:
- Wildcard cert for *.cheflogik.com
- SNI for custom domains (tenant-provided certs or shared)

RATE LIMITING:
- Auth endpoints (register/initiate, register/verify, login, forgot-password): 5 req/min per IP
- CMS endpoints: 100 req/min per user
