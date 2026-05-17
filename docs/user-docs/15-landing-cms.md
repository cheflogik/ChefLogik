# Landing Page CMS — Testing Guide

## Overview
The Landing Page CMS (Content Management System) allows restaurant staff to manage their public-facing customer website at `landing.cheflogik.com/[restaurant-slug]`. The landing page is built from one of three visual templates and supports: content blocks (hero text, about, contact info), a photo gallery, featured menu items, SEO metadata, social media feeds, and moderation of customer reviews.

**Three templates**:
- `v1-maison` — Classic, elegant, serif typography
- `v2-editorial` — Modern editorial magazine style
- `v3-cinematic` — Bold, full-bleed cinematic imagery

## Prerequisites
- Logged in to the `@web` staff app (`http://localhost:5500`)
- Permission required: `landing.manage_content`
- A landing page template must be selected before other sections take full effect
- The landing app (`@landing`) must be running on port 5700 to preview changes

## Sub-sections

### Landing CMS Navigation

**Purpose**
Navigate between the eight CMS sub-sections.

**How to access**
Click **Landing Page CMS** in the left sidebar (under Management). URL: `/landing-cms`. A secondary tab bar appears at the top of the page.

**Test Cases**

#### Test 1: CMS navigation bar loads
- **Steps**:
  1. Navigate to `/landing-cms`.
  2. A tab bar or navigation appears with links: **Template Settings**, **Content Blocks**, **Gallery**, **Featured Items**, **SEO**, **Social Feeds**, **Reviews**.
- **Expected result**: All tabs are visible and clickable.

---

### Template Settings

**Purpose**
Choose which of the three visual templates is active for the landing page, and configure template-specific settings (colours, accent fonts, hero style).

**How to access**
Click the **Template Settings** tab. URL: `/landing-cms/template-settings`.

**Test Cases**

#### Test 2: Select a template
- **Steps**:
  1. Navigate to `/landing-cms/template-settings`.
  2. Three template options are displayed: **v1-maison**, **v2-editorial**, **v3-cinematic**.
  3. Click **v2-editorial** to select it.
  4. Click **Save** or **Apply**.
- **Expected result**: The landing page at `http://localhost:5700/[slug]` switches to the editorial template layout.

#### Test 3: Configure accent colour
- **Steps**:
  1. On Template Settings, find the **Accent colour** setting.
  2. Change it to a hex value: `#C0392B` (deep red).
  3. Click **Save**.
- **Expected result**: The selected template's accent colour (buttons, links, highlights) updates on the landing page.
- **Edge cases to check**:
  - Enter an invalid hex value (e.g. `#ZZZZZZ`) → validation error.
  - Very light colour on white background → accessibility warning (check if the system warns about contrast ratio).

---

### Content Blocks

**Purpose**
Edit the main text content sections of the landing page: hero headline, tagline, about us text, opening hours display, and contact information.

**How to access**
Click the **Content Blocks** tab. URL: `/landing-cms/content-blocks`.

**Test Cases**

#### Test 4: Edit hero headline
- **Steps**:
  1. Navigate to `/landing-cms/content-blocks`.
  2. Find the **Hero** block. Edit the headline field from `"Welcome to Rosti"` to `"Exceptional Dining in the Heart of London"`.
  3. Click **Save**.
- **Expected result**: The landing page hero section shows the new headline.
- **Edge cases to check**:
  - Very long headline (200+ characters) → check if it wraps or overflows visually on the landing page.

#### Test 5: Edit opening hours content block
- **Steps**:
  1. Find the **Opening Hours** block.
  2. Update Monday hours text to `"Monday: Closed"`.
  3. Click **Save**.
- **Expected result**: Opening hours on the landing page reflect the updated text.

#### Test 6: Multi-language content block
- **Precondition**: The restaurant has multilanguage enabled (language list configured).
- **Steps**:
  1. On a content block, find a language switcher (e.g. tabs for EN, FR, AR).
  2. Select **FR** (French).
  3. Enter the French translation of the hero headline.
  4. Save.
- **Expected result**: When a customer visits the landing page and selects French, the headline appears in French.

---

### Gallery

**Purpose**
Upload and manage the photo gallery displayed on the landing page.

**How to access**
Click the **Gallery** tab. URL: `/landing-cms/gallery`.

**Test Cases**

#### Test 7: Upload a photo to the gallery
- **Steps**:
  1. Navigate to `/landing-cms/gallery`.
  2. Click **Upload Photo** (or drag and drop).
  3. Select a JPEG or PNG file (recommended: min 1200×800 px).
  4. Add a caption (optional): `"Our signature lamb dish"`.
  5. Click **Upload** or **Save**.
- **Expected result**: The photo appears in the gallery grid. It is displayed on the landing page gallery section.
- **Edge cases to check**:
  - Upload a non-image file (e.g. PDF) → error: "Only image files are accepted."
  - Upload a very small image (e.g. 100×100 px) → warning about minimum resolution.
  - Upload an image exceeding the size limit (e.g. 20MB) → error with size limit info.

#### Test 8: Delete a gallery photo
- **Steps**:
  1. In the gallery grid, hover over a photo.
  2. Click the **Delete** (trash) icon.
  3. Confirm deletion.
- **Expected result**: Photo is removed from the grid and from the landing page.

#### Test 9: Reorder gallery photos
- **Steps**:
  1. Drag a photo from position 3 to position 1 in the grid.
  2. Click **Save** or the order auto-saves.
- **Expected result**: Photos appear in the new order on the landing page.

---

### Featured Items

**Purpose**
Select specific menu items to be featured/highlighted on the landing page.

**How to access**
Click the **Featured Items** tab. URL: `/landing-cms/featured-items`.

**Test Cases**

#### Test 10: Add a featured item
- **Precondition**: Menu items exist in Menu Management.
- **Steps**:
  1. Navigate to `/landing-cms/featured-items`.
  2. Click **Add Featured Item** or a search field to find a menu item.
  3. Select `Grilled Salmon` from the dropdown/search.
  4. Click **Save**.
- **Expected result**: "Grilled Salmon" appears in the featured items list and is displayed in the featured section of the landing page.
- **Edge cases to check**:
  - Feature an 86'd item → the system should warn that the item is currently unavailable.
  - Add the same item twice → duplicate warning.

#### Test 11: Remove a featured item
- **Steps**:
  1. Find "Grilled Salmon" in the featured items list.
  2. Click **Remove**.
  3. Confirm.
- **Expected result**: Item is removed from the featured section of the landing page.

---

### SEO Settings

**Purpose**
Configure meta title, meta description, and Open Graph (social sharing) tags for the landing page.

**How to access**
Click the **SEO** tab. URL: `/landing-cms/seo`.

**Test Cases**

#### Test 12: Update SEO meta title and description
- **Steps**:
  1. Navigate to `/landing-cms/seo`.
  2. In **Page title**: enter `"Rosti Restaurant — Fine Dining London"`.
  3. In **Meta description**: enter `"Award-winning Italian cuisine in Soho, London. Book your table online."` (keep under 160 characters).
  4. Click **Save**.
- **Expected result**: The landing page HTML `<title>` tag and `<meta name="description">` tag are updated.
- **Edge cases to check**:
  - Meta description over 160 characters → warning: "Google may truncate descriptions over 160 characters."
  - Blank page title → validation error.

---

### Social Feeds

**Purpose**
Connect the restaurant's social media accounts to display their latest posts on the landing page.

**How to access**
Click the **Social Feeds** tab. URL: `/landing-cms/social-feeds`.

**Test Cases**

#### Test 13: Add an Instagram handle
- **Steps**:
  1. Navigate to `/landing-cms/social-feeds`.
  2. Enter the Instagram handle: `@rostirestaurant`.
  3. Click **Save**.
- **Expected result**: The Instagram feed section appears on the landing page showing the latest posts from that account.
- **Edge cases to check**:
  - Private Instagram account → feed will not load (external limitation; the app may show an error or empty state).
  - Invalid handle (e.g. `@#invalid`) → validation error.

---

### Reviews

**Purpose**
Moderate customer reviews submitted via the landing page or imported from Google/TripAdvisor. Approved reviews are displayed on the landing page.

**How to access**
Click the **Reviews** tab. URL: `/landing-cms/reviews`.

**Test Cases**

#### Test 14: View pending reviews
- **Precondition**: At least one review has been submitted.
- **Steps**:
  1. Navigate to `/landing-cms/reviews`.
  2. Reviews appear in a table with: reviewer name, rating (1–5 stars), review text, date, status (Pending / Approved / Hidden).
- **Expected result**: Pending reviews are visible.

#### Test 15: Approve a review
- **Steps**:
  1. Find a "Pending" review in the table.
  2. Click **Approve**.
- **Expected result**: Review status changes to "Approved" and it appears on the landing page reviews section.

#### Test 16: Hide (reject) a review
- **Steps**:
  1. Find a review (e.g. offensive content).
  2. Click **Hide** or **Reject**.
- **Expected result**: Review status changes to "Hidden". It does not appear on the landing page.

---

## Known Relationships
- **Featured Items** pulls data from **Menu Management**. Items must exist there first.
- Template settings affect the entire appearance of the customer-facing **Landing Page** (the `@landing` app on port 5700).
- Gallery photos are stored in AWS S3 (configured in backend settings).
- SEO tags are rendered server-side on the landing page for search engine indexing.

## Checklist
- [ ] CMS navigation tabs all load without error
- [ ] Template selection switches the landing page layout
- [ ] Accent colour change reflects on landing page
- [ ] Content blocks (hero, about, hours) editable and save correctly
- [ ] Long content in blocks wraps correctly on landing page
- [ ] Gallery photo upload (JPEG/PNG) succeeds
- [ ] Non-image file upload blocked with error
- [ ] Gallery photo deletion with confirmation
- [ ] Featured items selectable from menu items
- [ ] Featured 86'd item shows warning
- [ ] SEO title and description update HTML meta tags
- [ ] Description >160 chars shows truncation warning
- [ ] Social media handle saves and feed loads on landing page
- [ ] Reviews list shows pending items
- [ ] Approve review displays it on landing page
- [ ] Hide review removes it from landing page
