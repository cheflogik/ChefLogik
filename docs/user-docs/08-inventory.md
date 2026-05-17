# Inventory — Testing Guide

## Overview
The Inventory module tracks raw ingredient and supply stock across branches. Key features include: stock items with reorder thresholds, manual stock adjustments, inter-branch stock transfers, goods received notes (GRN — recording deliveries from suppliers), purchase orders, supplier management, recipe costing, stocktake forms, and waste logging. Inventory ties directly into the menu — a stockout automatically 86's linked menu items.

## Prerequisites
- Logged in to the `@web` staff app (`http://localhost:5500`)
- A branch is selected in the sidebar
- Permission required: `inventory.view_stock` (view), `inventory.adjust_stock` (adjust), `inventory.manage` (full management)
- At least one supplier must exist before creating purchase orders or GRNs

## Sub-sections

### Stock Items List

**Purpose**
View all inventory items with current stock levels, reorder thresholds, and stock status indicators.

**How to access**
Click **Inventory** in the left sidebar (under Management). URL: `/inventory`. The secondary navigation bar at the top of the page has tabs: **Stock**, **GRNs**, **Purchase Orders**, **Suppliers**, **Recipes**, **Stocktakes**, **Waste Logs**.

**Test Cases**

#### Test 1: Stock list loads
- **Precondition**: At least one inventory item exists.
- **Steps**:
  1. Navigate to `/inventory`.
  2. The page shows a table of inventory items with columns: name, current stock, unit, reorder point, WAC (weighted average cost), stock status badge, and action buttons.
- **Expected result**: Items are listed. Status badges show:
  - Green "OK" — stock above reorder point
  - Yellow "Reorder" — stock at or below reorder point
  - Red "Critical" — stock at critical low level (triangle warning icon)
- **Edge cases to check**:
  - No items → empty state message.
  - No branch selected → "No branch selected" screen.

#### Test 2: Search inventory items
- **Steps**:
  1. In the search input at the top of the stock list, type a partial name (e.g. `Sal`).
- **Expected result**: Only items with "Sal" in their name are shown (e.g. "Salmon fillet", "Salt").

#### Test 3: Filter by stock status
- **Steps**:
  1. Find the **Status** filter dropdown.
  2. Select **Critical**.
- **Expected result**: Only items with "Critical" stock level are shown.

---

### Add / Edit Inventory Item

**Purpose**
Create a new inventory item or edit an existing one with thresholds, units, and cost data.

**How to access**
Click **+ Add Item** button (top-right of stock list). URL: `/inventory/items/new`. To edit an existing item, click the edit (pencil) icon or item name. URL: `/inventory/items/:itemId`.

**Test Cases**

#### Test 4: Create a new inventory item
- **Steps**:
  1. Click **+ Add Item**.
  2. Fill in the form:
     - **Name**: `Atlantic Salmon`
     - **Unit**: `kg` (select from dropdown or type)
     - **Current stock**: `15`
     - **Reorder point**: `5`
     - **Critical level**: `2`
     - **Unit cost**: `12.50`
  3. Click **Save** or **Create**.
- **Expected result**: Item appears in the stock list with green "OK" status (since 15 > 5).
- **Edge cases to check**:
  - Blank name → validation error.
  - Current stock below critical level → item immediately shows "Critical" status on creation.
  - Negative stock value → validation error or allowed depending on system configuration.

#### Test 5: Edit an inventory item threshold
- **Steps**:
  1. Click the pencil icon on "Atlantic Salmon".
  2. Change **Reorder point** from `5` to `8`.
  3. Click **Save**.
- **Expected result**: The item's reorder point is updated. If current stock (15) is still above 8, status remains "OK".

---

### Adjust Stock

**Purpose**
Manually add or remove stock units (e.g. after a waste incident, manual count correction, or receiving stock without a formal GRN).

**How to access**
In the stock list, click the **Adjust** button (sliders icon) on an item row.

**Test Cases**

#### Test 6: Add stock manually
- **Precondition**: An inventory item exists (e.g. "Atlantic Salmon" with 15 kg).
- **Steps**:
  1. Click the adjust (sliders) icon on "Atlantic Salmon".
  2. The **Adjust Stock** modal appears showing current stock: `15 kg`.
  3. In the **Quantity Change** field, enter `5` (positive = adding stock).
  4. In **Notes**, enter: `"Received extra delivery"`.
  5. Click **Adjust**.
- **Expected result**: Modal closes. Stock level updates to `20 kg`.

#### Test 7: Remove stock manually (negative adjustment)
- **Steps**:
  1. Open the Adjust Stock modal for an item.
  2. Enter `-3` in the **Quantity Change** field.
  3. Enter note: `"Spoilage — damaged packaging"`.
  4. Click **Adjust**.
- **Expected result**: Stock decreases by 3 units.
- **Edge cases to check**:
  - Enter `0` → error: "Enter a non-zero quantity."
  - Enter text instead of a number → validation error.
  - Adjust stock below 0 → confirm whether negative stock is allowed.

---

### Stock Transfer

**Purpose**
Transfer stock from one branch to another.

**How to access**
In the stock list, click the transfer (arrows) icon on an item row.

**Test Cases**

#### Test 8: Transfer stock between branches
- **Precondition**: At least two branches exist. The item has stock in the current branch.
- **Steps**:
  1. Click the transfer icon on "Atlantic Salmon".
  2. The **Stock Transfer** modal appears.
  3. Select the **Destination branch** from the dropdown.
  4. Enter **Quantity**: `3`.
  5. Enter **Notes**: `"Transfer to City Branch for event"`.
  6. Click **Transfer**.
- **Expected result**: Stock decreases by 3 in the current branch. Stock increases by 3 in the destination branch.
- **Edge cases to check**:
  - Transfer more than available stock → error.
  - No other branches exist → dropdown shows only "Select branch…" with no selectable options.

---

### Goods Received Notes (GRNs)

**Purpose**
Record deliveries from suppliers. Each GRN logs what was delivered, at what cost, and updates stock levels accordingly.

**How to access**
Click the **GRNs** tab in the inventory navigation bar. URL: `/inventory/grns`.

**Test Cases**

#### Test 9: Create a GRN (goods received note)
- **Precondition**: At least one supplier exists. At least one inventory item exists.
- **Steps**:
  1. Navigate to `/inventory/grns`.
  2. Click **Add GRN** or **New Delivery**.
  3. Select the **Supplier**.
  4. Enter **Delivery date**: today.
  5. Enter **Invoice number**: `INV-2026-0042`.
  6. Add line items: click **Add item**, select "Atlantic Salmon", enter quantity received `10`, unit cost `11.80`.
  7. Click **Save**.
- **Expected result**: GRN is recorded. "Atlantic Salmon" stock increases by 10. The WAC (weighted average cost) recalculates.
- **Edge cases to check**:
  - No supplier selected → validation error.
  - Add item with quantity 0 → error or warning.
  - Same invoice number twice from same supplier → system may warn about duplicate.

---

### Purchase Orders

**Purpose**
Create formal purchase orders sent to suppliers, which can later be matched against GRNs when deliveries arrive.

**How to access**
Click **Purchase Orders** tab. URL: `/inventory/purchase-orders`.

**Test Cases**

#### Test 10: Create a purchase order
- **Steps**:
  1. Navigate to `/inventory/purchase-orders`.
  2. Click **New Purchase Order**.
  3. Select supplier, add items with quantities and expected costs.
  4. Click **Save / Send**.
- **Expected result**: Purchase order is created with "Pending" status. When the delivery arrives, it can be matched to a GRN.

---

### Suppliers

**Purpose**
Manage supplier contact information and linking.

**How to access**
Click **Suppliers** tab. URL: `/inventory/suppliers`.

**Test Cases**

#### Test 11: Create a supplier
- **Steps**:
  1. Navigate to `/inventory/suppliers`.
  2. Click **Add Supplier**.
  3. Enter: name (`Freshfish Ltd`), contact name (`Tom Brown`), email (`tom@freshfish.com`), phone (`+44 7700 900200`).
  4. Click **Save**.
- **Expected result**: Supplier appears in the list and is selectable in GRNs and purchase orders.
- **Edge cases to check**:
  - Blank name → validation error.
  - Duplicate supplier name → warning or allowed.

---

### Recipes

**Purpose**
Define recipes that link menu items to inventory ingredients, enabling automatic COGS (cost of goods sold) calculation and stock deduction on orders.

**How to access**
Click **Recipes** tab. URL: `/inventory/recipes`.

**Test Cases**

#### Test 12: Create a recipe
- **Steps**:
  1. Navigate to `/inventory/recipes`.
  2. Click **Add Recipe**.
  3. Select menu item: `Grilled Salmon`.
  4. Add ingredients:
     - `Atlantic Salmon` — 0.200 kg
     - `Herb Butter` — 0.030 kg
  5. Click **Save**.
- **Expected result**: Recipe is saved. The menu item now shows a calculated cost based on ingredient WAC. Orders for "Grilled Salmon" will deduct 0.200 kg of Atlantic Salmon from stock.
- **Edge cases to check**:
  - Add an ingredient not in inventory → prompt to create it.
  - Zero quantity → validation error.

---

### Stocktakes

**Purpose**
Conduct periodic physical stock counts and record the actual quantities on hand, reconciling against the system's expected stock.

**How to access**
Click **Stocktakes** tab. URL: `/inventory/stocktakes`.

**Test Cases**

#### Test 13: Create and complete a stocktake
- **Precondition**: Inventory items exist.
- **Steps**:
  1. Navigate to `/inventory/stocktakes`.
  2. Click **Start Stocktake** or **New Stocktake**.
  3. The form shows a list of all inventory items with a blank "Counted quantity" field next to each.
  4. Enter the physically counted quantities for each item (e.g. `Atlantic Salmon: 14`).
  5. Click **Complete Stocktake** or **Submit**.
- **Expected result**: Stock levels are updated to the counted values. A variance report shows the difference between expected and actual (e.g. "Atlantic Salmon: expected 15, counted 14, variance -1 kg").
- **Edge cases to check**:
  - Leave some items blank → confirm if partial stocktakes are allowed or all items must be counted.
  - Submit with all items at 0 → confirms mass depletion and should require confirmation.

---

### Waste Logs

**Purpose**
Record deliberate waste events (spoilage, breakage, preparation waste) with reason codes.

**How to access**
Click **Waste Logs** tab. URL: `/inventory/waste-logs`.

**Test Cases**

#### Test 14: Log a waste event
- **Steps**:
  1. Navigate to `/inventory/waste-logs`.
  2. Click **Log Waste**.
  3. Select item: `Atlantic Salmon`.
  4. Enter quantity: `0.5`.
  5. Select reason: `Spoilage`.
  6. Enter notes: `"Past use-by date"`.
  7. Click **Save**.
- **Expected result**: Waste event is recorded. Atlantic Salmon stock decreases by 0.5 kg. The waste log entry appears in the list.
- **Edge cases to check**:
  - Log more waste than current stock → error or warning.
  - Blank reason → validation error.

---

## Known Relationships
- A stockout in inventory triggers an automatic **86** on linked menu items in **Menu Management**.
- Restoring an 86'd item that was triggered by a stockout requires **manager confirmation** (visible in Menu Management).
- GRN costs update the **WAC (Weighted Average Cost)** used in **Analytics → Kitchen** dashboard.
- Recipes link inventory to **Menu Items** for COGS calculation in Analytics.
- Purchase orders and GRNs both reference **Suppliers**.

## Checklist
- [ ] Stock list loads with status badges (OK, Reorder, Critical)
- [ ] Search and status filter work
- [ ] New inventory item created with thresholds
- [ ] Edit item updates thresholds
- [ ] Adjust stock (positive and negative) updates level correctly
- [ ] Zero quantity adjustment shows error
- [ ] Stock transfer between branches updates both branch levels
- [ ] GRN created and stock increases + WAC updates
- [ ] Duplicate invoice number warns
- [ ] Purchase order created with pending status
- [ ] Supplier created and selectable in GRNs
- [ ] Recipe links menu item to ingredients
- [ ] Stocktake creates variance report on completion
- [ ] Waste log decrements stock and records reason
