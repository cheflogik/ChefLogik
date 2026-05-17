# Customer Portal — Testing Guide

## Overview
The Customer Portal is a self-service section of the `@web` app where **customers** (not staff) can manage their own account. It lives under the `/portal` path and uses a separate login from the staff login. Customers can: log in, browse restaurants, view their loyalty points and tier, manage reservations, and update their profile.

**Important**: This is a customer-facing section. Do not confuse it with the staff sections. Customers log in at `/portal/login`, not at the main `/login`.

## Prerequisites
- The `@web` app is running on port 5500
- A customer account must exist (created via staff enrolment at `/customers/enroll` or via self-registration if enabled)
- The customer's phone number is their login identifier

## Sub-sections

### Customer Login

**Purpose**
Allow customers to log in to the portal using their phone number.

**How to access**
Navigate to `http://localhost:5500/portal/login`.

**Test Cases**

#### Test 1: Customer logs in successfully
- **Precondition**: A customer account exists with phone `+44 7700 900400` (Sophie Williams, enrolled in the Customers module).
- **Steps**:
  1. Navigate to `http://localhost:5500/portal/login`.
  2. Enter phone number: `+44 7700 900400`.
  3. Click **Send OTP** or **Continue**.
  4. An OTP is sent to the customer's phone (via SMS/Twilio).
  5. Enter the OTP code.
  6. Click **Verify**.
- **Expected result**: The customer is logged in and sees the portal home screen.
- **Edge cases to check**:
  - Phone number not registered → error: "No account found with this number."
  - Wrong OTP → error: "Invalid code. Please try again."
  - OTP expired → error: "Code has expired. Request a new one."

---

### Restaurant Selection

**Purpose**
After login, a customer selects which restaurant they want to interact with (they may be enrolled at multiple restaurants).

**How to access**
URL: `/portal/restaurants`. This page appears automatically after login if the customer is enrolled at more than one restaurant.

**Test Cases**

#### Test 2: Restaurant selection screen
- **Precondition**: Customer is enrolled at multiple restaurants.
- **Steps**:
  1. Log in as the customer.
  2. The restaurant selection screen shows all restaurants the customer has visited/enrolled at.
  3. Click on one restaurant name.
- **Expected result**: The portal switches context to that restaurant. The home page shows loyalty data specific to that restaurant.
- **Edge cases to check**:
  - Customer enrolled at only one restaurant → skip the selection screen, go directly to portal home.

---

### Portal Home

**Purpose**
Overview of the customer's loyalty status at the selected restaurant: current tier, points balance, and quick links.

**How to access**
URL: `/portal/home`.

**Test Cases**

#### Test 3: Portal home shows loyalty data
- **Precondition**: Logged in as a customer who has loyalty points.
- **Steps**:
  1. Navigate to `/portal/home` (or this appears automatically after login/restaurant selection).
  2. The page shows: loyalty tier badge (e.g. Bronze), current points balance (e.g. `150 points`), next tier threshold (e.g. `"350 more points to reach Silver"`), recent visit summary.
- **Expected result**: Correct tier and points are displayed. The tier matches what is visible in the staff **Customers** module.

#### Test 4: Points balance is consistent with staff view
- **Steps**:
  1. Note the points shown in the portal for Sophie Williams (`150 points`).
  2. Log in as a staff member.
  3. Navigate to `/customers` and find Sophie Williams.
  4. Confirm the points balance matches.
- **Expected result**: Both views show the same points value.

---

### Customer Reservations

**Purpose**
View upcoming and past reservations booked under this customer account.

**How to access**
URL: `/portal/reservations`.

**Test Cases**

#### Test 5: View upcoming reservations
- **Precondition**: A reservation exists linked to the customer's phone/email.
- **Steps**:
  1. Navigate to `/portal/reservations`.
  2. The page shows: upcoming reservations with date, time, party size, table, and status.
- **Expected result**: Reservations match what is visible in the staff **Reservations** module.
- **Edge cases to check**:
  - No reservations → empty state: "You have no upcoming reservations."

#### Test 6: View past bookings
- **Steps**:
  1. On the reservations page, find a "Past bookings" or "History" section/tab.
- **Expected result**: Past reservations are listed with status "Completed" or "Cancelled".

---

### Bookings (Events / Function Bookings)

**Purpose**
View event enquiries or function bookings the customer has submitted.

**How to access**
URL: `/portal/bookings`.

**Test Cases**

#### Test 7: View event bookings
- **Precondition**: The customer has submitted an event enquiry.
- **Steps**:
  1. Navigate to `/portal/bookings`.
  2. The page shows enquiries/bookings with: event name, date, status, and contact.
- **Expected result**: Bookings appear with their pipeline status (e.g. "Confirmed", "Pending").
- **Edge cases to check**:
  - No bookings → empty state message.

---

### Customer Profile

**Purpose**
Allow customers to view and update their own personal details and communication preferences.

**How to access**
URL: `/portal/profile`.

**Test Cases**

#### Test 8: View customer profile
- **Steps**:
  1. Navigate to `/portal/profile`.
  2. Shows: first name, last name, email, phone, date of birth, marketing opt-in status.
- **Expected result**: All details match what was entered during enrolment.

#### Test 9: Update name
- **Steps**:
  1. Change **First name** from `Sophie` to `Sophia`.
  2. Click **Save**.
- **Expected result**: Name updates. The portal home header (if it shows the customer name) reflects the change.

#### Test 10: Update marketing preferences
- **Steps**:
  1. Find the **Marketing opt-in** toggle or checkbox.
  2. Toggle it off.
  3. Click **Save**.
- **Expected result**: Marketing opt-in is saved as `false`. The customer will not receive marketing emails/SMS from the restaurant.

#### Test 11: GDPR — Request data deletion
- **Steps**:
  1. On the profile page, find a **Delete My Account** or **Request Data Deletion** option.
  2. Click it.
  3. Confirm the action.
- **Expected result**: A deletion request is submitted. Per GDPR, the customer's PII is anonymised but financial history is retained in anonymised form. The customer is logged out.
- **Edge cases to check**:
  - Customer with pending reservations → system may warn that reservations will be cancelled.

---

## Known Relationships
- Customer loyalty data in the portal is the same data seen by staff in **Customers & Loyalty**.
- Reservations shown in the portal match those in the **Tables & Reservations** module.
- Event bookings in the portal match those in **Events & Functions**.
- Profile data updated here is reflected in the staff **Customers** module.

## Checklist
- [ ] Customer logs in via phone + OTP at `/portal/login`
- [ ] Wrong phone number returns "No account found" error
- [ ] Wrong OTP returns appropriate error
- [ ] Multi-restaurant customers see selection screen
- [ ] Single-restaurant customers skip straight to portal home
- [ ] Portal home shows correct tier and points balance
- [ ] Points balance matches staff Customers module view
- [ ] Upcoming reservations listed correctly
- [ ] No reservations shows empty state
- [ ] Past bookings/event enquiries visible
- [ ] Profile shows all personal details
- [ ] Name update saves and displays correctly
- [ ] Marketing opt-out saves
- [ ] Data deletion request processes and logs out customer
