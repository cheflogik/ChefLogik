# Admin — Feature Flags — Testing Guide

## Overview
The Feature Flags module allows platform admins to toggle functionality on or off across the entire platform without deploying new code. Flags are grouped into two categories: **Feature Flags** (enable/disable specific features for all tenants) and **Platform Controls** (system-wide configuration values like rate limits, session durations, etc.).

## Prerequisites
- Logged in to the `@admin` app (`http://localhost:5600`)
- Caution: changing feature flags affects **all tenants on the platform** immediately. Always confirm with the team before toggling flags in a shared environment.

## Sub-sections

### Feature Flags List

**Purpose**
View and toggle all platform-wide feature flags and configuration settings.

**How to access**
Click **Feature Flags** in the admin sidebar. URL: `/flags`.

**Test Cases**

#### Test 1: Feature flags page loads
- **Steps**:
  1. Navigate to `/flags`.
  2. The page shows two sections: **Feature Flags** (with a flag icon) and **Platform Controls** (with a settings gear icon).
  3. Each section lists individual settings as rows.
- **Expected result**: Both sections are visible. Each row shows: setting name, description, and a control (toggle switch, dropdown, or number input depending on the setting type).

---

### Boolean Flags (Toggle Switches)

**Purpose**
Enable or disable a feature for all tenants by toggling a switch.

**Test Cases**

#### Test 2: Toggle a boolean feature flag ON
- **Precondition**: A boolean flag exists (e.g. `enable_customer_portal`) and is currently OFF.
- **Steps**:
  1. Find the flag row (e.g. "Customer Portal").
  2. Look at the toggle switch on the right — it is in the grey/off position.
  3. Click the toggle switch.
- **Expected result**: The toggle slides to blue/on position. The setting is saved immediately (no separate Save button for boolean flags). The feature is now enabled platform-wide.
- **Edge cases to check**:
  - Toggle rapidly (click multiple times in quick succession) → the final state should reflect the last click. No race condition errors.

#### Test 3: Toggle a boolean feature flag OFF
- **Steps**:
  1. Find a flag that is currently ON (blue toggle).
  2. Click it to turn it off.
- **Expected result**: Toggle returns to grey/off. Feature is disabled for all tenants.

---

### String Enum Flags (Dropdown)

**Purpose**
Select one option from a predefined list (e.g. which payment provider mode: `test` vs `live`).

**Test Cases**

#### Test 4: Change a string enum setting
- **Precondition**: A string setting with options exists (e.g. "Stripe Mode" with options `test` and `live`).
- **Steps**:
  1. Find the setting in the list.
  2. The control is a `<select>` dropdown.
  3. Change the value from `test` to `live`.
- **Expected result**: The new value is saved (may happen on change, or require clicking a **Save** button if present).
- **CAUTION**: Switching Stripe from `test` to `live` would process real payments. Do this only in a production environment.

---

### Numeric Flags (Number Input)

**Purpose**
Set integer or decimal platform configuration values (e.g. max login attempts, OTP expiry time in minutes).

**Test Cases**

#### Test 5: Update a numeric platform setting
- **Precondition**: A numeric setting exists (e.g. "OTP Expiry (minutes)" with default `10`).
- **Steps**:
  1. Find the setting row.
  2. The control is a number input.
  3. Change the value from `10` to `15`.
  4. Click away from the input (the value is saved on blur, i.e. when you leave the field).
- **Expected result**: The new value is saved. OTPs now expire after 15 minutes.
- **Edge cases to check**:
  - Enter a value below the minimum (e.g. `-1` for OTP expiry) → validation error or clamped to minimum.
  - Enter a value above the maximum → clamped to maximum.
  - Enter non-numeric text → input rejects it (type="number").

---

## Known Relationships
- Feature flags affect all tenants simultaneously — use with caution in shared/production environments.
- Stripe mode flag controls whether the **Orders** payment flow uses test or live Stripe API keys.
- OTP and session configuration flags affect **Authentication** behaviour in the `@web` app.
- Flag changes are logged in **Admin Audit Logs**.

## Checklist
- [ ] Feature Flags page loads with two groups (Feature Flags, Platform Controls)
- [ ] Boolean toggle switches to ON (blue) and immediately takes effect
- [ ] Boolean toggle switches to OFF (grey) and immediately takes effect
- [ ] Rapid toggling resolves to correct final state
- [ ] String enum dropdown saves on selection
- [ ] Numeric input saves on blur (leaving the field)
- [ ] Numeric input rejects values outside min/max bounds
- [ ] Changes are reflected in audit log
