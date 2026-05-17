# Staff Management — Testing Guide

## Overview
The Staff Management module handles the full employee lifecycle: hiring, profiles, roles, scheduling, attendance tracking, leave management, and payroll export. It also includes a special flow for creating the first **Owner** account for a restaurant tenant. The module has five sub-sections accessible from the Staff sidebar item: the main list, Shifts, Attendance, Leave, and Payroll.

## Prerequisites
- Logged in to the `@web` staff app (`http://localhost:5500`)
- A branch is selected in the sidebar
- Permission required: `staff.view_all` or `staff.view_own_branch` (to view), `staff.edit` or `staff.manage` (to edit), `staff.delete` (to delete)
- Roles must exist before assigning them to staff members (see **Roles** module)

## Sub-sections

### Staff List

**Purpose**
View all staff members with status indicators, quick actions, and links to profiles.

**How to access**
Click **Staff** in the left sidebar (under Management). URL: `/staff`.

**Test Cases**

#### Test 1: Staff list loads
- **Precondition**: At least one staff member exists.
- **Steps**:
  1. Navigate to `/staff`.
  2. The page shows a data table with columns: Name, Email, Role, Branch, Status, and Actions.
  3. Status badges: **Active** (green), **Inactive** (grey), **Suspended** (yellow), **Offboarded** (red).
- **Expected result**: Staff members are listed with correct status colours.
- **Edge cases to check**:
  - Staff with documents expiring within 30 days shows a yellow warning icon (triangle) next to their name.
  - Empty list → empty state message.

#### Test 2: View staff profile
- **Steps**:
  1. In the staff list, find a staff member.
  2. Click the eye icon (View) in the Actions column.
- **Expected result**: Navigates to the staff member's profile page (`/staff/:staffId/profile`).

#### Test 3: Suspend a staff member
- **Precondition**: A staff member is in "Active" status. `staff.edit` permission.
- **Steps**:
  1. Find an active staff member in the list.
  2. Look for a status toggle or action button (e.g. **Deactivate** or `UserX` icon).
  3. Click it.
- **Expected result**: Staff member's status changes to "Inactive" (grey badge). They can no longer log in.

#### Test 4: Reactivate a staff member
- **Precondition**: A staff member is "Inactive".
- **Steps**:
  1. Find the inactive staff member.
  2. Click the **Activate** button (`UserCheck` icon).
- **Expected result**: Status changes to "Active" (green).

#### Test 5: Delete a staff member
- **Precondition**: `staff.delete` permission.
- **Steps**:
  1. Click the trash (Trash2) icon for a staff member.
  2. A confirmation dialog: `"Delete [Name]? This cannot be undone."` Click **OK**.
- **Expected result**: Staff member is removed from the list.
- **Edge cases to check**:
  - Attempt to delete yourself → may be blocked.
  - Click Cancel on the confirmation → no deletion.

#### Test 6: Create Owner account
- **Precondition**: `staff.manage` permission. No owner account exists yet, or you need an additional owner.
- **Steps**:
  1. On the staff list page, look for a **Create Owner** button or link.
  2. Click it — a modal appears.
  3. Enter **Owner name**: `Maria Rossi`.
  4. Enter **Owner email**: `maria@rostirestaurant.com`.
  5. Click **Create Owner**.
- **Expected result**: A success message shows including a temporary password. The owner account appears in the staff list with the "Owner" role.
- **Edge cases to check**:
  - Email already in use → error: "Could not create owner. Check the email is not already in use."
  - Blank name or email → button stays disabled (validation).

---

### New Staff Member

**Purpose**
Add a new staff member (employee) to the system.

**How to access**
On the Staff list, click **+ New Staff** or the `UserPlus` icon. URL: `/staff/new`.

**Test Cases**

#### Test 7: Create a new staff member
- **Steps**:
  1. Click **+ New Staff**.
  2. Fill in the form:
     - **First name**: `James`
     - **Last name**: `Chen`
     - **Email**: `james.chen@restaurant.com`
     - **Phone**: `+44 7700 900300`
     - **Role**: select from dropdown (e.g. `Waiter`)
     - **Branch**: select branch (if multi-branch)
     - **Start date**: today's date
     - **Hourly rate**: `12.50`
  3. Click **Create** or **Save**.
- **Expected result**: James Chen appears in the staff list with "Active" status.
- **Common mistakes**: Using an email already assigned to another staff member.
- **Edge cases to check**:
  - Blank required fields → validation error per field.
  - Invalid email format → validation error.
  - Duplicate email → error: "Email already in use."

---

### Staff Profile & Edit

**Purpose**
View full staff profile including employment details, emergency contacts, documents, and role assignments.

**How to access**
- Profile: click eye icon or name link → `/staff/:staffId/profile`
- Edit: click pencil icon → `/staff/:staffId/edit`

**Test Cases**

#### Test 8: View staff profile
- **Steps**:
  1. Navigate to a staff member's profile page.
  2. Profile shows: personal info, role, branch, start date, employment status, hourly rate, emergency contacts, uploaded documents.
- **Expected result**: All data entered during creation is visible.

#### Test 9: Edit staff member details
- **Steps**:
  1. Navigate to the edit page (`/staff/:staffId/edit`).
  2. Change **Hourly rate** to `13.00`.
  3. Click **Save**.
- **Expected result**: The updated rate is saved and visible in the profile.

#### Test 10: Upload a staff document (e.g. right to work)
- **Steps**:
  1. On the staff edit or profile page, find the **Documents** section.
  2. Click **Upload document**.
  3. Select document type (e.g. `Right to Work`), enter expiry date, upload a PDF file.
  4. Click **Save**.
- **Expected result**: Document appears in the staff member's profile with expiry date. If expiry is within 30 days, a warning indicator appears in the staff list.

---

### Shifts

**Purpose**
Create and view scheduled work shifts for staff members.

**How to access**
Click the **Shifts** sub-item under Staff in the sidebar. URL: `/staff/shifts`.

**Test Cases**

#### Test 11: View shift schedule
- **Steps**:
  1. Navigate to `/staff/shifts`.
  2. The page shows a schedule/calendar view of upcoming shifts.
- **Expected result**: Shifts are shown with staff member name, date, start time, end time, and branch.

#### Test 12: Create a new shift
- **Precondition**: At least one staff member exists.
- **Steps**:
  1. On the Shifts page, click **New Shift** or `+`. URL: `/staff/shifts/new`.
  2. Fill in:
     - **Staff member**: select James Chen
     - **Date**: next Monday
     - **Start time**: `09:00`
     - **End time**: `17:00`
     - **Branch**: select current branch
  3. Click **Save**.
- **Expected result**: Shift appears in the schedule.
- **Edge cases to check**:
  - End time before start time → validation error.
  - Overlapping shift for the same staff member → warning or error.

---

### Attendance

**Purpose**
Track clock-in and clock-out times for each shift. Shows attendance records for the branch.

**How to access**
Click the **Attendance** sub-item under Staff in the sidebar. URL: `/staff/attendance`.

**Test Cases**

#### Test 13: View attendance records
- **Steps**:
  1. Navigate to `/staff/attendance`.
  2. The page shows a list of attendance records with columns: staff member, date, clock-in time, clock-out time, hours worked, status (Present, Late, Absent).
- **Expected result**: Records are listed in reverse chronological order.

#### Test 14: Manually record attendance (if applicable)
- **Steps**:
  1. Look for an **Add Record** or **Clock In** button.
  2. Select staff member, enter clock-in time.
  3. Save.
- **Expected result**: Record appears in the attendance list.

---

### Leave Management

**Purpose**
Submit and approve leave requests (holiday, sick leave, personal days).

**How to access**
Click the **Leave** sub-item under Staff in the sidebar. URL: `/staff/leave`.

**Test Cases**

#### Test 15: Submit a leave request
- **Precondition**: Staff member exists. User is the staff member or a manager.
- **Steps**:
  1. Navigate to `/staff/leave`.
  2. Click **Request Leave**.
  3. Fill in:
     - **Staff member**: James Chen
     - **Leave type**: `Holiday`
     - **From date**: next Monday
     - **To date**: next Friday
     - **Notes**: `"Summer holiday"`
  4. Click **Submit**.
- **Expected result**: Leave request appears with status "Pending".

#### Test 16: Approve a leave request
- **Precondition**: A leave request is in "Pending" status. User has `staff.manage` permission.
- **Steps**:
  1. Find the pending request in the list.
  2. Click **Approve**.
- **Expected result**: Status changes to "Approved". The dates are marked on the shift schedule as leave.

#### Test 17: Reject a leave request
- **Steps**:
  1. Find a pending leave request.
  2. Click **Reject** and optionally enter a reason.
- **Expected result**: Status changes to "Rejected". The requesting staff member can see the rejection.

---

### Payroll Export

**Purpose**
Generate a payroll export report for a given pay period, summarising hours worked and gross pay.

**How to access**
Click the **Payroll** sub-item under Staff in the sidebar. URL: `/staff/payroll`. Requires `payroll.export` permission.

**Test Cases**

#### Test 18: Export payroll report
- **Precondition**: Attendance records exist for the selected period.
- **Steps**:
  1. Navigate to `/staff/payroll`.
  2. Select the **Pay period** (e.g. May 2026) using the date filter.
  3. Click **Export** or **Generate Report**.
- **Expected result**: A CSV or PDF file downloads with columns: staff name, total hours, hourly rate, gross pay.
- **Edge cases to check**:
  - Pay period with no attendance records → export produces an empty report or message "No data for this period."
  - Staff member with no hourly rate set → their row may show an error or £0.

---

## Known Relationships
- Staff roles are defined in the **Roles** module. The role assigned here determines permissions across all modules.
- Shifts link to **Attendance** (expected hours vs. actual).
- Leave requests block out shift slots.
- Payroll uses attendance hours × hourly rate per staff member.
- Staff accounts also serve as the login credentials for the `@web` app.

## Checklist
- [ ] Staff list loads with status badges
- [ ] Documents expiring within 30 days show warning icon
- [ ] Staff member can be activated and deactivated
- [ ] Staff member deletion with confirmation
- [ ] Create Owner modal works with temporary password shown
- [ ] New staff member form creates account
- [ ] Duplicate email shows error
- [ ] Staff profile shows all fields
- [ ] Edit saves changes
- [ ] Document upload with expiry date
- [ ] Shift creation with validation (no overlapping, end after start)
- [ ] Attendance records visible
- [ ] Leave request submitted, approved, rejected
- [ ] Payroll export downloads correctly
