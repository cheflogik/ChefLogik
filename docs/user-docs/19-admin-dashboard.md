# Admin Dashboard — Testing Guide

## Overview
The Admin Dashboard is the landing screen of the Platform Admin app (`@admin`). It provides a high-level view of the entire ChefLogik SaaS platform: monthly recurring revenue (MRR), active tenant count, churn rate, orders processed across all tenants, plan distribution, and recent new tenant signups.

## Prerequisites
- Logged in to the `@admin` app (`http://localhost:5600`)
- Note: Some data on this dashboard may be **mock/placeholder data** during early development — confirm with the team which metrics are live vs. mock

## Sub-sections

### KPI Cards

**Purpose**
Show four top-level business metrics for the platform.

**How to access**
Navigate to `http://localhost:5600/dashboard` (default landing page after login).

**Test Cases**

#### Test 1: Dashboard loads with KPI cards
- **Steps**:
  1. Log in and navigate to `/dashboard`.
  2. Four KPI cards appear at the top:
     - **Monthly Recurring Revenue** — e.g. `$48,500` with a `+12.4%` change indicator
     - **Active Tenants** — e.g. `127` with `+8` new
     - **Monthly Churn Rate** — e.g. `2.3%` with `-0.4%` (down = good)
     - **Orders Processed** — e.g. `48,291` with `+23.1%`
- **Expected result**: All four cards are visible with values and trend indicators (up arrow in green, down arrow in amber for churn).
- **Edge cases to check**:
  - If the data is live from the API: verify the numbers make sense (positive tenants, plausible MRR).
  - If data is mock: a note or indicator should ideally be visible (though this may not exist in the UI).

---

### Plan Distribution

**Purpose**
Show the split of active tenants across Starter, Growth, and Enterprise plans.

**Test Cases**

#### Test 2: Plan distribution section
- **Steps**:
  1. Scroll down on the Dashboard.
  2. Find the **Plan Distribution** section.
  3. Three rows show: Enterprise, Growth, Starter with tenant counts, percentage, and a coloured progress bar.
- **Expected result**: Percentages add up to ~100%. Enterprise is the highest revenue per tenant. Starter has the most tenants by count.

---

### Recent Signups

**Purpose**
Show the latest tenants (restaurants) that have signed up to the platform.

**Test Cases**

#### Test 3: Recent signups list
- **Steps**:
  1. Find the **Recent Signups** table on the Dashboard.
  2. Columns: restaurant name, slug, plan, signup date, status badge.
- **Expected result**: Latest signups are listed (newest first). Status badges show: Active (green), Trial (blue), Suspended (yellow), Cancelled (red).

#### Test 4: Click a tenant name to navigate to Tenants
- **Steps**:
  1. Click a restaurant name in the Recent Signups table.
- **Expected result**: Navigates to the `/tenants` page with that tenant highlighted or a detail panel opening.

---

## Known Relationships
- MRR data comes from the **Billing & Plans** module.
- Tenant counts link to the **Tenants** module.
- Orders Processed metric comes from aggregate order data across all tenants.
- The Dashboard is read-only — no actions are performed here.

## Checklist
- [ ] Dashboard loads at `/dashboard` after login
- [ ] Four KPI cards visible with values and trend arrows
- [ ] Plan distribution shows three plans with percentages summing to ~100%
- [ ] Recent signups table shows newest tenants first
- [ ] Status badges show correct colours
- [ ] Tenant name link navigates to tenants section
