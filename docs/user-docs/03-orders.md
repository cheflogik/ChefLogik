# Orders (Live Orders) — Testing Guide

## Overview
The Orders module is the operational heart of ChefLogik. It displays all active orders in a **Kanban board** grouped by status. Staff can advance orders through a 7-stage lifecycle, cancel orders, and manage delivery platform settings. Orders arrive from 7 channels: POS (dine-in staff entry), QR (customer self-order), takeaway counter, phone, online, Uber Eats, and Wolt.

## Prerequisites
- Logged in to the `@web` staff app (`http://localhost:5500`)
- A branch is selected in the sidebar branch selector
- Permission required: `orders.view` (to view), `orders.create` (to create), `orders.modify` (to advance status), `orders.cancel` (to cancel)
- At least one menu item must exist before creating a new order

## Sub-sections

### Live Orders Kanban Board

**Purpose**
Display all active orders in real time, grouped by their current status into columns.

**How to access**
Click **Live Orders** in the left sidebar (under Operations). URL: `/orders`.

**Test Cases**

#### Test 1: Kanban board loads with order columns
- **Precondition**: At least one active order exists.
- **Steps**:
  1. Navigate to `/orders`.
  2. The page shows the heading **Live Orders** and a horizontal scrolling board with columns.
  3. Columns are (in order): **New**, **Confirmed**, **Preparing**, **Ready**, **Out for Delivery**, **Served**, **Bill Settled**.
  4. Each column has a count badge next to its name.
- **Expected result**: Each column is visible. Orders appear as cards inside the appropriate column. Each card shows the order reference (e.g. `#ABC123`), elapsed time, source channel badge (e.g. `POS`, `QR`, `Uber Eats`), customer name (if available), table number (if applicable), item count and total amount, allergen note (if applicable, shown in red).
- **Edge cases to check**:
  - No orders at all → each column shows an "Empty" placeholder in dashed outline.

#### Test 2: Order card colour coding by status
- **Precondition**: Orders exist in multiple statuses.
- **Steps**:
  1. On the Kanban board, look at the left border of each order card.
- **Expected result**: 
  - New → blue border
  - Confirmed → indigo border
  - Preparing → amber border
  - Ready → green border
  - Out for Delivery → orange border
  - Served → teal border
  - Bill Settled → purple border

#### Test 3: Advance an order to next status
- **Precondition**: An order exists in "New" status. User has `orders.modify` permission.
- **Steps**:
  1. Find an order card in the **New** column.
  2. At the bottom of the card, look for action buttons (e.g. **Confirm** or **Accept**).
  3. Click the transition button.
- **Expected result**: The order card moves to the **Confirmed** column immediately. The column count badges update.
- **Edge cases to check**:
  - Button shows `…` while the action is in progress.
  - If the transition fails, an error is shown.

#### Test 4: Cancel an order
- **Precondition**: An active order exists. User has `orders.cancel` permission.
- **Steps**:
  1. Find an order card in any active column.
  2. Click the small red **Cancel** link at the bottom of the card.
  3. A **Cancel Order** modal appears with the order reference in the heading.
  4. In the **Reason** dropdown, select a reason (e.g. `Customer Request`, `Out Of Stock`, `Kitchen Error`).
  5. Optionally enter text in the **Note (optional)** field, e.g. `"Customer changed their mind"`.
  6. Click the red **Cancel Order** button.
- **Expected result**: The order disappears from the active Kanban board. It can be found in Order History.
- **Common mistakes**: Clicking the backdrop (grey area outside the modal) closes the modal without cancelling — use the **Back** button to close intentionally without cancelling.
- **Edge cases to check**:
  - Click **Back** in the Cancel modal → modal closes, order is not cancelled.
  - Leave the reason blank and submit → the dropdown has a default value so this cannot happen.

#### Test 5: Real-time updates via WebSocket
- **Precondition**: Two browser windows are open on the Orders page for the same branch.
- **Steps**:
  1. In Window 1, advance an order from "New" to "Confirmed".
  2. Watch Window 2.
- **Expected result**: Window 2 automatically shows the order card in the Confirmed column without a page refresh.

---

### New Order

**Purpose**
Allow staff to manually create a new order (walk-in POS, phone, counter).

**How to access**
On the Live Orders page, click **New Order** (top-right). URL: `/orders/new`. Requires `orders.create` permission.

**Test Cases**

#### Test 6: Create a new dine-in order
- **Precondition**: At least one menu item exists. A branch is selected.
- **Steps**:
  1. Click **New Order**.
  2. The New Order page loads. Select **Order source** from the dropdown (e.g. `POS`, `Phone`, `Counter`).
  3. If dine-in, select a **Table** from the table selector.
  4. Optionally enter a **Customer name** and **Customer phone**.
  5. Optionally enter an **Allergen note** (e.g. `"Nut allergy"`).
  6. In the **Items** section, search for a menu item by name and click **Add**.
  7. Adjust quantity if needed.
  8. Click **Place Order**.
- **Expected result**: The order is created and appears on the Kanban board in the **New** column. A success message or redirect back to `/orders` occurs.
- **Common mistakes**: Not selecting a table for a dine-in order — the table field may be required depending on source.
- **Edge cases to check**:
  - No items added → submit blocked with validation error.
  - Select source `Uber Eats` → external order; confirm if manual creation is allowed for 3rd-party sources.

---

### Order History

**Purpose**
View completed, cancelled, and settled orders.

**How to access**
On the Live Orders page, click **History** (top-right area). URL: `/orders/history`.

**Test Cases**

#### Test 7: Order history list
- **Precondition**: At least one order has been completed or cancelled.
- **Steps**:
  1. Click **History**.
  2. The history page shows a list of past orders with columns including: order ref, date, channel, status, total.
- **Expected result**: Past orders are listed. Status shows "Bill Settled", "Cancelled", etc.
- **Edge cases to check**:
  - Filter by date range or status if filters are available.

---

### Order Detail

**Purpose**
View the full detail of a single order.

**How to access**
Click any order reference link (e.g. `#ABC123`) on the Kanban board or history list. URL: `/orders/:orderId`.

**Test Cases**

#### Test 8: View order detail
- **Precondition**: At least one order exists.
- **Steps**:
  1. On the Kanban board, click the order reference link on any card.
  2. The Order Detail page loads.
- **Expected result**: The page shows full order information: items ordered, quantities, prices, total, channel, customer info, table, allergen notes, status history timeline.
- **Edge cases to check**:
  - Navigate directly to `/orders/invalid-id` → a "not found" or error state is shown.

---

### Delivery Zones

**Purpose**
Configure geographic delivery zones for the branch.

**How to access**
On Live Orders page, click **Delivery Zones** (visible if `orders.manage_zones` permission). URL: `/orders/delivery-zones`.

**Test Cases**

#### Test 9: View and edit delivery zones
- **Precondition**: `orders.manage_zones` permission.
- **Steps**:
  1. Click **Delivery Zones**.
  2. Existing zones are listed. Click **Add Zone** or **Edit** on an existing zone.
  3. Enter zone name and radius/polygon data.
  4. Click **Save**.
- **Expected result**: Zone appears in the list.

---

### Promo Codes

**Purpose**
Create and manage discount promo codes.

**How to access**
URL: `/orders/promo-codes`.

**Test Cases**

#### Test 10: Create a promo code
- **Steps**:
  1. Navigate to `/orders/promo-codes`.
  2. Click **Add promo code** (or similar button).
  3. Enter: code (e.g. `WELCOME10`), discount type (percentage or fixed), discount value (e.g. `10`), optional expiry date.
  4. Click **Save**.
- **Expected result**: The code appears in the list and can be applied during order creation.
- **Edge cases to check**:
  - Enter a duplicate code → error: "This code already exists."
  - Enter a negative discount → validation error.

---

### Platform Settings (Pause / Resume)

**Purpose**
Pause or resume all external delivery platform integrations (Uber Eats, Wolt) for the current branch.

**How to access**
On Live Orders page, the **Pause Platforms** and **Resume Platforms** buttons are visible at the top (if `orders.pause_platforms` permission). URL: `/orders/platform-settings` for full settings.

**Test Cases**

#### Test 11: Pause delivery platforms
- **Precondition**: `orders.pause_platforms` permission. Delivery platforms are active.
- **Steps**:
  1. On the Live Orders page, click **Pause Platforms**.
  2. Wait for confirmation message.
- **Expected result**: A message appears: "All delivery platforms paused." New orders from Uber Eats and Wolt stop arriving.

#### Test 12: Resume delivery platforms
- **Steps**:
  1. Click **Resume Platforms**.
- **Expected result**: Message: "Delivery platforms resumed." External orders resume flowing in.

---

### Order Disputes

**Purpose**
Manage disputed orders from delivery platforms.

**How to access**
URL: `/orders/disputes`.

**Test Cases**

#### Test 13: View disputes list
- **Steps**:
  1. Navigate to `/orders/disputes`.
- **Expected result**: List of disputed orders from Uber Eats / Wolt with dispute status, amount, and resolution options.

---

## Known Relationships
- Orders created here trigger **Kitchen Display System** tickets.
- Menu items used in orders come from **Menu Management**.
- Inventory is deducted when orders are confirmed (if inventory linking is configured).
- Customer data linked to orders appears in **Customers & Loyalty**.
- Revenue data from orders feeds **Analytics & Reports**.

## Checklist
- [ ] Kanban board shows 7 status columns
- [ ] Order cards show reference, channel, elapsed time, total, status
- [ ] Elapsed time turns red after 20 minutes
- [ ] Order cards with allergen notes show them in red
- [ ] Order can be advanced to next status
- [ ] Cancel Order modal allows reason selection and optional note
- [ ] Cancelled order disappears from Kanban and appears in History
- [ ] Real-time updates appear without page refresh
- [ ] New Order form creates an order in "New" column
- [ ] Order Detail page shows full information
- [ ] Pause/Resume Platforms buttons work with confirmation message
- [ ] Promo codes can be created and appear in list
