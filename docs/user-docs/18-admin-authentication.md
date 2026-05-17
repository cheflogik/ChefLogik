# Admin Authentication — Testing Guide

## Overview
The Platform Admin app (`@admin`) is a completely separate application from the staff app. It is used by ChefLogik's own internal team to manage the SaaS platform — tenant accounts, billing, system health, and feature flags. The admin app runs on port 5600.

**Access URL**: `http://localhost:5600`

Admin accounts are platform-level. They are not the same as restaurant staff accounts. Do not try to log into the admin app with a restaurant staff account.

## Prerequisites
- The `@admin` app is running (port 5600: `http://localhost:5600`)
- A platform admin account exists with a known email and password
- Note: Admin login may NOT use the same two-step OTP as the staff app — confirm the authentication method with the development team before testing

## Sub-sections

### Admin Login

**Purpose**
Authenticate a platform admin into the ChefLogik admin panel.

**How to access**
Navigate to `http://localhost:5600`. If not authenticated, the login page appears automatically.

**Test Cases**

#### Test 1: Successful admin login
- **Precondition**: A platform admin account exists with email `admin@cheflogik.com` and password `AdminPassword123!`.
- **Steps**:
  1. Open `http://localhost:5600`.
  2. The Admin Login page appears with a heading (e.g. "ChefLogik Platform Admin" or similar).
  3. Enter **Email**: `admin@cheflogik.com`.
  4. Enter **Password**: `AdminPassword123!`.
  5. Click **Sign in**.
- **Expected result**: Authenticated successfully and redirected to the Admin Dashboard (`/dashboard`). The dark sidebar is visible with the admin navigation items.
- **Common mistakes**: Using a restaurant staff account — these credentials will not work for the admin panel.
- **Edge cases to check**:
  - Wrong password → error message: "Invalid credentials."
  - Blank email or password → validation error (fields are required).
  - Leave email blank and click Sign in → browser or app validation prevents submission.

#### Test 2: Admin login fails with staff credentials
- **Steps**:
  1. Enter a staff member's email and password from the `@web` app.
  2. Click **Sign in**.
- **Expected result**: Login fails with "Invalid credentials." message. Staff accounts cannot access the admin panel.

#### Test 3: Admin logout
- **Precondition**: Logged in to admin panel.
- **Steps**:
  1. Look for the admin user's initials or avatar in the bottom-left of the dark sidebar.
  2. Click it or look for a logout option.
- **Expected result**: Session is cleared. Redirected to the admin login page.

---

### Admin Sidebar Navigation

**Purpose**
Navigate between admin modules using the collapsible dark sidebar.

**Test Cases**

#### Test 4: Sidebar collapse and expand
- **Steps**:
  1. Look at the bottom of the dark sidebar — there is a **collapse toggle** button (left/right chevron icon).
  2. Click it to collapse the sidebar.
  3. Click again to expand.
- **Expected result**: When collapsed, only icon-sized items are shown (64px width). When expanded, full labels are visible (220px width). Navigation still works when collapsed (hover tooltip shows label).

#### Test 5: All nav items navigate correctly
- **Steps**:
  1. Click each item in the sidebar: **Dashboard**, **Tenants**, **Billing & Plans**, **System Health**, **Feature Flags**, **Platform Analytics**, **Users & Roles**, **Audit Logs**, **Support Tickets**.
- **Expected result**: Each click navigates to the correct URL: `/dashboard`, `/tenants`, `/billing`, `/health`, `/flags`, `/analytics`, `/users`, `/audit`, `/support`.

---

## Known Relationships
- Admin login is separate from all tenant/staff logins.
- Platform admins can **impersonate** a restaurant tenant (access their staff app) via the **Tenants** module.
- Admin credentials are managed by ChefLogik's own team, not by restaurant owners.

## Checklist
- [ ] Admin login page loads at `http://localhost:5600`
- [ ] Successful login with valid admin credentials
- [ ] Wrong password shows error message
- [ ] Staff credentials rejected on admin login
- [ ] Logout clears session and returns to login page
- [ ] Sidebar collapse/expand works
- [ ] Collapsed sidebar shows icon tooltips on hover
- [ ] All 9 nav items navigate to correct pages
