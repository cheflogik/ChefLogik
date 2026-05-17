# Admin — Support Tickets — Testing Guide

## Overview
The Support Tickets module allows ChefLogik's support team to view and manage inbound support requests from restaurant tenants. Tickets have four statuses: **Open**, **In Progress**, **Resolved**, **Closed**. They can be filtered by status and searched by ticket ID, subject, or tenant name. Tickets can be assigned to specific support admins.

## Prerequisites
- Logged in to the `@admin` app (`http://localhost:5600`)
- Support Admin or Super Admin role

## Sub-sections

### Support Tickets List

**Purpose**
View all support tickets with priority indicators, status, assignee, and timestamps.

**How to access**
Click **Support Tickets** in the admin sidebar. URL: `/support`.

**Test Cases**

#### Test 1: Support tickets page loads
- **Steps**:
  1. Navigate to `/support`.
  2. Heading reads "Support Tickets" with a subtitle showing counts: e.g. "2 open · 2 in progress".
  3. A search input and status filter tabs are visible above the ticket list.
  4. The ticket table has columns: **ID**, **Subject**, **Tenant**, **Priority**, **Status**, **Assignee**, **Updated**.
- **Expected result**: All tickets are listed. The subtitle counts match the actual open and in-progress ticket counts in the table.

#### Test 2: Priority colour coding
- **Steps**:
  1. Review the **Priority** badges in the ticket list.
- **Expected result**:
  - **Critical** → red badge
  - **High** → orange badge
  - **Medium** → yellow badge
  - **Low** → grey badge

#### Test 3: Status colour coding
- **Steps**:
  1. Review the **Status** badges.
- **Expected result**:
  - **Open** → blue badge
  - **In Progress** → amber badge
  - **Resolved** → green badge
  - **Closed** → grey badge

#### Test 4: Filter tickets by status
- **Steps**:
  1. Look for status filter tabs or a dropdown (options: All, Open, In Progress, Resolved, Closed).
  2. Click **Open**.
- **Expected result**: Only tickets with "Open" status are shown. All other tickets are hidden.
  3. Click **In Progress**.
- **Expected result**: Only in-progress tickets shown.
  4. Click **All** to reset.

#### Test 5: Search tickets
- **Steps**:
  1. In the search input (placeholder: "Search tickets…"), type: `Uber Eats`.
- **Expected result**: Only the ticket about Uber Eats is shown (e.g. "Orders not syncing with Uber Eats" for "The Rustic Fork").
- **Steps**:
  2. Type: `T-1046` (a ticket ID).
- **Expected result**: That specific ticket is shown.
- **Steps**:
  3. Type: `Sakura`.
- **Expected result**: All tickets from "Sakura Kitchen" are shown.
- **Edge cases to check**:
  - No results → empty state message (table shows no rows or a "No tickets found" message).

---

### Ticket Detail

**Purpose**
View the full content of a support ticket and take action (assign, change status, respond).

**How to access**
Click a ticket row or ticket ID to open its detail view.

**Test Cases**

#### Test 6: View ticket detail
- **Steps**:
  1. Click on ticket `T-1046` ("Orders not syncing with Uber Eats").
  2. The detail view shows: ticket ID, subject, tenant, priority, status, assignee, created date, updated date, and the full ticket description/message.
- **Expected result**: All fields are populated. The tenant name should match what is in Tenant Management.

#### Test 7: Assign a ticket to an admin
- **Precondition**: The ticket has no assignee (null/unassigned).
- **Steps**:
  1. Open ticket `T-1047` ("Cannot add new branch — permission error").
  2. Find the **Assignee** field (shows "Unassigned").
  3. Click the Assignee dropdown and select a support admin (e.g. `Sarah Chen`).
  4. Save or confirm.
- **Expected result**: The ticket row now shows Sarah Chen as the assignee. The updated timestamp changes.

#### Test 8: Change ticket status
- **Precondition**: A ticket is "Open".
- **Steps**:
  1. Open the ticket.
  2. Find the **Status** control.
  3. Change from **Open** to **In Progress**.
  4. Save.
- **Expected result**: Status changes to "In Progress" (amber badge). The header subtitle count for "in progress" increments.

#### Test 9: Mark ticket as resolved
- **Steps**:
  1. Change the status of an "In Progress" ticket to **Resolved**.
- **Expected result**: Status changes to green "Resolved" badge. The ticket may be filtered out when viewing "Open" or "In Progress" tabs.

#### Test 10: Closed ticket is read-only
- **Precondition**: A ticket is in "Closed" status.
- **Steps**:
  1. Click on a "Closed" ticket.
- **Expected result**: The ticket details are visible but status change controls may be limited. Confirm whether a closed ticket can be reopened (check if there is a "Reopen" button).

---

## Known Relationships
- Support tickets are linked to specific tenants — clicking the tenant name may navigate to that tenant's detail in **Tenant Management**.
- Resolving a ticket may trigger an automatic notification to the tenant's owner (if email notifications are configured).
- Admin actions on tickets (assignment, status change) are logged in **Admin Audit Logs**.

## Checklist
- [ ] Support tickets page loads with correct open/in-progress counts in subtitle
- [ ] All tickets show ID, subject, tenant, priority, status, assignee, updated date
- [ ] Priority badges: Critical=red, High=orange, Medium=yellow, Low=grey
- [ ] Status badges: Open=blue, In Progress=amber, Resolved=green, Closed=grey
- [ ] Status filter tabs work (Open/In Progress/Resolved/Closed/All)
- [ ] Search by ticket ID returns correct result
- [ ] Search by subject keyword filters correctly
- [ ] Search by tenant name filters correctly
- [ ] No results search shows empty state
- [ ] Ticket detail view shows all fields
- [ ] Assign ticket to admin saves and shows in list
- [ ] Status change from Open → In Progress works
- [ ] Status change to Resolved changes badge to green
- [ ] Closed ticket behaviour (read-only or reopen option) is confirmed
