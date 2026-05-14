# Landing Page + CMS Quick Reference

## 🎯 What's Included (MVP)

### Customer-Facing Landing Page (`/landing` React app)

**Authentication & Profile**
- ✅ Customer registration (email, password, name, phone)
- ✅ Customer login/logout
- ✅ View customer profile & loyalty points balance
- ✅ Guest reservation (no account needed)
- ✅ Convert guest reservation to account

**Discovery & Browsing**
- ✅ View restaurant info (name, cuisine, location, rating)
- ✅ Browse full menu by category
- ✅ View opening hours (all branches)
- ✅ View restaurant branches (location, distance)
- ✅ View events (date, time, description, pricing)
- ✅ View customer reviews & ratings
- ✅ View featured menu items
- ✅ View photo galleries

**Ordering & Reservations**
- ✅ Make table reservation (guest or logged-in)
- ✅ Place food order (if integrated with Phase 1)
- ✅ View loyalty points after login
- ✅ View order history (past orders)

**Design & Customization**
- ✅ 3 template options (Maison, Editorial, Cinematic)
- ✅ Custom CSS override (owner-written)
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ White-label support (no ChefLogik branding required)

**Integrations**
- ✅ Instagram embed widget (official embeds)
- ✅ Facebook embed widget (official embeds)
- ✅ Multiple social accounts per restaurant

---

### CMS Management (`/web` admin section)

**Content Management**
- ✅ Choose & switch templates (v1-maison, v2-editorial, v3-cinematic)
- ✅ Upload & manage custom CSS
- ✅ Upload photo galleries (captions, alt text, ordering)
- ✅ Select featured menu items from master menu
- ✅ Manage Instagram & Facebook embed widgets
- ✅ Edit SEO metadata (title, description, og:image)
- ✅ Create custom content blocks (HTML sections)

**Access Control**
- ✅ Staff with permission `landing.manage_content` can edit
- ✅ Audit log tracks all CMS changes
- ✅ Role-based access (managers/owners only)

---

## 🚫 What's NOT Included (Phase 3+)

**Customer Features**
- ❌ Promotions & announcement banners
- ❌ Loyalty point redemption at checkout
- ❌ Customer reviews & ratings (submit)
- ❌ Wishlist/favorites
- ❌ Order tracking on landing page
- ❌ Pre-order functionality
- ❌ Referral program

**CMS Features**
- ❌ Blog/news section
- ❌ Staff spotlight management
- ❌ Real-time analytics dashboard
- ❌ Email notification configuration
- ❌ Multi-language support
- ❌ Advanced page builder (drag-drop)
- ❌ A/B testing templates
- ❌ Appointment scheduling

---

## 📱 Responsive Breakpoints

All templates must support:

```
Mobile:  320px - 768px
Tablet:  768px - 1024px
Desktop: 1024px+
```

---

## 🔐 Permission System

**Required New Permission:**
```
landing.manage_content
  → Can create, read, update, delete all CMS content
  → Can select template & upload custom CSS
  → Can manage galleries, featured items, social feeds
```

Assign to: Restaurant owners, managers (not kitchen/delivery staff)

---

## 🗄️ Database Tables Summary

| Table | Purpose | Tenant-Scoped |
|-------|---------|---|
| `landing_domains` | Domain → tenant_id mapping | No (one row per domain) |
| `landing_galleries` | Photo galleries | Yes |
| `landing_gallery_images` | Individual gallery photos | Yes |
| `landing_featured_items` | Selected menu items | Yes |
| `landing_social_feeds` | Instagram/Facebook embeds | Yes |
| `landing_template_settings` | Template choice + CSS | Yes (one per tenant) |
| `landing_seo_metadata` | Meta tags | Yes (one per tenant) |
| `landing_content_blocks` | Custom HTML sections | Yes |
| `landing_guest_reservations` | Guest bookings pre-account | Yes |

---

## 🔗 API Endpoints Cheat Sheet

### Public (no auth required)
```
GET    /api/landing/restaurant
GET    /api/landing/branches
GET    /api/landing/menu
GET    /api/landing/opening-hours
GET    /api/landing/events
GET    /api/landing/reviews
GET    /api/landing/config              ← Full page config
POST   /api/landing/guest-reservation
```

### Customer Auth (public endpoints)
```
POST   /api/landing/customer/auth/register
POST   /api/landing/customer/auth/login
POST   /api/landing/customer/auth/logout
GET    /api/landing/customer/auth/me
POST   /api/landing/customer/auth/guest   ← Convert guest to account
```

### CMS Management (staff auth + permission required)
```
GET    /api/landing/cms/gallery
POST   /api/landing/cms/gallery
PUT    /api/landing/cms/gallery/{id}
DELETE /api/landing/cms/gallery/{id}

GET    /api/landing/cms/featured-items
POST   /api/landing/cms/featured-items
PUT    /api/landing/cms/featured-items/{id}
DELETE /api/landing/cms/featured-items/{id}

GET    /api/landing/cms/social-feeds
POST   /api/landing/cms/social-feeds
PUT    /api/landing/cms/social-feeds/{id}
DELETE /api/landing/cms/social-feeds/{id}

GET    /api/landing/cms/template-settings
PUT    /api/landing/cms/template-settings

GET    /api/landing/cms/seo
PUT    /api/landing/cms/seo

GET    /api/landing/cms/content-blocks
POST   /api/landing/cms/content-blocks
PUT    /api/landing/cms/content-blocks/{id}
DELETE /api/landing/cms/content-blocks/{id}
```

---

## 🎨 Template Color Palettes

**V1 — MAISON** (Luxury Fine Dining)
```
Primary:    #D4AF37 (Gold)
Background: #1A1410 (Deep Black)
Text:       #F5F1EA (Cream)
Accent:     #8B7355 (Taupe)
```

**V2 — EDITORIAL** (Magazine)
```
Primary:    #722F37 (Wine)
Background: #1A1110 (Dark Maroon)
Text:       #F5F1EA (Cream)
Accent:     #C4A880 (Beige)
```

**V3 — CINEMATIC** (Immersive)
```
Primary:    #B87333 (Copper)
Background: #0D0D0D (Black)
Text:       #F5F1EA (Cream)
Accent:     #E85D04 (Ember)
```

---

## 🔄 Guest Reservation → Account Flow

```
1. Guest fills form (name, email, phone, date, time, party_size)
   ↓
2. POST /api/landing/guest-reservation
   → Creates landing_guest_reservations record
   → Sends confirmation email with conversion link
   ↓
3. Guest clicks "Create Account" in email
   → Navigates to /auth/guest-register/{confirmationCode}
   → Form pre-fills name, email, phone (locked)
   ↓
4. Guest sets password + submits
   ↓
5. POST /api/landing/customer/auth/guest
   → Creates customer_profile + customer_tenant_profile
   → Links to existing landing_guest_reservations
   → Returns JWT token
   ↓
6. Customer logged in, can now place orders, view loyalty, etc.
```

**Expiration:** Guest reservations expire after 30 days

---

## 🛡️ Tenant Isolation Rules

| What | Check | Result |
|------|-------|--------|
| Different tenant accesses my gallery | Host header + landing_domains lookup | 404 |
| Different tenant's staff edits my CMS | Permission check + tenant_id validation | 403 |
| I accidentally query without tenant_id | Global TenantScope enforced | Query fails (safe) |

---

## 📊 Data Flow Diagram

```
Customer Visit to myrestaurant.com:

  myrestaurant.com
        ↓ (DNS/Nginx routes to /landing)
  
  React /landing app loads (index.tsx)
        ↓
  
  Calls /api/landing/domain-lookup?domain=myrestaurant.com
        ↓
  
  Backend returns { tenant_id: 123 }
        ↓
  
  Frontend stores in AuthStore.tenant_id
        ↓
  
  MST RootStore initializes
        ↓
  
  Fetches /api/landing/restaurant (public, tenant from Host header)
  Fetches /api/landing/menu
  Fetches /api/landing/config (template, CSS, galleries, etc.)
        ↓
  
  Template selected from config.template
        ↓
  
  Renders chosen template (Maison/Editorial/Cinematic)
        ↓
  
  Injects custom CSS from config.customCss
        ↓
  
  Customer browses menu, makes reservation
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Domain resolution service (lookup, caching)
- [ ] Guest reservation creation & validation
- [ ] Template rendering with different data
- [ ] MST store actions

### Integration Tests
- [ ] Full customer registration → login → loyalty view
- [ ] Guest reservation → account conversion
- [ ] Staff CMS update → landing page reflects change
- [ ] Custom CSS injection works without breaking layout
- [ ] Gallery upload → appears on landing page

### Tenant Isolation Tests
- [ ] Tenant A's gallery not visible to Tenant B
- [ ] Domain lookup returns correct tenant
- [ ] Staff from Tenant B cannot edit Tenant A's CMS
- [ ] API queries properly scoped by tenant_id

### E2E Tests (Cypress/Playwright)
- [ ] Customer registration flow
- [ ] Menu browsing & search
- [ ] Make reservation (guest & logged-in)
- [ ] Social feed embeds render
- [ ] Template switching works
- [ ] Custom CSS applies correctly

---

## 📋 Pre-Implementation Questions

Before you start coding, confirm answers with the team:

1. **Password Reset:** Should customers be able to reset password on landing? (defer to Phase 3?)
2. **Email Verification:** Should customers verify email on registration?
3. **Phone Verification:** Should guest reservations require phone verification?
4. **Redis Caching:** Should we cache landing config in Redis? (Phase 3 optimization)
5. **Rate Limiting:** Should auth endpoints have rate limiting? (yes, prevent brute force)
6. **Audit Logging:** Should all CMS changes be logged to audit_log? (yes, compliance)
7. **Image Optimization:** Should we resize/compress gallery images? (yes, performance)
8. **CDN:** Should gallery images be served from CDN? (Phase 3)

---

## 🚀 Launch Checklist

- [ ] All 3 templates render correctly with mock data
- [ ] Domain resolution middleware working
- [ ] Auth endpoints tested & secured (rate limiting, CORS)
- [ ] CMS permissions enforced (audit logged)
- [ ] Tenant isolation verified (no cross-tenant leaks)
- [ ] Mobile-responsive on all templates
- [ ] Custom CSS injection secure (no XSS)
- [ ] Social feed embeds render safely
- [ ] Gallery images optimized
- [ ] SEO metadata applied (meta tags visible)
- [ ] Test coverage >80%
- [ ] Documented API & schema
- [ ] Staff trained on CMS interface
- [ ] Customer documentation (how to register, reserve, etc.)

---

## 📞 Support & Questions

When stuck, check:
1. `/api` documentation in `docs/04-api-design.md`
2. Frontend structure in `docs/06-frontend-architecture.md`
3. Auth system in `docs/05-auth-roles.md`
4. Existing code in `/web` for MST patterns
5. Full implementation guide in `.claude/prompts/landing-cms-implementation.md`
