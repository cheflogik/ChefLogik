# Events & Functions — Testing Guide

## Overview
The Events & Functions module manages private dining and function bookings — corporate dinners, weddings, birthday parties, and other special occasions. It operates as a **pipeline (Kanban)** from initial enquiry through to billing. Supporting sub-sections allow management of event packages, bookable spaces, and corporate accounts.

## Prerequisites
- Logged in to the `@web` staff app (`http://localhost:5500`)
- A branch is selected in the sidebar
- Permission required: `events.view` (to view), `events.create` (to create), `events.manage` (to update pipeline stage)
- At least one event space should exist before creating events

## Sub-sections

### Events Pipeline (Kanban Board)

**Purpose**
Track event enquiries and bookings through a multi-stage pipeline: Enquiry → Proposal → Confirmed → Deposit Paid → Final Brief → Completed (or Lost).

**How to access**
Click **Events & Functions** in the left sidebar (under Operations). URL: `/events`.

**Test Cases**

#### Test 1: Events pipeline loads with stage columns
- **Precondition**: At least one event exists.
- **Steps**:
  1. Navigate to `/events`.
  2. The page shows a horizontal Kanban board with pipeline stage columns.
  3. Each column shows its name and a count of events in that stage.
  4. Event cards show: event name, occasion type (e.g. "Birthday", "Corporate"), guest count, event date, and estimated value.
- **Expected result**: All stages are visible. Events appear in their respective columns.
- **Edge cases to check**:
  - No events → each column shows empty placeholder.

#### Test 2: Filter events by occasion type
- **Precondition**: Events exist with different occasion types.
- **Steps**:
  1. Look for a filter dropdown (typically at the top of the page, labelled "Occasion" or "Type").
  2. Select an occasion type, e.g. **Corporate**.
- **Expected result**: Only corporate events are shown across all pipeline stages.

#### Test 3: Advance an event to the next pipeline stage
- **Precondition**: An event is in "Enquiry" stage. User has `events.manage` permission.
- **Steps**:
  1. Find an event card in the **Enquiry** column.
  2. Click the action button to advance it (e.g. **Move to Proposal** or a status-change button on the card).
- **Expected result**: The event card moves to the **Proposal** column.

#### Test 4: Mark event as lost
- **Precondition**: An event is in any active pipeline stage.
- **Steps**:
  1. Find an event card.
  2. Click the **Mark Lost** button or option (may be in a dropdown or a separate button on the card).
  3. A **Mark as Lost** modal appears with a **Reason** dropdown.
  4. Select a reason (e.g. `Price`, `Venue`, `Date`).
  5. Click **Mark Lost**.
- **Expected result**: The event is moved to a "Lost" state and no longer appears in the active pipeline (or appears in a "Lost" column).
- **Edge cases to check**:
  - Click Cancel → modal closes, event stage unchanged.

---

### New Event

**Purpose**
Create a new event enquiry to start it in the pipeline.

**How to access**
On the Events page, click **New Event** (top-right). URL: `/events/new`. Requires `events.create` permission.

**Test Cases**

#### Test 5: Create a new event enquiry
- **Steps**:
  1. Click **New Event**.
  2. Fill in the required fields:
     - **Event name**: `Johnson Wedding`
     - **Occasion type**: `Wedding` (from dropdown)
     - **Guest count**: `80`
     - **Event date**: `2026-09-12`
     - **Space**: select an available space from the dropdown
     - **Contact name**: `Sarah Johnson`
     - **Contact email**: `sarah@example.com`
     - **Contact phone**: `+44 7700 900100`
     - **Notes**: `"Ceremony at 5pm, dinner at 7pm"`
  3. Click **Create Event** (or **Save**).
- **Expected result**: The event appears in the **Enquiry** column of the pipeline. The pipeline count increments.
- **Common mistakes**: Not selecting a space — the space may be required.
- **Edge cases to check**:
  - Leave event name blank → validation error.
  - Past date → validation error or warning.
  - Guest count exceeds space capacity → warning shown.

---

### Event Detail

**Purpose**
View and edit all details of a single event, including adding a proposal, recording deposit, attaching briefs, and managing billing.

**How to access**
Click any event card on the pipeline. URL: `/events/:eventId`.

**Test Cases**

#### Test 6: View event detail
- **Steps**:
  1. Click an event card on the pipeline.
  2. The Event Detail page shows: event name, occasion type, guest count, date, space, contact info, status/stage, notes, and a timeline of stage changes.
- **Expected result**: All data entered at creation is displayed.

#### Test 7: Send a proposal (advance to Proposal stage)
- **Precondition**: Event is in "Enquiry" stage.
- **Steps**:
  1. On the Event Detail page, look for a **Send Proposal** button or **Advance stage** option.
  2. Click it.
  3. Optionally enter proposal details or attach a package.
- **Expected result**: Event stage changes to "Proposal". The pipeline Kanban reflects this.

#### Test 8: Record deposit payment
- **Precondition**: Event is in "Proposal" or "Confirmed" stage.
- **Steps**:
  1. Look for a **Record Deposit** section.
  2. Enter deposit amount (e.g. `500.00`) and payment method.
  3. Click **Save**.
- **Expected result**: Deposit is recorded. Stage may auto-advance to "Deposit Paid".

---

### Event Packages

**Purpose**
Create and manage reusable event packages (menus, room setups, AV options) that can be attached to event enquiries.

**How to access**
On the Events page, click **Packages** tab or button. URL: `/events/packages`.

**Test Cases**

#### Test 9: Create an event package
- **Steps**:
  1. Navigate to `/events/packages`.
  2. Click **Add Package**.
  3. Enter: package name (`Silver Dinner Package`), description, price per head (e.g. `65.00`), minimum guest count (`20`).
  4. Click **Save**.
- **Expected result**: Package appears in the list and is available in the Event creation dropdown.
- **Edge cases to check**:
  - Blank name → validation error.
  - Negative price → validation error.

---

### Event Spaces

**Purpose**
Define and manage physical event spaces within the branch (e.g. private dining room, rooftop terrace).

**How to access**
URL: `/events/spaces`.

**Test Cases**

#### Test 10: Create an event space
- **Steps**:
  1. Navigate to `/events/spaces`.
  2. Click **Add Space**.
  3. Enter: space name (`Private Dining Room`), capacity (`30`), description, hourly rate or minimum spend if applicable.
  4. Click **Save**.
- **Expected result**: Space appears in the list and is selectable when creating new events.
- **Edge cases to check**:
  - Capacity of 0 → validation error.
  - Duplicate space name → warning or error.

---

### Corporate Accounts

**Purpose**
Manage corporate client accounts that regularly book events.

**How to access**
URL: `/events/corporate-accounts`.

**Test Cases**

#### Test 11: Create a corporate account
- **Steps**:
  1. Navigate to `/events/corporate-accounts`.
  2. Click **Add Corporate Account**.
  3. Enter: company name (`Acme Corp`), primary contact name (`Bob Lee`), contact email (`bob@acmecorp.com`), phone, billing address.
  4. Click **Save**.
- **Expected result**: Account appears in the list. Can be linked to future event enquiries.
- **Edge cases to check**:
  - Duplicate company name → the system may warn or allow (check behaviour).
  - Blank required fields → validation error.

---

## Known Relationships
- Event spaces and packages must exist before creating events.
- Corporate accounts can be linked to events for billing tracking.
- Event billing data feeds into **Analytics → Events Dashboard**.
- Events that are confirmed and paid may create entries in **Orders** for catering items.

## Checklist
- [ ] Events pipeline loads with all stage columns
- [ ] Events display name, occasion type, guest count, date on cards
- [ ] Empty columns show placeholder
- [ ] Events can be advanced through pipeline stages
- [ ] "Mark as Lost" modal appears with reason dropdown and records correctly
- [ ] New Event form creates an enquiry in the correct pipeline stage
- [ ] Required field validation prevents blank submissions
- [ ] Event Detail shows all data and stage history
- [ ] Packages can be created and are selectable in event creation
- [ ] Spaces can be created and appear in the space dropdown
- [ ] Corporate accounts can be created and linked
