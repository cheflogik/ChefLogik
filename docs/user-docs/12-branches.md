# Branches — Testing Guide

## Overview
The Branches module allows restaurant owners and platform admins to create and manage multiple physical branch locations within a single tenant (restaurant business). Each branch has its own address, contact details, operating hours, and can have staff, menus, and orders scoped to it. The branch selected in the sidebar determines which data is shown across all other modules.

## Prerequisites
- Logged in to the `@web` staff app (`http://localhost:5500`)
- Permission required: `branches.view` (view list), `branches.manage` (create/edit/deactivate)
- At least Owner or Management role is typical for this section

## Sub-sections

### Branches List

**Purpose**
View all branches belonging to the tenant.

**How to access**
Click **Branches** in the left sidebar (under Settings group). URL: `/branches`.

**Test Cases**

#### Test 1: Branches list loads
- **Precondition**: At least one branch exists (every tenant has at least one branch).
- **Steps**:
  1. Navigate to `/branches`.
  2. The page shows a table or card list of branches with: name, address, phone, status (Active/Inactive), and action buttons.
- **Expected result**: All branches are listed. The branch currently selected in the sidebar switcher is indicated.
- **Edge cases to check**:
  - Only one branch exists → list shows one entry. There should be no "Delete" option since a tenant must have at least one branch.

#### Test 2: View branch detail
- **Steps**:
  1. Click a branch name or the view icon.
- **Expected result**: Navigates to the branch detail/edit page (`/branches/:branchId`).

---

### New Branch

**Purpose**
Create a new branch location for the restaurant.

**How to access**
On the Branches list, click **+ New Branch** (top-right). URL: `/branches/new`. Requires `branches.manage` permission.

**Test Cases**

#### Test 3: Create a new branch
- **Steps**:
  1. Click **+ New Branch**.
  2. Fill in the form:
     - **Branch name**: `Soho Branch`
     - **Address line 1**: `42 Greek Street`
     - **Address line 2**: (optional)
     - **City**: `London`
     - **Postcode**: `W1D 4EB`
     - **Country**: `United Kingdom`
     - **Phone**: `+44 20 7123 4567`
     - **Email**: `soho@restaurant.com`
     - **Timezone**: `Europe/London`
  3. Click **Create Branch**.
- **Expected result**: "Soho Branch" appears in the branches list. It is immediately selectable from the sidebar branch switcher.
- **Common mistakes**: Forgetting to set the timezone — this affects operating hours and date/time display.
- **Edge cases to check**:
  - Blank branch name → validation error.
  - Invalid postcode format → may show warning (format-based validation).
  - Duplicate branch name within the same tenant → warn or allow (check behaviour).

---

### Branch Detail / Edit

**Purpose**
Update branch information, configure operating hours, and toggle branch active/inactive status.

**How to access**
Click a branch name from the list. URL: `/branches/:branchId`.

**Test Cases**

#### Test 4: Edit branch contact details
- **Steps**:
  1. Open the branch detail page.
  2. Change the **Phone** to `+44 20 7999 0000`.
  3. Click **Save**.
- **Expected result**: The phone number is updated and visible in the list.

#### Test 5: Configure operating hours
- **Steps**:
  1. On the branch detail, find the **Operating Hours** section.
  2. Set Monday–Friday hours to 11:00–23:00.
  3. Set Saturday hours to 10:00–24:00.
  4. Tick "Closed on Sundays" (or leave all Sunday hours blank).
  5. Click **Save**.
- **Expected result**: Hours are saved. The system uses these when validating reservation times.
- **Edge cases to check**:
  - End time before start time → validation error.
  - Set all days to closed → warning (branch with no open hours).

#### Test 6: Deactivate a branch
- **Precondition**: More than one branch exists.
- **Steps**:
  1. On the branch detail, find the **Status** toggle or **Deactivate** button.
  2. Toggle the branch to "Inactive" and confirm.
- **Expected result**: Branch is marked "Inactive" in the list. It is no longer selectable in the sidebar branch switcher. Existing data for that branch is preserved.
- **Edge cases to check**:
  - Attempt to deactivate the only branch → should be blocked: "You must have at least one active branch."

---

## Known Relationships
- The branch selected in the sidebar switcher filters data in every module: Orders, Reservations, Inventory, Staff, Analytics, etc.
- Settings for each branch are managed in **Settings → Branch Settings**.
- Staff are assigned to branches in **Staff Management**.
- Inventory stock levels are tracked per branch.

## Checklist
- [ ] Branches list shows all branches with status
- [ ] View branch detail navigates correctly
- [ ] New branch form creates with all required fields
- [ ] Blank branch name prevents submission
- [ ] Branch appears in sidebar switcher immediately after creation
- [ ] Edit branch saves updated contact details
- [ ] Operating hours configuration saved correctly
- [ ] Hours validation prevents end before start
- [ ] Branch deactivation requires confirmation
- [ ] Cannot deactivate the only remaining active branch
