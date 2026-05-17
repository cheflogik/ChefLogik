# Admin — Users & Roles — Testing Guide

## Overview
The Users & Roles section of the Platform Admin app manages ChefLogik's **own internal admin team accounts** — not restaurant staff. It lists all platform admins, their roles (Super Admin, Support Admin, Finance Admin, Read Only), and their last login. New admin users can be invited via the **Invite Admin** button.

**Important**: These are platform-level admin accounts, not restaurant staff accounts. They are entirely separate systems.

## Prerequisites
- Logged in to the `@admin` app (`http://localhost:5600`)
- Super Admin role is required to invite new admins or change roles

## Sub-sections

### Platform Admins List

**Purpose**
View all platform admin users with their role, status, and last login date.

**How to access**
Click **Users & Roles** in the admin sidebar. URL: `/users`.

**Test Cases**

#### Test 1: Users page loads
- **Steps**:
  1. Navigate to `/users`.
  2. Heading reads "Users & Roles" with subtitle "Platform admin accounts and role definitions."
  3. A **Platform Admins** table shows rows with: avatar initials, name, email, role badge, last login date, and status badge (Active/Inactive).
- **Expected result**: All platform admin accounts are listed. Active accounts show green "Active" badge. Inactive accounts show grey "Inactive" badge.
- **Edge cases to check**:
  - Only your own account exists → single row shown. Cannot deactivate yourself.

#### Test 2: Admin role badges
- **Steps**:
  1. Look at the role badges in the admin list.
- **Expected result**: Roles shown with indigo badge: `Super Admin`, `Support Admin`, `Finance Admin`. Each badge reflects the admin's permission level.

#### Test 3: Last login date displayed
- **Steps**:
  1. Look at the "Last login" column.
- **Expected result**: Each admin shows their most recent login date in `YYYY-MM-DD` format. Never-logged-in admins show "Never" or an empty date.

---

### Invite a New Admin

**Purpose**
Send an invitation to a new platform admin team member.

**How to access**
On the Users page, click the **Invite Admin** button (top-right, indigo button with `+` icon).

**Test Cases**

#### Test 4: Invite Admin button opens invitation form
- **Steps**:
  1. Click **Invite Admin**.
  2. A modal or form appears (confirm what fields are shown — likely: email, role selection).
  3. Enter **Email**: `newadmin@cheflogik.io`.
  4. Select **Role**: `Support Admin`.
  5. Click **Send Invitation** (or equivalent).
- **Expected result**: An invitation email is sent to `newadmin@cheflogik.io`. The admin appears in the list as "Inactive" (pending acceptance) or "Pending" status.
- **Edge cases to check**:
  - Email already in admin list → error: "This email is already registered as a platform admin."
  - Invalid email format → validation error.
  - Blank email → button disabled or validation error.

---

### Admin Roles Section

**Purpose**
View the definition of each admin role and how many admins have that role.

**Test Cases**

#### Test 5: Admin Roles section is visible
- **Steps**:
  1. Scroll below the Admins table on the `/users` page.
  2. An **Admin Roles** section shows four role definitions:
     - **Super Admin** — "Full platform access" — N assigned
     - **Support Admin** — "Tenant management, support tickets" — N assigned
     - **Finance Admin** — "Billing, plan management, invoicing" — N assigned
     - **Read Only** — "View-only access to all platform screens" — 0 assigned
- **Expected result**: All four roles are listed with their descriptions and current assignee counts.

---

## Known Relationships
- Super Admins have access to all admin modules including this one.
- Support Admins access the **Tenants** and **Support Tickets** modules.
- Finance Admins access the **Billing & Plans** module.
- Read Only admins can view all screens but cannot perform actions.
- Admin actions are logged in **Admin Audit Logs**.

## Checklist
- [ ] Users page loads with admin list
- [ ] All admins show name, email, role badge, last login, status
- [ ] Active/Inactive status badges show correct colours
- [ ] Invite Admin button opens invitation form
- [ ] Invitation with existing email shows error
- [ ] Invalid email format blocked
- [ ] Admin Roles section shows four role definitions with descriptions
- [ ] Assignee count per role is accurate
