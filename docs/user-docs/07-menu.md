# Menu Management — Testing Guide

## Overview
Menu Management allows staff to build and maintain the restaurant's menu: categories, menu items, pricing, photos, allergens, badges, and modifier groups (add-ons/extras). It also controls **86'ing** (taking items off sale in real time due to stock running out) and **branch overrides** (a branch can turn off or reprice individual items relative to the master menu).

## Prerequisites
- Logged in to the `@web` staff app (`http://localhost:5500`)
- A branch is selected in the sidebar
- Permission required: `menu.view` (to view), `menu.edit_master` (to add/edit), `menu.delete_master` (to delete), `menu.86_item` (to 86 or restore), `menu.view_costs` (to see cost prices and margins)

## Sub-sections

### Menu Overview (Two-Column Layout)

**Purpose**
Show all categories (left sidebar) and items (right main panel) with filtering, sorting, and view-mode options.

**How to access**
Click **Menu Management** in the left sidebar (under Management). URL: `/menu`.

**Test Cases**

#### Test 1: Menu page loads with categories and items
- **Precondition**: At least one category and one menu item exist.
- **Steps**:
  1. Navigate to `/menu`.
  2. The left sidebar lists all categories. The right panel shows items.
  3. The page header shows: `"N items across M categories"`, with additional counts if items are 86'd or have branch overrides.
- **Expected result**: Categories are listed on the left. Items are shown on the right in either Compact (row) or Catalogue (card) view.
- **Edge cases to check**:
  - No branch selected → "No branch selected" screen with instructions to choose a branch.
  - Empty menu → page loads but item count shows 0.

#### Test 2: Switch between Compact and Catalogue view
- **Steps**:
  1. In the toolbar above the item list, find the **Catalogue / Compact** toggle.
  2. Click **Catalogue**.
  3. Click **Compact**.
- **Expected result**: 
  - Catalogue view: items displayed as cards with photo, name, badge, price, allergens.
  - Compact view: items displayed as a dense table-style list with thumbnail, status dot, name, SKU, price, margin (if permitted), and action buttons.

#### Test 3: Search items
- **Steps**:
  1. In the toolbar, find the **Search items** input (placeholder: "Search items by name, SKU or allergen").
  2. Type the name of a known item (e.g. `Salmon`).
- **Expected result**: Only items matching "Salmon" in name, SKU, or allergens are shown. Other items are hidden.
- **Edge cases to check**:
  - Search for a term that matches nothing → the main panel shows "No items match the current filters."
  - Clear the search → all items reappear.

#### Test 4: Sort items
- **Steps**:
  1. In the toolbar, find the **Sort** dropdown (options: "Sort: Category order", "Sort: A–Z", "Sort: Price").
  2. Select **Sort: A–Z**.
- **Expected result**: Items are reordered alphabetically A to Z across all categories.

#### Test 5: Filter by status
- **Steps**:
  1. Find the **Status** dropdown (options: "Status: All", "Status: Active", "Status: Inactive", "Status: 86'd").
  2. Select **Status: 86'd**.
- **Expected result**: Only items that are currently 86'd are shown.

#### Test 6: Filter by badge
- **Steps**:
  1. Find the **Badge** dropdown (options: Any, None, New, Popular, Chef's Pick, Seasonal, Limited).
  2. Select **Badge: Popular**.
- **Expected result**: Only items with the "Popular" badge are shown.

#### Test 7: Select a category from the left sidebar
- **Steps**:
  1. Click any category name in the left sidebar.
- **Expected result**: The right panel shows only items in that category. The selected category is highlighted.
  - Click **All items** at the top of the sidebar to return to the full item list.

---

### Categories

**Purpose**
Create, rename, reorder, and delete menu categories. Categories can be top-level or nested under a parent.

**How to access**
The category sidebar is visible on the `/menu` page. A `+` button (top-right of the sidebar header) opens the Add Category form. Full setup at `/menu/categories/new`.

**Test Cases**

#### Test 8: Create a new category (quick form)
- **Precondition**: `menu.edit_master` permission.
- **Steps**:
  1. In the category sidebar header, click the `+` button.
  2. An inline form appears with a text input and optional parent category dropdown.
  3. Enter category name: `Desserts`.
  4. Leave parent as "Top-level category" (or select a parent if nesting).
  5. Click **Add**.
- **Expected result**: "Desserts" appears in the category sidebar. Items can now be assigned to it.
- **Edge cases to check**:
  - Enter blank name and click Add → does nothing (button is disabled or name is required).
  - Click **Cancel** → form closes without creating a category.

#### Test 9: Edit a category name
- **Precondition**: `menu.edit_master` permission. A category exists.
- **Steps**:
  1. Hover over a category in the sidebar — **Edit** appears on the right.
  2. Click **Edit**.
  3. The category name becomes an editable input. Change the name to `Starters`.
  4. Click **Save** (or press Enter).
- **Expected result**: Category name updates immediately.
- **Edge cases to check**:
  - Press Escape → edit is cancelled, name reverts.
  - Enter blank name and save → does nothing.

#### Test 10: Upload a category photo
- **Precondition**: `menu.edit_master` permission.
- **Steps**:
  1. Hover over a category — a camera icon (📷) appears.
  2. Click the camera icon.
  3. A file picker opens. Select a JPEG or PNG image.
- **Expected result**: The category icon in the sidebar changes to the uploaded photo thumbnail.

#### Test 11: Delete a category
- **Precondition**: `menu.delete_master` permission. A category with no items, or items you accept will be uncategorised.
- **Steps**:
  1. Hover over the category — **Del** appears.
  2. Click **Del**.
  3. A confirmation dialog appears: `"Delete category 'Desserts'? All items in it will be uncategorised."`.
  4. Click **OK**.
- **Expected result**: Category is removed from the sidebar. Items that were in it become uncategorised.
- **Edge cases to check**:
  - Click Cancel on the dialog → no deletion occurs.

---

### Menu Items

**Purpose**
Create, edit, view, and delete individual menu items. Each item has name, description, price, cost price, SKU, photo, allergens, badge, and availability.

**How to access**
- To add: click **Add item** (top-right of menu page) or click **+ Add item** link in a category section header. URL: `/menu/items/new`.
- To edit: click the **Edit** link on an item row/card. URL: `/menu/items/:itemId`.

**Test Cases**

#### Test 12: Create a new menu item
- **Precondition**: At least one category exists. `menu.edit_master` permission.
- **Steps**:
  1. Click **Add item** (top-right button on the Menu page).
  2. The New Item form appears. Fill in:
     - **Name**: `Grilled Salmon`
     - **SKU**: `SALM-001`
     - **Category**: select `Starters`
     - **Base price**: `18.50`
     - **Cost price**: `6.00` (if you have cost visibility permission)
     - **Prep time (mins)**: `15`
     - **Allergens**: tick `Fish`, `Gluten`
     - **Badge**: `Chef's Pick`
     - **Short description**: `"Fresh Atlantic salmon fillet with herb butter"`
     - **Active**: toggle on
  3. Upload a photo (optional): click the photo upload area, select a JPEG.
  4. Click **Save** or **Create item**.
- **Expected result**: Item "Grilled Salmon" appears in the Starters category on the menu page. Cost and margin are visible to users with `menu.view_costs`.
- **Common mistakes**: Forgetting to enter a SKU — the field may be required.
- **Edge cases to check**:
  - Blank name → validation error.
  - Negative price → validation error.
  - Price of 0 → confirm whether this is allowed (e.g. for free items).
  - Very long name (100+ chars) → check if it truncates gracefully.

#### Test 13: Edit a menu item
- **Steps**:
  1. In the item list (Compact view), find "Grilled Salmon" and click **Edit**.
  2. Change **Base price** to `19.00`.
  3. Click **Save**.
- **Expected result**: The item price updates to `$19.00` in the list.

#### Test 14: 86 a menu item (take off sale)
- **Precondition**: `menu.86_item` permission. A branch is selected. Item is active.
- **Steps**:
  1. Find "Grilled Salmon" in the item list.
  2. Click the red **86** button on the item row.
- **Expected result**: 
  - The item shows a red **86'd** badge.
  - The item row becomes slightly transparent (opacity 60%).
  - A red toast notification appears at the top-right: "86 Alert — Grilled Salmon" (or similar).
  - The menu page header count of 86'd items increments.
  - The item is no longer orderable by customers.
- **Edge cases to check**:
  - Try to 86 an item that is already 86'd → the button shows **Restore** instead.

#### Test 15: Restore an 86'd item
- **Precondition**: An item is currently 86'd.
- **Steps**:
  1. Find the 86'd item (red badge visible).
  2. Click the **Restore** button.
  3. If the item was 86'd due to an **inventory stockout**, a manager confirmation dialog appears: _"This item was 86'd due to a stock-out. Manager confirmation required. Confirm you have verified stock levels?"_
  4. Click **OK** to confirm.
- **Expected result**: The item's 86 badge is removed. It is available for ordering again.
- **Edge cases to check**:
  - Click Cancel on the stockout confirmation → item remains 86'd.
  - Item 86'd for a non-stockout reason → no confirmation dialog, restores immediately.

#### Test 16: Toggle branch availability (Branch Off)
- **Precondition**: `menu.edit_master` permission. A branch is selected.
- **Steps**:
  1. On an active item, click the amber **Branch Off** button.
- **Expected result**: The item shows an amber **Branch Off** badge. It is hidden from ordering at this branch only (not globally). The button changes to green **Enable**.
- **Steps to reverse**:
  2. Click **Enable**.
- **Expected result**: The item is available again at this branch.

#### Test 17: Delete a menu item
- **Precondition**: `menu.delete_master` permission. Item is not currently referenced by an active order.
- **Steps**:
  1. Find the item in the list.
  2. Click the red **Del** link.
  3. Confirm: `"Delete 'Grilled Salmon'? This cannot be undone."` → click OK.
- **Expected result**: Item is removed from the menu.
- **Edge cases to check**:
  - Delete an item referenced by an active order → error: "Could not delete item. It may be referenced by active orders."

---

### Modifier Groups

**Purpose**
Create groups of add-on options that can be attached to menu items (e.g. "Choice of sauce", "Cooking preference").

**How to access**
On the Menu page, click **Modifier groups** button (top-right). URL: `/menu/modifier-groups`.

**Test Cases**

#### Test 18: Create a modifier group
- **Steps**:
  1. Navigate to `/menu/modifier-groups`.
  2. Click **Add group** (or **New modifier group**).
  3. Enter: name (`Choice of Sauce`), selection type (`Single` or `Multiple`), min selections (`0`), max selections (`1`).
  4. Add options: click **Add option** → enter `Peppercorn`, price adjustment `0`. Click again → enter `Béarnaise`, price adjustment `1.50`.
  5. Click **Save**.
- **Expected result**: The modifier group "Choice of Sauce" appears in the list with its options.

#### Test 19: Attach modifier group to an item
- **Steps**:
  1. Open a menu item's edit page.
  2. Find the **Modifier groups** section.
  3. Select "Choice of Sauce" from the available groups.
  4. Save the item.
- **Expected result**: When ordering this item, the "Choice of Sauce" options are presented.

---

## Known Relationships
- 86'd items trigger alerts on the **Dashboard**.
- Item cost prices feed the **Analytics → Dishes** dashboard (margin analysis).
- Modifier groups are attached to items and appear in **Orders** (new order form).
- Inventory-linked 86 events are triggered by **Inventory** (stockout auto-86).
- Items created here appear on the restaurant's **Landing Page** if enabled.

## Checklist
- [ ] Menu page loads with category sidebar and item panel
- [ ] Compact and Catalogue view modes work
- [ ] Search by name, SKU, and allergen filters items correctly
- [ ] Sort by A–Z and Price works
- [ ] Status filter (Active/Inactive/86'd) works
- [ ] Badge filter works
- [ ] Category selection filters item panel
- [ ] New category created via quick form
- [ ] Category name editable inline with Enter/Escape support
- [ ] Category photo upload changes sidebar thumbnail
- [ ] Category deletion with confirmation
- [ ] New menu item created with all fields
- [ ] Required field validation on item form
- [ ] Item edit saves changes
- [ ] 86 action marks item with red badge and toast
- [ ] Restore action (with manager confirmation for stockouts)
- [ ] Branch Off toggles amber badge; Enable reverts it
- [ ] Item deletion with confirmation
- [ ] Modifier group created with options and price adjustments
- [ ] Modifier group attached to item
