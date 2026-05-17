# Customers & Loyalty — Testing Guide

## Overview
The Customers & Loyalty module manages customer profiles and the restaurant's loyalty programme. Customers are platform-level (not per-tenant) but their loyalty data (points, tier, visit history) is tracked per restaurant. Staff can search customers, enrol new members, view full profiles with transaction history, and manage loyalty point adjustments.

**Loyalty tiers** (in ascending order): Bronze → Silver → Gold → Platinum. Tier is determined by lifetime spend or visit frequency.

## Prerequisites
- Logged in to the `@web` staff app (`http://localhost:5500`)
- A branch is selected in the sidebar
- Permission required: `customers.view_basic` (list/search), `customers.view_full` (full profile and loyalty detail), `customers.manage_loyalty` (adjust points, enrol)
- At least one customer account must exist (created via the customer portal at `/portal`, or enrolled by staff)

## Sub-sections

### Customer List

**Purpose**
Search and browse all customers linked to the current restaurant tenant.

**How to access**
Click **Customers & Loyalty** in the left sidebar (under Management). URL: `/customers`.

**Test Cases**

#### Test 1: Customer list loads
- **Precondition**: At least one customer has been enrolled at this restaurant.
- **Steps**:
  1. Navigate to `/customers`.
  2. The page shows customer cards in a grid. Each card displays: avatar initial, full name, phone, email (if available), loyalty tier badge (Bronze/Silver/Gold/Platinum), loyalty points, lifetime visits, and last visit date.
- **Expected result**: Cards are visible. Tier badges show the correct colours (Bronze = tan, Silver = grey, Gold = gold, Platinum = dark).
- **Edge cases to check**:
  - No customers enrolled → empty state with a prompt to enrol.
  - Customer with no email shows only phone.

#### Test 2: Search for a customer
- **Steps**:
  1. In the search input at the top of the page, type a customer's name or phone number (e.g. `John` or `+447700`).
- **Expected result**: The card grid filters to show only matching customers. Non-matching cards disappear.
- **Edge cases to check**:
  - Search with no matches → "No customers found" message.
  - Clear the search → all customers reappear.

#### Test 3: Filter by loyalty tier
- **Steps**:
  1. Find the **Tier** filter dropdown (options: All Tiers, Bronze, Silver, Gold, Platinum).
  2. Select **Gold**.
- **Expected result**: Only Gold-tier customers are shown.

#### Test 4: Click a customer card to open their profile
- **Steps**:
  1. Click any customer card.
- **Expected result**: Navigates to the customer's full profile page (`/customers/:customerId`).

---

### Customer Profile

**Purpose**
View and manage a single customer's complete profile: personal details, loyalty tier, points balance, visit history, reservation history, and order history.

**How to access**
Click any customer card from the list. URL: `/customers/:customerId`.

**Test Cases**

#### Test 5: View customer profile
- **Precondition**: A customer exists.
- **Steps**:
  1. Click a customer card.
  2. The profile page shows: name, phone, email, loyalty number, tier badge, points balance, lifetime spend, visit count, join date, last visit date.
  3. Tabs or sections below show: visit/order history, reservation history.
- **Expected result**: All data is correctly populated. Loyalty number is shown (format e.g. `CL-00042`).

#### Test 6: Adjust loyalty points (manual override)
- **Precondition**: `customers.manage_loyalty` permission.
- **Steps**:
  1. On the customer profile, find the **Points** section.
  2. Click **Adjust Points** or an edit icon.
  3. Enter a positive number (e.g. `50`) to add points, or a negative number (e.g. `-20`) to deduct.
  4. Enter a reason: `"Goodwill adjustment for complaint"`.
  5. Click **Save**.
- **Expected result**: Points balance updates. The adjustment appears in the customer's activity history.
- **Edge cases to check**:
  - Deduct more points than the customer has → error or confirmation dialog warning balance will go to 0.
  - Blank reason → validation error.

#### Test 7: View order/visit history
- **Steps**:
  1. On the customer profile, scroll to the **History** section.
  2. Look for a list of past visits or orders.
- **Expected result**: Each entry shows date, order total, channel, and points earned. Sorted newest first.

#### Test 8: View reservation history
- **Steps**:
  1. On the customer profile, find the **Reservations** tab or section.
- **Expected result**: Shows past and upcoming reservations linked to this customer.

---

### Enrol New Customer

**Purpose**
Register a new customer at the point of sale or front-of-house, linking them to the restaurant's loyalty programme.

**How to access**
On the Customers list, click **+ Enrol Customer** button. URL: `/customers/enroll`.

**Test Cases**

#### Test 9: Enrol a new customer
- **Steps**:
  1. Click **+ Enrol Customer**.
  2. Fill in the enrolment form:
     - **Phone**: `+44 7700 900400` (required — used as the primary identifier)
     - **First name**: `Sophie`
     - **Last name**: `Williams`
     - **Email**: `sophie@example.com` (optional)
     - **Date of birth**: `1990-03-15` (optional — used for birthday promotions)
     - **Marketing opt-in**: tick the checkbox if the customer consents
  3. Click **Enrol**.
- **Expected result**: Sophie Williams appears in the customer list with Bronze tier (default starting tier) and 0 points.
- **Common mistakes**: Enrolling a phone number already linked to an existing account — the system should detect this and show the existing profile.
- **Edge cases to check**:
  - Blank phone → validation error (phone is required).
  - Invalid phone format → validation error.
  - Duplicate phone number → error: "A customer with this phone number already exists."
  - Email only, no phone → form may reject (phone is required as primary ID).

#### Test 10: Enrol creates a unique loyalty number
- **Steps**:
  1. Complete enrolment as above.
  2. Open Sophie's profile.
- **Expected result**: A loyalty number is assigned automatically (e.g. `CL-00043`). The tester should note this number for future tests.

---

## Known Relationships
- Customer data is shared across all restaurants (platform-level profiles) but loyalty points and tier are per-restaurant (`customer_tenant_profiles`).
- Reservations linked to customers appear in both this module and the **Reservations** module.
- Orders placed by customers earn loyalty points automatically (configured per restaurant).
- Customer analytics (RFM segmentation, churn risk) are visible in **Analytics → Customers** dashboard.
- Customers can log into their own portal (`/portal`) to view their points and history.

## Checklist
- [ ] Customer list loads with tier badges and correct data
- [ ] Search by name and phone filters cards
- [ ] Tier filter works (Bronze/Silver/Gold/Platinum)
- [ ] Click customer card opens profile
- [ ] Profile shows all personal and loyalty data
- [ ] Points adjustment (positive and negative) with reason
- [ ] Deducting more than balance shows error or warning
- [ ] Order/visit history listed newest first
- [ ] Reservation history shown on profile
- [ ] Enrol new customer with phone as required field
- [ ] Duplicate phone number returns error
- [ ] Loyalty number auto-assigned on enrolment
- [ ] Enrolled customer appears in list with Bronze tier
