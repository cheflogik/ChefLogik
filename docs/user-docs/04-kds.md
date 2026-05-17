# Kitchen Display System (KDS) — Testing Guide

## Overview
The Kitchen Display System (KDS) is a real-time screen for kitchen staff. It shows all active orders that need to be prepared, organised by ticket. Kitchen staff use it to track preparation, acknowledge allergen warnings, and mark items as ready. This module is typically displayed on a dedicated screen mounted in the kitchen.

## Prerequisites
- Logged in to the `@web` staff app (`http://localhost:5500`)
- A branch is selected in the sidebar
- Permission required: `kds.view` or `kds.manage`
- At least one active order must exist in "Confirmed" or "Preparing" status

## Sub-sections

### KDS Main Screen

**Purpose**
Show all kitchen tickets in real time so cooks know what to prepare.

**How to access**
Click **Kitchen Display** in the left sidebar (under Operations). URL: `/kds`. Also accessible as a direct link from the Dashboard Quick Actions ("View KDS").

**Test Cases**

#### Test 1: KDS loads and shows active tickets
- **Precondition**: At least one order is in "Confirmed" or "Preparing" status.
- **Steps**:
  1. Navigate to `/kds`.
  2. The screen shows kitchen tickets arranged in a grid or column layout.
  3. Each ticket shows: order reference number, order source/channel, items list with quantities, total elapsed time, and allergen notes (if any).
- **Expected result**: All active orders requiring kitchen action are displayed. There are no orders in "New" (not yet confirmed) or "Served"/"Bill Settled" (already done) status visible.
- **Edge cases to check**:
  - No active kitchen orders → the screen shows an empty state message.

#### Test 2: Allergen note is prominently displayed
- **Precondition**: An order exists with an allergen note (e.g. `"Nut allergy — table 5"`).
- **Steps**:
  1. On the KDS, find the ticket for the order with the allergen note.
- **Expected result**: The allergen note is displayed in a visually distinct style (red text or red background) so kitchen staff cannot miss it.
- **Edge cases to check**:
  - Order with no allergen note → no allergen section appears.

#### Test 3: Allergen acknowledgement (30-second rule)
- **Precondition**: An order with an allergen note has just appeared on the KDS. `kds.manage` permission is required.
- **Steps**:
  1. A ticket with an allergen note appears on the KDS.
  2. A 30-second countdown timer or prompt is visible on the ticket.
  3. Click the **Acknowledge Allergen** button (or equivalent) within 30 seconds.
- **Expected result**: The acknowledgement is recorded. The countdown stops. The ticket continues in normal kitchen workflow.
- **Edge cases to check**:
  - Do NOT acknowledge within 30 seconds → an alert fires on the Dashboard and/or an escalation notification is sent.

#### Test 4: Mark ticket as ready (bump)
- **Precondition**: An order ticket is visible on the KDS. `kds.manage` permission.
- **Steps**:
  1. Find a ticket for an order in "Preparing" status.
  2. Click the **Ready** (or **Bump**) button on the ticket.
- **Expected result**: The ticket is removed from the KDS screen (or changes appearance). The order status advances to "Ready" on the Live Orders Kanban board.
- **Edge cases to check**:
  - Accidentally bumping the wrong ticket — confirm whether there is an undo option.

#### Test 5: Elapsed time warning on slow tickets
- **Precondition**: An order has been in kitchen for more than the threshold time (typically 20 minutes).
- **Steps**:
  1. Leave an order in "Preparing" for over 20 minutes.
  2. View the KDS.
- **Expected result**: The elapsed timer on the ticket turns red or shows a warning highlight. A Dashboard alert may also appear.

#### Test 6: Real-time arrival of new tickets
- **Precondition**: KDS is open in one browser. A second browser window or device is used to create a new order and confirm it.
- **Steps**:
  1. Open KDS in Window 1.
  2. In Window 2, go to Live Orders and advance an order from "New" to "Confirmed".
  3. Watch Window 1.
- **Expected result**: The new ticket appears on the KDS in Window 1 without a page refresh.

---

## Known Relationships
- KDS tickets are created from **Orders** (when an order is confirmed).
- Allergen acknowledgements are recorded in the audit log (see **Analytics → Audit Log**).
- Bumping a ticket to "Ready" changes the order status visible on the **Live Orders** Kanban board and the **Dashboard**.

## Checklist
- [ ] KDS shows all active kitchen tickets
- [ ] Empty state shown when no active tickets
- [ ] Allergen notes displayed prominently (red styling)
- [ ] 30-second allergen acknowledgement timer visible and functional
- [ ] Bumping a ticket removes it from KDS and advances order to "Ready"
- [ ] Elapsed time turns red on slow tickets (>20 min)
- [ ] New orders appear on KDS in real time without page refresh
