# Dashboard — Testing Guide

## Overview
The Dashboard is the home screen of the ChefLogik staff app (`@web`). It provides a real-time operational snapshot for the currently selected branch: active orders, table occupancy, walk-in waitlist count, today's revenue, live order feed, system alerts, and quick-action shortcuts.

## Prerequisites
- Logged in to the `@web` staff app (`http://localhost:5500`)
- A branch must be selected in the bottom of the left sidebar
- At least one active order should exist to verify the live orders section (can be created via Orders → New Order)

## Sub-sections

### Stats Bar

**Purpose**
Show four key operational numbers at the top of the Dashboard: Active Orders, Tables Seated, Walk-in Waitlist, Revenue Today.

**How to access**
Click **Dashboard** in the left sidebar (under the Operations group). URL: `/dashboard`.

**Test Cases**

#### Test 1: Stats bar loads with correct branch data
- **Precondition**: A branch is selected in the bottom-left branch selector. The branch has some activity (orders or tables).
- **Steps**:
  1. Navigate to `/dashboard`.
  2. Look at the top row of four stat cards: **Active Orders**, **Tables Seated**, **Walk-in Waitlist**, **Revenue Today**.
- **Expected result**: Each card shows a number. Active Orders matches the count visible in Live Orders (`/orders`). Tables Seated shows `occupied/total` format (e.g. `3/12`). Revenue Today shows a currency value (e.g. `£142.50`).
- **Edge cases to check**:
  - No branch selected → the branch selector in the bottom-left shows "Select branch"; switching to a valid branch should reload the stats.
  - New branch with no data → all stats show `0` or `£0.00`.

#### Test 2: Stats refresh when branch changes
- **Precondition**: Two branches exist.
- **Steps**:
  1. Note the stat values for Branch A.
  2. Click the branch selector (bottom-left of sidebar), select Branch B.
  3. Watch the stats bar.
- **Expected result**: Stats update to reflect Branch B's data.

---

### Live Orders Feed

**Purpose**
Show up to 8 of the most recent active orders, updating in real time via WebSocket.

**How to access**
The Live Orders section appears in the main content area, left column, immediately below the stats bar.

**Test Cases**

#### Test 3: Live orders are displayed
- **Precondition**: At least one active order exists for the selected branch.
- **Steps**:
  1. On the Dashboard, look at the **Live Orders** section (left column).
  2. Each row shows: an order reference number (`#XXXXXX`), a channel badge (e.g. `POS`, `QR`, `Uber Eats`), a total amount, an elapsed time (e.g. `4m`), and a status badge.
- **Expected result**: Orders appear as a list. The "Real-time" indicator (green dot) is visible next to the section heading.
- **Edge cases to check**:
  - No active orders → the section shows the message "No active orders right now".

#### Test 4: "View all" link navigates to Live Orders
- **Precondition**: On the Dashboard.
- **Steps**:
  1. Click the **View all** link (top-right of the Live Orders section, next to an arrow icon).
- **Expected result**: Navigates to `/orders` (Live Orders page).

#### Test 5: Elapsed time shown in red for slow orders
- **Precondition**: An order has been active for more than 20 minutes.
- **Steps**:
  1. View the Dashboard.
  2. Look at the elapsed time column of the Live Orders feed.
- **Expected result**: Orders older than 20 minutes display their elapsed time in red.

---

### Alerts Panel

**Purpose**
Show operational alerts requiring attention: 86 alerts (item out of stock and removed from menu), slow orders, unacknowledged allergen notices, low stock warnings.

**How to access**
Right column of the Dashboard, upper section.

**Test Cases**

#### Test 6: Alerts are visible
- **Precondition**: The system has generated alerts (e.g. an item has been 86'd, or an allergen note is unacknowledged).
- **Steps**:
  1. On the Dashboard, look at the **Alerts** panel (right column).
  2. Each alert has a coloured left border: red border for danger, yellow border for warning.
  3. The heading row shows a red badge counting the number of "active" danger alerts.
- **Expected result**: Alerts are listed with their title, subtitle, and timestamp (e.g. "2m ago").
- **Edge cases to check**:
  - No alerts → section still appears but shows an empty or placeholder state.

---

### Quick Actions

**Purpose**
Provide shortcuts to common tasks: Open Table, New Walk-in, View KDS, Floor Plan.

**How to access**
Right column of the Dashboard, lower section, below the Alerts panel.

**Test Cases**

#### Test 7: Quick action shortcuts navigate correctly
- **Precondition**: Logged in with permissions for reservations and KDS.
- **Steps**:
  1. Click **Open Table** — expect navigation to `/reservations`.
  2. Click **New Walk-in** — expect navigation to `/reservations`.
  3. Click **View KDS** — expect navigation to `/kds`.
  4. Click **Floor Plan** — expect navigation to `/reservations`.
- **Expected result**: Each tile navigates to the correct page without errors.

#### Test 8: Quick actions in header
- **Precondition**: On the Dashboard.
- **Steps**:
  1. Look at the top-right of the Dashboard header area — two buttons: **+ Walk-in** and **+ Reservation**.
  2. Click **+ Walk-in** — confirm what happens (expected: opens a walk-in creation flow or navigates to reservations/floor plan).
  3. Click **+ Reservation** — confirm navigation or modal opens.
- **Expected result**: Buttons are clickable and initiate the intended flows.

---

## Known Relationships
- Active order count links to **Orders** module.
- Tables Seated links to **Tables & Reservations** module.
- 86 alerts are triggered by **Menu Management** (86 action) or **Inventory** (stock-out event).
- Quick action "View KDS" links to the **Kitchen Display System** module.

## Checklist
- [ ] Stats bar loads four numbers for the selected branch
- [ ] Stats update when branch changes
- [ ] Live Orders feed shows active orders with correct data
- [ ] No active orders shows empty state message
- [ ] Elapsed time shows in red for orders over 20 minutes
- [ ] "View all" link navigates to `/orders`
- [ ] Alerts panel displays danger (red) and warning (yellow) alerts
- [ ] Quick action tiles navigate to correct pages
- [ ] "+ Walk-in" and "+ Reservation" header buttons are functional
