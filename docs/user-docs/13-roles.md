# Roles — Testing Guide

## Overview
The Roles module is a dynamic permission builder. Restaurant owners can create custom roles, assign specific permission slugs to each role, and then assign roles to staff members. This controls what each staff member can see and do across every module in the app.

**System roles** (pre-seeded, cannot be deleted): Owner, General Manager, Branch Manager, Head Chef, Waiter, Bartender, Delivery Driver, Customer Service.

**Important**: Permission checking in the app always uses slugs (e.g. `orders.view`, `menu.86_item`), never role names. Even if you rename a role, its permissions are determined by the slugs assigned to it.

## Prerequisites
- Logged in to the `@web` staff app (`http://localhost:5500`)
- Permission required: `roles.view` (view list), `roles.manage` or `staff.manage_roles` (create/edit)
- Owner or General Manager role is typical for managing roles

## Sub-sections

### Roles List

**Purpose**
View all roles available in the system, both system-seeded and custom.

**How to access**
Click **Roles** in the left sidebar (under Settings group). URL: `/roles`.

**Test Cases**

#### Test 1: Roles list loads
- **Steps**:
  1. Navigate to `/roles`.
  2. The page shows a list of roles with: role name, description, type (System or Custom), and number of permissions assigned.
- **Expected result**: All 8 system roles are listed plus any custom roles.
- **Edge cases to check**:
  - No custom roles yet → only system roles shown.

#### Test 2: System roles cannot be deleted
- **Steps**:
  1. In the roles list, look at a system role (e.g. "Owner").
- **Expected result**: No **Delete** button is visible for system roles. Only custom roles have a delete option.

---

### New Role

**Purpose**
Create a custom role with a specific set of permissions.

**How to access**
On the Roles list, click **+ New Role** (top-right). URL: `/roles/new`. Requires `roles.manage` permission.

**Test Cases**

#### Test 3: Create a custom role with permissions
- **Steps**:
  1. Click **+ New Role**.
  2. Fill in:
     - **Role name**: `Senior Waiter`
     - **Description**: `"Waiter with order management rights"`
  3. In the **Permissions** section, find and tick the following permission slugs:
     - `orders.view`
     - `orders.modify`
     - `reservations.view`
     - `reservations.create`
     - `customers.view_basic`
  4. Click **Create Role**.
- **Expected result**: "Senior Waiter" appears in the roles list with type "Custom" and "5 permissions".
- **Common mistakes**: Forgetting to assign any permissions — a role with zero permissions will give the staff member no access to anything.
- **Edge cases to check**:
  - Blank role name → validation error.
  - Role name identical to an existing role → error or warning (duplicate name).

---

### Role Detail / Edit

**Purpose**
View and modify the permission set of an existing role.

**How to access**
Click a role name from the list. URL: `/roles/:roleId`.

**Test Cases**

#### Test 4: View role permissions
- **Steps**:
  1. Click "Senior Waiter" from the roles list.
  2. The detail page shows the role name, description, and a list of all permissions with checked/unchecked state.
- **Expected result**: The 5 permissions ticked during creation are checked.

#### Test 5: Add a permission to an existing role
- **Steps**:
  1. On the "Senior Waiter" role edit page, find and tick: `orders.cancel`.
  2. Click **Save**.
- **Expected result**: The role now has 6 permissions. Any staff member with the "Senior Waiter" role can now cancel orders immediately (no need to log out/in if session is refreshed).

#### Test 6: Remove a permission from a role
- **Steps**:
  1. On the same role, untick `customers.view_basic`.
  2. Click **Save**.
- **Expected result**: Role has 5 permissions. Staff with this role can no longer see the Customers module.

#### Test 7: Permission cache invalidation
- **Note**: Permissions are cached in Redis for 5 minutes per user. After a role change, a staff member may need to wait up to 5 minutes for the change to take effect, or log out and log back in.
- **Steps**:
  1. Change a permission on a role assigned to a logged-in staff member (e.g. remove `orders.view`).
  2. In a separate browser session for that staff member, navigate to `/orders`.
- **Expected result**: Immediately after the change, the staff member might still see the module (cached). Within 5 minutes or after re-login, access is denied.

---

### Assign Role to Staff

**Purpose**
Roles are assigned to staff in the **Staff Management** module. This is documented here for completeness.

**Test Cases**

#### Test 8: Assign the new custom role to a staff member
- **Steps**:
  1. Go to `/staff`.
  2. Open a staff member's edit page.
  3. In the **Role** dropdown, select "Senior Waiter".
  4. Click **Save**.
- **Expected result**: The staff member's sidebar updates to show only the modules their new permissions allow.
- **Edge cases to check**:
  - Assign a role with no permissions → staff member sees no modules after login.
  - Staff member with Owner role — confirm they cannot remove their own Owner role.

---

## Known Relationships
- Roles are assigned to staff in **Staff Management** (edit form).
- Permission slugs are the authoritative control over every module's visibility and functionality.
- Permission changes are cached (5-minute TTL) — staff may need to re-login to see changes immediately.
- The **Analytics → Audit Log** captures all role assignments and permission changes.

## Checklist
- [ ] Roles list shows 8 system roles and any custom roles
- [ ] System roles have no Delete button
- [ ] New role created with name, description, and permissions
- [ ] Blank role name prevented by validation
- [ ] Role detail shows checked/unchecked permissions
- [ ] Adding a permission saves and takes effect
- [ ] Removing a permission saves and takes effect
- [ ] Custom role appears in Staff Management role dropdown
- [ ] Staff member assigned new role sees updated module access
- [ ] Permission cache noted (up to 5 min or re-login required)
