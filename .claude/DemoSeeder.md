# DemoSeeder Tracking

Tenant: **Burger Palace Group** (`burger-palace`)
File: `api/database/seeders/DemoSeeder.php`

---

## What's Already Seeded

| Module | Tables | Notes |
|---|---|---|
| Tenant | `tenants` | Enterprise plan, GBP, Europe/London |
| Roles | `roles`, `role_permissions`, `user_roles` | All 8 system roles provisioned via RoleService |
| Branches | `branches` | Downtown, Northside, Airport (3 branches) |
| Owner | `users`, `user_roles` | Alex Morgan — owner@burgerpalace.demo |
| Staff | `users`, `user_roles` | 67 staff: 3 managers + 64 across all roles, some cross-branch |
| Shifts | `shifts` | Past 40 days + next 40 days, 3 templates (morning/afternoon/evening), ~8% cancelled |
| Attendance | `attendance_records` | Past completed shifts only, ~15% absenteeism, late/overtime variance |
| Inventory | `inventory_items`, `stock_movements` | 33 items × 3 branches (burgers/pizza/drinks/sides/desserts), opening GRN per item |
| Menu | `menu_categories`, `menu_items`, `menu_item_branch_overrides`, `modifier_groups`, `modifiers` | 23 items, 6 categories, 3 modifier groups, Airport branch +£1 price override |
| Customers | `customer_profiles`, `customer_tenant_profiles` | 40 customers, loyalty tiers (bronze/silver/gold), lifetime spend/visits |
| Floor Plans | `floor_plans`, `tables` | 2 plans × 3 branches, 12 + 8 tables each, shapes + statuses (free/occupied/reserved/blocked) |
| Reservations | `reservations` | Past 14 days + next 21 days, 4–10 per branch per day, mix of statuses |
| Waitlist | `waitlist_entries` | 5 entries per branch (3 waiting, 1 seated, 1 left) |
| Events | `events`, `event_spaces`, `event_packages` | 1 space + 2 packages per branch, 8 events per branch across all statuses |

---

## What's Missing

### HIGH — Core business data (makes analytics, KDS, and loyalty meaningless without these)

- [ ] **Orders** — `orders`, `order_items`, `order_status_history`, `order_payments`
  - Historical orders for past 30+ days across all 7 sources (`dine_in_pos`, `dine_in_qr`, `takeaway_counter`, `takeaway_phone`, `online`, `uber_eats`, `wolt`)
  - Order items linked to menu items with modifiers
  - Payment records (card, cash, loyalty mixes)
  - Status history transitions per order

- [ ] **Loyalty Transactions** — `loyalty_transactions`
  - Customers have points/tiers but zero history explaining how they earned them
  - Earn and redeem transactions linked to orders

- [ ] **Recipes** — `recipes`, `recipe_ingredients`
  - No recipes linking menu items → inventory items
  - Needed for accurate cost tracking, WAC, and 86 management

- [ ] **Suppliers** — `suppliers`
  - Inventory has no supplier context
  - Required as FK for purchase orders and GRNs

- [ ] **Purchase Orders + GRNs** — `purchase_orders`, `purchase_order_items`, `goods_received_notes`, `grn_items`
  - Shows procurement workflow — stock was received but from nobody in the demo

---

### MEDIUM — Feature completeness

- [ ] **KDS Tickets** — `kds_tickets`, `kds_ticket_items`
  - Kitchen display has no data; depends on orders existing first
  - Past tickets across stations (grill/fryer/cold/pass), some completed, some in_progress

- [ ] **Waste Logs** — `waste_logs`
  - Inventory is incomplete without waste records

- [ ] **Stocktakes** — `stocktakes`, `stocktake_counts`
  - 1–2 past stocktakes per branch showing variance

- [ ] **86 Log** — `eighty_six_log`
  - No record of temporarily unavailable items

- [ ] **Delivery Zones** — `delivery_zones`
  - Online/delivery orders need at least 1 zone per branch

- [ ] **Promo Codes** — `promo_codes`
  - A handful of codes to show discount application on orders

- [ ] **Loyalty Campaigns** — `loyalty_campaigns`
  - 1–2 active/past campaigns (e.g. "Double Points Weekend", "Birthday Bonus")

---

### LOW — Supporting / config data

- [ ] **Corporate Accounts** — `corporate_accounts`
  - Seeded events have no corporate account linkage

- [ ] **Pre-Event Tasks** — `pre_event_tasks`
  - Seeded events have no task checklists

- [ ] **Special Operating Hours** — `special_operating_hours`
  - No holiday/special-hours records per branch

- [ ] **Branch Event Policies** — `branch_event_policies`
  - Events module has no deposit rules configured per branch

- [ ] **Analytics (pre-aggregated)** — `analytics_daily_revenue`, `analytics_hourly_snapshots`, `analytics_dish_performance`, `analytics_customer_segments`
  - Empty without orders; can be seeded directly with computed values derived from order history

- [ ] **Settings** — `settings`, `setting_delegates`
  - No default tenant/branch settings seeded

- [ ] **Tenant Integrations** — `tenant_integrations`
  - No integration records (even a disabled Uber Eats entry shows the feature)

- [ ] **Menu Item Platform Mappings** — `menu_item_platform_mappings`
  - No platform mappings for Uber Eats / Wolt menu items

---

## Implementation Order

```
1. Suppliers                  (no dependencies)
2. Delivery Zones             (no dependencies)
3. Promo Codes                (no dependencies)
4. Recipes + recipe_ingredients  (depends on menu_items + inventory_items)
5. Purchase Orders + GRNs     (depends on suppliers + inventory_items)
6. Orders + order_items + order_status_history + order_payments  (depends on tables, customers, menu_items, delivery_zones, promo_codes)
7. KDS Tickets + items        (depends on orders)
8. Loyalty Transactions       (depends on orders + customer_tenant_profiles)
9. Waste Logs                 (depends on inventory_items, users)
10. Stocktakes + counts       (depends on inventory_items)
11. 86 Log                    (depends on menu_items, users)
12. Loyalty Campaigns         (no dependencies)
13. Corporate Accounts        (no dependencies)
14. Pre-Event Tasks           (depends on events)
15. Special Operating Hours   (depends on branches)
16. Branch Event Policies     (depends on branches)
17. Analytics tables          (derived from orders — seed after orders)
18. Settings                  (depends on tenant + branches)
19. Tenant Integrations       (depends on tenant)
20. Menu Item Platform Mappings  (depends on menu_items + tenant_integrations)
```
