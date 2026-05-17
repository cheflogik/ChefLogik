# ChefLogik — QA Testing Guides

Comprehensive step-by-step testing documentation for the ChefLogik restaurant management platform. Written for manual QA testers with zero prior knowledge of the system.

## How to Use These Guides

1. **Start with Authentication** — you must be logged in before testing any other module.
2. **Read the Prerequisites** section of each guide before beginning — it tells you what must exist first.
3. **Note which app to use** — `@web` is the staff app on port 5500; `@admin` is the platform admin app on port 5600.
4. **Run the dev servers** before testing:
   - Staff app: `cd /web && npm run dev` → `http://localhost:5500`
   - Admin app: `cd /admin && npm run dev` → `http://localhost:5600`
   - Landing app: `cd /landing && npm run dev` → `http://localhost:5700`
   - API: `cd /api && php artisan serve` → `http://localhost:8000`

---

## Staff App (`@web`) — Modules

| # | Module | Description | File |
|---|--------|-------------|------|
| 01 | [Authentication](01-authentication.md) | Two-step OTP login, forgot password, new account onboarding | `01-authentication.md` |
| 02 | [Dashboard](02-dashboard.md) | Real-time operational overview: stats, live orders feed, alerts, quick actions | `02-dashboard.md` |
| 03 | [Live Orders](03-orders.md) | Kanban board of active orders across 7 channels, status transitions, cancel, new order | `03-orders.md` |
| 04 | [Kitchen Display (KDS)](04-kds.md) | Real-time kitchen tickets, allergen acknowledgement, bump to ready | `04-kds.md` |
| 05 | [Tables & Reservations](05-reservations.md) | Reservation list/create/manage, floor plan, waitlist | `05-reservations.md` |
| 06 | [Events & Functions](06-events.md) | Pipeline from enquiry to billing, packages, spaces, corporate accounts | `06-events.md` |
| 07 | [Menu Management](07-menu.md) | Categories, items, 86 management, branch overrides, modifier groups | `07-menu.md` |
| 08 | [Inventory](08-inventory.md) | Stock items, adjustments, transfers, GRNs, purchase orders, suppliers, recipes, stocktakes, waste logs | `08-inventory.md` |
| 09 | [Staff Management](09-staff.md) | Staff list, profiles, shifts, attendance, leave, payroll export | `09-staff.md` |
| 10 | [Customers & Loyalty](10-customers.md) | Customer profiles, loyalty tier & points, enrolment | `10-customers.md` |
| 11 | [Analytics & Reports](11-analytics.md) | Owner, branch, revenue, customers, dishes, events, kitchen dashboards + audit log | `11-analytics.md` |
| 12 | [Branches](12-branches.md) | Create and manage branch locations, operating hours | `12-branches.md` |
| 13 | [Roles](13-roles.md) | Dynamic permission-based role builder, custom roles, system roles | `13-roles.md` |
| 14 | [Settings](14-settings.md) | Tenant settings, branch settings, integration IDs, delegates | `14-settings.md` |
| 15 | [Landing Page CMS](15-landing-cms.md) | Template selection, content blocks, gallery, featured items, SEO, social feeds, reviews | `15-landing-cms.md` |
| 16 | [Messages](16-messages.md) | Internal real-time staff chat | `16-messages.md` |
| 17 | [Customer Portal](17-customer-portal.md) | Customer self-service: loyalty, reservations, bookings, profile, GDPR | `17-customer-portal.md` |

---

## Platform Admin App (`@admin`) — Modules

| # | Module | Description | File |
|---|--------|-------------|------|
| 18 | [Admin Authentication](18-admin-authentication.md) | Platform admin login, sidebar navigation | `18-admin-authentication.md` |
| 19 | [Admin Dashboard](19-admin-dashboard.md) | Platform KPIs: MRR, tenant count, churn rate, plan distribution | `19-admin-dashboard.md` |
| 20 | [Tenant Management](20-admin-tenants.md) | View/create/suspend/cancel tenants, impersonation | `20-admin-tenants.md` |
| 21 | [Billing & Plans](21-admin-billing.md) | Subscription plan definitions, revenue breakdown | `21-admin-billing.md` |
| 22 | [System Health](22-admin-system-health.md) | Real-time status monitoring of all platform services | `22-admin-system-health.md` |
| 23 | [Feature Flags](23-admin-feature-flags.md) | Toggle platform-wide features and configuration values | `23-admin-feature-flags.md` |
| 24 | [Platform Analytics](24-admin-platform-analytics.md) | Aggregated cross-tenant metrics: tenants, orders, revenue, growth | `24-admin-platform-analytics.md` |
| 25 | [Users & Roles](25-admin-users-roles.md) | Platform admin team accounts and role definitions | `25-admin-users-roles.md` |
| 26 | [Audit Logs](26-admin-audit-logs.md) | Immutable log of all platform admin actions | `26-admin-audit-logs.md` |
| 27 | [Support Tickets](27-admin-support.md) | Manage tenant support requests with priority, status, and assignee | `27-admin-support.md` |

---

## Suggested Testing Order

For a complete first-pass QA cycle, follow this order (each step depends on the previous):

1. **Admin app first** — Create a test tenant via `20-admin-tenants.md`
2. **Staff app login** — Use the credentials from step 1 (`01-authentication.md`)
3. **Settings** — Configure branch and timezone (`14-settings.md`)
4. **Branches** — Confirm branch is correctly set up (`12-branches.md`)
5. **Roles** — Create a test role with specific permissions (`13-roles.md`)
6. **Staff** — Add staff members with the new role (`09-staff.md`)
7. **Menu** — Add categories and items (`07-menu.md`)
8. **Inventory** — Add stock items and link to menu via recipes (`08-inventory.md`)
9. **Orders** — Create orders, advance through stages, test KDS (`03-orders.md`, `04-kds.md`)
10. **Reservations** — Create reservations, test floor plan (`05-reservations.md`)
11. **Customers** — Enrol customers, check loyalty points (`10-customers.md`)
12. **Events** — Create an event enquiry through the pipeline (`06-events.md`)
13. **Analytics** — Verify data appears correctly in all dashboards (`11-analytics.md`)
14. **Landing CMS** — Configure and preview the landing page (`15-landing-cms.md`)
15. **Customer Portal** — Log in as a customer and verify portal data (`17-customer-portal.md`)
16. **Messages** — Test staff internal chat (`16-messages.md`)
17. **Admin modules** — Verify audit logs, system health, and support tickets (`22–27`)

---

## Key Facts for Testers

- **Tenant isolation is critical**: Data from one restaurant must never be visible to another. Always verify cross-tenant data leakage does not occur.
- **86 management**: When an item is 86'd due to inventory stockout, restoring it requires manager confirmation. This is a food safety rule and must not be bypassed.
- **Allergen acknowledgement**: KDS allergen notices must be acknowledged within 30 seconds. Failure to do so triggers an alert.
- **Audit log is immutable**: No test should be able to edit or delete audit log entries in either `@web` or `@admin`.
- **Permission cache**: After a role permission change, up to 5 minutes may pass before the change takes effect (or the user can re-login immediately).
- **Two-step login**: All staff logins require email + OTP. There is no way to bypass the OTP in production.
