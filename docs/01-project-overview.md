# Project Overview

## What This System Is

A multi-tenant SaaS restaurant management platform. Restaurant businesses subscribe and manage their entire operation through one system: live orders across all channels, table reservations and floor plans, events and private dining, inventory and kitchen operations, staff scheduling, customer loyalty, and business analytics.

The platform serves two distinct user types:
- **Staff / managers** — internal operational users who run the restaurant day-to-day
- **Customers** — restaurant guests who access loyalty accounts, booking history, and the customer portal

And one platform-level user type:
- **Platform admins** — the SaaS operator (us), managing tenants, subscriptions, and platform health

---

## Tenant Model

A **tenant** is a restaurant business — a company that has subscribed to the platform. A tenant may own one or more branches (physical locations). All data belonging to a tenant is completely isolated from all other tenants.

```
Platform (SaaS operator)
  └── Tenant A: "Bella Italia Group"
        ├── Branch 1: "Bella Italia Soho"
        └── Branch 2: "Bella Italia Canary Wharf"
  └── Tenant B: "Stack Burger Co."
        └── Branch 1: "Stack Burger Oxford Street"
```

**Tenant isolation is absolute.** A user at Tenant A can never see, query, or infer any data belonging to Tenant B. This is enforced at the API level (JWT scoping), at the application level (Global Scope on every model), and validated in every test suite.

---

## The Eight Modules

| Module | Core purpose |
|---|---|
| Branch & Staff Management | Branch configuration, staff profiles, dynamic roles & permissions, scheduling, attendance |
| Menu Management | Master menu, branch overrides, allergen safety, 86 management, platform sync |
| Orders & Deliveries | All 7 order channels, 9-stage lifecycle, payments (Stripe), cancellations, refund engine |
| Table & Reservation | Floor plans, 5 table states, bookings, walk-in matching, waitlist, special hours |
| Events & Functions | 5-phase event lifecycle, enquiry pipeline, packages, corporate accounts, billing |
| Inventory & Kitchen | Stock management, WAC costing, KDS, waste logging, stocktake, supplier management |
| Customer Profiles & Loyalty | Profile deduplication, 3-tier loyalty, points earn/redeem, GDPR, campaigns |
| Analytics & Reporting | Pre-aggregated dashboards, RFM segmentation, CLV, churn risk, exports, scheduled reports |

---

## Key Design Decisions (Non-Negotiable)

These decisions were made during requirements design and must not be reversed without explicit discussion:

### 1. Stock deductions happen on order confirmation, not dish completion
When an order moves to `confirmed` status, ingredient quantities are immediately deducted from stock via a queued job. This gives the earliest possible signal for low-stock alerts and auto-86 triggers. Reversing this would break the inventory → menu 86 chain.

### 2. WAC (Weighted Average Cost) is the only cost method
All ingredient cost calculations use the Weighted Average Cost method. WAC is recalculated on every GRN (goods received note) confirmation. The Analytics module, Events billing, and Inventory module all reference WAC — it is calculated in Inventory and consumed everywhere else.

### 3. Inventory-linked 86 events never auto-restore
When an ingredient hits zero stock, the linked menu items are automatically 86'd. These items can ONLY be restored by a manager manually confirming that the ingredient is available and quality-checked. The auto-restore modes (time-based, next-open) in the Menu module do NOT apply to inventory-linked 86 events. This is a food safety rule.

### 4. The centralised refund engine handles all cancellation scenarios
All three cancellation triggers (customer-initiated, restaurant-initiated, delivery failure) feed one refund engine. The engine calculates amount, selects method (Stripe API, wallet credit, voucher, cash), processes, and notifies. No ad-hoc refund logic in controllers.

### 5. Stripe is the exclusive payment processor
No raw card data enters the system. Stripe Terminal for in-person, Stripe Payments (PaymentIntents) for online/QR, Stripe Refunds API for all refunds, Stripe Webhooks as the source of truth for payment status. PCI DSS SAQ A or SAQ A-EP compliance.

### 6. The analytics module is read-only
Analytics never writes to source module tables. All analytics are computed from pre-aggregated data in a separate analytics data store (read replica or dedicated analytics tables). Analytics queries never run against the live transaction database.

### 7. The audit log is write-only and immutable
All audit entries are INSERT-only. No UPDATE or DELETE on `audit_log` records, ever. The audit log is the forensic record — its integrity is non-negotiable.

### 8. Dynamic roles, not hardcoded
Roles and their permissions live in the database, not in code constants. The 8 system roles are seeded as immutable defaults. Tenants (Owner and Branch Manager) can create additional custom roles by selecting from the predefined permission slug list. Permission slugs are the only thing that lives in code.

### 9. 86 propagation timing: two different SLAs
- Local channels (QR menu, POS, online ordering): 86 must propagate within **5 seconds**
- Delivery platforms (Uber Eats, Wolt): 86 must propagate within **60 seconds** (platform API dependent)

These are different SLAs implemented differently (WebSocket broadcast vs queued platform API call).

### 10. The cover definition is owned by Analytics
- Dine-in: cover = individual guest (party size)
- Delivery order: cover = 1 per order
- Event: cover = confirmed guest count

If any other module's cover counting conflicts with this, Analytics takes precedence.

---

## What Is Out of Scope (MVP)

- Native mobile apps (staff use the React web app on tablets)
- Accounting system integration (Xero, QuickBooks) — future phase
- Franchise-level multi-tenant hierarchy (tenant owning other tenants)
- Database-per-tenant isolation — MVP uses single-db with tenant_id scoping
- AI-powered menu recommendations or demand forecasting
- Own-fleet delivery GPS tracking — delivery management is manual assignment
