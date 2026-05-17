# Admin — Tenant Management — Testing Guide

## Overview
Tenant Management is the primary module of the Platform Admin app. Each "tenant" is a restaurant business subscribed to ChefLogik. Admins can view all tenants, filter by status, create new tenant accounts via a 4-step wizard, view tenant details, **impersonate** (access a tenant's staff app as that tenant), and manage tenant status (activate, suspend, cancel).

## Prerequisites
- Logged in to the `@admin` app (`http://localhost:5600`)
- Platform admin account with tenant management rights

## Sub-sections

### Tenants List

**Purpose**
View, search, and filter all restaurant tenants on the platform.

**How to access**
Click **Tenants** in the admin sidebar. URL: `/tenants`.

**Test Cases**

#### Test 1: Tenants list loads
- **Precondition**: At least one tenant exists.
- **Steps**:
  1. Navigate to `/tenants`.
  2. The page shows a list/table of tenants with columns: restaurant name, plan, branches, orders this month, reservations this month, members, status, and action buttons.
  3. Above the list: a search input and status filter tabs: **All | Active | Trial | Suspended | Cancelled**.
- **Expected result**: Tenants are listed. Status badges show correct colours (Active=green, Trial=blue, Suspended=amber, Cancelled=red).

#### Test 2: Filter tenants by status
- **Steps**:
  1. Click the **Trial** tab.
- **Expected result**: Only tenants in Trial status are shown.
  2. Click **Suspended**.
- **Expected result**: Only suspended tenants are shown.
  3. Click **All** to reset.

#### Test 3: Search for a tenant
- **Steps**:
  1. In the search input (placeholder: search icon), type part of a restaurant name, e.g. `sakura`.
- **Expected result**: Only tenants matching "sakura" are shown (e.g. "Sakura Kitchen").
- **Edge cases to check**:
  - Search with no results → empty state: "No tenants found."
  - Clear search → full list returns.

---

### Tenant Detail (Side Panel)

**Purpose**
View detailed information about a specific tenant.

**How to access**
Click a tenant row in the list to open a detail side panel (or navigate to `/tenants/:tenantId`).

**Test Cases**

#### Test 4: View tenant detail
- **Steps**:
  1. Click any tenant row.
  2. A side panel or detail page opens showing: restaurant name, slug, plan, status, owner name, owner email, branch count, order stats, and recent activity.
- **Expected result**: All information is correct and matches the tenant's actual data.

#### Test 5: View tenant statistics
- **Steps**:
  1. In the tenant detail panel, look for stats: number of branches, total orders this month, reservation count, staff count.
- **Expected result**: Statistics are populated with live data.

---

### Create New Tenant (4-Step Wizard)

**Purpose**
Provision a new restaurant tenant account on the platform.

**How to access**
On the Tenants page, click **+ New Tenant** button. A 4-step modal appears.

**Test Cases**

#### Test 6: Create a new tenant — full 4-step flow
- **Steps**:

  **Step 1 — Owner Details:**
  1. Enter **Owner name**: `Carlos Mendez`.
  2. Enter **Owner email**: `carlos@newrestaurant.com`.
  3. Click **Next**.

  **Step 2 — Restaurant Details:**
  4. Enter **Restaurant name**: `La Cocina`.
  5. The **Restaurant ID (slug)** auto-fills as `la-cocina` (lowercased, hyphens).
  6. Verify or adjust the slug — it must be unique across the platform.
  7. Click **Next**.

  **Step 3 — Subscription Plan:**
  8. Select a plan: **Starter**, **Growth**, or **Enterprise**.
  9. Review the selected plan's max branches and feature list.
  10. Click **Next**.

  **Step 4 — Review & Create:**
  11. Review: owner name, email, restaurant name, slug, plan.
  12. Click **Create Tenant**.

- **Expected result**: A success screen appears showing a **temporary password** for the owner. Copy this password — it is shown once. The tenant "La Cocina" appears in the tenant list with the selected plan and "Active" (or "Trial") status.
- **Common mistakes**: 
  - Not copying the temporary password before closing the modal — it cannot be retrieved afterwards.
  - Using a slug that is already taken — the system returns an error.
- **Edge cases to check**:
  - Duplicate slug → error: "This Restaurant ID is already in use."
  - Duplicate owner email → error: "This email is already registered."
  - Blank any required field → Next button is disabled or validation error shows.

#### Test 7: Cancel wizard mid-way
- **Steps**:
  1. Click **+ New Tenant**.
  2. Fill in Step 1.
  3. Click the **× (Close)** button or click outside the modal.
- **Expected result**: Modal closes. No tenant is created. The list is unchanged.

---

### Tenant Actions (Status Management)

**Purpose**
Activate, suspend, or cancel a tenant account.

**How to access**
In the tenant detail panel or via action buttons in the tenant row.

**Test Cases**

#### Test 8: Suspend a tenant
- **Precondition**: Tenant is in "Active" status.
- **Steps**:
  1. Open the tenant detail for "La Cocina".
  2. Find the **Suspend** button or status dropdown.
  3. Click **Suspend**.
  4. Confirm the action.
- **Expected result**: Tenant status changes to "Suspended". The restaurant's staff cannot log in until the account is reactivated.
- **Edge cases to check**:
  - Suspending a tenant with active orders → confirm if orders are allowed to complete or immediately halted.

#### Test 9: Reactivate a suspended tenant
- **Steps**:
  1. Open a suspended tenant.
  2. Click **Reactivate** or **Activate**.
  3. Confirm.
- **Expected result**: Status returns to "Active". Staff can log in again.

#### Test 10: Cancel (offboard) a tenant
- **Precondition**: Tenant is active or suspended.
- **Steps**:
  1. Open the tenant detail.
  2. Click **Cancel Subscription** or **Offboard**.
  3. A strong confirmation dialog appears (e.g. "Type the restaurant name to confirm cancellation").
  4. Enter the restaurant name exactly.
  5. Click **Confirm Cancellation**.
- **Expected result**: Tenant status changes to "Cancelled". Data is retained per retention policy (7-year financial records) but the restaurant cannot log in.
- **Edge cases to check**:
  - Typed name does not match exactly → button stays disabled.

---

### Impersonation (Access Tenant's Staff App)

**Purpose**
Allow platform admins to temporarily access a tenant's staff app (`@web`) to troubleshoot issues, provide support, or audit the tenant's data.

**How to access**
In the tenant detail panel, click the **Impersonate** or **Access as Tenant** button (external link icon).

**Test Cases**

#### Test 11: Impersonate a tenant
- **Steps**:
  1. Open the detail panel for a tenant (e.g. "Sakura Kitchen").
  2. Click the **Impersonate** button (may show as "Open in Staff App" or an external link icon).
  3. A new tab or window opens at `http://localhost:5500` with query params like `?impersonate_token=...&tenant_name=sakura-kitchen`.
- **Expected result**: The staff app (`@web`) opens and automatically logs in as that tenant. A banner or indicator should be visible: "Impersonating: Sakura Kitchen — You are viewing this account as a platform admin."
- **Important note**: All actions taken during impersonation are logged in the Audit Log under the admin's user ID.
- **Edge cases to check**:
  - Impersonate a suspended tenant → may be blocked or the staff app shows a suspension notice.
  - Close the impersonation tab → the admin app session is unaffected.

---

## Known Relationships
- Plan selection in the tenant wizard corresponds to plans defined in **Billing & Plans**.
- Tenant creation generates an owner staff account automatically.
- All admin actions on tenants (create, suspend, cancel, impersonate) are recorded in **Admin Audit Logs**.
- The tenant's slug is used in staff login ("Restaurant ID" field) and in the customer landing page URL.

## Checklist
- [ ] Tenants list loads with correct columns and status badges
- [ ] Status filter tabs (All/Active/Trial/Suspended/Cancelled) work
- [ ] Search filters by name in real time
- [ ] Tenant detail panel shows all information
- [ ] 4-step new tenant wizard completes successfully
- [ ] Temporary password shown after creation (one-time display)
- [ ] Duplicate slug prevented with error
- [ ] Duplicate owner email prevented with error
- [ ] Cancelling wizard mid-way creates no tenant
- [ ] Suspend action changes status and blocks login
- [ ] Reactivate restores active status
- [ ] Cancel requires typed name confirmation
- [ ] Impersonation opens staff app in new tab with tenant context
- [ ] Impersonation visible to admin but audit-logged under admin's ID
