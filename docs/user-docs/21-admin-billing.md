# Admin — Billing & Plans — Testing Guide

## Overview
The Billing & Plans module of the Platform Admin app shows subscription plan definitions, revenue breakdown by plan, and MRR (Monthly Recurring Revenue) tracking. At MVP, all plans are free (`price_monthly = 0`) — full Stripe billing is deferred. This module is primarily informational at this stage, though plan metadata (max branches, features) is functional and enforced.

## Prerequisites
- Logged in to the `@admin` app (`http://localhost:5600`)
- Note: Price values may show `$0.00` / "Free" for all plans at MVP stage — this is expected and not a bug

## Sub-sections

### Plans Overview

**Purpose**
View the three subscription plans (Starter, Growth, Enterprise) with their feature sets and limits.

**How to access**
Click **Billing & Plans** in the admin sidebar. URL: `/billing`.

**Test Cases**

#### Test 1: Billing page loads with plan cards
- **Steps**:
  1. Navigate to `/billing`.
  2. Three plan cards are displayed: **Starter**, **Growth**, **Enterprise**.
  3. Each card shows: plan name, slug (e.g. `starter`), monthly price (or "Free"), max branches, and a list of included features.
- **Expected result**: All three cards are visible. Plans with `is_active = false` are shown with reduced opacity and an "Inactive" badge.
- **Edge cases to check**:
  - All plans show "Free" at MVP → this is expected. Document as note for the tester.

#### Test 2: Feature list on each plan card
- **Steps**:
  1. On the Growth plan card, look at the features list.
- **Expected result**: Features are listed as key-value pairs (e.g. "Analytics: Yes", "Multi-branch: Yes", "API Access: No"). A green checkmark icon indicates included features.

#### Test 3: Max branches limit per plan
- **Steps**:
  1. Check the **Max Branches** field on each plan card.
- **Expected result**:
  - Starter: e.g. 1 branch
  - Growth: e.g. 3 branches
  - Enterprise: "Unlimited" (displayed as `Unlimited` when max_branches = -1)

---

### Revenue Breakdown

**Purpose**
Show MRR contribution by plan and number of tenants on each plan.

**Test Cases**

#### Test 4: Revenue breakdown section
- **Steps**:
  1. Scroll below the plan cards on the `/billing` page.
  2. Find the **Revenue by Plan** section.
  3. Three rows: Enterprise, Growth, Starter — showing tenant count, MRR, and percentage of total MRR.
- **Expected result**: Revenue adds up to total platform MRR shown on the Dashboard. Enterprise contributes the highest revenue per tenant despite having the fewest tenants.
- **Note**: At MVP all plans are free so MRR may show $0.

---

## Known Relationships
- Plan selection for a tenant is done in **Tenant Management** when creating or upgrading a tenant.
- Plan limits (max branches) are enforced when creating branches in the tenant's **Branches** module.
- Full Stripe billing integration is deferred — the `stripe/stripe-php` package is installed but payment processing is not activated at MVP.

## Checklist
- [ ] Billing page loads with three plan cards
- [ ] Each card shows name, price, max branches, and features
- [ ] Inactive plans show reduced opacity and "Inactive" badge
- [ ] Max branches displays "Unlimited" for Enterprise
- [ ] Revenue breakdown shows tenant counts and MRR per plan
- [ ] Totals on billing page are consistent with Dashboard MRR
