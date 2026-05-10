# Module: Branch & Staff Management
Full requirements: 75 numbered requirements (BM-01 through NF-14).

## Branch Configuration
branches table: operating_hours (JSONB), settings (JSONB), timezone, currency
special_operating_hours: per-date overrides (closures, extended hours, private hire)
Branch settings: seat count, revenue targets, food cost target, waste threshold, commission rates per delivery platform

## Dynamic Roles System
See docs/05-auth-roles.md for full permission system specification.

Roles are per-tenant. System roles (is_system=true) are seeded and read-only.
Custom roles: Owner and Branch Manager can create (requires staff.manage_roles permission).
Custom roles: select from the predefined permission slug list in config/permissions.php.
Cannot delete a role with active user assignments.
Role change: permission cache invalidated immediately (Redis key deleted).

## Staff Lifecycle
Onboarding: create user record, assign role, assign branch_ids, upload documents
Documents: driving licence, food hygiene certificate, right-to-work
Document expiry: alert 30 days before expiry (analytics.branch_dashboard shows this)
Offboarding: status='suspended' → revoke all Sanctum tokens → status='inactive'

## Scheduling
Shifts: branch, date, start_time, end_time, role, assigned_user_id
Weekly schedule published by Branch Manager. Staff notified on publish.
Open shifts: visible to eligible staff (same role) who can claim them.
Scheduling conflicts: if staff member assigned to overlapping shifts → validation error.

## Attendance & Time Tracking
Clock-in/out: staff action at start/end of shift
Grace period: configurable (default 5 minutes). Late arrival flagged if beyond grace period.
Overtime: actual_end > scheduled_end by configurable threshold → flagged
Discrepancy alerts: clock-in without a scheduled shift, no clock-in for scheduled shift

## Payroll Export
Labour cost calculated as: (hours_worked × hourly_rate) per staff member per period.
Hourly rate stored in users.employment JSONB.
Export as CSV: staff_id, name, role, branch, scheduled_hours, actual_hours, overtime_hours, hourly_rate, gross_pay
Used by Analytics module for labour_cost % calculations.

## Leave Management
`leave_requests` table: tenant_id, user_id, branch_id, leave_type, start_date, end_date, reason, status, reviewed_by, reviewed_at, notes

Leave types: `annual` | `sick` | `unpaid` | `other`
Status machine: `pending` → `approved` | `rejected`; `pending` or `approved` → `cancelled` (owner only)

Permission: `staff.manage_leave` — required for approve/reject. Staff submit their own requests (no permission check on apply).

### API Endpoints
```
GET    /api/v1/staff/leave           ← list (managers see all; staff filtered by own user_id)
POST   /api/v1/staff/leave           ← apply (status: pending; user_id set from auth token)
PATCH  /api/v1/staff/leave/{id}/approve ← approve (requires staff.manage_leave)
PATCH  /api/v1/staff/leave/{id}/reject  ← reject  (requires staff.manage_leave)
DELETE /api/v1/staff/leave/{id}         ← cancel (own request only; pending or approved)
```

### LeaveService Behaviour
- `apply()` — sets `user_id` from the authenticated actor; status always starts as `pending`
- `approve()` / `reject()` — validates current status is `pending`; throws `ValidationException` otherwise; records `reviewed_by` + `reviewed_at`
- `cancel()` — validates caller is the owner of the request; validates status is `pending` or `approved`
- In-app notification dispatched on approve/reject: type `staff.leave_approved` or `staff.leave_rejected`
