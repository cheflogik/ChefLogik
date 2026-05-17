# Admin — Platform Analytics — Testing Guide

## Overview
Platform Analytics shows aggregated metrics across **all tenants** on the ChefLogik platform. This is distinct from the per-tenant Analytics module in the `@web` staff app. Platform analytics covers: total tenants, total staff users, orders processed, average revenue per tenant, tenant growth over time (new vs. churned), and regional breakdown.

**Note**: This page currently uses demonstration data. Confirm with the team which metrics are live vs. mock before QA.

## Prerequisites
- Logged in to the `@admin` app (`http://localhost:5600`)

## Sub-sections

### Platform KPI Cards

**Purpose**
Show four top-level platform-wide metrics.

**How to access**
Click **Platform Analytics** in the admin sidebar. URL: `/analytics`.

**Test Cases**

#### Test 1: Platform analytics page loads
- **Steps**:
  1. Navigate to `/analytics`.
  2. Heading reads "Platform Analytics" with subtitle "Aggregated metrics across all tenants."
  3. Four KPI cards appear:
     - **Total Tenants** — e.g. `127` (Building2 icon, indigo)
     - **Total Staff Users** — e.g. `4,821` (Users icon, green)
     - **Orders (30d)** — e.g. `48,291` (ShoppingCart icon, blue)
     - **Avg Revenue / Tenant** — e.g. `$382` (TrendingUp icon, amber)
- **Expected result**: All four cards visible with icons and values.

---

### Tenant Growth Chart

**Purpose**
Show month-by-month new signups vs. churned tenants over the last 6 months.

**Test Cases**

#### Test 2: Growth chart is visible
- **Steps**:
  1. On the Platform Analytics page, look for the **Tenant Growth (6 months)** chart section.
  2. A bar chart shows each month (e.g. Dec, Jan, Feb, Mar, Apr, May) with two bars: **New** (indigo) and **Churned** (rose/red).
- **Expected result**: Six months of data are visible. New signups are consistently higher than churn. Hovering over bars may show tooltips (check if implemented).

---

### Regional Breakdown

**Purpose**
Show tenant count and revenue by geographic region.

**Test Cases**

#### Test 3: Regional data table
- **Steps**:
  1. Find the **Revenue by Region** table.
  2. Rows show: Region name, tenant count, monthly revenue, and percentage of total.
  3. A horizontal progress bar visualises each region's share.
- **Expected result**: Regions are listed (e.g. London, Manchester, Birmingham, Bristol, Leeds, Other). Percentages add up to 100%.

---

## Known Relationships
- Total Tenants count matches the number in **Tenant Management**.
- Orders (30d) matches the sum of all tenant orders visible in each tenant's staff app.
- Regional data may require tenant address data to be accurate.

## Checklist
- [ ] Platform Analytics page loads at `/analytics`
- [ ] Four KPI cards visible with values and icons
- [ ] Tenant Growth chart shows 6 months with new vs churned bars
- [ ] Regional breakdown table visible with percentages
- [ ] Percentages in regional table sum to ~100%
