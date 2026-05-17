# Tables & Reservations — Testing Guide

## Overview
The Tables & Reservations module manages dining room occupancy. It covers: listing and filtering reservations, creating new bookings, viewing and acting on individual reservations, a visual interactive floor plan, and a walk-in waitlist. Used primarily by front-of-house managers and hosts.

## Prerequisites
- Logged in to the `@web` staff app (`http://localhost:5500`)
- A branch is selected in the sidebar
- Permission required: `reservations.view` (to view), `reservations.create` (to create), `reservations.manage` (to update/cancel)
- Tables must be configured in the floor plan for availability to show correctly

## Sub-sections

### Reservations List

**Purpose**
View all reservations for the current branch, filterable by date and status.

**How to access**
Click **Tables & Reservations** in the left sidebar (under Operations). URL: `/reservations`.

**Test Cases**

#### Test 1: Reservations list loads
- **Precondition**: At least one reservation exists.
- **Steps**:
  1. Navigate to `/reservations`.
  2. The page shows a table/list with columns: **Guest**, **Party**, **Date**, **Time**, **Status**, and possibly **Branch** (if viewing all branches).
- **Expected result**: Reservations are listed. Dates and times are formatted legibly (e.g. "Mon, Jun 3" and "7:30 PM").
- **Edge cases to check**:
  - No reservations → empty state message is shown.
  - No branch selected → "No branch selected" screen appears with instructions to choose a branch.

#### Test 2: Filter by date
- **Precondition**: Reservations exist on multiple dates.
- **Steps**:
  1. On the Reservations list, find the date filter (look for a date input or filter bar at the top).
  2. Select today's date.
- **Expected result**: Only reservations for today are shown.

#### Test 3: Filter by status
- **Precondition**: Reservations exist with different statuses (pending, confirmed, seated, completed, cancelled, no_show).
- **Steps**:
  1. Find the **Status** filter dropdown.
  2. Select **Confirmed**.
- **Expected result**: Only confirmed reservations are shown.

#### Test 4: Click guest name to open detail
- **Steps**:
  1. In the list, click a guest's name (shown as a link).
- **Expected result**: Navigates to the Reservation Detail page (`/reservations/:id`).

---

### New Reservation

**Purpose**
Create a new reservation for a guest.

**How to access**
On the Reservations list, click the **New Reservation** button (top-right). URL: `/reservations/new`. Requires `reservations.create` permission.

**Test Cases**

#### Test 5: Create a valid reservation
- **Precondition**: Tables are configured in the floor plan.
- **Steps**:
  1. Click **New Reservation**.
  2. Fill in the following fields:
     - **Guest name**: `John Smith`
     - **Guest email**: `john@example.com`
     - **Guest phone**: `+44 7700 900000`
     - **Party size**: `4`
     - **Date**: tomorrow's date (e.g. `2026-05-19`)
     - **Time**: `19:30`
     - **Table**: select an available table from the dropdown or floor plan
     - **Notes**: `"Anniversary dinner — please prepare flowers"`
  3. Click **Create Reservation** (or **Save**).
- **Expected result**: The reservation is created and appears in the list with status "Pending" or "Confirmed". A confirmation email is sent to the guest if email is configured.
- **Common mistakes**: Not selecting a table when one is required. Picking a time when the restaurant is closed.
- **Edge cases to check**:
  - Party size larger than the selected table's capacity → warning or error.
  - Overlapping reservation for the same table and time → conflict error.
  - Leave guest name blank → validation error, form does not submit.
  - Past date → validation error.

#### Test 6: Reservation with no email
- **Steps**:
  1. Fill in all required fields except email.
  2. Submit.
- **Expected result**: Reservation is created (email may be optional). No email confirmation sent.

---

### Reservation Detail

**Purpose**
View and manage a single reservation: confirm it, seat the guest, mark as no-show, cancel, or add notes.

**How to access**
Click any guest name link in the Reservations list. URL: `/reservations/:reservationId`.

**Test Cases**

#### Test 7: View reservation detail
- **Precondition**: A reservation exists.
- **Steps**:
  1. Click a guest name from the list.
  2. The detail page shows: guest info, party size, date, time, assigned table, status, notes, and action buttons.
- **Expected result**: All fields display the values entered at creation.

#### Test 8: Confirm a pending reservation
- **Precondition**: A reservation is in "Pending" status.
- **Steps**:
  1. Open the reservation detail.
  2. Click the **Confirm** button.
- **Expected result**: Status changes to "Confirmed". The list shows the updated status.

#### Test 9: Seat a confirmed reservation
- **Precondition**: A reservation is "Confirmed" and the guest has arrived.
- **Steps**:
  1. Open the reservation detail.
  2. Click **Seat** (or equivalent action button).
- **Expected result**: Status changes to "Seated". The assigned table shows as occupied on the floor plan.

#### Test 10: Mark as no-show
- **Precondition**: A reservation's time has passed and the guest did not arrive.
- **Steps**:
  1. Open the reservation detail.
  2. Click **No Show**.
- **Expected result**: Status changes to "No Show". The table is released.

#### Test 11: Cancel a reservation
- **Precondition**: A reservation exists in any pre-completed status.
- **Steps**:
  1. Open the reservation detail.
  2. Click **Cancel**.
  3. Confirm the cancellation in the confirmation dialog.
- **Expected result**: Status changes to "Cancelled". Guest may receive a cancellation email.

---

### Floor Plan

**Purpose**
Visual, interactive map of the dining room. Shows which tables are occupied, available, or reserved. Staff can seat guests, view table status, and manage table assignments.

**How to access**
On the Reservations page, click **Floor Plan** tab or button. URL: `/reservations/floor-plan`.

**Test Cases**

#### Test 12: Floor plan renders correctly
- **Precondition**: Tables have been configured in the floor plan designer.
- **Steps**:
  1. Navigate to `/reservations/floor-plan`.
  2. A graphical representation of the dining room appears, with tables drawn as rectangles or circles.
- **Expected result**: Tables are visible with their labels (e.g. "Table 1", "T2"). Colour indicates status: green = available, red/orange = occupied, yellow = reserved.

#### Test 13: Click a table to see its status
- **Steps**:
  1. Click on a table on the floor plan.
  2. A popup or sidebar appears.
- **Expected result**: Popup shows: table number, capacity, current status, current guest name (if seated), elapsed time, and action buttons (Seat / Release / View Reservation).

#### Test 14: Open/seat a table from the floor plan
- **Precondition**: A table is available (green).
- **Steps**:
  1. Click the available table.
  2. In the popup, click **Open Table** or **Seat Guest**.
  3. Enter party size and optionally a name.
  4. Confirm.
- **Expected result**: The table changes colour to occupied (red/orange) and the count of "Tables Seated" on the Dashboard updates.

#### Test 15: Release (close) a table
- **Precondition**: A table is occupied.
- **Steps**:
  1. Click the occupied table.
  2. Click **Release** or **Close Table** in the popup.
  3. Confirm.
- **Expected result**: Table returns to green (available). Dashboard stats update.

#### Test 16: Floor plan edit mode (designer)
- **Precondition**: `reservations.manage` or similar permission.
- **Steps**:
  1. Look for an **Edit** toggle or button on the floor plan page.
  2. Switch to Edit mode.
  3. Drag a table to a new position.
  4. Add a new table from the toolbox (left or right panel).
  5. Click **Save**.
- **Expected result**: The floor plan layout is saved and visible in view mode.

---

### Walk-in Waitlist

**Purpose**
Manage a queue of walk-in guests waiting for a table.

**How to access**
On the Reservations page, click the **Waitlist** tab or button. URL: `/reservations/waitlist`.

**Test Cases**

#### Test 17: Add a guest to the waitlist
- **Precondition**: All tables are occupied (or branch is busy).
- **Steps**:
  1. Navigate to `/reservations/waitlist`.
  2. Click **Add to Waitlist** (or **+ Walk-in**).
  3. Enter: guest name (`Jane Doe`), party size (`2`), phone (`+44 7700 900001`).
  4. Click **Add**.
- **Expected result**: Guest appears in the waitlist with their estimated wait time. The Dashboard "Walk-in Waitlist" count increments by 1.

#### Test 18: Seat a guest from the waitlist
- **Precondition**: A guest is on the waitlist and a table has become available.
- **Steps**:
  1. On the waitlist, find the guest at the top of the queue.
  2. Click **Seat** or **Assign Table**.
  3. Select an available table.
  4. Confirm.
- **Expected result**: The guest is removed from the waitlist. The table changes to occupied on the floor plan.

#### Test 19: Remove a guest from the waitlist
- **Precondition**: A guest is on the waitlist.
- **Steps**:
  1. Find the guest entry.
  2. Click **Remove** or **Cancel**.
  3. Confirm the removal.
- **Expected result**: Guest is removed from the waitlist. Dashboard count decreases.

---

## Known Relationships
- Table configuration (capacity, names) is set up in the **Floor Plan edit mode**.
- Seated tables affect the **Dashboard** "Tables Seated" stat.
- Reservations can be linked to **Customers** in the Customers & Loyalty module.
- Walk-in waitlist count appears on the **Dashboard**.

## Checklist
- [ ] Reservations list loads with correct columns
- [ ] Date and status filters work correctly
- [ ] New reservation creates with all required fields
- [ ] Validation prevents submission with missing required fields
- [ ] Duplicate table/time conflict shows an error
- [ ] Reservation detail shows all data correctly
- [ ] Status transitions: Pending → Confirmed → Seated → Completed
- [ ] No-show and cancel actions work
- [ ] Floor plan renders with colour-coded table statuses
- [ ] Table popup shows correct info on click
- [ ] Table can be opened (occupied) and released (available)
- [ ] Floor plan edit mode allows dragging and saving
- [ ] Waitlist: add, seat, and remove guests all work
- [ ] Dashboard stats update when tables change status
