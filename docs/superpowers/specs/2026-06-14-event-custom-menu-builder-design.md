# Per-Event Custom Menu Builder — Design Spec

**Date:** 2026-06-14
**Status:** Approved (pending spec review)
**New architectural decision:** Decision 49 (to be recorded in `decisions.md`)
**Scope:** `/api` (Laravel) + `/web` (staff app). No `/admin`, no `/landing`.

---

## 1. Problem

`events.custom_menu` is a `jsonb` column that already exists, is `fillable`, is cast to
`array`, and is accepted by `EventController::update` as `['nullable','array']`. But it has
**no defined row shape, no form to build it, and no render anywhere** — it is an empty
extension point surfaced by the 2026-06-14 orphaned-data audit, not a feature.

Events today get their menu via predefined `event_packages` (`event.package.name` shown on
the detail page) plus a free-text `run_sheet.menu_summary`. `custom_menu` is meant for
**bespoke à-la-carte items on a specific event**, distinct from the package.

`EventController::store` does **not** accept `custom_menu`; only `update` does. Nothing in
seeders/tests/factories defines a row shape.

## 2. Goals

- Define a concrete, validated row shape for `custom_menu`.
- Let staff build/edit the custom menu on the event detail page using design-system components.
- Show a computed, **display-only** estimate that combines the package and the custom menu.
- Render the custom menu on the run sheet (the on-the-day menu document).

## 3. Non-Goals (explicitly out of scope)

- Writing the custom menu into `actual_spend` or the minimum-spend compliance check
  (`actual_spend` stays driven solely by linked POS orders — Decision 42).
- A create-time builder on the enquiry form (`store` stays lightweight).
- Course tracking (separately deferred — see CLAUDE.md §6).
- A generic dynamic report/menu query engine.
- PDF redesign beyond a single run-sheet block.
- A new permission slug.
- A database migration (the column, cast, and `fillable` entry already exist).

## 4. Decisions captured during brainstorming

| # | Decision |
|---|---|
| Row shape | Priced line items, each with an optional reference to an existing menu item. |
| Pricing | Per-row `pricing_mode` toggle (`per_item` \| `per_head`) with a **single** `unit_price` field. |
| Spend interaction | Subtotal is **display-only**. `actual_spend` and the min-spend check are untouched. |
| Render | Own **Custom Menu** tab on the event detail page, inline add/edit, running subtotal. |
| When editable | **Update-only** (detail page). `store` is unchanged. |
| API shape | Introduce a full **`EventResource`** and route all event-returning endpoints through it. |
| Permissions | `events.view` to read, `events.manage` to add/edit/delete. No new slug. |

## 5. Data Shape — `events.custom_menu` (JSONB)

Array of priced line items:

```jsonc
custom_menu: [
  {
    "id": "uuid",                      // server-generated if absent on input
    "name": "Wagyu slider",            // required, ≤ 255
    "pricing_mode": "per_item",        // "per_item" | "per_head"
    "unit_price": 9.00,                // required, numeric ≥ 0, 2dp — price per item OR per head
    "quantity": 50,                    // int ≥ 1; required for per_item, null/omitted for per_head
    "notes": "No onions" ,             // nullable, ≤ 500
    "menu_item_id": "uuid"             // nullable; optional reference. name/price still stored inline
  }
]
```

**Line total:**
- `per_item` → `unit_price × quantity`
- `per_head` → `unit_price × event.guest_count` (→ `0` with a UI hint when `guest_count` is null)

**Subtotal** = Σ line totals. Computed, **never stored**.

## 6. Backend (`/api`)

### 6.1 `UpdateEventRequest` (new `App\Http\Requests\Events\UpdateEventRequest`)
Moves the current `update()` inline rules into a Form Request (matches the
"Form Request classes for all validation" convention) and adds nested rules:

```php
'custom_menu'                  => ['nullable', 'array'],
'custom_menu.*.id'             => ['nullable', 'uuid'],
'custom_menu.*.name'           => ['required', 'string', 'max:255'],
'custom_menu.*.pricing_mode'   => ['required', Rule::in(['per_item', 'per_head'])],
'custom_menu.*.unit_price'     => ['required', 'numeric', 'min:0', 'max:99999.99'],
'custom_menu.*.quantity'       => ['nullable', 'integer', 'min:1'],   // conditional requirement enforced in withValidator (see below)
'custom_menu.*.notes'          => ['nullable', 'string', 'max:500'],
'custom_menu.*.menu_item_id'   => ['nullable', 'uuid', /* tenant-scoped exists, see below */],
```

> **Gotcha:** Laravel's `required_if` does **not** resolve the `*` wildcard to the current
> row's index, so `required_if:custom_menu.*.pricing_mode,per_item` cannot express
> "quantity required when *this* row is per_item". Enforce it in `withValidator()` by
> iterating the rows and adding an error on `custom_menu.{i}.quantity` when
> `pricing_mode === 'per_item'` and `quantity` is missing/invalid.

`menu_item_id` uses a **tenant-scoped** existence check (a closure / `Rule::exists`
constrained to `resolved_tenant_id`) so a row can never reference another tenant's menu
item — honoring the CLAUDE.md tenant-isolation critical rule. (`menu_items` has a
`TenantScope` global scope; the raw `exists` rule bypasses it, so the constraint is added
explicitly.)

> Other event endpoints keep their existing inline validation; only `update` moves to a
> Form Request, because that is where `custom_menu` lives. (Noted as an intentional
> consistency trade-off to keep blast radius small.)

### 6.2 Service normalization
In `EventService` (or the controller's update path), normalize each row before persist:
- generate `id` (UUID) when absent,
- force `quantity` to `null` when `pricing_mode === 'per_head'`,
- keep `name`/`unit_price` inline even when `menu_item_id` is set.

### 6.3 `EventResource` (new `App\Http\Resources\Events\EventResource`)
Outputs the **full event shape** — every field the current MST model reads, with unchanged
keys — plus:
- `custom_menu` (array, or `null`),
- `custom_menu_subtotal` (number) — computed mode-aware: per-item lines use `quantity`,
  per-head lines use `$this->guest_count`.

Relations (`space`, `package`, `corporate_account`, `tasks`, `parent_event`, `child_events`)
emitted via `whenLoaded` to preserve the current "absent when not loaded" semantics that the
MST `_upsertEvent` relies on.

### 6.4 Controller wiring
Route **all** event-returning methods through `EventResource` so the single MST
`_upsertEvent` always receives one consistent shape:
`index`, `show`, `store`, `update`, `sendProposal`, `confirm`, `approveCredit`, `cancel`,
`markLost`, `moveToPreEvent`, `moveToDayOf`, `complete`, `recurrence`.

- `index` wraps `EventResource::collection($events->items())` and re-attaches the existing
  pagination meta (`current_page`/`last_page`/`per_page`/`total`) by hand — the same idiom
  already used by `EventController::orders()`. **`ApiResponse` is not modified.**
- `update` accepts `UpdateEventRequest`.

### 6.5 Run sheet
`EventService::buildRunSheet` already carries `custom_menu` into the run-sheet JSONB, so the
structured rows flow through with no service change. Add a **Custom Menu block** to
`resources/views/exports/run-sheet.blade.php` rendering each line (name, mode, qty/heads,
line total) and the subtotal. `actual_spend` / min-spend logic untouched.

## 7. Frontend (`/web`)

### 7.1 Types (`src/types/events.ts`)
```ts
export type CustomMenuPricingMode = 'per_item' | 'per_head'

export interface CustomMenuItem {
  id: string
  name: string
  pricing_mode: CustomMenuPricingMode
  unit_price: number
  quantity: number | null
  notes: string | null
  menu_item_id: string | null
}
```
- Add to `Event`: `custom_menu: CustomMenuItem[] | null` and `custom_menu_subtotal: number`.
- Add to `UpdateEventPayload`: `custom_menu?: CustomMenuItem[]`.

### 7.2 Store (`src/stores/EventStore.ts`)
- Add `custom_menu` (`types.maybeNull(types.frozen<CustomMenuItem[]>())`) and
  `custom_menu_subtotal` (`types.optional(types.number, 0)`) to `EventModel`.
- Map both in `_upsertEvent`.
- Persist via the **existing** `updateEvent` action (`custom_menu` passed in
  `UpdateEventPayload`). No new store action.

### 7.3 New `CustomMenuTab` (in `src/routes/_authenticated/events/$eventId.tsx`)
- Added to the `TabBar` with a count badge:
  `Details | Tasks | Run sheet | Orders | Recurrence | Custom Menu (n)`.
- Follows the `DetailsTab` edit pattern: a **local working copy** seeded from
  `event.custom_menu`; inline add / edit / remove rows; a dirty indicator; a single
  **Save** button that calls `updateEvent({ custom_menu })` (no PATCH-per-keystroke).
- Row controls — **design-system components only**:
  - `SegmentedControl` — Per item / Per head.
  - `Input` — name.
  - `NumberInput` — quantity (per_item only) and unit_price.
  - `Input` or `Textarea` — notes.
  - `Combobox` — pick an existing menu item; **autofills** `name` + `unit_price`
    (`base_price`) and sets `menu_item_id`; all fields remain editable afterward.
  - `IconButton` — remove row. (Removal is local until Save; no ConfirmModal needed.)
- Per-head rows show the event's guest count as a read-only `× N` multiplier and the
  computed line total; if `guest_count` is null, total shows `0` with a hint to set guests.
- Running subtotal at the foot.
- Gating: tab is visible with `events.view`; all edit controls and the Save button require
  `events.manage` (`authStore.can(...)`).

### 7.4 Menu-item source
The `Combobox` depends on the existing `/web` menu store/service to list selectable menu
items (id, name, base_price). Loaded lazily when the tab mounts.

### 7.5 Financials (DetailsTab)
Add **display-only** lines to the Financials section:
- `Custom menu` = `custom_menu_subtotal`
- `Estimated event value` = `(package.price_per_head × guest_count)` + `custom_menu_subtotal`

No writes; purely a planning figure.

### 7.6 i18n
Add `events.custom_menu_*` en-US keys (tab label, add item, per item / per head, unit price,
price per head, quantity, notes, subtotal, estimated value, save, empty state, guest-count hint).

## 8. Permissions

| Action | Slug |
|---|---|
| Read custom menu | `events.view` |
| Add / edit / delete | `events.manage` |

No new slug. UI gating is UX only; the API re-validates via `Gate::authorize('events.manage')`
in `update`.

## 9. Migration

**None.** `events.custom_menu` (`jsonb`, nullable), the `array` cast, and the `fillable`
entry already exist. (Flagged per the CLAUDE.md migration-ask rule — there is nothing to
create.)

## 10. Testing

Per project convention, automated tests are **not written without explicit approval**. If
approved, candidate coverage:
- API: `update` accepts a valid `custom_menu`; rejects bad rows (missing name, per_item
  without quantity, negative price, cross-tenant `menu_item_id`); `EventResource` returns
  `custom_menu_subtotal` correct for mixed modes; tenant isolation on the menu-item reference.
- Web: subtotal computation (mixed modes, null guest_count); Combobox autofill; Save round-trip.

## 11. Decision 49 (to add to `decisions.md`)

Record: row shape, per-row `pricing_mode` with single `unit_price`, display-only subtotal,
full `EventResource` adoption, update-only, `events.view`/`events.manage`, no migration,
no new slug.
