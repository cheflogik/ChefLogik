# Settings — Testing Guide

## Overview
The Settings module has four sections: **General Settings** (landing page), **Tenant Settings** (global restaurant profile), **Branch Settings** (per-branch configuration), and **Delegates** (grant temporary cross-tenant admin access). Settings is accessible to any logged-in user for their own profile, but most configuration options require Owner or Manager level roles.

## Prerequisites
- Logged in to the `@web` staff app (`http://localhost:5500`)
- Owner or General Manager permission is typically needed for Tenant and Branch settings
- A branch must be selected for Branch Settings to be accessible

## Sub-sections

### Settings Overview

**Purpose**
Navigate to each settings category.

**How to access**
Click **Settings** in the left sidebar (under Settings group). URL: `/settings`. A secondary navigation bar lists sub-sections.

**Test Cases**

#### Test 1: Settings page loads
- **Steps**:
  1. Navigate to `/settings`.
  2. A navigation bar appears at the top with links: **General**, **Tenant**, **Branch**, **Delegates** (labels may vary slightly).
- **Expected result**: The default settings view loads. Navigation links are clickable.

---

### Tenant Settings

**Purpose**
Configure global restaurant settings that apply across all branches: restaurant name, logo, primary currency, default timezone, and contact details.

**How to access**
On the Settings page, click the **Tenant** tab. URL: `/settings/tenant`.

**Test Cases**

#### Test 2: View and edit tenant details
- **Steps**:
  1. Navigate to `/settings/tenant`.
  2. The form shows: Restaurant name, restaurant slug (URL identifier), logo upload, default currency, default timezone, website URL, and contact email.
- **Expected result**: All current values are displayed and editable.

#### Test 3: Update restaurant name
- **Steps**:
  1. In **Restaurant name**, change `"Rosti Restaurant"` to `"Rosti & Co."`.
  2. Click **Save**.
- **Expected result**: The new name is saved. The app header or sidebar may reflect the updated name.

#### Test 4: Upload restaurant logo
- **Steps**:
  1. In the **Logo** field, click **Upload** or the image area.
  2. Select a PNG or JPEG file (recommended: 200×200 px minimum).
  3. Click **Save**.
- **Expected result**: The logo is uploaded and previewed. It appears in the app header/login page.
- **Edge cases to check**:
  - Upload a file that is not an image (e.g. a PDF) → error: "Only image files are accepted."
  - Upload an image larger than the size limit → error with size info.

#### Test 5: Change default currency
- **Steps**:
  1. In the **Currency** dropdown, select a different currency (e.g. `EUR`).
  2. Click **Save**.
  3. Navigate to Menu Management and check a price.
- **Expected result**: Prices display in the new currency symbol throughout the app.
- **Edge cases to check**:
  - Existing order prices stored in pence/cents — confirm they still display correctly after currency change.

#### Test 6: Tenant slug is read-only after creation
- **Steps**:
  1. Look at the **Restaurant ID (slug)** field on the tenant settings page.
- **Expected result**: The field is displayed but is either read-only (not editable) or shows a warning if you try to change it, since the slug is used in staff login and the customer landing page URL.

---

### Branch Settings

**Purpose**
Configure per-branch settings: operating hours, address, contact, receipt configuration, and integrations (Uber Eats / Wolt store IDs).

**How to access**
On the Settings page, click the **Branch** tab or a specific branch link. URL: `/settings/branch/:branchId`.

**Test Cases**

#### Test 7: View branch settings
- **Steps**:
  1. Navigate to `/settings/branch/:branchId` (replace `:branchId` with the actual branch ID, or navigate via the Settings page branch tab).
  2. Settings shown: branch name, address, phone, email, timezone, operating hours, and integration settings.
- **Expected result**: Current branch configuration is displayed.

#### Test 8: Update operating hours
- **Steps**:
  1. In the **Operating Hours** section, change Monday hours from `11:00–23:00` to `12:00–22:00`.
  2. Click **Save**.
- **Expected result**: Hours are saved. Reservation availability checks now use the new hours.
- **Edge cases to check**:
  - Set end time before start time → validation error.

#### Test 9: Configure Uber Eats store ID
- **Steps**:
  1. Find the **Integrations** or **Delivery Platforms** section.
  2. Enter the Uber Eats store ID provided by Uber Eats: e.g. `store_abc123`.
  3. Click **Save**.
- **Expected result**: The branch is linked to the Uber Eats store. Orders from that store ID will now flow into this branch's Live Orders board.
- **Edge cases to check**:
  - Enter an invalid store ID → orders will not arrive; no in-app validation possible (external platform).

---

### Delegates

**Purpose**
Grant another person temporary admin/manager access to this tenant without creating a permanent staff account. Used for auditors, support staff, or platform admins who need to access the tenant's data.

**How to access**
On the Settings page, click the **Delegates** tab. URL: `/settings/delegates`.

**Test Cases**

#### Test 10: Create a delegate
- **Steps**:
  1. Navigate to `/settings/delegates`.
  2. Click **Add Delegate**.
  3. Enter:
     - **Email**: `auditor@example.com`
     - **Role**: select from dropdown (e.g. `Viewer`)
     - **Expires at**: pick a date 7 days from now
  4. Click **Grant Access**.
- **Expected result**: The delegate appears in the list with their email, role, and expiry date. The email receives an invitation.
- **Edge cases to check**:
  - Email that already has a permanent staff account → may be blocked or warned.
  - Expiry date in the past → validation error.
  - Blank email → validation error.

#### Test 11: Revoke a delegate
- **Steps**:
  1. Find a delegate in the list.
  2. Click **Revoke** or **Remove**.
  3. Confirm the revocation.
- **Expected result**: The delegate can no longer access the tenant's data. The entry is removed from the list.

---

## Known Relationships
- Tenant settings affect branding in the **Landing CMS** and the customer-facing **Landing Page**.
- Branch settings (operating hours) affect the **Reservations** module's time slot availability.
- Uber Eats and Wolt store IDs in Branch Settings determine which delivery platform orders flow into **Live Orders**.
- Delegates granted here appear in the **Analytics → Audit Log** when they perform actions.

## Checklist
- [ ] Settings page loads with navigation tabs
- [ ] Tenant name editable and saves correctly
- [ ] Logo upload accepts images and rejects non-image files
- [ ] Currency change reflects in price displays
- [ ] Tenant slug is not freely editable (protected)
- [ ] Branch settings show correct current values
- [ ] Operating hours update and validate (end after start)
- [ ] Uber Eats / Wolt store ID saves to branch settings
- [ ] Delegate created with email, role, and expiry
- [ ] Past expiry date blocked on delegate creation
- [ ] Delegate can be revoked and removed from list
