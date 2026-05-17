# Admin — Audit Logs — Testing Guide

## Overview
The Admin Audit Logs page provides an **immutable, write-only** record of all significant actions taken by platform admins. Records are never deleted or modified. The log captures: who performed the action (actor), what action was taken, which resource was affected, the actor's IP address, and the timestamp. It is used for compliance, investigation, and accountability.

## Prerequisites
- Logged in to the `@admin` app (`http://localhost:5600`)
- At least one admin action must have been performed to generate log entries (login, tenant creation, impersonation, feature flag toggle, etc.)

## Sub-sections

### Audit Log List

**Purpose**
Browse and search all platform admin audit events.

**How to access**
Click **Audit Logs** in the admin sidebar. URL: `/audit`.

**Test Cases**

#### Test 1: Audit log page loads
- **Steps**:
  1. Navigate to `/audit`.
  2. Heading reads "Audit Logs" with subtitle "Immutable log of all admin actions. Records are write-only."
  3. Below the heading: a search input.
  4. A table with four columns: **Actor**, **Action**, **Resource**, **Time**.
- **Expected result**: Log entries are listed newest first. Each row shows:
  - Actor: admin name with initials avatar
  - Action: a colour-coded badge with the action code (see below)
  - Resource: the affected entity name (e.g. "Sakura Kitchen", "Enterprise Plan")
  - Time: date in `YYYY-MM-DD` format (full timestamp available on hover or expansion)

#### Test 2: Action colour coding
- **Steps**:
  1. Review the action badges in the log.
- **Expected result**: Action badges use specific colours:
  - `tenant.created` → green badge
  - `tenant.suspended` → red badge
  - `tenant.reactivated` → blue badge
  - `impersonation.start` → amber badge
  - `plan.updated` → indigo badge
  - `admin.login` → grey/slate badge
  - `flag.toggled` → purple badge

#### Test 3: Search audit log
- **Steps**:
  1. In the search input (placeholder: "Search by actor, action, or resource…"), type: `impersonation`.
- **Expected result**: Only log entries with `impersonation.start` action are shown.
- **Steps**:
  2. Clear and type: `Sakura Kitchen`.
- **Expected result**: Only entries where the resource is "Sakura Kitchen" are shown.
- **Edge cases to check**:
  - Search with no results → empty state: "No matching log entries."
  - Case-insensitive search → `sakura kitchen` and `SAKURA KITCHEN` both return results.

#### Test 4: Audit log is read-only
- **Steps**:
  1. Review the table rows carefully.
- **Expected result**: There are NO **Edit**, **Delete**, or **Update** buttons anywhere on the page. Rows are display-only.

#### Test 5: Perform an action and verify it appears in audit log
- **Precondition**: You have Super Admin access.
- **Steps**:
  1. Navigate to Tenants and suspend a tenant (e.g. "Test Restaurant").
  2. Navigate to `/audit`.
  3. Check the most recent entry.
- **Expected result**: A `tenant.suspended` entry appears at the top of the log with your name as actor and "Test Restaurant" as the resource. IP address matches your current IP.

#### Test 6: Impersonation is logged
- **Steps**:
  1. Open a tenant's detail in Tenants management.
  2. Click **Impersonate**.
  3. Navigate back to `/audit`.
- **Expected result**: An `impersonation.start` entry is visible with your name as actor and the tenant name as resource.

---

## Known Relationships
- The Audit Log records actions from all admin modules: Tenants, Billing, Feature Flags, Users, Support.
- Impersonation logged here corresponds to the **Impersonate** button in **Tenant Management**.
- Admin logins (`admin.login`) are recorded automatically on each successful login.
- The audit log is separate from the per-tenant audit log visible in the `@web` staff app at `/analytics/audit-log`.

## Checklist
- [ ] Audit log page loads at `/audit`
- [ ] Table shows four columns: Actor, Action, Resource, Time
- [ ] Action badges are colour-coded by action type
- [ ] No edit or delete controls exist on any row
- [ ] Search by actor name filters correctly
- [ ] Search by action type filters correctly
- [ ] Search by resource name filters correctly
- [ ] Empty search result shows "No matching log entries."
- [ ] Performing an admin action creates a new log entry immediately
- [ ] Impersonation action is logged with correct actor and tenant name
