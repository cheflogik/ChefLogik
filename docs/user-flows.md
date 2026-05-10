# ChefLogik — User Flows by Role

> This document describes the day-to-day task flows for every actor in the system,
> including which database tables are read and written at each step.
>
> **Notation used throughout:**
> - `R:` — table(s) read
> - `W:` — table(s) written / inserted / updated
> - `→ job` — action is handled asynchronously by a queued job
> - `→ event` — a Laravel Event is fired, picked up by one or more Listeners

---

## Actors at a Glance

| Actor | Guard | Tenant-scoped? | Typical device |
|---|---|---|---|
| Owner | `staff` | Yes — all branches | Desktop / tablet |
| Branch Manager | `staff` | Yes — assigned branches | Desktop / tablet |
| Events Manager | `staff` | Yes — assigned branches | Desktop |
| Head Chef | `staff` | Yes — assigned branches | Kitchen display / tablet |
| Chef de Partie | `staff` | Yes — assigned branches | Kitchen display |
| Waiter | `staff` | Yes — assigned branches | Tablet / handheld |
| Host | `staff` | Yes — assigned branches | Tablet at front desk |
| Kitchen Porter | `staff` | Yes — assigned branches | Kitchen display |
| Customer | `customer` | Yes — selected restaurant | Mobile / web |
| Platform Admin | `platform` | No — full platform access | Desktop |

---

## 1. Owner

**Permissions:** All permissions across all branches of their tenant.

The Owner configures the restaurant at setup, monitors overall business health, and handles anything requiring cross-branch authority.

---

### 1.1 Initial Setup (One-time)

```
Create tenant (via platform onboarding)
  R: subscription_plans
  W: tenants

  └── Set up branch(es)
        W: branches
        W: special_operating_hours (if closed dates / extended hours needed)

  └── Build master menu
        W: menu_categories (parent_id = NULL for top-level; self-FK for sub-categories)
        W: menu_items       (is_master = true; allergens + dietary_flags set here — owner only)
        W: modifier_groups
        W: modifiers
        W: item_modifier_groups (pivot: menu_item_id ↔ modifier_group_id)
        → job: SyncMenuToPlatformsJob (high queue) on publish
              W: audit_log (action: 'menu.published')

  └── Set up inventory
        W: suppliers
        W: inventory_items  (par_level, reorder_point, critical_threshold, wac = 0 initially)
        W: recipes          (status = 'draft'; branch_id = NULL for master recipe)
        W: recipe_ingredients

  └── Approve master recipes
        R: recipes, recipe_ingredients, inventory_items
        W: recipes (status: draft → pending_approval → approved; approved_by, approved_at)
        W: audit_log

  └── Configure roles
        R: roles (is_system = true, seeded), permissions
        W: roles         (custom roles if needed; is_system = false)
        W: role_permissions

  └── Onboard staff
        W: users         (status = 'active'; employment JSONB includes hourly_rate)
        W: user_roles    (role_id, branch_ids — NULL for owner = all branches)
        W: audit_log     (action: 'staff.onboarded')

  └── Configure event spaces and packages
        W: event_spaces
        W: event_packages

  └── Configure delivery zones
        W: delivery_zones
```

---

### 1.2 Daily Operations

```
Start of day — Owner dashboard
  R: analytics_daily_revenue      (yesterday's revenue across all branches)
  R: analytics_customer_segments  (high-value at risk: top 20% CLV + churn_risk_score)
  R: users (documents JSONB)      (document expiry alerts — expiry_date < now + 30 days)
  R: events                       (overdue pre-event tasks — pre_event tasks due < today)
  R: corporate_accounts           (pending credit limit override requests)

During service — escalations only
  R: orders                       (all branches, any status)
  W: orders (status transition)   (post-prep modification override: orders.modify_post_prep)
  W: order_status_history         (actor_id = owner, actor_type = 'staff')
  R: events                       (actual_spend vs minimum_spend alerts)
  R: corporate_accounts           (credit limit check for new event bookings)
  W: events (status, notes)       (authorise bookings exceeding credit limit)
  W: audit_log

End of period — period close
  R: stocktakes                   (confirm completed stocktake exists for each branch)
  R: inventory_items, stock_movements, waste_logs
  W: stocktakes (status → 'locked'; is_period_close = true)
  R: analytics_daily_revenue      (COGS finalisation)
  W: audit_log                    (action: 'period.closed')
  Note: Owner is the only actor who can reopen a closed period (logged with reason)
```

---

### 1.3 Menu & 86 Management

```
Create / edit menu item
  W: menu_items (allergens, dietary_flags — owner-only write via menu.edit_allergens)
  W: audit_log
  → job: SyncMenuToPlatformsJob (incremental sync on price change, image update)

Manually 86 an item
  W: eighty_six_log (trigger_type = 'manual', started_at = now, ended_at = NULL)
  → event: ItemEightySixed
        → Reverb broadcast: tenant.{tid}.branch.{bid}.orders (within 5s)
        → job: SyncEightySixToPlatformsJob (high queue, within 60s)
  W: audit_log

Restore a manually 86'd item
  W: eighty_six_log (ended_at = now, restored_by = user_id, restore_note)
  → event: ItemRestored → Reverb broadcast + platform sync job
  W: audit_log

Restore an inventory-linked 86 (FOOD SAFETY — manager must confirm)
  R: eighty_six_log (trigger_type = 'inventory_stockout' — must check this first)
  W: eighty_six_log (ended_at, restored_by, restore_note)
        Only allowed when manager_confirmed = true in request body
  W: audit_log
  Note: auto-restore modes (time-based, next-open) are BLOCKED for inventory_stockout trigger_type

Branch price / availability overrides
  W: menu_item_branch_overrides (price_override, is_available, description_override,
                                  photo_override, is_visible)
  Note: allergens and dietary_flags on menu_items are NOT overridable at branch level
```

---

### 1.4 Customer & Loyalty Administration

```
View full customer profile
  R: customer_profiles            (platform-level — no tenant_id)
  R: customer_tenant_profiles     (loyalty_points, tier, lifetime_spend, no_show_count)
  R: loyalty_transactions         (full history)
  R: analytics_customer_segments  (RFM score, CLV, churn_risk_score)

Merge duplicate profiles
  R: customer_profiles            (look up candidates by phone / email)
  W: customer_profiles            (secondary: status = 'anonymised')
  W: customer_tenant_profiles     (consolidate points, visits, spend into primary)
  W: loyalty_transactions         (re-link source_id to primary customer_id)
  W: reservations, orders         (re-link customer_profile_id to primary)
  W: audit_log                    (action: 'customer.merged'; reversible within 30 days)

Manually adjust loyalty points
  W: loyalty_transactions         (transaction_type = 'adjustment'; actor_id = owner)
  Note: NEVER directly update customer_tenant_profiles.loyalty_points
        The loyalty_transactions INSERT triggers balance recalculation

Process GDPR erasure request
  W: customer_profiles (status = 'deletion_pending')
  → After 14-day confirmation window:
        W: customer_profiles (phone = 'ANONYMISED-{uuid}', email = null,
                              first_name = 'Anonymised', last_name = 'Anonymised',
                              date_of_birth = null, allergen_notes = null,
                              status = 'anonymised')
        W: customer_tenant_profiles (loyalty_points = 0, status = 'anonymised')
        W: loyalty_campaigns (remove from target_segment)
  Note: loyalty_transactions and order references are RETAINED (financial records)
        but the profile is no longer linkable to a real person
  W: audit_log (action: 'customer.gdpr_erased')

Create loyalty campaign
  R: analytics_customer_segments  (target by RFM segment)
  R: customer_tenant_profiles     (target by tier: bronze / silver / gold)
  W: loyalty_campaigns            (status = 'draft' → 'scheduled' → 'sending' → 'sent')
  → job: SendCampaignJob (default queue) — SMS (Decision 8) or email (Decision 9)
```

---

## 2. Branch Manager

**Permissions:** All permissions scoped to their assigned branch(es).

---

### 2.1 Pre-Service Setup

```
Branch dashboard
  R: analytics_daily_revenue      (revenue vs target, food_cost %, labour_cost %)
  R: analytics_hourly_snapshots   (live metrics: waste today, covers today)
  R: users (documents JSONB)      (document expiry alerts for branch staff)
  R: inventory_items              (current_stock <= critical_threshold — low stock alerts)

Publish shift schedule
  R: users, roles                 (eligible staff for each shift slot)
  W: shifts (status: 'draft' → 'published')
  → event: SchedulePublished → notify assigned staff (push / email stub)
  W: audit_log

Configure floor plan for the day
  R: floor_plans, tables
  W: tables (status = 'blocked')  (block tables not in use: reservations.block_tables)
  W: floor_plans (layout_data)    (layout edits: reservations.edit_floor_plan)

Pause / activate delivery platforms
  W: delivery_zones (status = 'paused' / 'active')
  → job: PlatformStatusJob (critical queue) — calls Uber Eats + Wolt Store Status API
  W: audit_log
```

---

### 2.2 During Service

```
Order management
  R: orders, order_items, order_status_history
  W: orders (status transition — post-prep modification override)
  W: order_items                  (add/remove items post-prep if orders.modify_post_prep)
  W: order_status_history         (every transition logged)
  W: order_payments               (refund via RefundEngine)
  W: disputes                     (manage_disputes: platform dispute records)
  W: audit_log

Monitor attendance
  R: attendance_records           (clock_in_at, is_late, is_overtime)
  R: shifts                       (scheduled_start, scheduled_end for comparison)
  Note: is_late = clock_in_at > scheduled_start + grace_period_minutes
        is_overtime = clock_out_at > scheduled_end + overtime_threshold_minutes

Receive goods (GRN)
  R: purchase_orders, purchase_order_items (match delivery to PO)
  W: goods_received_notes (status = 'received' or 'discrepancy')
  W: grn_items (received_qty, unit_cost, temperature_celsius, temperature_status)
  → On GRN confirmation:
        W: inventory_items (current_stock += received_qty; wac recalculated)
              new_wac = (existing_stock × old_wac + received_qty × unit_cost)
                        / (existing_stock + received_qty)
        W: stock_movements (movement_type = 'grn'; wac_before, wac_after recorded)
        W: menu_items (cost_price updated for all items whose recipe uses this ingredient)
  W: audit_log

Approve branch-exclusive recipes
  R: recipes (branch_id = this branch, status = 'pending_approval')
  R: recipe_ingredients, inventory_items
  W: recipes (status: pending_approval → approved; approved_by, approved_at)
  W: audit_log
```

---

### 2.3 End of Service

```
Review waste log
  R: waste_logs (branch_id, logged_at for today)
  R: inventory_items (wac — to see cost impact)

Conduct stocktake
  W: stocktakes (status = 'in_progress'; conducted_by = user_id)
  W: stocktakes (status = 'completed'; variance_cost calculated)
  → On completion: stock adjustments applied
        W: stock_movements (movement_type = 'stocktake_correction')
        W: inventory_items (current_stock corrected)
  W: audit_log

Payroll review (read only at branch level)
  R: attendance_records           (actual hours per staff member for period)
  R: shifts                       (scheduled hours)
  R: users (employment JSONB)     (hourly_rate per staff member)
  → Export: GET /api/v1/staff/payroll/export → CSV generated from above
```

---

### 2.4 Staff Administration

```
Onboard staff member
  W: users (name, email, phone, status = 'active', employment JSONB with hourly_rate)
  W: user_roles (user_id, role_id, tenant_id, branch_ids = [this branch])
  W: audit_log (action: 'staff.onboarded')

Offboard staff member
  W: users (status = 'suspended')
  W: personal_access_tokens (deleted — all tokens for this user revoked)
  W: users (status = 'inactive')
  W: audit_log (action: 'staff.offboarded')

Create custom role
  R: permissions                  (full slug list from config/permissions.php)
  R: user_roles, role_permissions (escalation check: can only assign slugs they hold)
  W: roles (is_system = false, created_by = user_id)
  W: role_permissions
  → Cache invalidated: Redis key 'perms:{tenant_id}:{user_id}' deleted for all affected users
  W: audit_log
```

---

## 3. Events Manager

**Permissions:** `events.*`, `reservations.*`, `customers.view_basic`, `analytics.events_dashboard`

---

### 3.1 Enquiry Pipeline

```
Create enquiry
  R: customer_profiles            (look up organiser by phone/email)
  R: event_spaces                 (check capacity for guest_count)
  W: events (status = 'enquiry'; occasion_type, event_date, guest_count, space preferences)

Contact and qualify
  W: events (status: enquiry → contacted)
  R: special_operating_hours, branches (check availability on requested date)
  R: events (overlapping confirmed events in the same space)
  R: corporate_accounts           (check credit_limit vs outstanding invoices if corp client)

Send proposal
  R: event_packages               (select package: price_per_head, includes JSONB)
  W: events (package_id, custom_menu JSONB, minimum_spend, notes)
  W: events (status: contacted → proposal_sent)

Collect deposit and confirm
  W: order_payments               (stripe_payment_intent_id — blocked on Decision 7)
  W: events (status: proposal_sent → confirmed; deposit_amount, deposit_paid_at,
              stripe_payment_intent_id)
  → Auto-generated pre-event tasks created (based on occasion_type)
  W: audit_log

Mark enquiry as lost
  W: events (status = 'cancelled'; cancellation_reason JSONB with reason code)
  W: audit_log
```

---

### 3.2 Pre-Event Planning

```
Assign pre-event tasks
  R: events (confirmed, with task list in run_sheet JSONB)
  R: users, shifts                (check staff availability for task due dates)
  W: events (run_sheet JSONB updated with staff assignments and due dates)

Monitor overdue tasks
  R: events (pre_event tasks where due_date < now and not completed)
  → Reverb alert + push notification to manager if task overdue

Finalise run sheet
  R: events (all fields: timeline, menu, dietary requirements, staff assignments)
  R: customer_profiles            (guest allergen_notes, dietary_flags)
  W: events (run_sheet JSONB — finalised version)
  → Export: run_sheet → PDF (stored on S3 or returned directly)

Day-of transition
  W: events (status: pre_event → day_of)
  → Run sheet pushed to Host via push notification

Track actual spend vs minimum spend
  R: orders (branch_id + event date, customer linked to event — actual_spend)
  W: events (actual_spend updated in real time as orders are linked to the event)
  → If actual_spend < minimum_spend at bill close: manager alert fired

Complete event
  W: events (status: day_of → completed)
  W: loyalty_transactions (2× standard earn for event booking — IssueLoyaltyPointsJob)
  W: audit_log
```

---

### 3.3 Corporate Account Management

```
Create / edit corporate account
  W: corporate_accounts (company_name, billing_contact, credit_limit,
                          coordinator_user_id, status)

New booking for net-30 corporate account
  R: corporate_accounts (credit_limit, status)
  R: events (outstanding invoices for this corporate_account_id — sum deposit_amount
              where status NOT IN completed/cancelled)
  → If new booking would exceed credit_limit: escalate to Owner (requires authorisation)
  W: events (corporate_account_id linked to event)

Recurring event setup
  W: events (recurrence_rule JSONB, parent_event_id = NULL — this is the parent)
  → System auto-generates child event records per occurrence:
        W: events (parent_event_id = parent.id, individual date/time per occurrence)

Cancel individual child event
  W: events (child record status = 'cancelled') — does NOT affect sibling records

Cancel parent (recurring series)
  W: events (parent status = 'cancelled')
  W: events (all future children where status IN confirmed, pre_event → 'cancelled')
  W: audit_log
```

---

## 4. Head Chef

**Permissions:** `inventory.*`, `menu.view`, `menu.86_item`, `kds.*`, `analytics.kitchen_dashboard`

---

### 4.1 Kitchen Setup

```
Create / edit inventory items
  W: inventory_items (name, sku, unit, par_level, reorder_point, critical_threshold,
                       storage_location, allergen_flags)
  W: audit_log

Configure stock alert thresholds
  W: inventory_items (reorder_point, critical_threshold, par_level)
  Note: Partial index on (tenant_id, branch_id) WHERE current_stock <= critical_threshold
        powers the branch dashboard low-stock alert query

Create / edit recipes
  W: recipes (menu_item_id, branch_id, status = 'draft', prep_time_minutes, instructions)
  W: recipe_ingredients (inventory_item_id, quantity, unit, wastage_factor)
  Note: wastage_factor e.g. 1.05 = 5% prep waste factored into deduction quantity

Submit recipe for approval
  W: recipes (status: draft → pending_approval)
  → Owner approves master recipes; Branch Manager approves branch-exclusive recipes

Create purchase order
  R: suppliers, inventory_items
  W: purchase_orders (supplier_id, expected_delivery_date, status = 'draft' → 'sent')
  W: purchase_order_items (inventory_item_id, quantity_ordered, unit_cost)
  W: audit_log
```

---

### 4.2 During Service — KDS

```
Order confirmed → KDS ticket fires
  R: orders, order_items          (items organised by station)
  R: menu_items                   (allergens, dietary_flags for each item)
  → Reverb broadcast: tenant.{tid}.branch.{bid}.kds
  Note: tickets grouped by prep station (grill, fryer, cold, pass)

Acknowledge allergen alert (HARD GATE — kds.acknowledge_allergen)
  R: order_items, menu_items      (allergens + dietary_flags)
  W: audit_log                    (immutable: actor_id, order_item_id, acknowledged_at)
  SLA: 30 seconds from ticket arrival
  → If unacknowledged after 30s: escalation alert via Reverb to pass manager
  Note: item CANNOT be marked prepared until acknowledged — enforced in KDS logic

Mark items prepared
  W: order_status_history         (if all items for an order are prepared → order status: preparing → ready)
  → Reverb broadcast: tenant.{tid}.branch.{bid}.kds (ticket updated)
  → Reverb broadcast: tenant.{tid}.branch.{bid}.orders (order status updated)

Manual 86 during service
  W: eighty_six_log (trigger_type = 'manual', started_at = now, menu_item_id, branch_id)
  → event: ItemEightySixed
        → Reverb broadcast (QR/POS within 5s)
        → job: SyncEightySixToPlatformsJob (high queue, within 60s)
  W: audit_log
```

---

### 4.3 Stock and Receiving

```
Receive goods (GRN) — same as Branch Manager
  R: purchase_orders, purchase_order_items
  W: goods_received_notes, grn_items (received_qty, unit_cost, temperature_celsius, temperature_status)
  → On confirmation:
        W: inventory_items (current_stock, wac recalculated)
        W: stock_movements (movement_type = 'grn'; wac_before, wac_after)
        W: menu_items (cost_price updated for recipes using this ingredient)
  Note: temperature logs retained 7 years for environmental health inspection
        temperature_status = 'fail' should block the GRN or trigger manager alert

Log waste
  R: inventory_items              (current wac — snapshotted at log time)
  W: waste_logs (inventory_item_id, quantity, waste_type, cost_at_wac, logged_by)
  W: inventory_items (current_stock -= quantity)
  W: stock_movements (movement_type = 'waste'; reference_type = 'waste_log')

Conduct stocktake
  W: stocktakes (status = 'in_progress'; conducted_by, period_start, period_end)
  R: inventory_items (expected current_stock per item)
  W: stocktakes (status = 'completed'; variance_cost)
  W: stock_movements (movement_type = 'stocktake_correction' for each variance)
  W: inventory_items (current_stock corrected to actual count)
  W: audit_log

View kitchen analytics
  R: analytics_hourly_snapshots   (waste today, food_cost today — pre-aggregated)
  R: analytics_dish_performance   (dish popularity, engineering_quadrant)
  R: analytics_daily_revenue      (food_cost %, labour_cost % for branch)
```

---

## 5. Chef de Partie

**Permissions:** `inventory.view_stock`, `inventory.log_waste`, `inventory.receive_grn`, `menu.view`, `kds.*`

---

### 5.1 Start of Shift

```
Check stock levels
  R: inventory_items (current_stock, reorder_point for their station's ingredients)

View menu and 86 status
  R: menu_items, menu_item_branch_overrides
  R: eighty_six_log (WHERE ended_at IS NULL — active 86s for this branch)
  R: menu_items (allergens, dietary_flags — for service prep awareness)
```

---

### 5.2 During Service

```
KDS ticket flow (same flow as Head Chef — see section 4.2)
  R: orders, order_items, menu_items
  W: audit_log (allergen acknowledgements — immutable)
  W: order_status_history (on items marked prepared)

Log waste
  R: inventory_items (wac — snapshotted at log time)
  W: waste_logs
  W: inventory_items (current_stock -= quantity)
  W: stock_movements (movement_type = 'waste')

Receive goods (if delivery arrives at kitchen)
  W: goods_received_notes, grn_items
  → WAC recalculation triggered (same as Branch Manager / Head Chef flow)
```

---

## 6. Waiter

**Permissions:** `orders.view`, `orders.create`, `orders.modify`, `reservations.view`, `reservations.seat`, `customers.view_basic`

---

### 6.1 Taking an Order

```
View floor plan
  R: floor_plans, tables (status, capacity_min, capacity_max, position)
  R: eighty_six_log      (WHERE ended_at IS NULL — active 86s to know what's unavailable)
  → Real-time table state via Reverb: tenant.{tid}.branch.{bid}.tables

Seat guests at a table
  W: tables (status: free/reserved → occupied)
  → Reverb broadcast: tenant.{tid}.branch.{bid}.tables (state change within 3s)
  W: reservations (status: confirmed → seated) if walk-in matches a reservation

View customer at table (customers.view_basic)
  R: customer_profiles            (name, allergen_notes)
  R: customer_tenant_profiles     (loyalty_tier)
  Note: Waiter sees name, tier, allergen notes ONLY. Full profile requires customers.view_full.

Create order
  R: menu_items, menu_item_branch_overrides  (active items for this branch)
  R: modifier_groups, modifiers              (available modifiers per item)
  R: promo_codes                             (validate code: is_active, expires_at, max_uses, applicable_channels)
  W: orders  (source, branch_id, table_id, customer_profile_id, order_ref = 'ORD-YYYYMMDD-NNNN',
               subtotal, service_charge, discount_amount, total, status = 'new')
  W: order_items (item_name, item_sku, unit_price snapshotted from menu_items at order time;
                   modifiers snapshotted as JSONB — price is LOCKED at creation)
  W: order_status_history (from_status = NULL, to_status = 'new')
  W: audit_log
```

---

### 6.2 Confirming and Progressing an Order

```
Confirm order (new → confirmed)
  W: orders (status = 'confirmed')
  W: order_status_history
  → event: OrderConfirmed
        → job: DeductStockJob (critical queue)
              R: order_items, recipes (approved only), recipe_ingredients, inventory_items
              W: inventory_items (current_stock -= quantity × wastage_factor per ingredient)
              W: stock_movements (movement_type = 'sale_deduction'; reference_id = order_id)
              → If any ingredient reaches zero:
                    W: eighty_six_log (trigger_type = 'inventory_stockout')
                    → event: ItemEightySixed → Reverb broadcast + platform sync
        → event: NewOrderReceived → Reverb broadcast: tenant.{tid}.branch.{bid}.orders
  W: audit_log

Modify order before preparation (orders.modify)
  R: orders (status must be 'new' or 'confirmed')
  W: order_items (add / remove / change quantity)
  W: orders (subtotal, total recalculated)
  → event: OrderModified → Reverb broadcast
  W: audit_log
  Note: Modification after 'preparing' requires orders.modify_post_prep (Branch Manager / Owner)

Status transitions during service
  confirmed → preparing   R: orders   W: orders, order_status_history  (kitchen picks up)
  preparing → ready       R: orders   W: orders, order_status_history  (KDS marks prepared)
  ready → served          R: orders   W: orders, order_status_history  (waiter delivers)
  served → bill_settled   R: orders   W: orders, order_status_history, order_payments
  bill_settled → completed
        W: orders (status = 'completed', completed_at = now)
        W: order_status_history
        → job: IssueLoyaltyPointsJob (default queue)
              R: orders (total, customer_profile_id)
              R: customer_tenant_profiles (loyalty_tier for multiplier)
              R: customer_profiles (date_of_birth for birthday 2× check)
              W: loyalty_transactions (transaction_type = 'earn'; earn_rate_applied)
              Note: loyalty_points on customer_tenant_profiles is NEVER updated directly;
                    a trigger / job recalculates it from loyalty_transactions balance_after
        W: audit_log

Cancel order
  W: orders (status = 'cancelled'; cancellation_reason JSONB {code, note}; cancelled_at)
  W: order_status_history
  → Cancellation before 'preparing':
        W: stock_movements (movement_type = 'adjustment' — stock restored)
        W: inventory_items (current_stock += restored quantities)
  → Cancellation after 'preparing':
        Stock NOT restored (food already prepared)
  → RefundEngine (if payment was taken):
        R: order_payments (stripe_payment_intent_id)
        W: order_payments (refund_amount, stripe_refund_id)
        Note: all refunds via Stripe Refunds API — never ad-hoc
  W: audit_log
```

---

## 7. Host

**Permissions:** `reservations.view`, `reservations.create`, `reservations.cancel`, `reservations.seat`, `reservations.manage_waitlist`, `customers.view_basic`

---

### 7.1 Reservation Management

```
View floor plan and reservations
  R: floor_plans, tables          (position, status, capacity)
  R: reservations                 (reservation_date = today, status = 'confirmed')
  → Real-time via Reverb: tenant.{tid}.branch.{bid}.tables

Create reservation
  R: branches (operating_hours JSONB)
  R: special_operating_hours (date = requested date — overrides branch hours if exists)
        If is_closed = true: return no availability for that date
  R: tables (capacity_min ≤ party_size ≤ capacity_max, status != 'blocked')
  R: reservations (overlapping reservations for candidate tables in the time slot)
  R: customer_profiles (look up by phone/email — link to existing profile)
  W: reservations (table_id, customer_profile_id, party_size, reservation_date,
                    reservation_time, duration_minutes, status = 'confirmed')
  W: customer_tenant_profiles (first_visit_at if new to this restaurant)
  → job: ReservationReminder24hJob (scheduled for T-24h)
  → job: ReservationReminder2hJob  (scheduled for T-2h)
        Both send SMS via Twilio (blocked on Decision 8) — stub queued
  W: audit_log

Cancel reservation
  W: reservations (status = 'cancelled'; cancelled_at, cancellation_reason)
  W: tables (status reverted if table was held for this reservation)
  → Reverb broadcast: tenant.{tid}.branch.{bid}.tables
  W: audit_log
```

---

### 7.2 Walk-in Flow

```
Guest arrives — profile matching (500ms SLA)
  1. Normalise phone to E.164
  2. R: customer_profiles WHERE phone = normalised_phone
        Match found:
          R: customer_tenant_profiles (loyalty_tier, no_show_count)
          R: customer_profiles        (allergen_notes — display to host for safety)
          Display: name, tier, allergen notes, no_show_count
        No match:
          W: customer_profiles        (phone, name — new platform-level profile)
          W: customer_tenant_profiles (loyalty enrolment record; acquisition_channel = 'walk_in')
        Multiple matches:
          Return all candidates → host selects
          W: audit_log (flag for merge review)

Seat walk-in
  W: tables (status: free → occupied)
  → Reverb broadcast: tenant.{tid}.branch.{bid}.tables (within 3s)
  W: customer_tenant_profiles (last_visit_at, lifetime_visits += 1)
```

---

### 7.3 Waitlist Management

```
Add to waitlist
  R: customer_profiles            (look up by phone — same matching logic as walk-in)
  W: waitlist_entries (party_size, guest_name, guest_phone, joined_at,
                        estimated_wait_minutes, status = 'waiting',
                        customer_profile_id if matched)

Seat from waitlist
  R: tables                       (find available table matching party_size)
  W: waitlist_entries (status = 'waiting' → 'seated'; seated_at, table_id)
  W: tables (status: free → occupied)
  → Reverb broadcast: tenant.{tid}.branch.{bid}.tables
  → SMS notification to customer (stub — Decision 8)

Handle no-show
  W: reservations (status = 'confirmed' → 'no_show')
  W: customer_tenant_profiles (no_show_count += 1)
  W: tables (status: reserved → free)
  → Reverb broadcast: tenant.{tid}.branch.{bid}.tables
  Note: if no_show_count >= threshold (default 2):
        future reservations flagged for deposit requirement
        Gold/Silver members get first no-show forgiveness (configurable)
  W: audit_log
```

---

## 8. Kitchen Porter

**Permissions:** `inventory.log_waste`, `inventory.receive_grn`, `kds.view`, `kds.mark_prepared`

---

### 8.1 Receiving Deliveries

```
Receive delivery
  R: purchase_orders              (match to outstanding PO if provided)
  W: goods_received_notes (status = 'received' or 'discrepancy')
  W: grn_items (received_qty, unit_cost, temperature_celsius, temperature_status)
  → On confirmation (if authorised to confirm — else Head Chef confirms):
        W: inventory_items (current_stock updated; WAC recalculated)
        W: stock_movements (movement_type = 'grn')
  Note: temperature_status must be recorded. 'fail' items should be flagged immediately.
        All GRN temperature records retained 7 years.
```

---

### 8.2 Waste Logging

```
Log waste
  R: inventory_items (wac — snapshotted at log time into cost_at_wac)
  W: waste_logs (inventory_item_id, quantity, waste_type, cost_at_wac, logged_by, logged_at)
  W: inventory_items (current_stock -= quantity)
  W: stock_movements (movement_type = 'waste'; reference_type = 'waste_log')
  Note: 6 waste types: spoilage | prep | service | overproduction | unaccounted | staff_meal
```

---

### 8.3 KDS Support

```
View KDS
  R: orders (status = 'confirmed' or 'preparing')
  R: order_items, menu_items
  → Real-time via Reverb: tenant.{tid}.branch.{bid}.kds

Mark items prepared
  W: order_status_history (if all items for order prepared → order: preparing → ready)
  → Reverb broadcast on channel: tenant.{tid}.branch.{bid}.kds + .orders
  Note: Kitchen Porter CANNOT acknowledge allergen alerts.
        kds.acknowledge_allergen is required for that action (Head Chef, Chef de Partie).
        Any ticket with unacknowledged allergens is BLOCKED for mark_prepared.
```

---

## 9. Customer

**Guard:** `customer` | **Tenant-scoped:** Yes (after restaurant selection)

---

### 9.1 Registration and Login

```
Register
  R: customer_profiles WHERE phone = submitted_phone  (deduplication check)
  W: customer_profiles (phone, email, first_name, last_name, date_of_birth JSONB,
                         password, status = 'active')
  Note: NO tenant_id on customer_profiles — this is a platform-level record

Login
  R: customer_profiles (email + password check)
  W: personal_access_tokens (user_type = 'customer', tenant_id = NULL initially)
        → Platform-scoped token returned

Select restaurant
  R: customer_tenant_profiles WHERE customer_id = this customer
  → Returns list of tenants where the customer has visited
  W: personal_access_tokens (tenant_id set to selected tenant)
        → Tenant-scoped token returned

First-time enrolment at a restaurant
  → Triggered when staff enrolls customer at the counter
  W: customer_tenant_profiles (customer_id, tenant_id, loyalty_number = 'LYL-NNNNN',
                                 loyalty_tier = 'bronze', loyalty_points = 0,
                                 acquisition_channel = 'loyalty_enrolment' / 'walk_in')
```

---

### 9.2 Loyalty Portal

```
View loyalty profile
  R: customer_profiles            (name, dietary_flags, allergen_notes, communication_prefs)
  R: customer_tenant_profiles     (loyalty_points, loyalty_tier, lifetime_spend, lifetime_visits,
                                    last_visit_at, no_show_count)
  R: loyalty_transactions         (recent earn/redeem history; check points expiry warning)
  R: analytics_customer_segments  (rfm_segment, churn_risk_score — if customer portal shows this)

Earn points (automatic — no customer action)
  → Triggered by IssueLoyaltyPointsJob on order completed:
        Base earn: 1 point per $1 of order total
        Multipliers applied in order:
          × 2.0  if source_type = 'event_booking'
          × 2.0  if current month matches customer_profiles.date_of_birth { day, month }
          × 1.50 if loyalty_tier = 'gold'
          × 1.25 if loyalty_tier = 'silver'
        W: loyalty_transactions (transaction_type = 'earn', earn_rate_applied, balance_after)

Redeem points at checkout
  R: customer_tenant_profiles (loyalty_points balance)
  Note: 100 points = $1 discount; minimum 100 points; maximum = bill value in points
        Not redeemable on: delivery orders, service charges, event deposits
        Partial redemption allowed in multiples of 100
  W: loyalty_transactions (transaction_type = 'redeem'; points_delta = negative)
  W: orders (discount_amount += redeemed_value; discount_ref = loyalty_transaction_id)

Tier progression (automatic — weekly batch job, Monday 03:00)
  R: customer_tenant_profiles (lifetime_spend, lifetime_visits for trailing 12 months)
  R: loyalty_transactions (to calculate trailing 12-month spend)
  W: customer_tenant_profiles (loyalty_tier updated if threshold crossed)
  Note: Bronze → Silver: $500 trailing 12-month spend OR 6 visits
        Silver → Gold:   $1,500 trailing 12-month spend OR 15 visits
        Downgrade: 30-day warning email (Decision 9) before tier drops

Points expiry (automated job)
  R: loyalty_transactions (last earn/redeem date per customer)
  → If no activity for 12 months: send expiry warning
  → If no activity for 18 months:
        W: loyalty_transactions (transaction_type = 'expire'; points_delta = -balance)
        W: customer_tenant_profiles (loyalty_points = 0)

GDPR self-service erasure
  R: customer_profiles (status check)
  W: customer_profiles (status = 'deletion_pending')
  → 14-day confirmation window → Owner / system processes anonymisation
  (see Owner flow 1.4 for full erasure write sequence)
```

---

## 10. Platform Admin

**Guard:** `platform` | **Tenant-scoped:** No — bypasses all tenant scoping via `withoutGlobalScope(TenantScope::class)`.

---

### 10.1 Tenant Management

```
Onboard new tenant (POST /api/platform/tenants)
  R: subscription_plans           (select plan: starter / growth / enterprise)
  W: tenants (name, slug, plan_id, status = 'active')
  W: roles × 8                   (system roles provisioned for the new tenant: owner, branch_manager, ...)
  W: role_permissions             (each role gets its canonical permission set from config/permissions.php)
  W: users (owner_name, owner_email, tenant_id, temp_hashed_password, status = 'active')
  W: user_roles (role_id = owner_role.id, branch_ids = null = all branches)
  DISPATCH: SendOwnerWelcomeEmailJob (encrypted payload; sends email with temp_password via MAIL_MAILER)
  W: audit_log (actor_type = 'platform_admin', action = 'tenant.provisioned', tenant_id = new tenant)
  → Response includes temp_password (shown once — owner must change on first login)

List all tenants
  R: tenants (withoutGlobalScope — all rows returned, no tenant_id filter)
  R: subscription_plans           (join for plan name / features)

Create additional business owner (POST /api/v1/staff/owners — requires owners.manage permission)
  Guard: staff | TenantScope active — scoped to authenticated owner's tenant
  R: roles (slug = 'owner', tenant_id = resolved_tenant_id)
  W: users (name, email, tenant_id auto-set via HasTenantScope, temp_hashed_password, status = 'active')
  W: user_roles (role_id = owner_role.id, branch_ids = null, assigned_by = actor.id)
  DISPATCH: SendOwnerWelcomeEmailJob
  W: audit_log (actor_type = 'staff', actor_role = 'owner', action = 'owner.created', resource_type = 'user')
  Note: email uniqueness scoped to tenant only — two tenants may share the same owner email

Suspend tenant
  W: tenants (status = 'suspended')
  W: personal_access_tokens       (DELETE all tokens WHERE tenant_id = this tenant)
        → All staff + customer sessions terminated immediately
  W: audit_log

Update subscription plan
  W: tenants (plan_id)
  Note: plan features (max_branches, features JSONB) applied on next API request
        via tenant.subscription_plan.features check
  W: audit_log
```

---

### 10.2 Platform Monitoring

```
View platform metrics
  Note: Platform Admin does NOT have access to per-tenant operational tables.
        Monitoring is done via infrastructure tooling:

  Queue health:
    → RabbitMQ management UI (queues: critical, high, default, analytics, low)

  Application errors:
    → AWS CloudWatch log groups:
        /cheflogik/api     (API errors, slow queries)
        /cheflogik/worker  (job failures, retry counts)
        /cheflogik/reverb  (WebSocket disconnects)

  Audit trail:
    R: audit_log (withoutGlobalScope — cross-tenant; filtered by tenant_id or actor_id)
        Retained 7 years. Write-only: no UPDATE or DELETE on audit_log ever.
```

---

## Cross-Role: Order Lifecycle Summary

| Stage | Actor | Tables Read | Tables Written |
|---|---|---|---|
| `new` | Waiter | `menu_items`, `modifier_groups`, `promo_codes` | `orders`, `order_items`, `order_status_history` |
| `new → confirmed` | Waiter | `orders` | `orders`, `order_status_history` → `DeductStockJob`: `inventory_items`, `stock_movements` |
| `confirmed → preparing` | Chef | `orders`, `order_items`, `menu_items` | `order_status_history` (KDS picks up) |
| `preparing → ready` | Chef | — | `order_status_history`, Reverb broadcast |
| `ready → served` | Waiter | `orders` | `orders`, `order_status_history` |
| `served → bill_settled` | Waiter | `orders` | `orders`, `order_status_history`, `order_payments` |
| `bill_settled → completed` | Waiter | `orders` | `orders` → `IssueLoyaltyPointsJob`: `loyalty_transactions` |
| `* → cancelled` | Waiter / BM / Owner | `orders`, `order_payments` | `orders`, `order_status_history`, `stock_movements` (if before prep), `order_payments` (refund) |

---

## Cross-Role: Table State Lifecycle

| State | Transitions to | Actor | Tables Written |
|---|---|---|---|
| `free` | `reserved` | Host | `reservations`, `tables` |
| `free` | `occupied` | Host / Waiter | `tables`, `customer_tenant_profiles` |
| `reserved` | `occupied` | Host / Waiter | `tables`, `reservations` (status → seated) |
| `reserved` | `free` | Host | `tables`, `reservations` (status → cancelled) |
| `occupied` | `needs_cleaning` | Waiter | `tables` |
| `needs_cleaning` | `free` | Porter / Waiter | `tables` |
| `free` | `blocked` | Branch Manager | `tables` |
| `blocked` | `free` | Branch Manager | `tables` |

All state changes: Reverb broadcast → `tenant.{tid}.branch.{bid}.tables` within 3s.

---

## Cross-Role: Inventory-Linked 86 Flow

```
DeductStockJob fires on order confirmed
  R: order_items, recipes (status = 'approved'), recipe_ingredients
  W: inventory_items (current_stock -= quantity × wastage_factor)
  W: stock_movements (movement_type = 'sale_deduction')

  If any inventory_item.current_stock reaches 0:
    W: eighty_six_log (trigger_type = 'inventory_stockout'; trigger_ref = inventory_item_id;
                         started_at = now; ended_at = NULL)
    → event: ItemEightySixed
          → Reverb broadcast (QR/POS within 5s): tenant.{tid}.branch.{bid}.orders
          → job: SyncEightySixToPlatformsJob (high queue, within 60s)
    W: audit_log

Head Chef confirms ingredient restocked
  (physical stock received and GRN confirmed)
  W: goods_received_notes, grn_items, inventory_items, stock_movements (as per GRN flow)

Branch Manager or Owner restores the 86
  R: eighty_six_log (trigger_type check — must be 'inventory_stockout')
  POST /api/v1/menu/items/{id}/restore/{log}  with body: { manager_confirmed: true }
  W: eighty_six_log (ended_at, restored_by, restore_note)
  → event: ItemRestored → Reverb broadcast + SyncRestoreToPlatformsJob
  W: audit_log

  BLOCKED: auto-restore modes (time-based, next-open) do NOT apply to inventory_stockout
           trigger_type check is enforced in EightySixService::restore()
```

---

## Cross-Role: Recipe Approval Flow

```
Head Chef
  W: recipes (status = 'draft')
  W: recipe_ingredients
  W: recipes (status: draft → pending_approval)

Owner (master menu recipes — branch_id = NULL)
  R: recipes (pending_approval, branch_id IS NULL)
  R: recipe_ingredients, inventory_items (review ingredient mappings)
  W: recipes (status: pending_approval → approved; approved_by, approved_at)
  W: audit_log

Branch Manager (branch-exclusive recipes — branch_id = this branch)
  R: recipes (pending_approval, branch_id = manager's branch)
  W: recipes (status: pending_approval → approved; approved_by, approved_at)
  W: audit_log

Effect of approval
  → From 'approved' status: DeductStockJob deducts stock for orders of this item
  → Orders for items with only 'draft' recipes:
        KDS ticket fires, but NO stock deduction
        W: audit_log (manager alert: recipe not approved)
```

---

## WAC Recalculation (triggered by any GRN confirmation)

```
For each grn_items row confirmed:
  R: inventory_items (current_stock as existing_stock, wac as old_wac)
  R: grn_items (received_qty, unit_cost)

  new_wac = (existing_stock × old_wac + received_qty × unit_cost)
            / (existing_stock + received_qty)

  W: inventory_items (current_stock += received_qty; wac = new_wac)
  W: stock_movements (wac_before = old_wac; wac_after = new_wac; movement_type = 'grn')

  For every recipe using this inventory_item:
    R: recipe_ingredients (quantity per portion), recipes (menu_item_id)
    W: menu_items (cost_price recalculated from all ingredient WACs × portion quantities)
```

---

## Permission Cache Lifecycle

```
On login
  R: user_roles (user_id, role_id, branch_ids)
  R: role_permissions, permissions
  → Redis WRITE: key 'perms:{tenant_id}:{user_id}' = [slug array]; TTL = 5 minutes
  W: personal_access_tokens (abilities encoded with permission list)

On every API request
  → Redis READ: 'perms:{tenant_id}:{user_id}'
  → Gate::before() checks slug against cached array
  → Cache miss: rebuilt from role_permissions + permissions tables

On role change / custom role edit
  W: user_roles or role_permissions
  → Redis DELETE: 'perms:{tenant_id}:{user_id}' for all affected users
        (next request rebuilds from DB — 0 delay in permission change taking effect)
  W: audit_log
```
