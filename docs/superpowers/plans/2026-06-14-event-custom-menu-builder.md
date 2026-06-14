# Event Custom Menu Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give events a per-event bespoke custom-menu builder (`events.custom_menu`) with priced per-item/per-head line items, a display-only estimate, run-sheet rendering, and a full `EventResource`.

**Architecture:** `custom_menu` is an existing nullable `jsonb` column (no migration). The backend gains a validated row shape (`UpdateEventRequest`), a server-computed subtotal and a new `EventResource` that every event-returning endpoint flows through so the single MST `_upsertEvent` always sees one shape. The `/web` event detail page gains a "Custom Menu" tab (local-working-copy editor, one Save) and display-only Financials estimate lines.

**Tech Stack:** Laravel 12 / PHP 8.3 (API Resources, Form Requests, Blade/DomPDF), React 19 + TypeScript + MobX-State-Tree (`/web`), design-system components only.

> **Standing user rules honored here:** (1) **No automated tests** are written unless the user approves — Task 11 is gated. (2) **Commits only when the user asks** — commit steps are checkpoints, do not run them unprompted. (3) **No new migration** (column already exists).

---

## File Structure

**API (`/api`)**
- Create: `app/Http/Requests/Events/UpdateEventRequest.php` — update validation incl. nested `custom_menu.*` rules + `withValidator` conditional quantity + tenant-scoped `menu_item_id`.
- Create: `app/Http/Resources/Events/EventResource.php` — full event output + `custom_menu` + `custom_menu_subtotal`.
- Modify: `app/Services/Events/EventService.php` — add `normalizeCustomMenu()` static helper.
- Modify: `app/Http/Controllers/Api/V1/Events/EventController.php` — use `UpdateEventRequest`, normalize, route all event-returning methods through `EventResource`.
- Modify: `resources/views/exports/run-sheet.blade.php` — Custom Menu block.
- Modify: `lang/en-US/web.php` — `events.custom_menu_*` keys.

**Web (`/web`)**
- Modify: `src/types/events.ts` — `CustomMenuItem` + `Event` fields + `UpdateEventPayload`.
- Modify: `src/stores/EventStore.ts` — model fields + `_upsertEvent` mapping.
- Modify: `src/routes/_authenticated/events/$eventId.tsx` — `CustomMenuTab`, TabBar wiring, Financials estimate lines.

**Docs**
- Modify: `decisions.md` (Decision 49), `GAPS.md`, memory files.

---

## Task 1: `UpdateEventRequest` (validation)

**Files:**
- Create: `api/app/Http/Requests/Events/UpdateEventRequest.php`

- [ ] **Step 1: Create the Form Request**

```php
<?php

declare(strict_types=1);

namespace App\Http\Requests\Events;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Gate::authorize('events.manage') is enforced in the controller
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $tenantId = $this->get('resolved_tenant_id');

        return [
            'title'                      => ['nullable', 'string', 'max:255'],
            'space_id'                   => ['nullable', 'uuid', 'exists:event_spaces,id'],
            'organiser_name'             => ['sometimes', 'string', 'max:255'],
            'organiser_email'            => ['nullable', 'email', 'max:255'],
            'organiser_phone'            => ['nullable', 'string', 'max:30'],
            'occasion_type'              => ['nullable', 'string', 'max:100'],
            'event_date'                 => ['sometimes', 'date'],
            'start_time'                 => ['sometimes', 'date_format:H:i'],
            'end_time'                   => ['sometimes', 'date_format:H:i'],
            'guest_count'                => ['nullable', 'integer', 'min:1'],
            'package_id'                 => ['nullable', 'uuid', 'exists:event_packages,id'],
            'minimum_spend'              => ['nullable', 'numeric', 'min:0'],
            'notes'                      => ['nullable', 'string', 'max:2000'],

            'custom_menu'                => ['nullable', 'array'],
            'custom_menu.*.id'           => ['nullable', 'uuid'],
            'custom_menu.*.name'         => ['required', 'string', 'max:255'],
            'custom_menu.*.pricing_mode' => ['required', Rule::in(['per_item', 'per_head'])],
            'custom_menu.*.unit_price'   => ['required', 'numeric', 'min:0', 'max:99999.99'],
            'custom_menu.*.quantity'     => ['nullable', 'integer', 'min:1'],
            'custom_menu.*.notes'        => ['nullable', 'string', 'max:500'],
            'custom_menu.*.menu_item_id' => [
                'nullable',
                'uuid',
                Rule::exists('menu_items', 'id')->where(
                    fn ($q) => $q->where('tenant_id', $tenantId),
                ),
            ],
        ];
    }

    /**
     * Laravel's required_if does not resolve the `*` wildcard to the current row index,
     * so enforce "quantity required for per_item rows" manually.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            foreach ((array) $this->input('custom_menu', []) as $i => $row) {
                $mode = $row['pricing_mode'] ?? null;
                $qty  = $row['quantity'] ?? null;
                if ($mode === 'per_item' && (! is_numeric($qty) || (int) $qty < 1)) {
                    $v->errors()->add("custom_menu.{$i}.quantity", 'Quantity is required for per-item rows.');
                }
            }
        });
    }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd api && ./vendor/bin/pint app/Http/Requests/Events/UpdateEventRequest.php && php -l app/Http/Requests/Events/UpdateEventRequest.php`
Expected: "No syntax errors detected" and Pint passes.

---

## Task 2: `normalizeCustomMenu` service helper

**Files:**
- Modify: `api/app/Services/Events/EventService.php`

- [ ] **Step 1: Add a static normalizer** (place it near the top of the class body, after the constructor)

```php
    /**
     * Normalize custom-menu rows before persist:
     * - generate a UUID id when absent,
     * - drop quantity for per_head rows (guest_count is the multiplier),
     * - coerce numeric types.
     *
     * @param  array<int, array<string, mixed>>  $rows
     * @return array<int, array<string, mixed>>
     */
    public static function normalizeCustomMenu(array $rows): array
    {
        return array_values(array_map(function (array $row): array {
            $mode = ($row['pricing_mode'] ?? 'per_item') === 'per_head' ? 'per_head' : 'per_item';

            return [
                'id'           => $row['id'] ?? (string) \Illuminate\Support\Str::uuid(),
                'name'         => (string) ($row['name'] ?? ''),
                'pricing_mode' => $mode,
                'unit_price'   => round((float) ($row['unit_price'] ?? 0), 2),
                'quantity'     => $mode === 'per_item' ? (int) ($row['quantity'] ?? 1) : null,
                'notes'        => isset($row['notes']) && $row['notes'] !== '' ? (string) $row['notes'] : null,
                'menu_item_id' => $row['menu_item_id'] ?? null,
            ];
        }, $rows));
    }
```

- [ ] **Step 2: Verify**

Run: `cd api && ./vendor/bin/pint app/Services/Events/EventService.php --test && php -l app/Services/Events/EventService.php`
Expected: no syntax errors; Pint clean (run without `--test` to auto-fix if needed).

---

## Task 3: `EventResource`

**Files:**
- Create: `api/app/Http/Resources/Events/EventResource.php`

- [ ] **Step 1: Create the Resource**

```php
<?php

declare(strict_types=1);

namespace App\Http\Resources\Events;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id'                   => $this->id,
            'tenant_id'            => $this->tenant_id,
            'branch_id'            => $this->branch_id,
            'title'                => $this->title,
            'occasion_type'        => $this->occasion_type,
            'event_date'           => $this->event_date?->format('Y-m-d'),
            'start_time'           => $this->start_time,
            'end_time'             => $this->end_time,
            'guest_count'          => $this->guest_count,
            'organiser_name'       => $this->organiser_name,
            'organiser_email'      => $this->organiser_email,
            'organiser_phone'      => $this->organiser_phone,
            'status'               => $this->status,
            'enquiry_status'       => $this->enquiry_status,
            'lost_reason'          => $this->lost_reason,
            'space_id'             => $this->space_id,
            'package_id'           => $this->package_id,
            'corporate_account_id' => $this->corporate_account_id,
            'customer_profile_id'  => $this->customer_profile_id,
            'minimum_spend'        => $this->minimum_spend,
            'actual_spend'         => $this->actual_spend ?? 0,
            'deposit_amount'       => $this->deposit_amount,
            'deposit_paid_at'      => $this->deposit_paid_at,
            'notes'                => $this->notes,
            'run_sheet'            => $this->run_sheet,

            'custom_menu'          => $this->custom_menu,
            'custom_menu_subtotal' => $this->customMenuSubtotal(),

            'parent_event_id'      => $this->parent_event_id,
            'recurrence_rule'      => $this->recurrence_rule,

            'space'                => $this->whenLoaded('space'),
            'package'              => $this->whenLoaded('package'),
            'corporate_account'    => $this->whenLoaded('corporateAccount'),
            'customer_profile'     => $this->whenLoaded('customerProfile'),
            'tasks'                => $this->whenLoaded('tasks'),
            'parent_event'         => $this->whenLoaded('parentEvent'),
            'child_events'         => $this->whenLoaded('childEvents'),

            'created_at'           => $this->created_at,
            'updated_at'           => $this->updated_at,
        ];
    }

    /** Mode-aware subtotal: per_item = unit_price*quantity; per_head = unit_price*guest_count. */
    private function customMenuSubtotal(): float
    {
        $guests = (int) ($this->guest_count ?? 0);

        $total = 0.0;
        foreach ((array) ($this->custom_menu ?? []) as $row) {
            $price = (float) ($row['unit_price'] ?? 0);
            $total += ($row['pricing_mode'] ?? 'per_item') === 'per_head'
                ? $price * $guests
                : $price * (int) ($row['quantity'] ?? 0);
        }

        return round($total, 2);
    }
}
```

- [ ] **Step 2: Verify**

Run: `cd api && ./vendor/bin/pint app/Http/Resources/Events/EventResource.php && php -l app/Http/Resources/Events/EventResource.php`
Expected: "No syntax errors detected".

---

## Task 4: Route the controller through `EventResource`

**Files:**
- Modify: `api/app/Http/Controllers/Api/V1/Events/EventController.php`

- [ ] **Step 1: Add imports** (top of file, with the other `use` statements)

```php
use App\Http\Requests\Events\UpdateEventRequest;
use App\Http\Resources\Events\EventResource;
```

- [ ] **Step 2: `index` — wrap items in the Resource, keep pagination meta**

Replace the `return ApiResponse::paginated($events);` line (and keep the query above it) with:

```php
        return response()->json([
            'data' => EventResource::collection($events->items()),
            'meta' => [
                'current_page' => $events->currentPage(),
                'last_page'    => $events->lastPage(),
                'per_page'     => $events->perPage(),
                'total'        => $events->total(),
            ],
        ]);
```

`index` was the only `ApiResponse` user in this controller, so its import is now unused. Remove `use App\Http\Responses\ApiResponse;` (Pint's `no_unused_imports` rule would strip it anyway in Step 7).

- [ ] **Step 3: `store` — return the Resource** (keep the existing `createEnquiry` call)

Replace `return response()->json(['data' => $event->load(['space', 'package'])], 201);` with:

```php
        return (new EventResource($event->load(['space', 'package'])))
            ->response()
            ->setStatusCode(201);
```

- [ ] **Step 4: `show` — return the Resource**

Replace the `return response()->json([...load(...)]);` block with:

```php
        return (new EventResource($event->load([
            'space', 'package', 'corporateAccount', 'tasks.assignee', 'customerProfile',
            'parentEvent:id,title,organiser_name,event_date',
            'childEvents' => fn ($q) => $q->orderBy('event_date'),
        ])))->response();
```

- [ ] **Step 5: `update` — use `UpdateEventRequest`, normalize, return the Resource**

Replace the whole `update` method signature and body with:

```php
    public function update(UpdateEventRequest $request, Event $event): JsonResponse
    {
        Gate::authorize('events.manage');
        abort_if($event->tenant_id !== $request->get('resolved_tenant_id'), 404);

        $data = $request->validated();

        if (array_key_exists('custom_menu', $data)) {
            $data['custom_menu'] = $data['custom_menu'] === null
                ? null
                : \App\Services\Events\EventService::normalizeCustomMenu($data['custom_menu']);
        }

        $event->update($data);

        return (new EventResource($event->fresh()->load(['space', 'package'])))->response();
    }
```

- [ ] **Step 6: Action endpoints — return the Resource**

For each of these methods, replace the final `return response()->json(['data' => $event...]);` with `return (new EventResource($event...))->response();`, preserving any `->load(...)`/`->fresh()` already present:
- `sendProposal` → `new EventResource($event)`
- `confirm` → `new EventResource($event->load(['tasks']))`
- `approveCredit` → `new EventResource($event)`
- `cancel` → `new EventResource($event)`
- `markLost` → `new EventResource($event)`
- `moveToPreEvent` → `new EventResource($event)`
- `moveToDayOf` → `new EventResource($event->fresh())`
- `complete` → `new EventResource($event)`

Leave `confirm`/`complete`/`approveCredit` **error** branches (the 409/422 `response()->json([...])`) exactly as they are — only the success return changes.

For `recurrence`, keep the children payload shape:

```php
        return response()->json([
            'data'     => new EventResource($event->fresh()),
            'children' => $children,
        ]);
```

Leave `initiateDeposit`, `runSheet`, `runSheetPdf`, `listTasks`, `createTask`, `updateTask`, `orders`, `attachOrder`, `detachOrder` unchanged (they don't return a full event).

- [ ] **Step 7: Verify**

Run: `cd api && ./vendor/bin/pint app/Http/Controllers/Api/V1/Events/EventController.php && php -l app/Http/Controllers/Api/V1/Events/EventController.php`
Expected: "No syntax errors detected".

- [ ] **Step 8: Manual smoke (optional, requires a running API + token)**

Run a `GET /api/v1/events` and `GET /api/v1/events/{id}` and confirm each event now carries `custom_menu` (null initially) and `custom_menu_subtotal: 0`, and that `space`/`package` still appear where loaded. (Tinker alternative: `App\Http\Resources\Events\EventResource::make(App\Models\Event::with('space')->first())->toArray(request())`.)

---

## Task 5: Run-sheet Custom Menu block

**Files:**
- Modify: `api/resources/views/exports/run-sheet.blade.php`

- [ ] **Step 1: Insert the block** immediately after the `@endif` that closes the Package section and before the `@if(!empty($runSheet['notes']))` Notes section:

```blade
@if(!empty($runSheet['custom_menu']))
<h2>Custom Menu</h2>
<table class="tasks">
    <thead>
        <tr>
            <th>Item</th>
            <th>Pricing</th>
            <th>Qty / Heads</th>
            <th>Unit Price</th>
            <th>Line Total</th>
        </tr>
    </thead>
    <tbody>
        @php($menuSubtotal = 0)
        @foreach($runSheet['custom_menu'] as $line)
            @php($isPerHead = ($line['pricing_mode'] ?? 'per_item') === 'per_head')
            @php($multiplier = $isPerHead ? (int) ($runSheet['guest_count'] ?? 0) : (int) ($line['quantity'] ?? 0))
            @php($lineTotal = (float) ($line['unit_price'] ?? 0) * $multiplier)
            @php($menuSubtotal += $lineTotal)
            <tr>
                <td>
                    {{ $line['name'] ?? '—' }}
                    @if(!empty($line['notes']))<br><span style="color:#888;font-size:9px;">{{ $line['notes'] }}</span>@endif
                </td>
                <td>{{ $isPerHead ? 'Per head' : 'Per item' }}</td>
                <td>{{ $multiplier }}</td>
                <td>£{{ number_format((float) ($line['unit_price'] ?? 0), 2) }}</td>
                <td>£{{ number_format($lineTotal, 2) }}</td>
            </tr>
        @endforeach
        <tr>
            <td colspan="4" style="text-align:right;font-weight:bold;">Subtotal</td>
            <td style="font-weight:bold;">£{{ number_format($menuSubtotal, 2) }}</td>
        </tr>
    </tbody>
</table>
@endif
```

- [ ] **Step 2: Verify the Blade compiles**

Run: `cd api && php artisan view:clear` (no error). Optionally render a run-sheet PDF for an event that has `custom_menu` rows and confirm the block appears.

---

## Task 6: API i18n keys (en-US)

**Files:**
- Modify: `api/lang/en-US/web.php`

- [ ] **Step 1: Add keys inside the `'events' => [ ... ]` array** (near the other event keys, e.g. after `'run_sheet' => 'Run sheet',`):

```php
        'custom_menu'                => 'Custom menu',
        'custom_menu_empty'          => 'No custom menu items yet.',
        'custom_menu_add'            => 'Add item',
        'custom_menu_item_name'      => 'Item name',
        'custom_menu_pricing'        => 'Pricing',
        'custom_menu_per_item'       => 'Per item',
        'custom_menu_per_head'       => 'Per head',
        'custom_menu_quantity'       => 'Quantity',
        'custom_menu_unit_price'     => 'Unit price',
        'custom_menu_price_per_head' => 'Price / head',
        'custom_menu_line_total'     => 'Line total',
        'custom_menu_subtotal'       => 'Custom menu subtotal',
        'custom_menu_notes'          => 'Notes',
        'custom_menu_pick_item'      => 'Link a menu item (optional)',
        'custom_menu_guest_hint'     => 'Set a guest count to price per-head items.',
        'custom_menu_save'           => 'Save menu',
        'custom_menu_saved'          => 'Custom menu saved.',
        'estimated_event_value'      => 'Estimated event value',
        'package_estimate'           => 'Package estimate',
```

- [ ] **Step 2: Clear the translation cache**

Run: `cd api && php artisan cache:clear`
Expected: cache cleared (the TranslationController caches per locale/app for 300s).

---

## Task 7: Frontend types

**Files:**
- Modify: `web/src/types/events.ts`

- [ ] **Step 1: Add the `CustomMenuItem` type** (near the other domain models, e.g. above `export interface Event`):

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

- [ ] **Step 2: Add fields to `Event`** (after `notes: string | null`):

```ts
  custom_menu: CustomMenuItem[] | null
  custom_menu_subtotal: number
```

- [ ] **Step 3: Add to `UpdateEventPayload`** (after `notes?: string | null`):

```ts
  custom_menu?: CustomMenuItem[]
```

- [ ] **Step 4: Verify types compile**

Run: `cd web && npx tsc --noEmit`
Expected: no new errors from `types/events.ts` (errors will remain until Task 8 maps the fields — that's fine; re-run after Task 8).

---

## Task 8: EventStore model + mapping

**Files:**
- Modify: `web/src/stores/EventStore.ts`

- [ ] **Step 1: Import the type** — add `CustomMenuItem` to the existing `import type { ... } from '@/types/events'` list.

- [ ] **Step 2: Add fields to `EventModel`** (after the `notes:` line):

```ts
  custom_menu:          types.maybeNull(types.frozen<CustomMenuItem[]>()),
  custom_menu_subtotal: types.optional(types.number, 0),
```

- [ ] **Step 3: Map them in `_upsertEvent`** (after the `notes:` mapping line):

```ts
        custom_menu:          event.custom_menu ?? null,
        custom_menu_subtotal: Number(event.custom_menu_subtotal ?? 0),
```

- [ ] **Step 4: Verify**

Run: `cd web && npx tsc --noEmit && npm run lint`
Expected: no errors related to events types/store.

---

## Task 9: `CustomMenuTab` + TabBar wiring

**Files:**
- Modify: `web/src/routes/_authenticated/events/$eventId.tsx`

- [ ] **Step 1: Add imports** (with the other component/store imports at the top):

```ts
import { SegmentedControl } from '@/components/ui/segmented-control'
import { Combobox } from '@/components/ui/combobox'
import { IconButton } from '@/components/ui/icon-button'
import { useMenuStore } from '@/stores/context'
import { Plus, Trash2 } from 'lucide-react'
import type { CustomMenuItem, CustomMenuPricingMode } from '@/types/events'
```

(If `lucide-react` icons are imported elsewhere in the file, merge into the existing import.)

- [ ] **Step 2: Add the `CustomMenuTab` component** (place it after `RunSheetTab`, before `DetailsTab`):

```tsx
// ── Custom Menu Tab (Decision 49) ───────────────────────────────────────────

function lineTotal(row: CustomMenuItem, guestCount: number | null): number {
  if (row.pricing_mode === 'per_head') return row.unit_price * (guestCount ?? 0)
  return row.unit_price * (row.quantity ?? 0)
}

const CustomMenuTab = observer(function CustomMenuTab({
  event,
  canManage,
}: {
  event: EventModelType
  canManage: boolean
}) {
  const eventStore = useEventStore()
  const menuStore = useMenuStore()
  const t = useT()

  const [rows, setRows] = useState<CustomMenuItem[]>(() => event.custom_menu ?? [])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void menuStore.fetchItems({ is_active: true })
  }, [menuStore])

  const dirty = JSON.stringify(rows) !== JSON.stringify(event.custom_menu ?? [])
  const subtotal = rows.reduce((sum, r) => sum + lineTotal(r, event.guest_count), 0)

  const menuOptions = menuStore.itemList.map((i) => ({ value: i.id, label: i.name }))

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: '',
        pricing_mode: 'per_item',
        unit_price: 0,
        quantity: 1,
        notes: null,
        menu_item_id: null,
      },
    ])
  }

  function patchRow(id: string, patch: Partial<CustomMenuItem>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  function pickMenuItem(id: string, menuItemId: string) {
    const item = menuStore.itemList.find((i) => i.id === menuItemId)
    if (!item) return
    patchRow(id, {
      menu_item_id: menuItemId,
      name: item.name,
      unit_price: Number(item.base_price),
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      await eventStore.updateEvent(event.id, { custom_menu: rows })
    } catch {
      // error surfaced via store
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {rows.length} {rows.length === 1 ? 'item' : 'items'}
        </p>
        {canManage && (
          <Button size="sm" variant="outline" onClick={addRow}>
            <Plus className="size-4" /> {t('events.custom_menu_add')}
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-md">
          {t('events.custom_menu_empty')}
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <FormField label={t('events.custom_menu_item_name')} htmlFor={`name-${row.id}`}>
                    <Input
                      id={`name-${row.id}`}
                      value={row.name}
                      onChange={(e) => patchRow(row.id, { name: e.target.value })}
                      disabled={!canManage}
                      placeholder="e.g. Seared scallops"
                    />
                  </FormField>
                </div>
                {canManage && (
                  <IconButton
                    icon={<Trash2 className="size-4" />}
                    label="Remove item"
                    variant="ghost"
                    size="sm"
                    className="mt-7"
                    onClick={() => removeRow(row.id)}
                  />
                )}
              </div>

              <FormField label={t('events.custom_menu_pick_item')} htmlFor={`mi-${row.id}`}>
                <Combobox
                  id={`mi-${row.id}`}
                  options={menuOptions}
                  value={row.menu_item_id ?? ''}
                  onChange={(v) => (v ? pickMenuItem(row.id, v) : patchRow(row.id, { menu_item_id: null }))}
                  placeholder={t('events.custom_menu_pick_item')}
                  clearable
                  disabled={!canManage}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label={t('events.custom_menu_pricing')}>
                  <SegmentedControl
                    options={[
                      { value: 'per_item', label: t('events.custom_menu_per_item') },
                      { value: 'per_head', label: t('events.custom_menu_per_head') },
                    ]}
                    value={row.pricing_mode}
                    onChange={(v: CustomMenuPricingMode) =>
                      patchRow(row.id, {
                        pricing_mode: v,
                        quantity: v === 'per_item' ? (row.quantity ?? 1) : null,
                      })
                    }
                    disabled={!canManage}
                  />
                </FormField>
                <FormField
                  label={
                    row.pricing_mode === 'per_head'
                      ? t('events.custom_menu_price_per_head')
                      : t('events.custom_menu_unit_price')
                  }
                >
                  <NumberInput
                    value={row.unit_price}
                    onChange={(v) => patchRow(row.id, { unit_price: v ?? 0 })}
                    min={0}
                    step={1}
                    disabled={!canManage}
                  />
                </FormField>
              </div>

              {row.pricing_mode === 'per_item' && (
                <FormField label={t('events.custom_menu_quantity')}>
                  <NumberInput
                    value={row.quantity ?? undefined}
                    onChange={(v) => patchRow(row.id, { quantity: v ?? 1 })}
                    min={1}
                    step={1}
                    disabled={!canManage}
                  />
                </FormField>
              )}

              <FormField label={t('events.custom_menu_notes')} htmlFor={`notes-${row.id}`}>
                <Input
                  id={`notes-${row.id}`}
                  value={row.notes ?? ''}
                  onChange={(e) => patchRow(row.id, { notes: e.target.value || null })}
                  disabled={!canManage}
                  placeholder="Optional"
                />
              </FormField>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {row.pricing_mode === 'per_head'
                    ? `${formatCurrency(row.unit_price)} × ${event.guest_count ?? 0}`
                    : `${formatCurrency(row.unit_price)} × ${row.quantity ?? 0}`}
                </span>
                <span className="font-semibold tabular-nums">
                  {t('events.custom_menu_line_total')}: {formatCurrency(lineTotal(row, event.guest_count))}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {rows.some((r) => r.pricing_mode === 'per_head') && !event.guest_count && (
        <p className="text-xs text-amber-600">{t('events.custom_menu_guest_hint')}</p>
      )}

      <div className="flex items-center justify-between border-t pt-3">
        <span className="text-sm font-semibold">{t('events.custom_menu_subtotal')}</span>
        <span className="text-sm font-semibold tabular-nums">{formatCurrency(subtotal)}</span>
      </div>

      {canManage && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => void handleSave()} loading={saving} disabled={!dirty || saving}>
            {t('events.custom_menu_save')}
          </Button>
        </div>
      )}
    </div>
  )
})
```

- [ ] **Step 3: Add the tab to the `TabBar`** in `EventDetailPage`. Update the `tab` state union, the `tabs` array, the `onChange` cast, and the tab-content switch.

State type — change:
```tsx
  const [tab, setTab] = useState<'details' | 'tasks' | 'run-sheet' | 'orders' | 'recurrence'>('details')
```
to:
```tsx
  const [tab, setTab] = useState<'details' | 'tasks' | 'run-sheet' | 'orders' | 'recurrence' | 'custom-menu'>('details')
```

`tabs` array — add after the `recurrence` entry:
```tsx
            { id: 'custom-menu', label: `${t('events.custom_menu')}${event.custom_menu ? ` (${event.custom_menu.length})` : ''}` },
```

`onChange` cast — change the union in the `as` cast to include `'custom-menu'`:
```tsx
          onChange={(id) => setTab(id as 'details' | 'tasks' | 'run-sheet' | 'orders' | 'recurrence' | 'custom-menu')}
```

Tab content — add after the `recurrence` line:
```tsx
          {tab === 'custom-menu' && <CustomMenuTab event={event} canManage={canManage} />}
```

- [ ] **Step 4: Verify**

Run: `cd web && npx tsc --noEmit && npm run lint`
Expected: no errors. If `SegmentedControl`'s `onChange` generic complains, type the value param explicitly as shown (`(v: CustomMenuPricingMode) => ...`).

---

## Task 10: Financials estimate lines

**Files:**
- Modify: `web/src/routes/_authenticated/events/$eventId.tsx` (the `DetailsTab` Financials `<section>`)

- [ ] **Step 1: Add display-only lines** inside the Financials `<dl>`, after the Actual Spend `<div>` (keep everything else):

```tsx
          {event.custom_menu_subtotal > 0 && (
            <div>
              <dt className="text-muted-foreground">{t('events.custom_menu_subtotal')}</dt>
              <dd className="font-medium">{formatCurrency(event.custom_menu_subtotal)}</dd>
            </div>
          )}
          {(event.custom_menu_subtotal > 0 || event.package) && (
            <div>
              <dt className="text-muted-foreground">{t('events.estimated_event_value')}</dt>
              <dd className="font-medium">
                {formatCurrency(
                  (event.package ? Number(event.package.price_per_head) * (event.guest_count ?? 0) : 0) +
                    event.custom_menu_subtotal,
                )}
              </dd>
            </div>
          )}
```

- [ ] **Step 2: Verify**

Run: `cd web && npx tsc --noEmit && npm run lint && npm run build`
Expected: clean type-check, lint, and production build.

- [ ] **Step 3: Manual UI smoke (optional, dev server)**

Run `cd web && npm run dev`, open an event detail page → Custom Menu tab. Add a per-item and a per-head row, link a menu item (autofills name + price), confirm line totals and subtotal, Save, reload, confirm persistence; check the Financials "Estimated event value" line.

---

## Task 11: Automated tests — GATED (ask the user first)

> Do **not** start this task without explicit user approval (standing rule: no automated testing unless asked).

If approved, cover:
- **API** (`api/tests/Feature/Events/`): `update` accepts a valid mixed-mode `custom_menu`; rejects missing `name`, `per_item` without `quantity`, negative `unit_price`, and a cross-tenant `menu_item_id`; `EventResource` returns the correct `custom_menu_subtotal` for mixed modes; tenant isolation on the menu-item reference; `normalizeCustomMenu` nulls quantity for per_head and generates ids.
- **Web** (`web/src/stores/__tests__/EventStore.test.ts`): `_upsertEvent` maps `custom_menu` + `custom_menu_subtotal`; `lineTotal` for both modes incl. null guest_count.

- [ ] Ask: "Write automated tests for the custom menu builder now?"
- [ ] If yes: write tests, run `cd api && php artisan test --filter Event` and `cd web && npm run test`, confirm green.

---

## Task 12: Documentation + memory

**Files:**
- Modify: `decisions.md` (append Decision 49), `GAPS.md`, memory files under the auto-memory dir.

- [ ] **Step 1: Append Decision 49 to `decisions.md`** summarizing: row shape (priced line items + optional `menu_item_id`), per-row `pricing_mode` with single `unit_price` (per_head × guest_count), **display-only** subtotal (`actual_spend` untouched), full `EventResource` adoption across all event-returning endpoints, update-only, `events.view`/`events.manage` (no new slug), **no migration**, run-sheet block.

- [ ] **Step 2: Update `GAPS.md`** — mark the Events `custom_menu` orphaned-data item as shipped (Decision 49).

- [ ] **Step 3: Update memory** — append to `MEMORY.md` index and add/refresh a memory file noting Decision 49 shipped and resolving the `events.custom_menu` item from `orphaned-data-audit`.

- [ ] **Step 4 (checkpoint): Commit — only when the user asks.** Suggested separate commits per repo:
  - `api`: `feat(events): per-event custom menu builder + EventResource (Decision 49)`
  - `web`: `feat(events): custom menu tab + estimated value (Decision 49)`
  - docs repo: `docs: custom menu builder shipped (Decision 49)`
  Each commit message ends with the `Co-Authored-By` trailer.

---

## Self-Review notes (author)

- **Spec coverage:** row shape (T1/T2/T7), per-head modeling (T1/T3/T9), display-only subtotal (T3/T10), own tab (T9), update-only (T1/T4), full EventResource across all endpoints (T3/T4), permissions (controller `Gate::authorize` unchanged; UI gating in T9/T10), run-sheet block (T5), no migration (stated), i18n (T6), docs/Decision 49 (T12). All covered.
- **Date handling:** `EventResource.event_date` → `format('Y-m-d')` matches the frontend's `new Date(event_date + 'T12:00:00')` and house convention (`ReservationResource`).
- **Shape consistency:** every event-returning endpoint flows through `EventResource`, so the single `_upsertEvent` always receives `custom_menu` + `custom_menu_subtotal` (subtotal defaults to 0 via `types.optional`). `whenLoaded` preserves the current "relation absent when not loaded" behavior.
- **Known assumption:** `MenuItemModel` exposes `id`, `name`, `base_price` (confirmed in `web/src/stores/MenuStore.ts`) and `menuStore.fetchItems`/`itemList` exist (confirmed). `crypto.randomUUID()` is available in the target browsers.
