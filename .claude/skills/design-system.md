# Skill: Design System

> Load this file whenever touching any UI in `/web` or `/admin`.

---

## CRITICAL RULES — Never Violate

### `/web` staff app — always use design system components
Never use raw HTML elements. Always import from `@/components/ui/`:

| Raw element | Use instead | Import |
|---|---|---|
| `<button>` | `<Button>` | `@/components/ui/button` |
| `<button>` (icon only) | `<IconButton>` | `@/components/ui/icon-button` |
| `<input>` | `<Input>` | `@/components/ui/input` |
| `<input type="number">` | `<NumberInput>` | `@/components/ui/number-input` |
| `<input type="password">` | `<PasswordInput>` | `@/components/ui/password-input` |
| `<input type="search">` | `<SearchInput>` | `@/components/ui/search-input` |
| `<select>` | `<Select>` or `<Combobox>` | `@/components/ui/select` or `combobox` |
| `<textarea>` | `<Textarea>` | `@/components/ui/textarea` |
| `<input type="checkbox">` | `<Checkbox>` or `<CheckboxGroup>` | `@/components/ui/checkbox` |
| `<input type="radio">` | `<RadioGroup>` | `@/components/ui/radio-group` |
| toggle / on-off | `<Switch>` | `@/components/ui/switch` |
| `<input type="date">` | `<DatePicker>` | `@/components/ui/date-picker` |
| date range | `<DateRangePicker>` | `@/components/ui/date-range-picker` |
| `<input type="time">` | `<TimePicker>` | `@/components/ui/time-picker` |
| `<input type="file">` | `<FileUpload>` or `<ImageUpload>` | `@/components/ui/file-upload` |
| multi-select dropdown | `<MultiSelect>` | `@/components/ui/multi-select` |
| searchable dropdown | `<Combobox>` | `@/components/ui/combobox` |
| tag chips input | `<TagsInput>` | `@/components/ui/tags-input` |
| range slider | `<Slider>` | `@/components/ui/slider` |
| segmented toggle | `<SegmentedControl>` | `@/components/ui/segmented-control` |
| label + input + error | `<FormField>` wrapping control | `@/components/ui/form-field` |
| page title area | `<PageHeader>` | `@/components/ui/PageHeader` |
| section title | `<SectionHeader>` | `@/components/ui/SectionHeader` |
| tab navigation | `<TabBar>` | `@/components/ui/TabBar` |
| pill filters | `<FilterBar>` | `@/components/ui/FilterBar` |
| stat/metric card | `<StatCard>` | `@/components/ui/StatCard` |
| status pill | `<StatusBadge>` | `@/components/ui/StatusBadge` |
| allergen pill | `<AllergenBadge>` | `@/components/ui/AllergenBadge` |
| order channel pill | `<ChannelBadge>` | `@/components/ui/ChannelBadge` |
| delete/action confirm | `<ConfirmModal>` | `@/components/ui/ConfirmModal` |
| OTP entry | `<PinInput>` | `@/components/ui/pin-input` |

### `/admin` platform admin app — no component library
The admin app has no shared component library. All UI uses **Tailwind classes** (with `adm-*` token utilities) or **inline styles**. Follow the established patterns visible in existing routes.

---

## `/web` — Color Tokens

Font: **Plus Jakarta Sans Variable** · Base font-size: **15px** · Anti-aliased.

### Semantic tokens (use in Tailwind classes as `text-foreground`, `bg-primary`, etc.)

| Token | Light value | Purpose |
|---|---|---|
| `--background` | `oklch(0.958 0 0)` ≈ `#F5F5F5` | App canvas background |
| `--foreground` | `oklch(0.18 0.03 242)` ≈ `#111827` | Primary text |
| `--card` | `oklch(1 0 0)` = `#FFFFFF` | Card / panel surfaces |
| `--card-foreground` | same as foreground | Text on cards |
| `--popover` | `#FFFFFF` | Dropdown / popover surfaces |
| `--primary` | `oklch(0.28 0.082 242)` ≈ `#1A3D63` | Primary buttons, active states, focus rings |
| `--primary-foreground` | `#FFFFFF` | Text on primary |
| `--secondary` | `oklch(0.54 0.092 229)` ≈ `#4A7FA7` | Secondary buttons, sidebar active |
| `--secondary-foreground` | `#FFFFFF` | Text on secondary |
| `--muted` | `oklch(0.96 0 0)` ≈ `#F5F5F5` | Input backgrounds, subtle fills |
| `--muted-foreground` | `oklch(0.52 0.018 240)` ≈ `#6B7280` | Placeholder, hint, secondary text |
| `--accent` | `oklch(0.83 0.048 221)` ≈ `#B3CFE5` | Hover bg, tags, subtle fills |
| `--accent-foreground` | `oklch(0.18 0.03 242)` | Text on accent |
| `--destructive` | `oklch(0.577 0.245 27.325)` ≈ `#DC2626` | Errors, delete actions |
| `--border` | `oklch(0.918 0 0)` ≈ `#E5E7EB` | Dividers, input borders |
| `--input` | same as border | Input border default |
| `--ring` | `oklch(0.54 0.092 229)` ≈ `#4A7FA7` | Focus ring color |
| `--radius` | `0.625rem` | Base radius unit |

### ChefLogik semantic tokens (`cl-*`) — use in inline styles or `var()` calls

| Token | Value | Purpose |
|---|---|---|
| `--cl-bg` | `#F5F5F5` | App background |
| `--cl-card` | `#FFFFFF` | Card surface |
| `--cl-text` | `#111827` | Primary text |
| `--cl-text-soft` | `#374151` | Secondary text |
| `--cl-muted` | `#6B7280` | Placeholder / hint |
| `--cl-border` | `#E5E7EB` | Borders |
| `--cl-primary` | `#4A7FA7` (theme-overridden) | Brand accent |
| `--cl-dark` | `#1A3D63` (theme-overridden) | Dark brand, tab underlines |
| `--cl-danger` | `#DC2626` | Errors, delete |
| `--cl-warning` | `#D97706` | Warnings |
| `--cl-success` | `#16A34A` | Success |

### Colour themes (set via `data-theme` on `<html>`)

| Theme | `--cl-primary` | `--cl-dark` | Primary Tailwind oklch |
|---|---|---|---|
| `ocean` (default) | `#4A7FA7` | `#1A3D63` | `oklch(0.28 0.082 242)` |
| `forest` | `#68BA7F` | `#2E6F40` | `oklch(0.44 0.115 148)` |
| `sunrise` | `#F97316` | `#C2410C` | `oklch(0.52 0.205 38)` |

### Radius scale

| Class | Value | Use |
|---|---|---|
| `rounded-sm` | `0.375rem` | Tiny chips |
| `rounded-md` | `0.5rem` | Small elements |
| `rounded-lg` | `0.625rem` (= `--radius`) | Default cards |
| `rounded-xl` | `0.875rem` | Inputs, buttons, panels |
| `rounded-2xl` | `1.125rem` | Large cards |
| `rounded-full` | `9999px` | Pills, avatar, `Button` default shape |

---

## `/admin` — Color Tokens (ADM)

Font: **Plus Jakarta Sans Variable** · Base font-size: **15px** · No dark mode. Fixed palette only.

Available as Tailwind utilities `bg-adm-*`, `text-adm-*`, `border-adm-*` and as CSS vars `var(--adm-*)`.

| Token | Hex | Purpose |
|---|---|---|
| `--adm-bg` / `bg-adm-bg` | `#F4F6F9` | Page canvas |
| `--adm-card` / `bg-adm-card` | `#FFFFFF` | Card surfaces |
| `--adm-sidebar` | `#1E293B` | Sidebar background (dark slate) |
| `--adm-sidebar-text` | `#94A3B8` | Sidebar nav text (inactive) |
| `--adm-accent` / `text-adm-accent` | `#6366F1` | Indigo accent — buttons, links, active nav |
| `--adm-accent-light` / `bg-adm-accent-light` | `#EEF2FF` | Light indigo fill — active nav bg |
| `--adm-text` | `#0F172A` | Primary text |
| `--adm-muted` / `text-adm-muted` | `#64748B` | Secondary / hint text |
| `--adm-border` / `border-adm-border` | `#E2E8F0` | Borders, dividers |
| `--adm-success` | `#16A34A` | Success states |
| `--adm-danger` | `#DC2626` | Error / delete |
| `--adm-warning` | `#D97706` | Warnings |

### Admin sidebar constants (hardcoded, do not change)
- Background: `#1E293B` (dark slate)
- Active nav: `bg-indigo-500/20 text-indigo-300`
- Active icon: `text-indigo-400`
- Active indicator dot: `bg-indigo-400`
- Inactive nav: `text-slate-400 hover:bg-white/5 hover:text-slate-200`
- Nav group label: `text-slate-500` 10px bold uppercase tracking-widest
- Logo badge: `bg-indigo-500` (indigo-500, not accent token)

---

## Typography

Both apps use the same type scale. **Do not use font sizes outside this scale.**

| Class | Size | Weight | Letter-spacing | Use |
|---|---|---|---|---|
| `text-xs` | 12px | 400/500 | normal | Hints, badges, timestamps |
| `text-sm` | 13.3px (0.875rem) | 400–600 | normal | Body, labels, nav |
| `text-base` | 15px (1rem) | 400 | normal | Rare — large button |
| `text-lg` | 18px | 600 | −0.015em | Section headings |
| `text-xl` | 20px | 600–700 | −0.015em | Page headings |
| `text-2xl` | 24px | 700 | −0.015em | Large page titles |
| `text-[22px]` | 22px | 700 | 0 | `PageHeader` h1 (staff app) |

Heading rule: all `h1`–`h6` have `letter-spacing: -0.015em; font-weight: 600` globally.

Text colour defaults:
- Primary text: `text-foreground` (web) / `text-adm-text` or `color: var(--adm-text)` (admin)
- Secondary / muted: `text-muted-foreground` (web) / `text-adm-muted` (admin)
- Hint / placeholder: `text-muted-foreground` (web) / `color: var(--adm-muted)` (admin)

---

## `/web` — Field Base (shared input appearance)

All text-entry components (`Input`, `Textarea`, `Select`, `SearchInput`, `NumberInput`, `DatePicker`, `TimePicker`, `Combobox`, `MultiSelect`) share this base defined in `@/components/ui/field-styles.ts`:

```
bg-muted border border-transparent rounded-xl px-4 py-3 text-sm text-foreground
placeholder:text-muted-foreground
focus:outline-none focus:border-primary/30 focus:bg-background focus:ring-2 focus:ring-primary/20
disabled:cursor-not-allowed disabled:opacity-50
transition-colors
```

Error state adds:
```
border-destructive/40 focus:border-destructive/40 focus:ring-destructive/20
```

**This means all inputs have:** rounded-xl corners, muted background (no white), no border at rest, primary/30 border + ring on focus, destructive ring on error.

---

## `/web` — Component Reference

### `Button`
```tsx
import { Button } from '@/components/ui/button'

<Button variant="default" size="default">Save</Button>
```

**Shape:** always `rounded-full` (pill).

**Variants:**

| `variant` | Appearance | When to use |
|---|---|---|
| `default` | Navy bg (`primary`), white text | Primary action — one per section |
| `outline` | White bg, `border-border`, hover muted | Secondary action alongside default |
| `secondary` | Steel-blue bg (`secondary`), white text | Alternative primary, less common |
| `ghost` | Muted bg/60, muted text, hover muted | Tertiary, toolbar, icon-adjacent |
| `destructive` | Red/10 bg, red text, hover red/20 | Delete / irreversible actions |
| `link` | No bg, primary text, underline on hover | Inline links only |

**Sizes:**

| `size` | Height | Text | Padding | Use |
|---|---|---|---|---|
| `xs` | 28px (h-7) | 12px | px-3 | Dense tables, chips |
| `sm` | 36px (h-9) | 14px | px-4 | Toolbar, secondary actions |
| `default` | 40px (h-10) | 14px | px-5 | Standard — form submit, page CTA |
| `lg` | 48px (h-12) | 16px | px-8 | Hero CTAs only |
| `icon` | 40×40 | — | p-0 | Square icon button (prefer `IconButton`) |
| `icon-sm` | 36×36 | — | p-0 | Square icon, small |
| `icon-xs` | 28×28 | — | p-0 | Square icon, dense |
| `icon-lg` | 48×48 | — | p-0 | Square icon, large |

**Rules:**
- Use `<Button variant="default">` for the single primary CTA on any screen.
- Use `<Button variant="outline">` for the cancel/back action.
- Use `<Button variant="destructive">` for delete — always pair with `<ConfirmModal>`.
- Never use `size="icon"` on `<Button>` — use `<IconButton>` instead.

---

### `IconButton`
```tsx
import { IconButton } from '@/components/ui/icon-button'

<IconButton icon={<Trash2 className="size-4" />} label="Delete item" variant="ghost" size="sm" />
```

Required props: `icon` (ReactNode) and `label` (string — used as aria-label and title tooltip).

**Shape:** always `rounded-xl` (not pill like Button).

**Variant:** default is `ghost`. Available: all Button variants.

**Size mapping:**

| `size` | Renders as |
|---|---|
| omitted / `default` | 40×40 |
| `sm` | 36×36 |
| `xs` | 28×28 |
| `lg` | 48×48 |

---

### `Input`
```tsx
import { Input } from '@/components/ui/input'

<Input placeholder="Enter name" error={!!errors.name} />
```

Props: all native `<input>` attributes + `error?: boolean`.

`error={true}` swaps border/ring to destructive colour. Always combine with `<FormField error="message">` so the message displays.

---

### `NumberInput`
```tsx
import { NumberInput } from '@/components/ui/number-input'

<NumberInput value={qty} onChange={setQty} min={0} max={999} step={1} />
```

Has built-in `−` / `+` stepper buttons. Wraps Base UI NumberField.
Props: `value`, `defaultValue`, `onChange(value: number | null)`, `min`, `max`, `step` (default 1), `disabled`, `error`, `placeholder`.

---

### `PasswordInput`
```tsx
import { PasswordInput } from '@/components/ui/password-input'

<PasswordInput placeholder="Password" error={!!errors.password} />
```

Identical API to `Input`. Adds show/hide toggle button internally.

---

### `SearchInput`
```tsx
import { SearchInput } from '@/components/ui/search-input'

<SearchInput value={q} onChange={e => setQ(e.target.value)} onClear={() => setQ('')} placeholder="Search…" />
```

Prepends a search icon. When `value` is non-empty and `onClear` is provided, shows an × button.
Props: all native input attributes (minus `type`) + `error?: boolean`, `onClear?: () => void`.

---

### `Textarea`
```tsx
import { Textarea } from '@/components/ui/textarea'

<Textarea rows={4} placeholder="Notes…" resize="vertical" error={!!errors.notes} />
```

Props: all native textarea attributes + `error?: boolean`, `resize?: 'none' | 'vertical' | 'horizontal' | 'both'` (default `'vertical'`).
Default min-height: 100px.

---

### `Select`
```tsx
import { Select } from '@/components/ui/select'

<Select
  options={[{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }]}
  placeholder="Choose…"
  value={val}
  onChange={e => setVal(e.target.value)}
  error={!!errors.val}
/>
```

Native `<select>` with custom chevron. Good for short static lists.
Props: `options: SelectOption[]`, `placeholder?`, `error?`, all native select attributes.

Use `<Combobox>` instead when the list is long or searchable.

---

### `Combobox`
```tsx
import { Combobox } from '@/components/ui/combobox'

<Combobox
  options={items.map(i => ({ value: i.id, label: i.name }))}
  value={selectedId}
  onChange={setSelectedId}
  placeholder="Search items…"
  clearable
  error={!!errors.item}
/>
```

Searchable single-select dropdown with filtered list.
Props: `options`, `value`, `onChange(value: string)`, `placeholder`, `searchPlaceholder`, `emptyMessage`, `disabled`, `error`, `clearable`, `className`, `id`.

---

### `MultiSelect`
```tsx
import { MultiSelect } from '@/components/ui/multi-select'

<MultiSelect
  options={allergens}
  value={selected}
  onChange={setSelected}
  placeholder="Select allergens…"
  max={5}
  error={!!errors.allergens}
/>
```

Multi-select with tag chips in trigger and searchable dropdown.
Props: `options`, `value: string[]`, `onChange(value: string[])`, `placeholder`, `searchPlaceholder`, `emptyMessage`, `disabled`, `error`, `max?: number`.

---

### `TagsInput`
```tsx
import { TagsInput } from '@/components/ui/tags-input'

<TagsInput value={tags} onChange={setTags} placeholder="Add tag…" max={10} />
```

Free-text tag entry. Press Enter or comma to add; Backspace to remove last.
Props: `value: string[]`, `onChange`, `placeholder`, `disabled`, `error`, `max?: number`, `id`.

---

### `Checkbox`
```tsx
import { Checkbox } from '@/components/ui/checkbox'

<Checkbox
  checked={val}
  onCheckedChange={setVal}
  label="Accept terms"
  description="You agree to our terms of service."
/>
```

Single checkbox with optional label + description.
Props: `checked`, `defaultChecked`, `onCheckedChange(checked: boolean)`, `indeterminate`, `disabled`, `required`, `label?`, `description?`, `id`, `name`, `value`.

---

### `CheckboxGroup`
```tsx
import { CheckboxGroup } from '@/components/ui/checkbox-group'

<CheckboxGroup
  options={[
    { value: 'mon', label: 'Monday' },
    { value: 'tue', label: 'Tuesday', disabled: true },
  ]}
  value={selected}
  onValueChange={setSelected}
  orientation="horizontal"
  error={!!errors.days}
/>
```

Props: `options: CheckboxGroupOption[]`, `value: string[]`, `onValueChange`, `orientation?: 'vertical' | 'horizontal'` (default vertical), `disabled`, `error`.

---

### `RadioGroup`
```tsx
import { RadioGroup } from '@/components/ui/radio-group'

<RadioGroup
  options={[{ value: 'cash', label: 'Cash' }, { value: 'card', label: 'Card' }]}
  value={method}
  onChange={setMethod}
  orientation="horizontal"
/>
```

Props: `options: RadioOption[]`, `value?`, `defaultValue?`, `onChange(value: string)`, `orientation?`, `disabled`, `error`.

---

### `Switch`
```tsx
import { Switch } from '@/components/ui/switch'

<Switch
  checked={enabled}
  onCheckedChange={setEnabled}
  label="Accept online orders"
  description="Customers can place orders via the website."
/>
```

When `label` / `description` are provided, the component renders as a full row (label left, toggle right). When omitted, renders the toggle only.

Props: `checked`, `defaultChecked`, `onCheckedChange(checked: boolean)`, `disabled`, `label?`, `description?`, `id`, `name`.

---

### `SegmentedControl`
```tsx
import { SegmentedControl } from '@/components/ui/segmented-control'

<SegmentedControl
  options={[
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
  ]}
  value={view}
  onChange={setView}
  size="md"
/>
```

Tab-like button group inside a muted pill container. Active segment gets white bg + shadow.
Props: `options: SegmentedControlOption<T>[]` (each has `value`, `label`, optional `icon`, optional `disabled`), `value: T`, `onChange(value: T)`, `disabled`, `size?: 'sm' | 'md'` (default `'md'`).

Sizes: `sm` → px-3 py-1 text-xs; `md` → px-4 py-1.5 text-sm.

Use this instead of `<TabBar>` when the switch controls what content is shown below it (not full-page navigation).

---

### `Slider`
```tsx
import { Slider } from '@/components/ui/slider'

<Slider value={pct} onChange={setPct} min={0} max={100} step={5} showValue formatValue={v => `${v}%`} />
```

Props: `value`, `defaultValue`, `onChange(value: number)`, `min` (default 0), `max` (default 100), `step` (default 1), `disabled`, `showValue`, `formatValue(v: number) => string`, `id`, `name`.

---

### `PinInput`
```tsx
import { PinInput } from '@/components/ui/pin-input'

<PinInput length={6} value={otp} onChange={setOtp} error={!!errors.otp} />
```

OTP / PIN entry. Each digit is a separate 40×48px box. Auto-advances on input; supports paste; Backspace moves back.
Props: `length?` (default 6), `value: string`, `onChange(value: string)`, `disabled`, `error`, `id`.

---

### `DatePicker`
```tsx
import { DatePicker } from '@/components/ui/date-picker'

<DatePicker
  value={date}
  onChange={setDate}
  placeholder="Pick a date"
  min={new Date()}
  clearable
  error={!!errors.date}
/>
```

Custom calendar dropdown. Formatted as `DD MMM YYYY`.
Props: `value?: Date | null`, `onChange(date: Date | null)`, `placeholder`, `disabled`, `error`, `min?: Date`, `max?: Date`, `clearable`, `id`.

---

### `DateRangePicker`
```tsx
import { DateRangePicker } from '@/components/ui/date-range-picker'

<DateRangePicker
  value={range}
  onChange={setRange}
  placeholder="Select period"
  error={!!errors.range}
/>
```

Two-click selection: click start, then end. Shows `DD MMM YYYY – DD MMM YYYY`.
Props: `value?: { from: Date | null; to: Date | null }`, `onChange(range)`, `placeholder`, `disabled`, `error`, `min?: Date`, `max?: Date`, `id`.

---

### `TimePicker`
```tsx
import { TimePicker } from '@/components/ui/time-picker'

<TimePicker value="14:30" onChange={setTime} minuteStep={15} error={!!errors.time} />
```

Two native selects (HH / MM) side by side. Value is `'HH:mm'` string.
Props: `value?: string | null`, `onChange(value: string)`, `disabled`, `error`, `minuteStep?` (default 5), `id`.

---

### `FileUpload`
```tsx
import { FileUpload } from '@/components/ui/file-upload'

<FileUpload
  value={files}
  onChange={setFiles}
  accept=".pdf,.csv"
  multiple
  maxSize={5 * 1024 * 1024}  // 5 MB
  maxFiles={3}
  hint="PDF or CSV files only"
  error={!!errors.files}
/>
```

Drag-and-drop zone + file list. Shows size error internally.
Props: `value?: File[]`, `onChange(files: File[])`, `accept?`, `multiple?`, `maxSize?: number` (bytes), `maxFiles?: number`, `disabled`, `error`, `hint?`, `id`.

---

### `ImageUpload`
```tsx
import { ImageUpload } from '@/components/ui/image-upload'

<ImageUpload
  value={previewUrl}
  onChange={file => uploadFile(file)}
  onRemove={() => setPreviewUrl(null)}
  maxSize={2 * 1024 * 1024}
  hint="JPG or PNG, 2 MB max"
/>
```

Single-image upload with preview. When `value` (a URL) is provided, shows the image; otherwise shows the drop zone.
Props: `value?: string | null`, `onChange(file: File)`, `onRemove()`, `accept?` (default `'image/*'`), `maxSize?`, `disabled`, `error`, `hint?`, `id`.

---

### `FormField`
```tsx
import { FormField } from '@/components/ui/form-field'

<FormField label="Email address" htmlFor="email" required error={errors.email} hint="We'll send a confirmation to this address.">
  <Input id="email" type="email" error={!!errors.email} />
</FormField>
```

**Always wrap inputs in `<FormField>`** when there's a label, hint, or error message. Do not write bare `<label>` tags alongside inputs.

Props: `label?`, `hint?`, `error?` (string — shown in red; suppresses hint), `required?`, `htmlFor?`, `className?`, `children`.

Label style: `text-sm font-medium text-foreground`. Required asterisk: `text-destructive`.
Hint style: `text-xs text-muted-foreground`. Error style: `text-xs text-destructive`, role="alert".

---

### `PageHeader`
```tsx
import { PageHeader } from '@/components/ui/PageHeader'

<PageHeader
  title="Menu Items"
  subtitle="Manage your restaurant's menu"
  actions={<Button size="sm">Add item</Button>}
/>
```

Use at the top of every page (inside the main content area). Renders h1 at 22px/700 with `--cl-text`, subtitle at 13.5px `--cl-muted`. Actions slot is right-aligned.

---

### `SectionHeader`
```tsx
import { SectionHeader } from '@/components/ui/SectionHeader'

<SectionHeader title="Active Orders" count={7} action={<Button size="xs" variant="ghost">View all</Button>} />
```

h2 at 14px/600. Optional count badge (grey pill). Optional right-aligned action.

---

### `TabBar`
```tsx
import { TabBar } from '@/components/ui/TabBar'

<TabBar
  tabs={[
    { id: 'overview', label: 'Overview' },
    { id: 'orders', label: 'Orders', badge: 4 },
  ]}
  active={activeTab}
  onChange={setActiveTab}
/>
```

Underline-style tab navigation. Active tab: 2px bottom border `--cl-dark`, font-weight 600, color `--cl-dark`. Badge pill: dark bg when active, grey bg when inactive.

Use for **page-level navigation** between distinct sub-sections. Use `<SegmentedControl>` for inline view-switchers.

---

### `FilterBar`
```tsx
import { FilterBar } from '@/components/ui/FilterBar'

<FilterBar
  options={['All', 'Pending', 'Active', 'Completed']}
  active={filter}
  onChange={setFilter}
  colorOverrides={{ Pending: '#D97706', Completed: '#16A34A' }}
/>
```

Horizontal row of pill buttons. Active: dark bg (`--cl-dark`) or custom `colorOverrides[option]`; inactive: `#F3F4F6` with muted text.

---

### `StatCard`
```tsx
import { StatCard } from '@/components/ui/StatCard'

<StatCard
  icon={<ShoppingBag className="size-5" />}
  value={42}
  label="Orders today"
  color="#4A7FA7"
/>
```

Metric tile with icon badge, value, and label. `color` sets the icon badge background. `bg` defaults to `'white'`.

---

### `StatusBadge`
```tsx
import { StatusBadge } from '@/components/ui/StatusBadge'

<StatusBadge status="pending" />
<StatusBadge status="confirmed" label="Confirmed" />
```

Coloured pill badge mapped from status string. Supported statuses and their colours:

| Status | bg | color |
|---|---|---|
| `confirmed`, `active`, `valid`, `completed` | green-100 | green-700 |
| `pending`, `needs_cleaning`, `waiting` | yellow-100 | yellow-700 |
| `cancelled`, `blocked` | red-100 | red-700 |
| `no-show`, `inactive`, `pos` | grey-100 | grey-500 |
| `preparing`, `occupied`, `dine-in` | blue-100 | blue-700 |
| `ready`, `free`, `bill_settled` | green-50 | green-800 |
| `dispatched`, `online`, `reserved`, `invited` | violet-100 | violet-700 |
| `expiring` | amber-100 | amber-800 |
| `gold` | yellow-100 | amber-800 |
| `silver` | grey-100 | grey-700 |
| `bronze` | orange-100 | amber-800 |

Unknown statuses default to grey. The `status` string is normalised (lowercase, spaces→underscores). Provide `label` to override display text.

---

### `AllergenBadge`
```tsx
import { AllergenBadge } from '@/components/ui/AllergenBadge'

<AllergenBadge allergen="gluten" />
```

Outlined pill with allergen-specific colour. Supported allergens with distinct colours: `gluten`, `dairy`, `eggs`, `nuts`, `peanuts`, `fish`, `shellfish`, `soy`, `sesame`, `celery`, `mustard`, `sulphites`, `lupin`, `molluscs`. Unknown defaults to red.

---

### `ChannelBadge`
```tsx
import { ChannelBadge } from '@/components/ui/ChannelBadge'

<ChannelBadge channel="dine-in" />
<ChannelBadge channel="uber eats" />
```

Order channel pill. Supported: `dine-in` (blue), `qr` (green), `online` (violet), `pos` (grey), `phone` (amber), `uber eats` (orange), `wolt` (blue). Unknown → grey.

---

### `ConfirmModal`
```tsx
import { ConfirmModal } from '@/components/ui/ConfirmModal'

<ConfirmModal
  open={showConfirm}
  title="Delete menu item?"
  body="This action cannot be undone."
  confirmLabel="Delete"
  onConfirm={() => { deleteItem(); setShowConfirm(false) }}
  onCancel={() => setShowConfirm(false)}
/>
```

Full-screen overlay modal for destructive confirmations. Confirm button: `--cl-danger` red. Cancel button: outlined white.

Always use this before any destructive action (delete, cancel order, void payment).

---

## `/admin` — Patterns

The admin app has **no shared component library**. Write raw Tailwind + occasional inline styles following these patterns.

### Button patterns (admin)
```tsx
// Primary action — indigo
<button
  type="button"
  className="px-4 py-2 bg-adm-accent text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
>
  Save
</button>

// Secondary / outline
<button
  type="button"
  className="px-4 py-2 border border-adm-border text-adm-text rounded-lg text-sm font-medium hover:bg-adm-bg transition-colors"
>
  Cancel
</button>

// Danger
<button
  type="button"
  className="px-4 py-2 bg-adm-danger text-white rounded-lg text-sm font-medium hover:opacity-90"
>
  Delete
</button>
```

### Input patterns (admin)
```tsx
<input
  className="w-full px-3 py-2 border border-adm-border rounded-lg text-sm text-adm-text bg-adm-card
             focus:outline-none focus:ring-2 focus:ring-adm-accent/30 focus:border-adm-accent/60
             disabled:opacity-50 disabled:cursor-not-allowed"
/>
```

### Card patterns (admin)
```tsx
<div className="bg-adm-card border border-adm-border rounded-xl p-6">
  {/* content */}
</div>
```

### Badge patterns (admin)
```tsx
// Accent (active/enabled)
<span className="px-2 py-0.5 bg-adm-accent-light text-adm-accent rounded-full text-xs font-semibold">
  Active
</span>

// Success
<span className="px-2 py-0.5 bg-green-100 text-adm-success rounded-full text-xs font-semibold">
  Running
</span>

// Danger
<span className="px-2 py-0.5 bg-red-100 text-adm-danger rounded-full text-xs font-semibold">
  Error
</span>
```

### Typography patterns (admin)
```tsx
// Page title
<h1 className="text-xl font-semibold text-adm-text">Tenants</h1>

// Section label
<h2 className="text-sm font-semibold text-adm-text">Subscription Plan</h2>

// Body / description
<p className="text-sm text-adm-muted">No tenants found.</p>

// Table header
<th className="text-xs font-semibold text-adm-muted uppercase tracking-wide">Name</th>
```

---

## Spacing Conventions

Both apps use Tailwind's default spacing scale (4px base). Most used values:

| Class | Value | Common use |
|---|---|---|
| `gap-1` | 4px | Tight icon-label gaps |
| `gap-1.5` | 6px | Tag chips |
| `gap-2` | 8px | Button icon gap, inline items |
| `gap-3` | 12px | Form field stack (`FormField` gap) |
| `gap-4` | 16px | Card content padding, section gap |
| `gap-6` | 24px | Between cards |
| `p-4` / `px-4 py-3` | 16px / 16×12 | Input padding |
| `p-6` | 24px | Card padding |
| `mb-4` | 16px | Between form fields |
| `mb-6` | 24px | Between sections |

`PageHeader` always has `marginBottom: 22px` (inline style, matches existing component).

---

## Anti-Patterns — Never Do These

1. **Raw `<button>` in `/web`** — always `<Button>` or `<IconButton>`.
2. **Raw `<input>` in `/web`** — always the appropriate `*Input` component.
3. **Inline `style={{color: '#...'}}`** in `/web` — use Tailwind token classes instead.
4. **`text-[13px]`** or other arbitrary sizes — use the defined scale.
5. **`rounded-md` on inputs** — all inputs are `rounded-xl` via `fieldBase`.
6. **`rounded-full` on `IconButton`** — `IconButton` is always `rounded-xl`, not pill.
7. **`className` on `<FormField>` children for error colour** — pass `error` prop, never hard-code red text.
8. **Role-name checks** (`user.role === 'manager'`) — always `authStore.can('permission.slug')`.
9. **`bg-white` on admin page canvas** — use `bg-adm-bg` (`#F4F6F9`). Cards use `bg-adm-card`.
10. **Creating new colours** — only use the token palette. Never `bg-[#abc123]` unless it is a known badge/chart colour.
11. **Using `useState` for server data in `/web`** — use MST models.
12. **Using `<Select>` for long lists (20+ options)** — use `<Combobox>` instead.
