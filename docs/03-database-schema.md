# Database Schema

All tables include `tenant_id UUID NOT NULL` with a FK to `tenants` unless explicitly noted as platform-level (no tenant_id). Every tenant-scoped table has a composite index on `(tenant_id, id)` and branch-scoped tables add `(tenant_id, branch_id)`.

**ID strategy:** Low-write tables use `gen_random_uuid()`. High-write tables (`orders`, `order_items`, `order_status_history`, `stock_movements`, `loyalty_transactions`, `audit_log`, `analytics_hourly_snapshots`) use `gen_ulid()` (time-sortable, UUID-compatible) to prevent B-tree index fragmentation. Requires `pg_ulid` extension or a custom `gen_ulid()` function seeded at migration time.

**Partitioning:** `audit_log`, `stock_movements`, and `analytics_hourly_snapshots` are range-partitioned by month on their timestamp column. Monthly partitions are auto-created by a scheduled maintenance job.

---

## Platform-level tables (no tenant_id)

### tenants
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
name            VARCHAR(255) NOT NULL
slug            VARCHAR(100) UNIQUE NOT NULL   -- used in subdomain routing
plan_id         UUID FK → subscription_plans
status          ENUM('active','suspended','trial','cancelled')
settings        JSONB DEFAULT '{}'
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

### subscription_plans
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
name            VARCHAR(100) NOT NULL          -- 'Starter', 'Growth', 'Enterprise'
slug            VARCHAR(50) UNIQUE NOT NULL
max_branches    SMALLINT NOT NULL DEFAULT 1
features        JSONB NOT NULL DEFAULT '{}'    -- feature flags per plan
price_monthly   DECIMAL(10,2)
stripe_price_id VARCHAR(100)                   -- ⚠️ Decision 7 pending (payment gateway)
is_active       BOOLEAN DEFAULT true
```

### platform_admins
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
name            VARCHAR(255)
email           VARCHAR(255) UNIQUE NOT NULL
password        VARCHAR(255)
created_at      TIMESTAMPTZ
```

### permissions  (platform-level seed, never changes per tenant)
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
slug            VARCHAR(100) UNIQUE NOT NULL   -- e.g. 'orders.cancel'
module          VARCHAR(50) NOT NULL           -- e.g. 'orders'
label           VARCHAR(200) NOT NULL          -- human-readable
description     TEXT
sort_order      SMALLINT DEFAULT 0
```

---

## Tenant infrastructure tables

### branches
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
tenant_id       UUID NOT NULL FK → tenants
name            VARCHAR(255) NOT NULL
address         JSONB NOT NULL                 -- { street, city, postcode, country, lat, lng }
phone           VARCHAR(30)
email           VARCHAR(255)
timezone        VARCHAR(50) NOT NULL DEFAULT 'UTC'
currency        CHAR(3) NOT NULL DEFAULT 'GBP'
locale          VARCHAR(10) DEFAULT 'en-GB'
operating_hours JSONB NOT NULL DEFAULT '{}'   -- { mon: { open: '09:00', close: '23:00' }, ... }
settings        JSONB DEFAULT '{}'
status          ENUM('active','inactive')
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ

INDEX (tenant_id, id)
```

### special_operating_hours
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
tenant_id       UUID NOT NULL FK → tenants
branch_id       UUID NOT NULL FK → branches
date            DATE NOT NULL
is_closed       BOOLEAN DEFAULT false
open_time       TIME
close_time      TIME
reason          VARCHAR(255)

UNIQUE (branch_id, date)
INDEX (tenant_id, branch_id, date)
```

---

## Auth & roles tables

### users  (staff)
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
tenant_id       UUID NOT NULL FK → tenants
name            VARCHAR(255) NOT NULL
email           VARCHAR(255) NOT NULL
phone           VARCHAR(30)
password        VARCHAR(255)
status          ENUM('active','inactive','suspended')
profile_photo   VARCHAR(500)
employment      JSONB DEFAULT '{}'             -- { start_date, contract_type, hourly_rate }
documents       JSONB DEFAULT '[]'             -- [ { type, expiry_date, file_path } ]
settings        JSONB DEFAULT '{}'
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ

UNIQUE (tenant_id, email)
INDEX (tenant_id, status)
```

### roles
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
tenant_id       UUID NOT NULL FK → tenants
name            VARCHAR(100) NOT NULL
slug            VARCHAR(100) NOT NULL
is_system       BOOLEAN DEFAULT false          -- true = read-only, cannot be deleted
description     TEXT
created_by      UUID FK → users
created_at      TIMESTAMPTZ

UNIQUE (tenant_id, slug)
INDEX (tenant_id, is_system)
```

### role_permissions
```sql
role_id         UUID NOT NULL FK → roles
permission_id   UUID NOT NULL FK → permissions
PRIMARY KEY (role_id, permission_id)
```

### user_roles
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID NOT NULL FK → users
role_id         UUID NOT NULL FK → roles
tenant_id       UUID NOT NULL FK → tenants
branch_ids      UUID[]                         -- NULL = all branches; array = specific branches
assigned_by     UUID FK → users
assigned_at     TIMESTAMPTZ

INDEX (tenant_id, user_id)
INDEX (tenant_id, role_id)
```

### personal_access_tokens  (Laravel Sanctum — standard table, augmented)
```sql
-- Standard Sanctum columns plus:
tenant_id       UUID FK → tenants
user_type       ENUM('staff','customer','platform_admin')
```

---

## Staff scheduling tables

### shifts
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
tenant_id       UUID NOT NULL FK → tenants
branch_id       UUID NOT NULL FK → branches
user_id         UUID FK → users               -- NULL = open shift
role_id         UUID NOT NULL FK → roles
shift_date      DATE NOT NULL
start_time      TIME NOT NULL
end_time        TIME NOT NULL
status          ENUM('draft','published','claimed','completed','cancelled')
claimed_by      UUID FK → users
claimed_at      TIMESTAMPTZ
notes           TEXT
created_by      UUID FK → users
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ

CONSTRAINT chk_shift_times CHECK (end_time > start_time)

INDEX (tenant_id, branch_id, shift_date)
INDEX (tenant_id, user_id, shift_date)
```

### attendance_records
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
tenant_id       UUID NOT NULL FK → tenants
branch_id       UUID NOT NULL FK → branches
user_id         UUID NOT NULL FK → users
shift_id        UUID FK → shifts              -- NULL if unscheduled clock-in
clock_in_at     TIMESTAMPTZ NOT NULL
clock_out_at    TIMESTAMPTZ
scheduled_start TIME
scheduled_end   TIME
is_late         BOOLEAN DEFAULT false
is_overtime     BOOLEAN DEFAULT false
notes           TEXT
created_at      TIMESTAMPTZ

INDEX (tenant_id, branch_id, clock_in_at DESC)
INDEX (tenant_id, user_id, clock_in_at DESC)
```

---

## Menu tables

### menu_categories
```sql
id, tenant_id, name, slug, photo_url (full public S3 URL), parent_id (FK self), sort_order, is_active, created_at, updated_at
INDEX (tenant_id, parent_id)
```

### menu_items
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
tenant_id         UUID NOT NULL FK → tenants
category_id       UUID NOT NULL FK → menu_categories
sku               VARCHAR(100) NOT NULL
name              VARCHAR(255) NOT NULL
short_description VARCHAR(255)                   -- one-line summary for menu cards
description       TEXT
badge             VARCHAR(50)                    -- enum: new, popular, chef_pick, seasonal, limited
kitchen_notes     TEXT                           -- internal KDS notes, not shown to customers
base_price        DECIMAL(10,2) NOT NULL
cost_price        DECIMAL(10,2)                  -- WAC-derived, updated by inventory
tax_category      VARCHAR(50) DEFAULT 'standard'
allergens         JSONB DEFAULT '[]'             -- ['gluten','dairy','nuts',...]
dietary_flags     JSONB DEFAULT '{}'             -- { vegan, vegetarian, gluten_free, halal, kosher }
photo_url         VARCHAR(500)                   -- full public S3 URL
prep_time_mins    SMALLINT
available_from    TIME                           -- null = no time restriction
available_until   TIME
available_days    JSONB DEFAULT '[0,1,2,3,4,5,6]' -- array of weekday ints (0=Sun, 6=Sat)
is_active         BOOLEAN DEFAULT true
is_master         BOOLEAN DEFAULT true           -- false = branch-exclusive item
sort_order        SMALLINT DEFAULT 0
created_at        TIMESTAMPTZ
updated_at        TIMESTAMPTZ

UNIQUE (tenant_id, sku)
INDEX (tenant_id, category_id, is_active)
INDEX (tenant_id, is_master)
```

### menu_item_nutrition
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
tenant_id     UUID NOT NULL FK → tenants
menu_item_id  UUID NOT NULL FK → menu_items   -- UNIQUE: one row per item
serving_size  DECIMAL(8,2)
serving_unit  VARCHAR(50)                      -- 'g', 'ml', 'oz', 'per serving'
calories      SMALLINT
protein_g     DECIMAL(6,2)
carbs_g       DECIMAL(6,2)
fat_g         DECIMAL(6,2)
fiber_g       DECIMAL(6,2)
sodium_mg     DECIMAL(8,2)
sugar_g       DECIMAL(6,2)
created_at    TIMESTAMPTZ
updated_at    TIMESTAMPTZ

UNIQUE (menu_item_id)
INDEX (tenant_id, menu_item_id)
```

### menu_item_branch_overrides
```sql
id, tenant_id, menu_item_id (FK), branch_id (FK), price_override, is_available, description_override,
photo_override, is_visible, created_at, updated_at
UNIQUE (menu_item_id, branch_id)
```

### modifier_groups
```sql
id, tenant_id, name, selection_type (ENUM single/multiple), min_selections, max_selections, is_required
```

### modifiers
```sql
id, tenant_id, group_id (FK), name, price_addition, is_default, sort_order
```

### item_modifier_groups  (pivot)
```sql
menu_item_id, modifier_group_id, sort_order
```

### eighty_six_log
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
tenant_id       UUID NOT NULL FK → tenants
branch_id       UUID NOT NULL FK → branches
menu_item_id    UUID NOT NULL FK → menu_items
trigger_type    ENUM('manual','inventory_stockout')
trigger_ref     UUID                           -- inventory_item_id if inventory_stockout
started_at      TIMESTAMPTZ NOT NULL
ended_at        TIMESTAMPTZ                    -- NULL = still 86'd
restored_by     UUID FK → users               -- NULL until restored
restore_note    TEXT

INDEX (tenant_id, branch_id, ended_at) WHERE ended_at IS NULL
```

---

## Orders tables

### orders
```sql
id              UUID PRIMARY KEY DEFAULT gen_ulid()   -- ULID: high write volume
tenant_id       UUID NOT NULL FK → tenants
branch_id       UUID NOT NULL FK → branches
order_ref       VARCHAR(50) NOT NULL           -- ORD-YYYYMMDD-NNNN
source          ENUM('dine_in_pos','dine_in_qr','takeaway_counter','takeaway_phone','online','uber_eats','wolt')
table_id        UUID FK → tables
customer_profile_id UUID FK → customer_profiles
customer_name   VARCHAR(255)
customer_phone  VARCHAR(30)
status          ENUM(OrderStatus) NOT NULL DEFAULT 'new'
allergen_note   TEXT
subtotal        DECIMAL(10,2) NOT NULL
discount_amount DECIMAL(10,2) DEFAULT 0
discount_ref    VARCHAR(255)
service_charge  DECIMAL(10,2) DEFAULT 0
delivery_fee    DECIMAL(10,2) DEFAULT 0
total           DECIMAL(10,2) NOT NULL
payment_status  ENUM('unpaid','paid','partially_refunded','fully_refunded')
payment_method  ENUM('card','cash','qr_pay','loyalty','mixed','platform')
platform_order_id VARCHAR(100)
platform_commission DECIMAL(10,2)
delivery_address JSONB
delivery_zone_id UUID FK → delivery_zones
estimated_ready_at TIMESTAMPTZ
estimated_delivery_at TIMESTAMPTZ
actual_ready_at TIMESTAMPTZ
actual_delivered_at TIMESTAMPTZ
completed_at    TIMESTAMPTZ
cancelled_at    TIMESTAMPTZ
cancellation_reason JSONB                      -- { code, note }
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ

CONSTRAINT chk_orders_total_positive    CHECK (total >= 0)
CONSTRAINT chk_orders_subtotal_positive CHECK (subtotal >= 0)

UNIQUE (tenant_id, order_ref)
INDEX (tenant_id, branch_id, status)
INDEX (tenant_id, branch_id, created_at DESC)
INDEX (tenant_id, branch_id, source)
INDEX (tenant_id, branch_id, payment_status)
INDEX (tenant_id, branch_id, completed_at DESC)
INDEX (tenant_id, customer_profile_id)
INDEX (tenant_id, platform_order_id) WHERE platform_order_id IS NOT NULL
```

### order_items
```sql
-- Replaces orders.items JSONB. Enables dish-level analytics and FK integrity.
id              UUID PRIMARY KEY DEFAULT gen_ulid()   -- ULID: high write volume
tenant_id       UUID NOT NULL FK → tenants
order_id        UUID NOT NULL FK → orders
menu_item_id    UUID FK → menu_items          -- nullable: item may be deleted later
item_name       VARCHAR(255) NOT NULL          -- snapshot at time of order
item_sku        VARCHAR(100) NOT NULL          -- snapshot
quantity        SMALLINT NOT NULL
unit_price      DECIMAL(10,2) NOT NULL         -- snapshot (price may change after order)
modifier_total  DECIMAL(10,2) DEFAULT 0
line_total      DECIMAL(10,2) NOT NULL
modifiers       JSONB DEFAULT '[]'             -- snapshot: [{ name, price_addition }]
special_instructions TEXT
created_at      TIMESTAMPTZ

CONSTRAINT chk_order_items_qty_positive       CHECK (quantity > 0)
CONSTRAINT chk_order_items_line_total_positive CHECK (line_total >= 0)

INDEX (tenant_id, order_id)
INDEX (tenant_id, menu_item_id)
```

### order_status_history
```sql
-- Full lifecycle log for every order status transition. Enables kitchen SLA measurement.
id              UUID PRIMARY KEY DEFAULT gen_ulid()   -- ULID: high write volume
tenant_id       UUID NOT NULL FK → tenants
order_id        UUID NOT NULL FK → orders
from_status     VARCHAR(50)                    -- NULL for initial 'new' state
to_status       VARCHAR(50) NOT NULL
actor_id        UUID FK → users               -- NULL for system/platform transitions
actor_type      ENUM('staff','system','customer','platform')
notes           TEXT
created_at      TIMESTAMPTZ NOT NULL

INDEX (tenant_id, order_id, created_at)
```

### order_payments
```sql
id, tenant_id, order_id (FK), method, amount, stripe_payment_intent_id, status,
refund_amount, refund_reason, stripe_refund_id, created_at
```

### promo_codes
```sql
id, tenant_id, code, discount_type (ENUM flat/percent), discount_value, applicable_channels (JSONB),
max_uses_total, max_uses_per_customer, current_uses, expires_at, is_active, created_at
UNIQUE (tenant_id, code)
```

### delivery_zones
```sql
id, tenant_id, branch_id (FK), name, geo_type (ENUM radius/polygon/postcode_list),
geo_definition (JSONB), min_order_value, delivery_fee, transit_time_minutes,
operating_hours (JSONB), status (ENUM active/paused), created_at, updated_at
```

### disputes
```sql
id, tenant_id, order_id (FK), platform, platform_dispute_id, reason_code, claimed_amount,
response_deadline, evidence_notes, response_type (ENUM accept/partial/dispute), outcome, financial_impact,
responded_at, resolved_at, created_at
```

---

## Reservations tables

### floor_plans
```sql
id, tenant_id, branch_id (FK), name, layout_data (JSONB), is_active, created_at, updated_at
```

### tables
```sql
id, tenant_id, branch_id (FK), floor_plan_id (FK), table_number, capacity_min, capacity_max,
status (ENUM free/reserved/occupied/needs_cleaning/blocked), position (JSONB {x,y,w,h,rotation}),
is_active, created_at, updated_at
INDEX (tenant_id, branch_id, status)
```

### reservations
```sql
id, tenant_id, branch_id (FK), table_id (FK), customer_profile_id (FK), party_size,
guest_name, guest_phone, guest_email, occasion, special_requests,
reservation_date, reservation_time, duration_minutes, status (ENUM confirmed/arrived/seated/completed/no_show/cancelled),
booking_channel, deposit_required, deposit_amount, stripe_payment_intent_id, reminder_sent_24h, reminder_sent_2h,
cancelled_at, cancellation_reason, created_at, updated_at
INDEX (tenant_id, branch_id, reservation_date, status)
INDEX (tenant_id, customer_profile_id)
```

### waitlist_entries
```sql
id, tenant_id, branch_id (FK), customer_profile_id (FK), guest_name, guest_phone,
party_size, joined_at, estimated_wait_minutes, status (ENUM waiting/seated/left/expired),
seated_at, table_id (FK), created_at
INDEX (tenant_id, branch_id, status)
```

---

## Events tables

### event_spaces
```sql
id, tenant_id, branch_id (FK), name, capacity_min, capacity_max, default_minimum_spend,
hire_fee, description, amenities (JSONB), is_active
```

### events
```sql
id, tenant_id, branch_id (FK), space_id (FK), customer_profile_id (FK), title (nullable), organiser_name,
organiser_email, organiser_phone, corporate_account_id (FK nullable),
occasion_type, event_date, start_time, end_time, guest_count, status (ENUM enquiry/proposal/confirmed/pre_event/day_of/completed/cancelled),
package_id (FK nullable), custom_menu (JSONB), minimum_spend, actual_spend,
deposit_amount, deposit_paid_at, stripe_payment_intent_id, notes, run_sheet (JSONB),
parent_event_id (FK self, for recurring), recurrence_rule (JSONB nullable),
created_at, updated_at
INDEX (tenant_id, branch_id, event_date)
INDEX (tenant_id, status)
```

### event_packages
```sql
id, tenant_id, name, price_per_head, minimum_spend, includes (JSONB), is_active
```

### corporate_accounts
```sql
id, tenant_id, company_name, billing_contact_name, billing_contact_email, billing_address (JSONB),
credit_limit, agreed_hire_rate_override, coordinator_user_id (FK users), status (ENUM active/on_hold), created_at
```

---

## Inventory tables

### inventory_items
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
tenant_id       UUID NOT NULL FK → tenants
branch_id       UUID NOT NULL FK → branches
name            VARCHAR(255) NOT NULL
sku             VARCHAR(100) NOT NULL
unit            VARCHAR(50) NOT NULL
category        VARCHAR(100)
par_level       DECIMAL(10,3) NOT NULL
reorder_point   DECIMAL(10,3) NOT NULL
current_stock   DECIMAL(10,3) NOT NULL DEFAULT 0
wac             DECIMAL(12,4) NOT NULL DEFAULT 0  -- Weighted Average Cost, 4dp precision
critical_threshold DECIMAL(10,3) NOT NULL
storage_location VARCHAR(100)
allergen_flags  JSONB DEFAULT '[]'
last_stocktake_at TIMESTAMPTZ
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ

CONSTRAINT chk_par_level_positive      CHECK (par_level > 0)
CONSTRAINT chk_reorder_point_positive  CHECK (reorder_point >= 0)

UNIQUE (tenant_id, branch_id, sku)
INDEX (tenant_id, branch_id)
INDEX (tenant_id, branch_id, reorder_point)
INDEX (tenant_id, branch_id) WHERE current_stock <= critical_threshold
```

### recipes
```sql
id, tenant_id, menu_item_id (FK), branch_id (FK nullable — NULL = master recipe),
status (ENUM draft/pending_approval/approved/archived),
prep_time_minutes, instructions (TEXT), approved_by (FK users), approved_at,
version, created_at, updated_at
```

### recipe_ingredients
```sql
recipe_id           UUID NOT NULL FK → recipes
inventory_item_id   UUID NOT NULL FK → inventory_items
quantity            DECIMAL(10,3) NOT NULL      -- 4dp precision for accurate WAC calc
unit                VARCHAR(50) NOT NULL
wastage_factor      DECIMAL(5,4) DEFAULT 1.0000 -- e.g. 1.0500 = 5% wastage
PRIMARY KEY (recipe_id, inventory_item_id)
```

### stock_movements
```sql
-- PARTITIONED BY RANGE (created_at) monthly. High write volume.
id              UUID PRIMARY KEY DEFAULT gen_ulid()   -- ULID: high write volume
tenant_id       UUID NOT NULL FK → tenants
branch_id       UUID NOT NULL FK → branches
inventory_item_id UUID NOT NULL FK → inventory_items
movement_type   ENUM('grn','sale_deduction','waste','adjustment','stocktake_correction','transfer')
quantity        DECIMAL(10,3) NOT NULL         -- positive=in, negative=out
unit_cost       DECIMAL(12,4)                  -- cost per unit at time of movement
wac_before      DECIMAL(12,4)                  -- WAC before this movement
wac_after       DECIMAL(12,4)                  -- WAC after this movement
reference_type  VARCHAR(50)                    -- 'order', 'grn', 'waste_log', etc.
reference_id    UUID
notes           TEXT
actor_id        UUID FK → users
created_at      TIMESTAMPTZ NOT NULL

INDEX (tenant_id, branch_id, inventory_item_id, created_at DESC)
```

### goods_received_notes
```sql
id, tenant_id, branch_id (FK), supplier_id (FK), purchase_order_id (FK nullable → purchase_orders),
status (ENUM draft/received/discrepancy/completed), received_at, received_by (FK users),
notes (TEXT), created_at
```

### grn_items
```sql
grn_id              UUID NOT NULL FK → goods_received_notes
inventory_item_id   UUID NOT NULL FK → inventory_items
ordered_qty         DECIMAL(10,3)
received_qty        DECIMAL(10,3) NOT NULL
unit_cost           DECIMAL(12,4) NOT NULL      -- 4dp for WAC accuracy
temperature_celsius DECIMAL(4,1)
temperature_status  ENUM('pass','fail','borderline')
created_at          TIMESTAMPTZ

CONSTRAINT chk_grn_received_qty_positive CHECK (received_qty >= 0)
```

### waste_logs
```sql
id, tenant_id, branch_id (FK), inventory_item_id (FK), quantity DECIMAL(10,3), unit,
waste_type (ENUM spoilage/prep/service/overproduction/unaccounted/staff_meal),
cost_at_wac DECIMAL(12,4), notes, logged_by (FK users), logged_at
```

### suppliers
```sql
id, tenant_id, name, contact_name, email, phone, address (JSONB),
payment_terms, lead_time_days, is_active, created_at
```

### stocktakes
```sql
id, tenant_id, branch_id (FK), status (ENUM in_progress/completed/locked),
period_start, period_end, conducted_by (FK users), completed_at, variance_cost DECIMAL(12,4),
is_period_close BOOLEAN DEFAULT false, created_at
```

### purchase_orders
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
tenant_id       UUID NOT NULL FK → tenants
branch_id       UUID NOT NULL FK → branches
supplier_id     UUID NOT NULL FK → suppliers
status          ENUM('draft','sent','acknowledged','partially_received','completed','cancelled')
expected_delivery_date DATE
notes           TEXT
created_by      UUID FK → users
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ

INDEX (tenant_id, branch_id, status)
INDEX (tenant_id, supplier_id)
```

### purchase_order_items
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
po_id               UUID NOT NULL FK → purchase_orders
inventory_item_id   UUID NOT NULL FK → inventory_items
quantity_ordered    DECIMAL(10,3) NOT NULL
unit_cost           DECIMAL(12,4)              -- agreed price per unit
notes               TEXT

INDEX (po_id)
```

---

## Customer & Loyalty tables

### customer_profiles  (platform-level — no tenant_id)
```sql
-- Decision 3: platform-level customer accounts. One profile per customer across all restaurants.
-- Loyalty data is per-tenant in customer_tenant_profiles.
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
phone           VARCHAR(30) UNIQUE NOT NULL    -- E.164, platform-wide dedup key
email           VARCHAR(255)
first_name      VARCHAR(100)
last_name       VARCHAR(100)
date_of_birth   JSONB                          -- { day, month } — no year for privacy
password        VARCHAR(255)                   -- for customer portal login
dietary_flags   JSONB DEFAULT '{}'
allergen_notes  TEXT
communication_prefs JSONB DEFAULT '{"sms_marketing":true,"email_marketing":true}'
gdpr_consent    JSONB
status          ENUM('active','inactive','anonymised','deletion_pending') DEFAULT 'active'
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ

INDEX (status)
INDEX (email)
```

### customer_tenant_profiles  (per-tenant loyalty data)
```sql
-- One row per (customer, tenant) pair. Holds all loyalty and visit data scoped to a restaurant.
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
customer_id     UUID NOT NULL FK → customer_profiles
tenant_id       UUID NOT NULL FK → tenants
loyalty_number  VARCHAR(20) NOT NULL           -- LYL-NNNNN, unique per tenant
loyalty_tier    ENUM('bronze','silver','gold') DEFAULT 'bronze'
loyalty_points  INTEGER NOT NULL DEFAULT 0
lifetime_spend  DECIMAL(12,2) DEFAULT 0
lifetime_visits INTEGER DEFAULT 0
first_visit_at  TIMESTAMPTZ
last_visit_at   TIMESTAMPTZ
avg_visit_interval_days DECIMAL(6,1)
acquisition_channel ENUM('online_booking','walk_in','loyalty_enrolment','delivery','referral','event')
referred_by_id  UUID FK → customer_profiles
no_show_count   SMALLINT DEFAULT 0
points_expiry_warned_at TIMESTAMPTZ                -- 12-month inactivity warning sent at
staff_notes     TEXT
status          ENUM('active','inactive','anonymised','deletion_pending') DEFAULT 'active'
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ

CONSTRAINT chk_loyalty_points_non_negative CHECK (loyalty_points >= 0)

UNIQUE (customer_id, tenant_id)
UNIQUE (tenant_id, loyalty_number)
INDEX (tenant_id, loyalty_tier)
INDEX (tenant_id, last_visit_at)
INDEX (tenant_id, status)
```

### loyalty_transactions
```sql
-- ULID for high write volume. References customer_id + tenant_id (identifies customer_tenant_profiles row).
id              UUID PRIMARY KEY DEFAULT gen_ulid()
tenant_id       UUID NOT NULL FK → tenants
customer_id     UUID NOT NULL FK → customer_profiles
transaction_type ENUM('earn','redeem','expire','reverse','bonus','adjustment')
points_delta    INTEGER NOT NULL
balance_after   INTEGER NOT NULL
source_type     VARCHAR(50)                    -- 'order', 'campaign', 'manual', etc.
source_id       UUID
earn_rate_applied DECIMAL(8,4)
description     VARCHAR(255)
actor_id        UUID FK → users               -- NULL for system-generated transactions
created_at      TIMESTAMPTZ NOT NULL

INDEX (tenant_id, customer_id, created_at DESC)
```

### loyalty_campaigns
```sql
id, tenant_id, name, campaign_type (ENUM birthday/churn_prevention/tier_nudge/post_event/promotional/milestone),
target_segment (JSONB), message_template_sms, message_template_email, scheduled_at,
status (ENUM draft/scheduled/sending/sent/cancelled), sent_count, visit_count (within 14 days),
created_by (FK users), created_at
```

---

## Analytics tables

### analytics_daily_revenue
```sql
tenant_id, branch_id, date, channel, gross_revenue, net_revenue, order_count, cover_count,
avg_order_value, food_cost, labour_cost
PRIMARY KEY (tenant_id, branch_id, date, channel)
```

### analytics_hourly_snapshots
```sql
-- PARTITIONED BY RANGE (snapshot_at) monthly. High write volume.
tenant_id       UUID NOT NULL
branch_id       UUID NOT NULL
snapshot_at     TIMESTAMPTZ NOT NULL
metric_key      VARCHAR(100) NOT NULL
metric_value    JSONB NOT NULL

PRIMARY KEY (tenant_id, branch_id, snapshot_at, metric_key)
INDEX (tenant_id, branch_id, snapshot_at DESC)
```

### analytics_dish_performance
```sql
tenant_id, branch_id, menu_item_id, period_start, period_end, units_sold, revenue, food_cost_pct,
gross_margin, contribution_margin, menu_mix_pct, popularity_index, eighty_six_count,
engineering_quadrant (ENUM star/plowhorse/puzzle/dog)

INDEX (tenant_id, branch_id, period_start)
```

### analytics_customer_segments
```sql
-- References customer_id (platform-level) + tenant_id (identifies customer_tenant_profiles row).
tenant_id           UUID NOT NULL
customer_id         UUID NOT NULL FK → customer_profiles
calculated_at       TIMESTAMPTZ NOT NULL
rfm_recency         SMALLINT
rfm_frequency       SMALLINT
rfm_monetary        DECIMAL(12,2)
rfm_segment         ENUM('champion','loyal','potential_loyalist','at_risk','about_to_churn','new','lost','high_value_at_risk')
clv_historical      DECIMAL(12,2)
clv_projected       DECIMAL(12,2)
churn_risk_score    DECIMAL(5,4)
expected_visit_interval_days DECIMAL(6,1)
days_since_last_visit INTEGER

PRIMARY KEY (tenant_id, customer_id)
INDEX (tenant_id, rfm_segment)
INDEX (tenant_id, churn_risk_score DESC)
```

---

## Audit table (platform-level, cross-tenant)

### audit_log
```sql
-- WRITE ONLY. No UPDATE or DELETE ever.
-- PARTITIONED BY RANGE (created_at) monthly. 7-year retention requirement.
id              UUID PRIMARY KEY DEFAULT gen_ulid()   -- ULID: high write volume + sortable
tenant_id       UUID FK → tenants              -- NULL for platform-admin actions
actor_id        UUID NOT NULL
actor_type      ENUM('staff','customer','platform_admin','system')
actor_role      VARCHAR(100)
action          VARCHAR(100) NOT NULL           -- e.g. 'order.cancelled', 'menu_item.86d'
resource_type   VARCHAR(100)
resource_id     UUID
changes         JSONB                           -- { before: {}, after: {} }
ip_address      INET
user_agent      TEXT
created_at      TIMESTAMPTZ NOT NULL

INDEX (tenant_id, created_at DESC)
INDEX (tenant_id, resource_type, resource_id)
INDEX (actor_id, created_at DESC)
```
