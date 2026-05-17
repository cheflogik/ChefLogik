# Analytics & Reports — Testing Guide

## Overview
The Analytics module provides data-driven dashboards and reports across multiple dimensions. Access is permission-controlled — different roles see different dashboards. The available dashboards are:

| Dashboard | Who sees it | URL |
|---|---|---|
| Owner | Owner/Management | `/analytics/owner` |
| Branch | Branch managers | `/analytics/branch` |
| Revenue | Finance roles | `/analytics/revenue` |
| Customers | CRM roles | `/analytics/customers` |
| Dishes | Menu managers | `/analytics/dishes` |
| Events | Events managers | `/analytics/events` |
| Kitchen | Head chef | `/analytics/kitchen` |
| Audit Log | Compliance/Owners | `/analytics/audit-log` |

## Prerequisites
- Logged in to the `@web` staff app (`http://localhost:5500`)
- A branch is selected (some dashboards aggregate across all branches)
- Historical data must exist: orders, reservations, customers, etc. Analytics dashboards will be mostly empty if there is no historical data.
- Relevant permission for the dashboard being tested (see table above)

## Sub-sections

### Analytics Navigation

**Purpose**
Route users to the correct dashboard based on their role.

**How to access**
Click **Analytics & Reports** in the left sidebar (under Insights). URL: `/analytics`. The system auto-redirects to the first dashboard the user has permission to view.

**Test Cases**

#### Test 1: Redirect to correct dashboard based on permission
- **Precondition**: User has `analytics.branch_dashboard` permission but NOT `analytics.owner_dashboard`.
- **Steps**:
  1. Click **Analytics & Reports** in the sidebar.
- **Expected result**: Automatically redirected to `/analytics/branch` (not `/analytics/owner`).

#### Test 2: No analytics permission
- **Precondition**: User has no analytics permissions at all.
- **Steps**:
  1. Click **Analytics & Reports**.
- **Expected result**: Page shows: "You do not have permission to view any analytics dashboards."

---

### Owner Dashboard (`/analytics/owner`)

**Purpose**
High-level overview for restaurant owners: revenue trends, order volume, top dishes, customer retention, and multi-branch comparison.

**Test Cases**

#### Test 3: Owner dashboard loads
- **Precondition**: `analytics.owner_dashboard` permission. Orders exist.
- **Steps**:
  1. Navigate to `/analytics/owner`.
  2. Check that the page renders key metrics: total revenue (period), order count, average order value, new vs. returning customer split.
- **Expected result**: Charts and stat cards are visible. If data is sparse, charts may show flat lines — this is expected.
- **Edge cases to check**:
  - No data at all → charts show empty state or "No data for this period."

#### Test 4: Change date range
- **Precondition**: Owner dashboard is loaded.
- **Steps**:
  1. Find the date range picker (e.g. "Last 7 days", "Last 30 days", "Custom").
  2. Select **Last 30 days**.
- **Expected result**: All charts and metrics update to reflect the 30-day window.

---

### Branch Dashboard (`/analytics/branch`)

**Purpose**
Operational dashboard for branch managers: daily revenue, covers (diners), average spend per cover, order timing performance.

**Test Cases**

#### Test 5: Branch dashboard loads with current branch data
- **Precondition**: `analytics.branch_dashboard` permission. A branch is selected.
- **Steps**:
  1. Navigate to `/analytics/branch`.
  2. Check for metrics: revenue today, covers today, average spend, order timing (% on time vs. late).
- **Expected result**: Metrics reflect the selected branch's data.

#### Test 6: Switch branch and dashboard refreshes
- **Precondition**: Two branches exist with different order volumes.
- **Steps**:
  1. Note the metrics for Branch A.
  2. Switch to Branch B using the branch selector.
  3. Navigate back to `/analytics/branch`.
- **Expected result**: Metrics reflect Branch B's data.

---

### Revenue Dashboard (`/analytics/revenue`)

**Purpose**
Detailed revenue breakdown: by channel (dine-in, delivery, takeaway), by time of day, payment methods, refunds, and discounts applied.

**Test Cases**

#### Test 7: Revenue dashboard loads
- **Precondition**: `analytics.revenue_dashboard` or equivalent permission.
- **Steps**:
  1. Navigate to `/analytics/revenue`.
  2. Look for: total revenue charts, revenue by channel breakdown (pie or bar chart), refund total, discount/promo code usage.
- **Expected result**: Charts render. Channel labels match the order channels: POS, QR, Counter, Phone, Online, Uber Eats, Wolt.

---

### Customers Dashboard (`/analytics/customers`)

**Purpose**
Customer analytics: RFM segmentation (Recency, Frequency, Monetary), churn risk, loyalty tier distribution, new vs. lapsed customers.

**Test Cases**

#### Test 8: Customers dashboard loads
- **Precondition**: `analytics.customer_dashboard` permission.
- **Steps**:
  1. Navigate to `/analytics/customers`.
  2. Look for: customer count, loyalty tier breakdown, RFM segments, churn risk indicators.
- **Expected result**: Charts render. Tier breakdown shows proportion of Bronze/Silver/Gold/Platinum customers.

---

### Dishes Dashboard (`/analytics/dishes`)

**Purpose**
Menu performance: best-selling items, worst performers, margin analysis by dish, and 86 frequency (items most often taken off sale).

**Test Cases**

#### Test 9: Dishes dashboard loads
- **Precondition**: `analytics.branch_dashboard` or similar permission. Orders with items exist.
- **Steps**:
  1. Navigate to `/analytics/dishes`.
  2. Look for: top-selling items list, lowest-selling items, item margin chart.
- **Expected result**: Items are ranked by sales volume. Each entry shows the item name, orders, revenue, cost (if permission allows), and margin percentage.

---

### Events Dashboard (`/analytics/events`)

**Purpose**
Events business analytics: pipeline conversion rates, revenue from events, most popular occasion types, average event value.

**Test Cases**

#### Test 10: Events dashboard loads
- **Precondition**: `analytics.events_dashboard` permission. Event data exists.
- **Steps**:
  1. Navigate to `/analytics/events`.
  2. Check for: total events, conversion rate (enquiry → confirmed), average event value, revenue by occasion type.
- **Expected result**: Pipeline funnel visible. Data matches events created in the Events module.

---

### Kitchen Dashboard (`/analytics/kitchen`)

**Purpose**
Kitchen efficiency metrics: average preparation time by dish, KDS bump rate, allergen acknowledgement compliance rate.

**Test Cases**

#### Test 11: Kitchen dashboard loads
- **Precondition**: `analytics.kitchen_dashboard` permission. Orders have been processed through KDS.
- **Steps**:
  1. Navigate to `/analytics/kitchen`.
  2. Check for: average prep time per dish, ticket throughput over time, allergen acknowledgement % within 30 seconds.
- **Expected result**: Charts render with kitchen efficiency data.

---

### Audit Log (`/analytics/audit-log`)

**Purpose**
Immutable, chronological record of all significant system actions: logins, permission changes, order modifications, role changes, allergen acknowledgements. Used for compliance and investigation.

**How to access**
Navigate to `/analytics/audit-log`. Requires `analytics.audit_log` or similar compliance permission.

**Test Cases**

#### Test 12: Audit log loads and shows entries
- **Precondition**: Any system action has been performed (login, order creation, etc.).
- **Steps**:
  1. Navigate to `/analytics/audit-log`.
  2. The page shows a chronological list of audit entries with columns: timestamp, actor (who), action, resource type, resource ID, IP address.
- **Expected result**: Entries are listed newest first. No entry can be edited or deleted (read-only).

#### Test 13: Audit log captures a specific action
- **Precondition**: You are about to perform an audited action.
- **Steps**:
  1. Go to Menu Management and 86 an item.
  2. Navigate to `/analytics/audit-log`.
  3. Look for the most recent entry.
- **Expected result**: An entry for "menu.86" (or similar) appears with your user as actor, the item name as resource, and the current timestamp.

#### Test 14: Audit log — no delete/edit possible
- **Steps**:
  1. Review the audit log list.
- **Expected result**: There are no "Edit" or "Delete" buttons on any row. The log is read-only.

---

## Known Relationships
- Revenue data comes from **Orders**.
- Customer analytics come from **Customers & Loyalty**.
- Dish analytics come from **Menu Management** and **Orders**.
- Kitchen analytics come from **KDS** timestamps.
- Event analytics come from the **Events & Functions** module.
- The Audit Log captures actions from all modules.

## Checklist
- [ ] `/analytics` redirects to correct dashboard based on user permission
- [ ] No analytics permission → clear message shown
- [ ] Owner dashboard loads with revenue and order metrics
- [ ] Date range picker updates all charts
- [ ] Branch dashboard reflects selected branch data
- [ ] Revenue dashboard shows channel breakdown
- [ ] Customers dashboard shows tier distribution and RFM segments
- [ ] Dishes dashboard shows sales ranking and margins
- [ ] Events dashboard shows pipeline conversion
- [ ] Kitchen dashboard shows prep times and allergen compliance
- [ ] Audit log is read-only (no edit/delete buttons)
- [ ] Audit log captures real-time actions (e.g. 86 event visible after performing it)
