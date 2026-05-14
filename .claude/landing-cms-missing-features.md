# Missing Features Analysis & Recommendations

## 📊 Feature Matrix: What's In vs. Out

### MVP (Phase 2 — Landing + CMS)

| Feature | Status | Why Included | Impact |
|---------|--------|-------------|--------|
| Customer OTP registration on landing | ✅ MVP | Enable self-signup (2-step: initiate + verify) | Grows customer base |
| Guest reservations (via existing reservations table) | ✅ MVP | Lower friction — no account required | Better UX |
| 3 templates + CSS override | ✅ MVP | Give restaurants visual identity | Differentiation |
| Social feed embeds | ✅ MVP | Build social proof, engagement | Trust + credibility |
| Photo galleries | ✅ MVP | Showcase food, ambiance | Marketing asset |
| Featured menu items | ✅ MVP | Highlight bestsellers | Sales driver |
| SEO metadata | ✅ MVP | Search ranking, social sharing | Discoverability |
| Loyalty points view | ✅ MVP | Encourage repeat visits | Retention |
| Custom CSS editor (sanitized via sabberworm) | ✅ MVP | Branding flexibility | Owner satisfaction |
| Review display (is_published = true) | ✅ MVP | Social proof on landing page | Trust + conversion |
| Review moderation in CMS | ✅ MVP | Staff approve/unpublish/delete reviews | Content control |

---

### Phase 3 (Deferred Features)

| Feature | Complexity | Revenue Impact | Recommendation |
|---------|-----------|---|---|
| **Review submission form** (customers submit reviews) | Medium | High | **Do in Phase 3** — display + moderation are Phase 2 |
| **Promotional Banners** | Low | Medium | **Could do in Phase 3** |
| **Email Notifications** | Medium | High | **Do in Phase 3** |
| **Order Tracking** | High | High | **Requires Phase 1 completion first** |
| **Loyalty Redemption** | High | High | **Strategic phase 3 feature** |
| **Pre-orders** | High | Medium | **Later (operational complexity)** |
| **Blog/Content** | Low | Low | **Skip unless marketing-driven** |
| **Analytics Dashboard** | High | High | **Phase 3 (business intelligence)** |

---

## 🔥 Top 5 Missing Features That Would Add Value

### 1. **Customer Review Submission Form** (Phase 3)

**What it does:** Customers who've placed orders can submit reviews + ratings via the landing page

**Note:** Review *display* and CMS *moderation* (approve/unpublish/delete) are already Phase 2.
The `landing_reviews` table and all moderation endpoints exist. Phase 3 adds the customer-facing
submission form only.

**Why important:**
- Trust signal for new customers (UGC is most trusted marketing)
- SEO benefit (fresh content, keywords)
- Sentiment analysis (identify issues early)

**Effort:** Low-medium (3-5 days — schema + moderation already done)
- Backend: `POST /api/v1/landing/reviews` (auth:customer)
- Frontend: `ReviewForm.tsx` component in `/landing`
- Permission check: customer must have at least one completed order at the branch

**Revenue:** High
- Higher conversion rates (social proof)
- Better search ranking

**Defer reason:** Depends on orders + customer history existing in Phase 1

---

### 2. **Email Notification System** (Phase 3)

**What it does:** Send customers automated emails for reservations, order confirmations, loyalty milestones

**Why important:**
- Engagement (email open rate ~20%)
- Reservation reminders (reduce no-shows)
- Order updates (reduces "where's my food?" calls)
- Loyalty milestone notifications (encourages redemption)

**Effort:** Medium (1-2 weeks)
- Schema: `landing_email_templates` (for owner customization)
- Jobs: Reservation confirmation, reminder (24hr before), order status updates
- Service: SendEmailJob via Amazon SES (already in stack Decision 9)
- Frontend: Email preference center in customer account

**Revenue:** High (indirect)
- Reduced no-shows (seat optimization)
- Increased order frequency
- Better customer retention

**Defer reason:** Not critical for MVP launch, improves after people use it

---

### 3. **Promotional Banners & Announcements** (Phase 3)

**What it does:** Owners create time-limited promotions ("50% off Tuesdays", "New menu items", "Closed for private event")

**Why important:**
- Drive demand for slow periods
- Highlight new offerings
- Manage customer expectations
- Create urgency (limited-time offers)

**Effort:** Low (5-7 days)
- Schema: `landing_promotions` (title, description, valid_from, valid_to, banner_color)
- CMS: Simple form to create/edit/archive promotions
- Frontend: Banner component (dismissible, position at top)
- Rules: Show promotions that are active + relevant

**Revenue:** Medium
- 20-30% uplift on promoted items
- Better table utilization

**Defer reason:** Low effort but not essential to launch — add in Phase 3 wave 1

---

### 4. **Advanced Analytics Dashboard** (Phase 3)

**What it does:** Show restaurant owners website traffic, conversion metrics, customer insights

**Why important:**
- Data-driven decisions (what's working?)
- Identify bottlenecks (where do people drop off?)
- Template effectiveness (compare conversion rates)
- Customer patterns (busiest days/times)

**Effort:** High (3-4 weeks)
- Schema: `landing_analytics_events` (page views, click events, conversions)
- Frontend: Tracking via Segment/Mixpanel or custom tracking
- Dashboard: 5-6 key charts (traffic, conversions, template comparison, top items, etc.)
- Reports: Weekly/monthly email summary

**Revenue:** High (indirect)
- Informed optimization → revenue growth
- Upsell analytics tier (SaaS feature)

**Defer reason:** Requires data to accumulate first (Phase 3+)

---

### 5. **Multi-Language Support** (Phase 3 or 4)

**What it does:** Restaurants in diverse areas can display menu/content in Spanish, Mandarin, etc.

**Why important:**
- Expand addressable market (non-English speakers)
- Better customer experience
- Competitive advantage (most platforms monolingual)

**Effort:** High (3+ weeks)
- Architecture: i18n library (next-i18n-router, react-i18next)
- Schema: `landing_translations` (language, section, key, value)
- CMS: Multi-language editor for all content
- SEO: hreflang tags for lang variants

**Revenue:** High (if target market has non-English customers)

**Defer reason:** Not needed for launch, add based on demand

---

## ❌ Features to Skip (Not Worth Building)

| Feature | Why Skip |
|---------|----------|
| **Blog/News Section** | Requires editorial effort; most restaurants don't maintain. Use Instagram instead. |
| **Staff Spotlight** | Feel-good feature, minimal business impact. |
| **Video Uploads** | Heavy infrastructure. Use YouTube/Instagram embeds instead. |
| **Appointment Scheduling** | Overlaps with reservations; added complexity. |
| **Live Chat Support** | No budget. Suggest Intercom in Phase 4. |
| **Membership/Subscription** | Loyalty program already handles this. |
| **Referral Program** | Can add as point incentive, don't build standalone system. |

---

## 🎯 Recommended Phase 3 Build Order

**Phase 3 — Wave 1** (weeks 1-3):
1. Customer review submission form (schema + moderation already in Phase 2)
2. Promotional banners
3. Email notification system
4. Order tracking on landing page

**Phase 3 — Wave 2** (weeks 4-6):
5. Analytics dashboard (basic)
6. Advanced search/filtering
7. Loyalty point redemption at checkout

**Phase 4+:**
8. Multi-language support
9. Customer portal (GDPR self-service, booking history)
10. Referral program
11. Mobile app (if strategic priority)

---

## 🎁 Quick Wins (Easy Additions to MVP)

These features are **easy to add to Phase 2** without scope creep:

### 1. **Hours Override (Seasonal/Special)** (2 days)
- Restaurant can mark "Closed for event", "Holiday hours", "New Year special hours"
- Schema: `landing_special_hours` (date_from, date_to, text, is_closed)
- CMS: Date picker + text field
- Frontend: Show override instead of regular hours

**Value:** High (prevents customer frustration)

### 2. **Dietary Filter Tags** (1 day)
- Menu items already have tags (VEG, GF, VEGAN, DAIRY_FREE, etc.)
- Add filter chips on menu page
- Filter by dietary preference
- Store preference in localStorage

**Value:** Medium (improves UX, increases order volume)

### 3. **Allergen Warnings** (1 day)
- Menu items can have allergen list (dairy, gluten, nuts, shellfish, etc.)
- Display warnings prominently
- Toggleable allergen filter ("Hide all gluten items")

**Value:** High (liability + customer safety)

### 4. **"Call Restaurant" Button** (0.5 day)
- Simple CTA that opens phone dialer
- Better mobile UX than copying phone number

**Value:** Low but easy

### 5. **Testimonials/Quote Carousel** (1 day)
- Owner can add customer testimonials (text quotes, no reviews)
- Display rotating carousel on hero
- Separate from reviews (no ratings, pre-curated)

**Value:** Medium (social proof)

---

## 🚦 Feature Dependency Map

```
PHASE 1 (Must Complete First)
├── Customer auth system (CustomerAuthController + OTP methods added here)
├── Order system (OrderService — reused by LandingOrderController)
├── Payment system
└── Menu system (menu_items — reused by landing_featured_items)
     ↓
PHASE 2 (Landing + CMS)
├── Landing page app (/landing, port 5700)
├── CMS management in /web (landing-cms/* routes)
├── OTP 2-step customer registration
├── Guest reservations (existing reservations table, source='landing')
├── Review display (is_published=true) + CMS moderation
├── Loyalty view (read-only balance)
├── Social embeds, galleries, featured items, SEO, content blocks
└── Redis config cache (landing_config:{tenant_id})
     ↓
PHASE 3 (Enhancement)
├── Customer review submission form ← schema + moderation already done in Phase 2
├── Order tracking on landing page ← needs Phase 1 orders in place
├── Loyalty redemption ← needs loyalty system mature
├── Promotional banners
├── Email notifications ← needs SES integration wired
├── Analytics ← needs event tracking infrastructure
└── Referral program ← needs customer engagement
     ↓
PHASE 4 (Advanced)
├── Multi-language support
├── Mobile app
├── Advanced personalization
└── AI recommendations
```

---

## 💡 Hidden Features (Already In Phase 2 Design)

These are valuable but easy to miss:

1. **White-Label Support** — Templates don't mention ChefLogik, owner can fully brand
2. **Multi-Branch Support** — Customer can see all branches, pick nearest
3. **Tenant-Specific Domains** — Each restaurant gets own custom domain (myrestaurant.com)
4. **Dynamic Opening Hours** — Pull live hours from master DB (no data duplication)
5. **Audit Logging** — All CMS changes tracked (compliance + accountability)
6. **Role-Based Access** — Permission `landing.manage_content` (not all staff)
7. **Responsive Design** — Works on mobile, tablet, desktop
8. **SEO Built-In** — Meta tags, canonical URLs, og:image (search ranking)
9. **Social Proof** — Reviews, ratings, guest count (trust signals)
10. **Conversion Tracking** — Guest reservations auto-convert to accounts (lower friction)

---

## 📈 Expected Business Impact

### Customer Acquisition
| Feature | Expected Uplift |
|---------|---|
| Landing page (vs. no presence) | +300% discovery |
| Social proof (reviews + ratings) | +40% conversion |
| White-label design | +20% brand perception |
| Multiple templates | +15% customization satisfaction |

### Retention
| Feature | Expected Uplift |
|---------|---|
| Loyalty points display | +25% repeat visits |
| Email notifications | +20% engagement |
| Easy reservations (guest conversion) | +35% accounts |
| Order tracking | +10% satisfaction |

### Revenue
| Feature | Expected Impact |
|---------|---|
| Featured menu items | +15% featured item sales |
| Promotional banners | +20% slow-period revenue |
| Order upsell (recommendations) | +10% AOV |
| Loyalty redemption | +30% loyalty program engagement |

---

## ⚠️ Common Pitfalls to Avoid

1. **Building too much content management** → Keep CMS simple (no drag-drop page builder)
2. **Ignoring mobile experience** → 60% of food orders are mobile
3. **Making custom CSS too powerful** → Risks breaking layout, XSS attacks
4. **Not validating email/phone** → Leads to bad reservations
5. **Forgetting tenant isolation** → CRITICAL security issue
6. **No rate limiting on auth** → Vulnerable to brute force attacks
7. **Caching landing config too long** → Stale content after CMS update
8. **Not testing cross-domain** → Works on localhost, breaks in production
9. **Slow image galleries** → Optimize/resize before upload
10. **Unclear CMS navigation** → Staff can't find where to update content

---

## ✅ Success Metrics (Phase 2)

Track these to measure success:

| Metric | Target | How to Measure |
|--------|--------|---|
| Landing page traffic | 1000+ views/month | Google Analytics |
| Customer OTP registrations | 50+ new customers/month | customer_profiles count |
| Guest reservations (no account) | 20+ per month | reservations WHERE source='landing' AND customer_profile_id IS NULL |
| CMS adoption | 80%+ of restaurants | Usage dashboard |
| Mobile traffic | 60%+ | Google Analytics |
| Template preference | Balanced 33% each | landing_template_settings distribution |
| SEO ranking | Top 3 for restaurant name | Google Search Console |
| Review approval rate | Tracked | landing_reviews: published vs. pending counts |

---

## 🎓 Learning Resources

Before building, familiarize with:

1. **React Hooks & MST** — How `/web` manages state
2. **Laravel Sanctum** — Multiple auth guards (staff vs. customer)
3. **Responsive Design** — Mobile-first approach
4. **DNS & Domain Routing** — How myrestaurant.com points to us
5. **Security** — XSS (CSS injection), CSRF, rate limiting
6. **SEO Basics** — Meta tags, canonical URLs, structured data
7. **Tenancy Patterns** — Multi-tenant isolation (read Decision 1)

---

## 🔗 Related Documentation

Read these before starting:

- `CLAUDE.md` — Project decisions & context
- `decisions.md` — All 21 architectural decisions
- `docs/03-database-schema.md` — Existing schema (understand relationships)
- `docs/04-api-design.md` — API conventions
- `docs/05-auth-roles.md` — Auth system & permissions
- `docs/06-frontend-architecture.md` — Frontend patterns (MST, routing, etc.)
- `.claude/prompts/landing-cms-implementation.md` — FULL implementation guide
- `.claude/landing-cms-architecture.md` — System design & data flow
