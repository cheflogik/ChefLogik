# Authentication — Testing Guide

## Overview
Authentication is the entry point to the ChefLogik staff app (`@web`). All staff members must log in before accessing any module. The login process is **two-step**: first a credentials check, then an OTP (one-time password) sent to the staff member's email. There is also a separate customer portal login described at the end.

## Prerequisites
- The `@web` app must be running (port 5500: `http://localhost:5500`)
- At least one staff member account must exist in the system with a known email and password
- The staff member's **Restaurant ID** (tenant slug, e.g. `demo-restaurant`) must be known
- Email delivery must be working (OTP is sent by email)

## Sub-sections

### Staff Login (Two-Step OTP)

**Purpose**
Allow staff members to securely authenticate into the ChefLogik staff application.

**How to access**
Navigate to `http://localhost:5500`. If not logged in, the app automatically shows the Sign in screen.

**Test Cases**

#### Test 1: Successful login with valid credentials
- **Precondition**: A staff account exists with email `staff@test.com`, password `Password123!`, tenant slug `demo-restaurant`
- **Steps**:
  1. Open `http://localhost:5500` in a browser.
  2. You will see the **Sign in** screen with the heading "Sign in" and subtitle "Welcome back to ChefLogik".
  3. In the **Email address** field, enter: `staff@test.com`
  4. In the **Password** field, enter: `Password123!`
  5. In the **Restaurant ID** field, enter: `demo-restaurant`
  6. Click the **Sign in** button.
  7. A second screen appears — the OTP verification screen. Check the email inbox for a 6-digit OTP code.
  8. Enter the 6-digit OTP code into the OTP field.
  9. Click **Verify** (or press Enter).
- **Expected result**: The app redirects to the Dashboard (`/dashboard`). The sidebar is visible with the staff member's accessible modules.
- **Common mistakes**: Entering the wrong tenant slug — the Restaurant ID is the URL slug (e.g. `demo-restaurant`), not the display name.
- **Edge cases to check**:
  - Enter wrong password → error message appears below the form: "These credentials do not match our records." (or similar)
  - Enter wrong tenant slug → error message appears
  - Leave any field empty and click Sign in → browser validation prevents submission (fields are marked required)

#### Test 2: OTP entry — wrong code
- **Precondition**: Reached the OTP screen after step 6 above.
- **Steps**:
  1. On the OTP screen, enter an incorrect code, e.g. `000000`.
  2. Click **Verify**.
- **Expected result**: An error message appears: "Invalid OTP" or similar. The OTP input is still visible and the user can try again.
- **Edge cases to check**:
  - Enter an expired OTP (wait several minutes, then try) → error about expired code

#### Test 3: Remember me checkbox
- **Precondition**: None.
- **Steps**:
  1. On the Sign in screen, tick the **Remember me for 30 days** checkbox (visible below the Restaurant ID field).
  2. Complete the full login flow.
  3. Close and reopen the browser.
  4. Navigate to `http://localhost:5500`.
- **Expected result**: The app opens directly to the Dashboard without asking for login again.

#### Test 4: Forgot password flow
- **Precondition**: A staff account with a valid email exists.
- **Steps**:
  1. On the Sign in screen, click the **Forgot password?** link (next to the Password label).
  2. The screen changes to **Forgot Password**. Enter your email address, e.g. `staff@test.com`.
  3. Click **Send reset link** (or similar button).
- **Expected result**: A success message appears: "Check your email for a reset link." An email with a password reset link is sent.
- **Edge cases to check**:
  - Enter an email that does not exist → the app should show the same success message (security best practice — do not reveal whether an email exists)
  - Leave email blank and submit → validation error

#### Test 5: SSO buttons (Google / Microsoft)
- **Precondition**: None.
- **Steps**:
  1. On the Sign in screen, click the **Google** or **Microsoft** button.
- **Expected result**: The app initiates an SSO redirect to the respective provider. (Note: SSO may not be fully configured in all environments — confirm with the team before testing.)

#### Test 6: Logout
- **Precondition**: Logged in to the staff app.
- **Steps**:
  1. Click the user avatar or name in the top-right corner of the header.
  2. A dropdown appears — click **Log out** (or **Sign out**).
- **Expected result**: The session is cleared and the app returns to the Sign in screen.

---

### Onboarding (First-Time Setup)

**Purpose**
Allow a new restaurant to set up their ChefLogik account.

**How to access**
On the Sign in screen, click **Set up your account** (bottom of the form).

**Test Cases**

#### Test 7: New restaurant onboarding
- **Precondition**: No existing account for the restaurant.
- **Steps**:
  1. Click **Set up your account**.
  2. The Onboarding screen appears. Fill in the required fields (restaurant name, owner email, password, etc.).
  3. Complete each step of the wizard.
  4. Click **Finish** or **Create account**.
- **Expected result**: Account is created, the user is redirected to the login screen or directly into the app.
- **Edge cases to check**:
  - Enter a restaurant slug that is already taken → error: "This Restaurant ID is already in use."
  - Enter a password shorter than the minimum → validation error
  - Enter an invalid email format → validation error

---

## Known Relationships
- Staff accounts are managed in the **Staff Management** module.
- Roles and permissions assigned in **Roles** determine which sidebar modules are visible after login.
- The **Customer Portal** has its own separate login flow at `/portal/login`.

## Checklist
- [ ] Can log in with valid credentials + correct OTP
- [ ] Wrong password shows error message
- [ ] Wrong OTP shows error message
- [ ] "Remember me" persists session across browser restarts
- [ ] Forgot password sends email
- [ ] Logout clears session and returns to Sign in
- [ ] New account onboarding creates a tenant and redirects correctly
