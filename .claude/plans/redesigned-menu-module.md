# Plan: Menu System Redesign

## Context
The user has redesigned all menu-related screens. New designs live in `UI/Menu-Item/` (8 HTML files). The existing implementation spans 6 React route files. This plan covers implementing all redesigns across listing, item forms, category form, and modifier group pages.

---

## Scope summary

| Design file | Route | Status |
|---|---|---|
| `Menu-listing.html` | `menu/index.tsx` | Redesign |
| `Edit-Menu-item.html` | `menu/items/$itemId.tsx` | Redesign |
| `New-Menu-form.html` | `menu/items/new.tsx` | Redesign |
| `Menu-Catrgory-Form.html` | `menu/categories/new.tsx` | New route |
| `Modifier-groups-list.html` | `menu/modifier-groups/index.tsx` | Redesign |
| `New-modifier-form.html` | `menu/modifier-groups/new.tsx` | Redesign |
| `Edit_Modifier-Groups-tab.html` | `menu/modifier-groups/$groupId.tsx` | Redesign |
| `Edit_Nutrition-tab.html` | `menu/items/$itemId.tsx` (NutritionTab) | Redesign |

---

## 1. Backend changes (`/api`)

### 1a. Auto-generate SKU
- **File:** `app/Http/Requests/Menu/StoreMenuItemRequest.php` — change `sku` rule from `required` to `sometimes|nullable`
- **File:** `app/Services/Menu/MenuItemService.php` — auto-generate SKU if not provided: `Str::upper(Str::slug($data['name']) . '-' . Str::random(4))`
- **File:** (controller) — no change needed if service handles it
- **Note:** `UpdateMenuItemRequest.php` does not need changing — SKU is already `sometimes` there

### 1b. Modifier groups — new columns
- **Migration:** Add to `modifier_groups` table:
  - `prompt` — `string`, nullable (shown to guests above options)
  - `available_on_pos` — `boolean`, default `true`
- **Files to update after migration:**
  - `app/Http/Resources/ModifierGroupResource.php` — add `prompt`, `available_on_pos`, and `used_by_count` (see §1e below)
  - `app/Http/Requests/Menu/StoreModifierGroupRequest.php`
  - `app/Http/Requests/Menu/UpdateModifierGroupRequest.php`
  - `app/Models/ModifierGroup.php` — add fields to `$fillable`

### 1c. Modifier groups — `used_by_count` (for list sort)
- **File:** `app/Services/Menu/ModifierGroupService.php` — change `ModifierGroup::with('modifiers')->get()` to `ModifierGroup::with('modifiers')->withCount('menuItems')->get()`
- **File:** `app/Http/Resources/ModifierGroupResource.php` — add `'used_by_count' => $this->menu_items_count`
- `menu_items_count` is the auto-named result of `withCount('menuItems')` from the `menuItems` BelongsToMany relation already defined on the model

### 1d. Menu categories — new columns
- **Migration:** Add to `menu_categories` table (do NOT include `photo_url` — already added in `2026_05_17_000002_add_photo_url_to_menu_categories_table.php`):
  - `description` — `string(80)`, nullable
  - `accent_colour` — `string(7)`, nullable (hex e.g. `#E05E2A`)
  - `icon_glyph` — `string(2)`, nullable (2-letter monogram)
  - `available_from` — `time`, nullable
  - `available_until` — `time`, nullable
  - `available_days` — `json`, nullable
- **Files to update:**
  - `app/Http/Resources/MenuCategoryResource.php` — add all 6 new fields
  - `app/Http/Requests/Menu/StoreMenuCategoryRequest.php` — add validation rules:
    - `description: ['sometimes','nullable','string','max:80']`
    - `accent_colour: ['sometimes','nullable','string','regex:/^#[0-9A-Fa-f]{6}$/']`
    - `icon_glyph: ['sometimes','nullable','string','max:2']`
    - `available_from / available_until: ['sometimes','nullable','date_format:H:i']`
    - `available_days: ['sometimes','nullable','array']`, `available_days.*: ['integer','between:0,6']`
  - `app/Http/Requests/Menu/UpdateMenuCategoryRequest.php` — same rules
  - `app/Models/MenuCategory.php` — add 6 new fields to `$fillable`, add `available_days` to `$casts` as `'array'`

### 1e. Reorder modifier groups — new API endpoint
The drag-to-reorder feature in the Edit item page requires a new backend endpoint:
- **Route:** `PUT /menu/items/{menuItem}/modifier-groups/reorder`
  - Add to `api.php` inside the existing `menu` group, before the apiResource declaration for modifier-groups
- **Request:** `app/Http/Requests/Menu/ReorderModifierGroupsRequest.php`
  - Rules: `group_ids: ['required','array']`, `group_ids.*: ['uuid']`
- **Controller method:** `ModifierGroupController::reorder(MenuItem $menuItem, ReorderModifierGroupsRequest $request)`
  - Delegates to service
- **Service method:** `ModifierGroupService::reorder(MenuItem $menuItem, array $groupIds): void`
  - Loops over `$groupIds` and updates `sort_order` on the `item_modifier_groups` pivot table
- **Frontend:** `MenuService.reorderModifierGroups(itemId: string, groupIds: string[]): Promise<void>`
  - `api.put('/menu/items/{itemId}/modifier-groups/reorder', { group_ids: groupIds })`

---

## 2. Frontend — types & store (`/web`)

### 2a. `web/src/types/menu.ts`
- `MenuCategory` — add: `description`, `accent_colour`, `icon_glyph`, `available_from`, `available_until`, `available_days` (do NOT add `photo_url` — already present)
- `ModifierGroup` — add: `prompt`, `available_on_pos`, `used_by_count?: number`
- `CreateMenuCategoryPayload` / `UpdateMenuCategoryPayload` — add the new fields
- `CreateMenuItemPayload` — make `sku` optional (`sku?: string`)
- `CreateModifierGroupPayload` / `UpdateModifierGroupPayload` — add `prompt`, `available_on_pos`

### 2b. `web/src/stores/MenuStore.ts`
- `MenuCategoryModel` — add new optional/nullable fields using `types.maybeNull(types.string)` for string fields and `types.maybeNull(types.frozen<number[]>())` for `available_days`
- **Also update `_upsertCategory()` internal helper** — this function at line ~116 manually maps each field; it must be updated to pass the 6 new fields through or they are silently dropped when the API response is processed
- `MenuStore.createCategory` — update payload type (no change in logic needed)

---

## 3. Frontend — Install @dnd-kit

In `/web`:
```
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

## 4. Frontend — Menu listing (`menu/index.tsx`)

Full redesign of the listing layout. Key changes:
- **Header stat line:** add 86'd count + branch override count
- **Toolbar below header:** search input (by name/SKU/allergen), view toggle (Catalogue | Compact), sort dropdown (Category order / A–Z / Price)
- **Filter rail:** Status (All / Active / Inactive / 86'd), Badge (Any + each badge)
  - **No branch selector in filter rail** — the global branch selector in the app header already sets `auth.currentBranchId`; a second selector here would conflict. The filter rail reacts to the global branch choice.
- **Category view:** Keep the left sidebar for category navigation. In main panel, group items under category header rows with an item count and inline "+ Add item" link
- **`AddCategoryForm` sidebar widget** — keep as-is (quick-add with name + parent only). Add a "Full setup →" link below it that navigates to `/menu/categories/new` for the complete form.
- **Catalogue view:** Card grid — image, name, badge, price, margin, allergen chips, status dot, Edit link
- **Compact view:** Current row-based layout (already implemented) — keep it as-is, just wire to view toggle
- **Import CSV button:** Add button to header (UI only — shows "Coming soon" toast for now)

Local state additions:
- `searchQuery: string`
- `viewMode: 'catalogue' | 'compact'`
- `sortBy: 'category_order' | 'name_asc' | 'price_asc'`
- `filterStatus: 'all' | 'active' | 'inactive' | 'eighty_six'`
- `filterBadge: string` (badge value or 'any')

Filtering/sorting all done client-side (data already loaded).

---

## 5. Frontend — New item form (`menu/items/new.tsx`)

Changes:
- **Remove SKU field** — no longer shown; backend auto-generates
- **Remove SKU validation guard** — `new.tsx:88-91` has `if (!sku.trim()) { setError('SKU is required.') return }` — delete this block alongside the field removal
- **Update `CreateMenuItemPayload`** — `sku` is optional
- **Section headers:** "Core info" with subtitle text, "Allergens & dietary flags" with subtitle text
- **Badge picker:** Replace `<Select>` with inline pill row (None + 5 badge options), clicking toggles selection
- **Add "Save as draft" button** — submits with `is_active: false`; on success navigates to item detail
- **Form action row:** Cancel · Save as draft · Create item

---

## 6. Frontend — Edit item page (`menu/items/$itemId.tsx`)

### Header redesign
- **Breadcrumb:** `← {category name}` (look up category from `menuStore.categories`)
- **Title row:** item name + badge chip + Active/Inactive tag
- **Meta row:** SKU · base price · margin % · "N sold last 30 days" (show only if known — currently not available from API, so skip the sales stat or leave as placeholder)
- **Action buttons (top-right):**
  - **"86 today"** — quick 86 for `auth.currentBranchId`. If `auth.currentBranchId` is null, hide this button entirely (user has no branch selected)
  - **"Duplicate"** — UI only; shows a toast "Coming soon". Use `menuStore.latestAlert` pattern (already used in `menu/index.tsx`) rather than `alert()` for consistency
  - **"Save changes"** — submits the active tab's form. Implementation: each tab form component accepts an `imperativeRef` prop of type `React.RefObject<{ submit: () => void }>` that the parent wires up. Only Details and Nutrition tabs need this (Modifiers and Overrides have no single save action). On tabs without a save-able form, the button is hidden.

### Tabs
- Rename "86 Management" tab label → "86 history" — **keep the tab `id` as `'eighty_six'`** to avoid any deep-link breakage
- Add "Core info" section header in Details tab

### Modifier groups tab (drag-to-reorder)
- Use `@dnd-kit/sortable` to make attached modifier groups draggable
- On drop, call `MenuService.reorderModifierGroups(itemId, orderedGroupIds)` (new API endpoint)
- Requires adding `PUT /menu/items/{id}/modifier-groups/reorder` to the API

### Nutrition tab
- Add nutrition facts panel preview (visual right-side panel showing the label as-filled) — rendered alongside the form on wider screens, below on narrow
- No new fields (user opted out of saturated fat)

---

## 7. Frontend — New category page (`menu/categories/new.tsx`)

New route. The existing inline sidebar form stays for quick-add; this full page is for complete setup.

Sections:
1. **Basics:** Name (required), Description (max 80 chars, optional, new field — enforce `maxLength={80}` on the `<Input>`), Slug (read-only preview derived client-side as `name.toLowerCase().replace(/[^a-z0-9]+/g, '-')` — actual slug is generated by API on save), Sort position (number input), Parent category (select), Active toggle
2. **Appearance:** Photo upload (existing `uploadCategoryPhoto` logic — only available after category is saved; show notice "Save first to upload a photo" on new form), Icon glyph (2-letter `<Input>` with `maxLength={2}`, new field), Accent colour — use `<Input type="color">` (no separate ColorPicker component exists in the design system)
3. **Availability:** "Restrict by hours / days" checkbox → shows from/until time inputs + day toggles (same pattern as item availability; new fields on category)

Route: `/menu/categories/new`
On success → navigate to `/menu`

Create directory `web/src/routes/_authenticated/menu/categories/` and file `new.tsx`. TanStack Router's Vite plugin will auto-update `routeTree.gen.ts`.

---

## 8. Frontend — Modifier groups list (`menu/modifier-groups/index.tsx`)

Changes:
- **Filter tabs:** All groups / Required / Optional / Single select / Multi select / Unused — client-side filter on loaded groups
- **Search input:** Filter by group name or option name
- **Sort:** "Most used ▾" (requires `used_by_count` from API — add to `ModifierGroupResource`), fallback A–Z
- **Group cards:** Show `DEFAULT` badge on default modifiers, "Used by N items" count
- **Import button:** UI only ("Coming soon")

Backend: `used_by_count` is added in §1c above (service + resource). The "Unused" filter tab relies on `used_by_count === 0` — this only works after the backend is updated (step 1 in implementation order).

---

## 9. Frontend — New modifier form (`menu/modifier-groups/new.tsx`)

Changes:
- **Prompt field:** Text input for guest-facing prompt above options
- **Available on POS toggle:** `<Checkbox>` for `available_on_pos`
- **Drag-to-reorder options:** Use `@dnd-kit/sortable` on the options list
- **Attach to items section:** Multi-select from loaded `menuStore.itemList` — after group is created, call `MenuService.attachModifierGroup(itemId, groupId)` for each selected item using `Promise.allSettled`; report any per-item failures inline (don't block navigation for partial failure)

---

## 10. Frontend — Edit modifier group (`menu/modifier-groups/$groupId.tsx`)

Same changes as new form (prompt, POS toggle, drag-to-reorder options) plus the group's attached-items are shown with a detach option.

---

## Implementation order

Do these in sequence (each depends on the previous):

1. **Backend migrations + API updates** (items 1a, 1b, 1c, 1d, 1e) — unblock frontend type changes
2. **Frontend types + store** (item 2)
3. **Install @dnd-kit** (item 3)
4. **Menu listing redesign** (item 4) — biggest, most visible
5. **New item form** (item 5)
6. **Edit item page** (item 6)
7. **New category page** (item 7) — new route
8. **Modifier groups list** (item 8)
9. **New modifier form + edit modifier group** (items 9 & 10)

---

## Critical files

| File | Purpose |
|---|---|
| `/api/database/migrations/...` | New migrations (ask before creating) |
| `/api/app/Models/ModifierGroup.php` | Add `prompt`, `available_on_pos` to fillable |
| `/api/app/Models/MenuCategory.php` | Add new fields to fillable + `available_days` cast |
| `/api/app/Services/Menu/ModifierGroupService.php` | Add `withCount('menuItems')` to list query; add `reorder()` method |
| `/api/app/Http/Requests/Menu/ReorderModifierGroupsRequest.php` | New file |
| `/web/src/types/menu.ts` | TypeScript type definitions |
| `/web/src/stores/MenuStore.ts` | MST models + `_upsertCategory()` helper |
| `/web/src/services/MenuService.ts` | Add `reorderModifierGroups()` |
| `/web/src/routes/_authenticated/menu/index.tsx` | Menu listing (largest change) |
| `/web/src/routes/_authenticated/menu/items/new.tsx` | New item form |
| `/web/src/routes/_authenticated/menu/items/$itemId.tsx` | Edit item + tabs |
| `/web/src/routes/_authenticated/menu/categories/new.tsx` | New file (create directory too) |
| `/web/src/routes/_authenticated/menu/modifier-groups/index.tsx` | Modifier groups list |
| `/web/src/routes/_authenticated/menu/modifier-groups/new.tsx` | New modifier form |
| `/web/src/routes/_authenticated/menu/modifier-groups/$groupId.tsx` | Edit modifier group |

---

## Verification

- Run `npm run dev` in `/web` and navigate through each changed page
- Run `npm run lint` in `/web` to confirm no TypeScript errors
- Test golden paths: create category → create item → attach modifier group → 86 item → restore
- Verify drag-to-reorder modifier groups persists after page reload (`sort_order` on pivot is saved via reorder endpoint)
- Verify drag-to-reorder modifier options (within group form) persists after save
- Verify auto-SKU: submit new item form without SKU field; confirm item is created with a generated SKU in `SLUG-XXXX` format
- Verify new modifier fields (`prompt`, `available_on_pos`) round-trip through the API
- Verify new category fields (`description`, `accent_colour`, `icon_glyph`, `available_days`) round-trip
- Verify "86 today" header button is hidden when no branch is selected
- Verify "Unused" filter tab on modifier groups list correctly shows only groups with `used_by_count === 0`
- Run `php artisan test` in `/api` to verify no regression from migrations
