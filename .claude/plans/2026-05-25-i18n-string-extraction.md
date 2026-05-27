# i18n String Extraction — `/web` and `/admin` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every hardcoded UI string in `/web` (223 TSX files) and `/admin` (26 TSX files) with `t('key')` calls, backed by the existing API translation infrastructure, so zero English literals remain in rendered output.

---

## ⚡ RESUME STATUS — last updated 2026-05-27 (session 9)

### Fully Complete ✅
- **Task 1** ✅ — `admin/src/hooks/useT.ts` created
- **Task 2** ✅ — `portal` section already existed in `en-US/web.php` with all keys
- **Task 4** ✅ — All non-en-US `admin.php` files complete (all 7 locales)
- **Task 5** ✅ — All admin wiring complete (all 9 screens + login + layout)
- **Task 6** ✅ — All web layout files wired (Sidebar, Header, UserDropdown, UserMenu, NotifDropdown, MessagesDropdown, BranchSwitcher, NoBranchSelected, AppFooter)
- **Task 7** ✅ — All auth screens wired
- **Task 8** ✅ — Dashboard, Orders, KDS wired
- **Task 9** ✅ — Menu AND inventory modules fully wired and committed:
  - All `menu/` route files ✅ (including categories/new.tsx and categories/$categoryId.tsx)
  - All `inventory/` route files ✅ (all 9 files)
  - Committed: `feat(i18n): wire t() in menu, inventory, orders, KDS, and BranchSwitcher`
- **Task 10** ✅ — Reservations, Events, and Staff modules fully wired and committed:
  - All `reservations/` route files ✅
  - All `events/` route files ✅ (renamed `OCCASION_TYPES.map((t) =>` → `(ot) =>`, etc.)
  - All `staff/` route files ✅ (index, shifts/index, payroll, leave, $staffId, attendance, shifts/new, new, $staffId_.edit, $staffId_.profile)
  - `web/src/components/staff/PermissionPicker.tsx` ✅
  - All 5 floor-designer components ✅ (EditToolbar, ToolboxPanel, ViewLeftSidebar, ViewRightPanel, TablePopup incl. FreeBody/OccupiedBody)
  - Committed (api): `feat(i18n): add floor designer and staff module translation keys`
  - Committed (web): `feat(i18n): wire t() in reservations floor-designer and staff module`

### ⚡ NEXT RESUME POINT → Task 11: customers, analytics, settings, branches, roles

**Before starting Task 11, read each file first — do not assume what strings are present.**

Files to wire in Task 11:
- `web/src/routes/_authenticated/customers/` — list files with `ls`
- `web/src/routes/_authenticated/analytics/` — list files with `ls`
- `web/src/components/analytics/AnalyticsNav.tsx`
- `web/src/routes/_authenticated/settings/` — list files with `ls`
- `web/src/components/settings/SettingsNav.tsx`
- `web/src/routes/_authenticated/branches/` — list files with `ls`
- `web/src/routes/_authenticated/roles/` — list files with `ls`

Translation key sections to use: `customers.*`, `analytics.*`, `settings.*`, `branches.*`, `roles.*`

After all Task 11 files done:
```bash
cd /Users/deepak/Projects/ChefLogik/web && npm run lint
git add src/
git commit -m "feat(i18n): wire t() in customers, analytics, settings, branches, and roles"
```

Then continue with Task 12 (profile, notifications, landing CMS, portal) and Task 13 (shared UI).

### Partially Complete ⚠️
- **Task 3** — Non-en-US `web.php` files: only layout/notification keys added in earlier sessions. Still missing: menu, inventory, reservations (including the new floor-designer keys: snap, floor_status, floor_settings, floors_section, add_tables, add_elements, add_floor, ready_to_seat, seats_label, section, turn_time, suggested, good_fit, fits, large_party, hold, block, seat_next, elapsed, server, course, open_order, seated_by, guests_count, merge, split, overlap_warning, and status labels), events, staff (including: sched_start, sched_end, late, overtime, attendance_subtitle, no_attendance, select_branch_view, new_shift, create_shift, shift_draft_hint, shift_published, open_shift_option, assign_staff_label, new_staff_member, create_staff, emp_section, emp_type, emp_full_time/part_time/casual/contractor, hourly_rate, salary, edit_staff, edit_profile, profile_photo, personal_info), customers, analytics, kds, branches, roles, landing_cms, portal sections from all non-en-US locales. Full translated content for older sections ready to paste is in the Task 3 section below — new keys added in sessions 8–9 need translating separately.

### Tasks 12–13 — NOT STARTED

### Key technical facts for resuming
- `useT()` hook: `import { useT } from '@/hooks/useT'` → returns `(key, vars?) => i18n.t(key, vars)`
- **Must wrap components in `observer()` from `mobx-react-lite`** for locale changes to re-render
- Module-level constants with hardcoded labels must be moved inside components and computed via `t()` at render time (or values array kept at module level, labels computed inside)
- **Variable shadowing rule:** never use `t` as a `.map()` / `.filter()` callback variable — rename to `(tr)` (transitions), `(lt)` (leave types), `(ot)` (occasion types), `(tk)` (tasks), `(row)`, etc.
- Translation fallback: 2-level merge (en-US → target locale). No 3-level chain.
- `/web` dev server: port 5500 (`npm run dev` from `/web`)
- Pre-existing lint errors in `/web`: **70 errors** (reduced from 71 by one fix during this work) — do not treat as regressions
- PHP lang file: `/Users/deepak/Projects/ChefLogik/api/lang/en-US/web.php`
- Pattern for variable substitution: `t('menu.pct_margin', { pct: margin.toFixed(1) })` with `'{pct}% margin'` in PHP
- Plain (non-observer) sub-components can call `useT()` — reactivity via parent observer re-render
- Always check if a PHP key exists before adding: `grep -n 'key_name' /Users/deepak/Projects/ChefLogik/api/lang/en-US/web.php`
- Both repos are on branch `staging`; api repo is at `/Users/deepak/Projects/ChefLogik/api`, web repo is at `/Users/deepak/Projects/ChefLogik/web`

---

**Architecture:** The API already serves translations via `GET /v1/translations/{locale}?app={web|admin}` from PHP lang files in `api/lang/{locale}/{app}.php`. Both apps already boot-load translations into their `I18nStore` singleton and persist locale in `localStorage`. The work is: (1) complete missing translations in non-en-US lang files, (2) add a `portal` section to `en-US/web.php`, (3) add `useT()` hook to `/admin`, (4) change Sidebar `NAV_GROUPS` to use translation keys, and (5) replace hardcoded strings with `t()` calls in every component file.

**Tech Stack:** React 19 + TypeScript, MobX-State-Tree, `useT()` hook from `@/hooks/useT`, PHP 8.3 lang arrays in `/api/lang/`, all components must be wrapped in `observer()` for reactivity to work.

---

## Universal Pattern (read once, apply everywhere)

### `/web` components
```tsx
// 1. Import
import { useT } from '@/hooks/useT'

// 2. Inside observer component
const t = useT()

// 3. Replace strings
<h1>{t('profile.title')}</h1>
<Button>{t('common.save')}</Button>
<p>{t('auth.otp_sent_to', { email: user.email })}</p>
```

### `/admin` components (after Task 1 creates the hook)
```tsx
// Same import + usage as /web
import { useT } from '@/hooks/useT'
const t = useT()
```

### Key naming convention
- `common.*` — reused across modules (save, cancel, loading, error, etc.)
- `nav.*` — sidebar/header navigation labels
- `{module}.*` — module-specific strings (orders, menu, staff, etc.)
- `portal.*` — customer portal routes (new section, added in Task 2)

### Variables in strings
Keys that contain `{placeholder}` use the second arg:
```tsx
t('common.page_of', { current: String(page), total: String(totalPages) })
t('orders.order_id', { id: String(order.id) })
t('kds.allergen_warn', { allergens: order.allergens.join(', ') })
```

### Sidebar nav — special case
`NAV_GROUPS` in `Sidebar.tsx` is a static module-level array. The `label` field is rendered as `{item.label}`. Change the field to `tKey: string` and resolve in the render:
```tsx
// BEFORE
{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }

// AFTER
{ to: '/dashboard', tKey: 'nav.dashboard', icon: LayoutDashboard }

// In render
<span>{t(item.tKey)}</span>
```

---

## File Map

### New files
- `admin/src/hooks/useT.ts` — `useT()` hook for `/admin` (Task 1)

### Modified: `/api` lang files
- `api/lang/en-US/web.php` — add `portal` section (Task 2)
- `api/lang/{fr-FR,de-DE,de-AT,es-ES,pl-PL,it-IT,en-GB}/web.php` — complete all missing sections (Task 3)
- `api/lang/{fr-FR,de-DE,de-AT,es-ES,pl-PL,it-IT,en-GB}/admin.php` — complete all missing sections (Task 4)

### Modified: `/admin` (Tasks 5–6)
- `admin/src/routes/login.tsx`
- `admin/src/components/layout/AdminHeader.tsx`
- `admin/src/components/layout/AdminSidebar.tsx`
- `admin/src/routes/_authenticated/dashboard.tsx`
- `admin/src/routes/_authenticated/tenants.tsx`
- `admin/src/routes/_authenticated/billing.tsx`
- `admin/src/routes/_authenticated/analytics.tsx`
- `admin/src/routes/_authenticated/health.tsx`
- `admin/src/routes/_authenticated/audit.tsx`
- `admin/src/routes/_authenticated/support.tsx`
- `admin/src/routes/_authenticated/users.tsx`
- `admin/src/routes/_authenticated/flags.tsx`

### Modified: `/web` (Tasks 7–15)
- `web/src/components/layout/Sidebar.tsx`
- `web/src/components/layout/Header.tsx`
- `web/src/components/layout/UserDropdown.tsx`
- `web/src/components/layout/UserMenu.tsx`
- `web/src/components/layout/NotifDropdown.tsx`
- `web/src/components/layout/MessagesDropdown.tsx`
- `web/src/components/layout/BranchSwitcher.tsx`
- `web/src/components/layout/NoBranchSelected.tsx`
- `web/src/components/layout/AppFooter.tsx`
- `web/src/components/auth/LoginPage.tsx` + all `auth/screens/*.tsx`
- `web/src/components/auth/ForgotPasswordPage.tsx`
- `web/src/components/dashboard/DashboardScreen.tsx`
- All route files under `web/src/routes/_authenticated/orders/`
- All route files under `web/src/routes/_authenticated/menu/`
- All route files under `web/src/routes/_authenticated/inventory/`
- All route files under `web/src/routes/_authenticated/reservations/`
- All route files under `web/src/routes/_authenticated/events/`
- All route files under `web/src/routes/_authenticated/staff/`
- All route files under `web/src/routes/_authenticated/customers/`
- All route files under `web/src/routes/_authenticated/analytics/`
- All route files under `web/src/routes/_authenticated/kds/`
- All route files under `web/src/routes/_authenticated/settings/`
- All route files under `web/src/routes/_authenticated/branches/`
- All route files under `web/src/routes/_authenticated/roles/`
- All `web/src/components/profile/*.tsx`
- `web/src/routes/_authenticated/notifications.tsx`
- All `web/src/components/LandingCms/*.tsx`
- All `web/src/routes/portal/*.tsx`

---

## Task 1 — Add `useT()` hook to `/admin` ✅ COMPLETE

**Files:**
- Create: `admin/src/hooks/useT.ts`

- [x] **Step 1: Create the hook**

```ts
// admin/src/hooks/useT.ts
import { useI18n } from '@/stores/context'

export function useT() {
  const i18n = useI18n()
  return (key: string, vars?: Record<string, string>) => i18n.t(key, vars)
}
```

- [x] **Step 2: Verify it compiles**

```bash
cd /Users/deepak/Projects/ChefLogik/admin && npm run lint
```
Expected: no errors.

- [x] **Step 3: Commit**

```bash
cd /Users/deepak/Projects/ChefLogik/admin
git add src/hooks/useT.ts
git commit -m "feat(i18n): add useT() hook to admin app"
```

---

## Task 2 — Add `portal` section to `en-US/web.php`

**Files:**
- Modify: `api/lang/en-US/web.php`

The portal routes (`/portal/login`, `/portal/restaurants`, `/portal/home`, `/portal/bookings`, `/portal/reservations`, `/portal/profile`) have no existing translation section.

- [x] **Step 1: Add portal section at the end of `api/lang/en-US/web.php`** (before the closing `]`) ✅ ALREADY EXISTED

```php
    // ── Portal (Customer-facing) ──────────────────────────────────────────────
    'portal' => [
        'title'              => 'Customer Portal',
        'subtitle'           => 'View your loyalty, reservations & bookings',
        'login'              => 'Log in',
        'register'           => 'Register',
        'or_login'           => 'Already have an account? Log in',
        'or_register'        => 'New here? Create account',
        'phone'              => 'Phone number',
        'first_name'         => 'First name',
        'last_name'          => 'Last name',
        'login_failed'       => 'Login failed. Please check your credentials.',
        'register_failed'    => 'Registration failed. Please try again.',
        'select_restaurant'  => 'Select a restaurant',
        'choose_restaurant'  => 'Choose a restaurant to view your loyalty and reservations.',
        'loyalty'            => 'Loyalty',
        'points'             => '{points} pts',
        'tier'               => 'Tier',
        'total_spend'        => 'Total spend',
        'total_visits'       => 'Total visits',
        'next_tier'          => 'Next tier progress',
        'recent_activity'    => 'Recent Activity',
        'no_activity'        => 'No recent activity.',
        'bookings'           => 'Bookings',
        'no_bookings'        => 'No bookings yet.',
        'reservations'       => 'Reservations',
        'no_reservations'    => 'No reservations yet.',
        'profile'            => 'Profile',
        'sign_out'           => 'Sign out',
        'tx_earn'            => 'Earned',
        'tx_redeem'          => 'Redeemed',
        'tx_expire'          => 'Expired',
        'tx_reverse'         => 'Reversed',
        'tx_bonus'           => 'Bonus',
        'tx_adjustment'      => 'Adjustment',
    ],
```

- [ ] **Step 2: Clear translation cache and verify endpoint**

```bash
cd /Users/deepak/Projects/ChefLogik/api
php artisan cache:forget translations:en-US:web
curl -s "http://localhost:8000/api/v1/translations/en-US?app=web" | python3 -m json.tool | grep '"portal\.'
```
Expected: lines like `"portal.title": "Customer Portal"` appear.

- [ ] **Step 3: Commit**

```bash
cd /Users/deepak/Projects/ChefLogik/api
git add lang/en-US/web.php
git commit -m "feat(i18n): add portal section to en-US/web.php"
```

---

## Task 3 — Complete non-en-US `web.php` lang files

**Files:**
- Modify: `api/lang/fr-FR/web.php`, `api/lang/de-DE/web.php`, `api/lang/de-AT/web.php`, `api/lang/es-ES/web.php`, `api/lang/pl-PL/web.php`, `api/lang/it-IT/web.php`, `api/lang/en-GB/web.php`

The current coverage per locale:
- `fr-FR`: has nav, common, auth, profile, orders, dashboard, settings, landing_cms — **missing**: menu, inventory, reservations, events, staff, customers, analytics, kds, branches, roles, notifications, portal
- `de-DE`, `es-ES`, `pl-PL`, `it-IT`: have nav, common, auth, profile, orders, dashboard — **missing**: same 12 sections as fr-FR plus settings and landing_cms
- `de-AT`: has only 4 lines — **missing**: everything
- `en-GB`: has only 4 lines — **missing**: everything (en-GB is minor spelling variants of en-US)

The approach: for each locale, add the missing sections as translated arrays. The controller already merges the target locale over `en-US` as fallback, so any key not in a locale file automatically falls back to `en-US`.

- [ ] **Step 1: Complete `fr-FR/web.php` — add missing sections**

Add after the existing `landing_cms` section:

```php
    'menu' => [
        'title'           => 'Menu',
        'categories'      => 'Catégories',
        'items'           => 'Plats',
        'add_category'    => 'Ajouter une catégorie',
        'add_item'        => 'Ajouter un plat',
        'item_name'       => 'Nom du plat',
        'description'     => 'Description',
        'price'           => 'Prix',
        'allergens'       => 'Allergènes',
        'dietary'         => 'Régimes',
        'modifiers'       => 'Modificateurs',
        'eighty_six'      => '86 (épuisé)',
        'restore'         => 'Rétablir',
        'is_active'       => 'Actif',
        'photo'           => 'Photo',
        'sort_order'      => 'Ordre',
        'branch_overrides'=> 'Exceptions par établissement',
    ],

    'inventory' => [
        'title'          => 'Inventaire',
        'items'          => 'Articles en stock',
        'suppliers'      => 'Fournisseurs',
        'purchase_orders'=> 'Bons de commande',
        'grn'            => 'Réception de marchandises',
        'stocktake'      => 'Inventaire',
        'waste_log'      => 'Journal des pertes',
        'recipes'        => 'Recettes',
        'low_stock'      => 'Stock bas',
        'out_of_stock'   => 'Rupture de stock',
        'unit'           => 'Unité',
        'quantity'       => 'Quantité',
        'reorder_level'  => 'Seuil de réapprovisionnement',
        'wac'            => 'CMP',
    ],

    'reservations' => [
        'title'      => 'Réservations',
        'new'        => 'Nouvelle réservation',
        'date'       => 'Date',
        'time'       => 'Heure',
        'covers'     => 'Couverts',
        'guest'      => 'Nom du client',
        'table'      => 'Table',
        'status'     => 'Statut',
        'notes'      => 'Notes',
        'confirm'    => 'Confirmer',
        'seat'       => 'Placer',
        'complete'   => 'Terminer',
        'no_show'    => 'No show',
        'cancel'     => 'Annuler',
        'floor_plan' => 'Plan de salle',
        'waitlist'   => 'Liste d\'attente',
    ],

    'events' => [
        'title'       => 'Événements',
        'new'         => 'Nouvel événement',
        'event_date'  => 'Date',
        'title_label' => 'Titre',
        'type'        => 'Type',
        'status'      => 'Statut',
        'guest_count' => 'Nombre d\'invités',
        'space'       => 'Espace',
        'package'     => 'Forfait',
        'notes'       => 'Notes',
        'run_sheet'   => 'Feuille de route',
        'tasks'       => 'Tâches',
        'billing'     => 'Facturation',
    ],

    'staff' => [
        'title'         => 'Personnel',
        'invite'        => 'Inviter',
        'name'          => 'Nom',
        'role'          => 'Rôle',
        'branch'        => 'Établissement',
        'status'        => 'Statut',
        'shifts'        => 'Horaires',
        'attendance'    => 'Présences',
        'leave'         => 'Congés',
        'payroll'       => 'Paie',
        'clock_in'      => 'Pointer (entrée)',
        'clock_out'     => 'Pointer (sortie)',
        'approve_leave' => 'Approuver le congé',
        'reject_leave'  => 'Refuser le congé',
    ],

    'customers' => [
        'title'      => 'Clients',
        'profile'    => 'Profil',
        'loyalty'    => 'Fidélité',
        'tier'       => 'Niveau',
        'points'     => 'Points',
        'orders'     => 'Commandes',
        'spend'      => 'Dépenses totales',
        'last_visit' => 'Dernière visite',
        'tags'       => 'Étiquettes',
        'notes'      => 'Notes',
        'merge'      => 'Fusionner les profils',
    ],

    'analytics' => [
        'title'     => 'Analytique',
        'revenue'   => 'Chiffre d\'affaires',
        'orders'    => 'Commandes',
        'covers'    => 'Couverts',
        'avg_spend' => 'Dépense moy.',
        'top_dishes'=> 'Plats populaires',
        'period'    => 'Période',
        'today'     => 'Aujourd\'hui',
        'this_week' => 'Cette semaine',
        'this_month'=> 'Ce mois',
        'custom'    => 'Plage personnalisée',
        'export'    => 'Exporter',
        'no_data'   => 'Aucune donnée pour cette période.',
    ],

    'kds' => [
        'title'        => 'Affichage cuisine',
        'ticket'       => 'Ticket #{id}',
        'bump'         => 'Valider',
        'recall'       => 'Rappeler',
        'allergen_ack' => 'Confirmer les allergènes',
        'new_ticket'   => 'Nouveau ticket',
        'in_progress'  => 'En cours',
        'ready'        => 'Prêt',
        'allergen_warn'=> 'Allergène : {allergens}',
    ],

    'branches' => [
        'title'  => 'Établissements',
        'add'    => 'Ajouter',
        'name'   => 'Nom',
        'address'=> 'Adresse',
        'phone'  => 'Téléphone',
        'hours'  => 'Horaires',
        'status' => 'Statut',
    ],

    'roles' => [
        'title'       => 'Rôles & permissions',
        'add'         => 'Ajouter un rôle',
        'name'        => 'Nom du rôle',
        'permissions' => 'Permissions',
        'system_role' => 'Rôle système',
        'custom_role' => 'Rôle personnalisé',
        'assign'      => 'Attribuer',
    ],

    'notifications' => [
        'title'     => 'Notifications',
        'mark_read' => 'Marquer comme lu',
        'mark_all'  => 'Tout marquer comme lu',
        'no_new'    => 'Aucune nouvelle notification.',
        'view_all'  => 'Tout voir',
    ],

    'portal' => [
        'title'             => 'Portail client',
        'subtitle'          => 'Consultez votre fidélité, réservations et commandes',
        'login'             => 'Se connecter',
        'register'          => 'S\'inscrire',
        'or_login'          => 'Déjà inscrit ? Se connecter',
        'or_register'       => 'Nouveau ? Créer un compte',
        'phone'             => 'Numéro de téléphone',
        'first_name'        => 'Prénom',
        'last_name'         => 'Nom',
        'login_failed'      => 'Identifiants incorrects.',
        'register_failed'   => 'Inscription échouée. Réessayez.',
        'select_restaurant' => 'Choisir un restaurant',
        'choose_restaurant' => 'Choisissez un restaurant pour voir votre fidélité et réservations.',
        'loyalty'           => 'Fidélité',
        'points'            => '{points} pts',
        'tier'              => 'Niveau',
        'total_spend'       => 'Dépenses totales',
        'total_visits'      => 'Visites totales',
        'next_tier'         => 'Progression vers le niveau suivant',
        'recent_activity'   => 'Activité récente',
        'no_activity'       => 'Aucune activité récente.',
        'bookings'          => 'Réservations d\'événements',
        'no_bookings'       => 'Aucune réservation.',
        'reservations'      => 'Réservations de table',
        'no_reservations'   => 'Aucune réservation de table.',
        'profile'           => 'Profil',
        'sign_out'          => 'Se déconnecter',
        'tx_earn'           => 'Gagné',
        'tx_redeem'         => 'Utilisé',
        'tx_expire'         => 'Expiré',
        'tx_reverse'        => 'Annulé',
        'tx_bonus'          => 'Bonus',
        'tx_adjustment'     => 'Ajustement',
    ],
```

- [ ] **Step 2: Complete `de-DE/web.php` — add missing sections**

The existing file has nav, common, auth, profile, orders, dashboard. Add after `dashboard`:

```php
    'settings' => [
        'title'  => 'Einstellungen',
        'tenant' => 'Restauranteinstellungen',
        'branch' => 'Filialeinstellungen',
        'saved'  => 'Einstellungen gespeichert.',
    ],

    'menu' => [
        'title'           => 'Speisekarte',
        'categories'      => 'Kategorien',
        'items'           => 'Gerichte',
        'add_category'    => 'Kategorie hinzufügen',
        'add_item'        => 'Gericht hinzufügen',
        'item_name'       => 'Gerichtname',
        'description'     => 'Beschreibung',
        'price'           => 'Preis',
        'allergens'       => 'Allergene',
        'dietary'         => 'Ernährungshinweise',
        'modifiers'       => 'Modifikatoren',
        'eighty_six'      => '86 (nicht verfügbar)',
        'restore'         => 'Wiederherstellen',
        'is_active'       => 'Aktiv',
        'photo'           => 'Foto',
        'sort_order'      => 'Reihenfolge',
        'branch_overrides'=> 'Filialausnahmen',
    ],

    'inventory' => [
        'title'          => 'Lager',
        'items'          => 'Lagerartikel',
        'suppliers'      => 'Lieferanten',
        'purchase_orders'=> 'Bestellungen',
        'grn'            => 'Wareneingang',
        'stocktake'      => 'Inventur',
        'waste_log'      => 'Abfallprotokoll',
        'recipes'        => 'Rezepte',
        'low_stock'      => 'Niedriger Bestand',
        'out_of_stock'   => 'Nicht vorrätig',
        'unit'           => 'Einheit',
        'quantity'       => 'Menge',
        'reorder_level'  => 'Nachbestellgrenze',
        'wac'            => 'GDK',
    ],

    'reservations' => [
        'title'      => 'Reservierungen',
        'new'        => 'Neue Reservierung',
        'date'       => 'Datum',
        'time'       => 'Uhrzeit',
        'covers'     => 'Gedecke',
        'guest'      => 'Gastname',
        'table'      => 'Tisch',
        'status'     => 'Status',
        'notes'      => 'Notizen',
        'confirm'    => 'Bestätigen',
        'seat'       => 'Platzieren',
        'complete'   => 'Abschließen',
        'no_show'    => 'Nicht erschienen',
        'cancel'     => 'Stornieren',
        'floor_plan' => 'Raumplan',
        'waitlist'   => 'Warteliste',
    ],

    'events' => [
        'title'       => 'Veranstaltungen',
        'new'         => 'Neue Veranstaltung',
        'event_date'  => 'Datum',
        'title_label' => 'Titel',
        'type'        => 'Art',
        'status'      => 'Status',
        'guest_count' => 'Gästezahl',
        'space'       => 'Raum',
        'package'     => 'Paket',
        'notes'       => 'Notizen',
        'run_sheet'   => 'Ablaufplan',
        'tasks'       => 'Aufgaben',
        'billing'     => 'Abrechnung',
    ],

    'staff' => [
        'title'         => 'Personal',
        'invite'        => 'Einladen',
        'name'          => 'Name',
        'role'          => 'Rolle',
        'branch'        => 'Filiale',
        'status'        => 'Status',
        'shifts'        => 'Schichten',
        'attendance'    => 'Anwesenheit',
        'leave'         => 'Urlaub',
        'payroll'       => 'Gehaltsabrechnung',
        'clock_in'      => 'Einstempeln',
        'clock_out'     => 'Ausstempeln',
        'approve_leave' => 'Urlaub genehmigen',
        'reject_leave'  => 'Urlaub ablehnen',
    ],

    'customers' => [
        'title'      => 'Kunden',
        'profile'    => 'Profil',
        'loyalty'    => 'Treueprogramm',
        'tier'       => 'Stufe',
        'points'     => 'Punkte',
        'orders'     => 'Bestellungen',
        'spend'      => 'Gesamtausgaben',
        'last_visit' => 'Letzter Besuch',
        'tags'       => 'Etiketten',
        'notes'      => 'Notizen',
        'merge'      => 'Profile zusammenführen',
    ],

    'analytics' => [
        'title'     => 'Analysen',
        'revenue'   => 'Umsatz',
        'orders'    => 'Bestellungen',
        'covers'    => 'Gedecke',
        'avg_spend' => 'Durchschn. Ausgaben',
        'top_dishes'=> 'Top-Gerichte',
        'period'    => 'Zeitraum',
        'today'     => 'Heute',
        'this_week' => 'Diese Woche',
        'this_month'=> 'Diesen Monat',
        'custom'    => 'Benutzerdefiniert',
        'export'    => 'Exportieren',
        'no_data'   => 'Keine Daten für diesen Zeitraum.',
    ],

    'kds' => [
        'title'        => 'Küchenanzeige',
        'ticket'       => 'Ticket #{id}',
        'bump'         => 'Abschließen',
        'recall'       => 'Zurückrufen',
        'allergen_ack' => 'Allergene bestätigen',
        'new_ticket'   => 'Neues Ticket',
        'in_progress'  => 'In Bearbeitung',
        'ready'        => 'Fertig',
        'allergen_warn'=> 'Allergen: {allergens}',
    ],

    'branches' => [
        'title'  => 'Filialen',
        'add'    => 'Filiale hinzufügen',
        'name'   => 'Name',
        'address'=> 'Adresse',
        'phone'  => 'Telefon',
        'hours'  => 'Öffnungszeiten',
        'status' => 'Status',
    ],

    'roles' => [
        'title'       => 'Rollen & Berechtigungen',
        'add'         => 'Rolle hinzufügen',
        'name'        => 'Rollenname',
        'permissions' => 'Berechtigungen',
        'system_role' => 'Systemrolle',
        'custom_role' => 'Benutzerdefinierte Rolle',
        'assign'      => 'Zuweisen',
    ],

    'notifications' => [
        'title'     => 'Benachrichtigungen',
        'mark_read' => 'Als gelesen markieren',
        'mark_all'  => 'Alle als gelesen markieren',
        'no_new'    => 'Keine neuen Benachrichtigungen.',
        'view_all'  => 'Alle anzeigen',
    ],

    'landing_cms' => [
        'title'             => 'Startseite',
        'template'          => 'Vorlage',
        'custom_css'        => 'Eigenes CSS',
        'seo'               => 'SEO',
        'content_blocks'    => 'Inhaltsblöcke',
        'featured_items'    => 'Empfohlene Gerichte',
        'social_feeds'      => 'Social Feeds',
        'gallery'           => 'Galerie',
        'reviews'           => 'Bewertungen',
        'supported_locales' => 'Unterstützte Sprachen',
        'locale_en_us'      => 'Englisch — USA',
        'locale_en_gb'      => 'Englisch — UK',
        'locale_fr_fr'      => 'Französisch',
        'locale_es_es'      => 'Spanisch',
        'locale_de_de'      => 'Deutsch — Deutschland',
        'locale_de_at'      => 'Deutsch — Österreich',
        'locale_pl_pl'      => 'Polnisch',
        'locale_it_it'      => 'Italienisch',
    ],

    'portal' => [
        'title'             => 'Kundenportal',
        'subtitle'          => 'Treuepunkte, Reservierungen & Buchungen',
        'login'             => 'Anmelden',
        'register'          => 'Registrieren',
        'or_login'          => 'Bereits registriert? Anmelden',
        'or_register'       => 'Neu hier? Konto erstellen',
        'phone'             => 'Telefonnummer',
        'first_name'        => 'Vorname',
        'last_name'         => 'Nachname',
        'login_failed'      => 'Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Daten.',
        'register_failed'   => 'Registrierung fehlgeschlagen. Bitte erneut versuchen.',
        'select_restaurant' => 'Restaurant auswählen',
        'choose_restaurant' => 'Wählen Sie ein Restaurant, um Ihre Treue und Reservierungen zu sehen.',
        'loyalty'           => 'Treueprogramm',
        'points'            => '{points} Pkt.',
        'tier'              => 'Stufe',
        'total_spend'       => 'Gesamtausgaben',
        'total_visits'      => 'Gesamtbesuche',
        'next_tier'         => 'Fortschritt zur nächsten Stufe',
        'recent_activity'   => 'Letzte Aktivitäten',
        'no_activity'       => 'Keine Aktivitäten.',
        'bookings'          => 'Buchungen',
        'no_bookings'       => 'Keine Buchungen.',
        'reservations'      => 'Reservierungen',
        'no_reservations'   => 'Keine Reservierungen.',
        'profile'           => 'Profil',
        'sign_out'          => 'Abmelden',
        'tx_earn'           => 'Gutschrift',
        'tx_redeem'         => 'Eingelöst',
        'tx_expire'         => 'Abgelaufen',
        'tx_reverse'        => 'Storniert',
        'tx_bonus'          => 'Bonus',
        'tx_adjustment'     => 'Korrektur',
    ],
```

- [ ] **Step 3: Complete remaining locales (`de-AT`, `es-ES`, `pl-PL`, `it-IT`, `en-GB`)**

For **`de-AT/web.php`**: Copy the entire `de-DE/web.php` content. Add one differentiator — AT uses `Getränkekarte` for menu in Viennese usage but this is minor; the file should be a full copy of `de-DE/web.php`.

For **`es-ES/web.php`**: Has nav, common, auth, profile, orders, dashboard. Add all missing sections with these Spanish translations:

```php
    'settings' => [
        'title'  => 'Configuración',
        'tenant' => 'Ajustes del restaurante',
        'branch' => 'Ajustes del local',
        'saved'  => 'Ajustes guardados.',
    ],

    'menu' => [
        'title'           => 'Menú',
        'categories'      => 'Categorías',
        'items'           => 'Platos',
        'add_category'    => 'Añadir categoría',
        'add_item'        => 'Añadir plato',
        'item_name'       => 'Nombre del plato',
        'description'     => 'Descripción',
        'price'           => 'Precio',
        'allergens'       => 'Alérgenos',
        'dietary'         => 'Indicaciones dietéticas',
        'modifiers'       => 'Modificadores',
        'eighty_six'      => '86 (agotado)',
        'restore'         => 'Restaurar',
        'is_active'       => 'Activo',
        'photo'           => 'Foto',
        'sort_order'      => 'Orden',
        'branch_overrides'=> 'Excepciones por local',
    ],

    'inventory' => [
        'title'          => 'Inventario',
        'items'          => 'Artículos',
        'suppliers'      => 'Proveedores',
        'purchase_orders'=> 'Pedidos de compra',
        'grn'            => 'Recepción de mercancías',
        'stocktake'      => 'Inventario',
        'waste_log'      => 'Registro de mermas',
        'recipes'        => 'Recetas',
        'low_stock'      => 'Stock bajo',
        'out_of_stock'   => 'Sin existencias',
        'unit'           => 'Unidad',
        'quantity'       => 'Cantidad',
        'reorder_level'  => 'Nivel de reposición',
        'wac'            => 'CMP',
    ],

    'reservations' => [
        'title'      => 'Reservas',
        'new'        => 'Nueva reserva',
        'date'       => 'Fecha',
        'time'       => 'Hora',
        'covers'     => 'Comensales',
        'guest'      => 'Nombre del cliente',
        'table'      => 'Mesa',
        'status'     => 'Estado',
        'notes'      => 'Notas',
        'confirm'    => 'Confirmar',
        'seat'       => 'Sentar',
        'complete'   => 'Completar',
        'no_show'    => 'No presentado',
        'cancel'     => 'Cancelar',
        'floor_plan' => 'Plano de sala',
        'waitlist'   => 'Lista de espera',
    ],

    'events' => [
        'title'       => 'Eventos',
        'new'         => 'Nuevo evento',
        'event_date'  => 'Fecha',
        'title_label' => 'Título',
        'type'        => 'Tipo',
        'status'      => 'Estado',
        'guest_count' => 'Número de invitados',
        'space'       => 'Espacio',
        'package'     => 'Paquete',
        'notes'       => 'Notas',
        'run_sheet'   => 'Hoja de ruta',
        'tasks'       => 'Tareas',
        'billing'     => 'Facturación',
    ],

    'staff' => [
        'title'         => 'Personal',
        'invite'        => 'Invitar',
        'name'          => 'Nombre',
        'role'          => 'Rol',
        'branch'        => 'Local',
        'status'        => 'Estado',
        'shifts'        => 'Turnos',
        'attendance'    => 'Asistencia',
        'leave'         => 'Vacaciones',
        'payroll'       => 'Nómina',
        'clock_in'      => 'Entrada',
        'clock_out'     => 'Salida',
        'approve_leave' => 'Aprobar vacaciones',
        'reject_leave'  => 'Rechazar vacaciones',
    ],

    'customers' => [
        'title'      => 'Clientes',
        'profile'    => 'Perfil',
        'loyalty'    => 'Fidelidad',
        'tier'       => 'Nivel',
        'points'     => 'Puntos',
        'orders'     => 'Pedidos',
        'spend'      => 'Gasto total',
        'last_visit' => 'Última visita',
        'tags'       => 'Etiquetas',
        'notes'      => 'Notas',
        'merge'      => 'Fusionar perfiles',
    ],

    'analytics' => [
        'title'     => 'Analítica',
        'revenue'   => 'Ingresos',
        'orders'    => 'Pedidos',
        'covers'    => 'Comensales',
        'avg_spend' => 'Gasto medio',
        'top_dishes'=> 'Platos más populares',
        'period'    => 'Período',
        'today'     => 'Hoy',
        'this_week' => 'Esta semana',
        'this_month'=> 'Este mes',
        'custom'    => 'Rango personalizado',
        'export'    => 'Exportar',
        'no_data'   => 'Sin datos para este período.',
    ],

    'kds' => [
        'title'        => 'Pantalla de cocina',
        'ticket'       => 'Ticket #{id}',
        'bump'         => 'Completar',
        'recall'       => 'Recordar',
        'allergen_ack' => 'Confirmar alérgenos',
        'new_ticket'   => 'Nuevo ticket',
        'in_progress'  => 'En proceso',
        'ready'        => 'Listo',
        'allergen_warn'=> 'Alérgeno: {allergens}',
    ],

    'branches' => [
        'title'  => 'Locales',
        'add'    => 'Añadir local',
        'name'   => 'Nombre',
        'address'=> 'Dirección',
        'phone'  => 'Teléfono',
        'hours'  => 'Horario',
        'status' => 'Estado',
    ],

    'roles' => [
        'title'       => 'Roles y permisos',
        'add'         => 'Añadir rol',
        'name'        => 'Nombre del rol',
        'permissions' => 'Permisos',
        'system_role' => 'Rol del sistema',
        'custom_role' => 'Rol personalizado',
        'assign'      => 'Asignar',
    ],

    'notifications' => [
        'title'     => 'Notificaciones',
        'mark_read' => 'Marcar como leído',
        'mark_all'  => 'Marcar todo como leído',
        'no_new'    => 'Sin notificaciones nuevas.',
        'view_all'  => 'Ver todo',
    ],

    'landing_cms' => [
        'title'             => 'Página de inicio',
        'template'          => 'Plantilla',
        'custom_css'        => 'CSS personalizado',
        'seo'               => 'SEO',
        'content_blocks'    => 'Bloques de contenido',
        'featured_items'    => 'Platos destacados',
        'social_feeds'      => 'Redes sociales',
        'gallery'           => 'Galería',
        'reviews'           => 'Reseñas',
        'supported_locales' => 'Idiomas disponibles',
        'locale_en_us'      => 'Inglés — EE.UU.',
        'locale_en_gb'      => 'Inglés — Reino Unido',
        'locale_fr_fr'      => 'Francés',
        'locale_es_es'      => 'Español',
        'locale_de_de'      => 'Alemán — Alemania',
        'locale_de_at'      => 'Alemán — Austria',
        'locale_pl_pl'      => 'Polaco',
        'locale_it_it'      => 'Italiano',
    ],

    'portal' => [
        'title'             => 'Portal del cliente',
        'subtitle'          => 'Consulta tu fidelidad, reservas y pedidos',
        'login'             => 'Iniciar sesión',
        'register'          => 'Registrarse',
        'or_login'          => '¿Ya tienes cuenta? Iniciar sesión',
        'or_register'       => '¿Nuevo aquí? Crear cuenta',
        'phone'             => 'Teléfono',
        'first_name'        => 'Nombre',
        'last_name'         => 'Apellido',
        'login_failed'      => 'Error al iniciar sesión. Comprueba tus credenciales.',
        'register_failed'   => 'Error al registrarse. Inténtalo de nuevo.',
        'select_restaurant' => 'Seleccionar restaurante',
        'choose_restaurant' => 'Elige un restaurante para ver tu fidelidad y reservas.',
        'loyalty'           => 'Fidelidad',
        'points'            => '{points} pts',
        'tier'              => 'Nivel',
        'total_spend'       => 'Gasto total',
        'total_visits'      => 'Visitas totales',
        'next_tier'         => 'Progreso al siguiente nivel',
        'recent_activity'   => 'Actividad reciente',
        'no_activity'       => 'Sin actividad reciente.',
        'bookings'          => 'Reservas de eventos',
        'no_bookings'       => 'Sin reservas.',
        'reservations'      => 'Reservas de mesa',
        'no_reservations'   => 'Sin reservas de mesa.',
        'profile'           => 'Perfil',
        'sign_out'          => 'Cerrar sesión',
        'tx_earn'           => 'Ganado',
        'tx_redeem'         => 'Canjeado',
        'tx_expire'         => 'Expirado',
        'tx_reverse'        => 'Revertido',
        'tx_bonus'          => 'Bono',
        'tx_adjustment'     => 'Ajuste',
    ],
```

Apply the equivalent pattern (translated) to `pl-PL/web.php` and `it-IT/web.php`.

For **`pl-PL/web.php`** add (Polish translations of all missing sections):
```php
    'settings' => [
        'title'  => 'Ustawienia',
        'tenant' => 'Ustawienia restauracji',
        'branch' => 'Ustawienia oddziału',
        'saved'  => 'Ustawienia zapisane.',
    ],
    'menu' => ['title'=>'Menu','categories'=>'Kategorie','items'=>'Dania','add_category'=>'Dodaj kategorię','add_item'=>'Dodaj danie','item_name'=>'Nazwa dania','description'=>'Opis','price'=>'Cena','allergens'=>'Alergeny','dietary'=>'Oznaczenia dietetyczne','modifiers'=>'Modyfikatory','eighty_six'=>'86 (niedostępne)','restore'=>'Przywróć','is_active'=>'Aktywny','photo'=>'Zdjęcie','sort_order'=>'Kolejność','branch_overrides'=>'Wyjątki oddziału'],
    'inventory' => ['title'=>'Magazyn','items'=>'Artykuły','suppliers'=>'Dostawcy','purchase_orders'=>'Zamówienia zakupu','grn'=>'Przyjęcie towaru','stocktake'=>'Inwentaryzacja','waste_log'=>'Dziennik odpadów','recipes'=>'Receptury','low_stock'=>'Niski stan','out_of_stock'=>'Brak na stanie','unit'=>'Jednostka','quantity'=>'Ilość','reorder_level'=>'Poziom zamówienia','wac'=>'ŚWN'],
    'reservations' => ['title'=>'Rezerwacje','new'=>'Nowa rezerwacja','date'=>'Data','time'=>'Godzina','covers'=>'Liczba osób','guest'=>'Imię gościa','table'=>'Stół','status'=>'Status','notes'=>'Notatki','confirm'=>'Potwierdź','seat'=>'Posadź','complete'=>'Zakończ','no_show'=>'Nieobecność','cancel'=>'Anuluj','floor_plan'=>'Plan sali','waitlist'=>'Lista oczekujących'],
    'events' => ['title'=>'Wydarzenia','new'=>'Nowe wydarzenie','event_date'=>'Data','title_label'=>'Tytuł','type'=>'Typ','status'=>'Status','guest_count'=>'Liczba gości','space'=>'Przestrzeń','package'=>'Pakiet','notes'=>'Notatki','run_sheet'=>'Harmonogram','tasks'=>'Zadania','billing'=>'Rozliczenie'],
    'staff' => ['title'=>'Personel','invite'=>'Zaproś','name'=>'Imię','role'=>'Rola','branch'=>'Oddział','status'=>'Status','shifts'=>'Zmiany','attendance'=>'Obecność','leave'=>'Urlopy','payroll'=>'Płace','clock_in'=>'Wejście','clock_out'=>'Wyjście','approve_leave'=>'Zatwierdź urlop','reject_leave'=>'Odrzuć urlop'],
    'customers' => ['title'=>'Klienci','profile'=>'Profil','loyalty'=>'Lojalność','tier'=>'Poziom','points'=>'Punkty','orders'=>'Zamówienia','spend'=>'Łączne wydatki','last_visit'=>'Ostatnia wizyta','tags'=>'Tagi','notes'=>'Notatki','merge'=>'Połącz profile'],
    'analytics' => ['title'=>'Analityka','revenue'=>'Przychód','orders'=>'Zamówienia','covers'=>'Nakrycia','avg_spend'=>'Śr. wydatek','top_dishes'=>'Popularne dania','period'=>'Okres','today'=>'Dzisiaj','this_week'=>'Ten tydzień','this_month'=>'Ten miesiąc','custom'=>'Niestandardowy','export'=>'Eksportuj','no_data'=>'Brak danych.'],
    'kds' => ['title'=>'Ekran kuchni','ticket'=>'Bilet #{id}','bump'=>'Zakończ','recall'=>'Przypomnij','allergen_ack'=>'Potwierdź alergeny','new_ticket'=>'Nowy bilet','in_progress'=>'W trakcie','ready'=>'Gotowe','allergen_warn'=>'Alergen: {allergens}'],
    'branches' => ['title'=>'Oddziały','add'=>'Dodaj oddział','name'=>'Nazwa','address'=>'Adres','phone'=>'Telefon','hours'=>'Godziny','status'=>'Status'],
    'roles' => ['title'=>'Role i uprawnienia','add'=>'Dodaj rolę','name'=>'Nazwa roli','permissions'=>'Uprawnienia','system_role'=>'Rola systemowa','custom_role'=>'Rola niestandardowa','assign'=>'Przypisz'],
    'notifications' => ['title'=>'Powiadomienia','mark_read'=>'Oznacz jako przeczytane','mark_all'=>'Oznacz wszystkie','no_new'=>'Brak nowych powiadomień.','view_all'=>'Pokaż wszystkie'],
    'landing_cms' => ['title'=>'Strona główna','template'=>'Szablon','custom_css'=>'Własny CSS','seo'=>'SEO','content_blocks'=>'Bloki treści','featured_items'=>'Polecane dania','social_feeds'=>'Social media','gallery'=>'Galeria','reviews'=>'Recenzje','supported_locales'=>'Obsługiwane języki','locale_en_us'=>'Angielski — USA','locale_en_gb'=>'Angielski — UK','locale_fr_fr'=>'Francuski','locale_es_es'=>'Hiszpański','locale_de_de'=>'Niemiecki — Niemcy','locale_de_at'=>'Niemiecki — Austria','locale_pl_pl'=>'Polski','locale_it_it'=>'Włoski'],
    'portal' => ['title'=>'Portal klienta','subtitle'=>'Sprawdź swoją lojalność, rezerwacje i zamówienia','login'=>'Zaloguj się','register'=>'Zarejestruj się','or_login'=>'Masz konto? Zaloguj się','or_register'=>'Nowy użytkownik? Utwórz konto','phone'=>'Numer telefonu','first_name'=>'Imię','last_name'=>'Nazwisko','login_failed'=>'Błąd logowania.','register_failed'=>'Błąd rejestracji.','select_restaurant'=>'Wybierz restaurację','choose_restaurant'=>'Wybierz restaurację, aby zobaczyć swoją lojalność i rezerwacje.','loyalty'=>'Lojalność','points'=>'{points} pkt','tier'=>'Poziom','total_spend'=>'Łączne wydatki','total_visits'=>'Łączne wizyty','next_tier'=>'Postęp do następnego poziomu','recent_activity'=>'Ostatnia aktywność','no_activity'=>'Brak aktywności.','bookings'=>'Rezerwacje wydarzeń','no_bookings'=>'Brak rezerwacji.','reservations'=>'Rezerwacje stolika','no_reservations'=>'Brak rezerwacji stolika.','profile'=>'Profil','sign_out'=>'Wyloguj się','tx_earn'=>'Naliczone','tx_redeem'=>'Wymienione','tx_expire'=>'Wygasłe','tx_reverse'=>'Cofnięte','tx_bonus'=>'Bonus','tx_adjustment'=>'Korekta'],
```

For **`it-IT/web.php`** add (Italian translations):
```php
    'settings' => ['title'=>'Impostazioni','tenant'=>'Impostazioni ristorante','branch'=>'Impostazioni sede','saved'=>'Impostazioni salvate.'],
    'menu' => ['title'=>'Menu','categories'=>'Categorie','items'=>'Piatti','add_category'=>'Aggiungi categoria','add_item'=>'Aggiungi piatto','item_name'=>'Nome piatto','description'=>'Descrizione','price'=>'Prezzo','allergens'=>'Allergeni','dietary'=>'Indicazioni dietetiche','modifiers'=>'Modificatori','eighty_six'=>'86 (esaurito)','restore'=>'Ripristina','is_active'=>'Attivo','photo'=>'Foto','sort_order'=>'Ordine','branch_overrides'=>'Eccezioni per sede'],
    'inventory' => ['title'=>'Magazzino','items'=>'Articoli','suppliers'=>'Fornitori','purchase_orders'=>'Ordini d\'acquisto','grn'=>'Ricevimento merci','stocktake'=>'Inventario','waste_log'=>'Registro sprechi','recipes'=>'Ricette','low_stock'=>'Scorte basse','out_of_stock'=>'Esaurito','unit'=>'Unità','quantity'=>'Quantità','reorder_level'=>'Livello di riordino','wac'=>'CMM'],
    'reservations' => ['title'=>'Prenotazioni','new'=>'Nuova prenotazione','date'=>'Data','time'=>'Ora','covers'=>'Coperti','guest'=>'Nome ospite','table'=>'Tavolo','status'=>'Stato','notes'=>'Note','confirm'=>'Conferma','seat'=>'Fai sedere','complete'=>'Completa','no_show'=>'Mancata presentazione','cancel'=>'Annulla','floor_plan'=>'Planimetria sala','waitlist'=>'Lista d\'attesa'],
    'events' => ['title'=>'Eventi','new'=>'Nuovo evento','event_date'=>'Data','title_label'=>'Titolo','type'=>'Tipo','status'=>'Stato','guest_count'=>'Numero ospiti','space'=>'Spazio','package'=>'Pacchetto','notes'=>'Note','run_sheet'=>'Scaletta','tasks'=>'Attività','billing'=>'Fatturazione'],
    'staff' => ['title'=>'Personale','invite'=>'Invita','name'=>'Nome','role'=>'Ruolo','branch'=>'Sede','status'=>'Stato','shifts'=>'Turni','attendance'=>'Presenze','leave'=>'Ferie','payroll'=>'Buste paga','clock_in'=>'Entrata','clock_out'=>'Uscita','approve_leave'=>'Approva ferie','reject_leave'=>'Rifiuta ferie'],
    'customers' => ['title'=>'Clienti','profile'=>'Profilo','loyalty'=>'Fedeltà','tier'=>'Livello','points'=>'Punti','orders'=>'Ordini','spend'=>'Spesa totale','last_visit'=>'Ultima visita','tags'=>'Tag','notes'=>'Note','merge'=>'Unisci profili'],
    'analytics' => ['title'=>'Analisi','revenue'=>'Ricavi','orders'=>'Ordini','covers'=>'Coperti','avg_spend'=>'Spesa media','top_dishes'=>'Piatti più richiesti','period'=>'Periodo','today'=>'Oggi','this_week'=>'Questa settimana','this_month'=>'Questo mese','custom'=>'Personalizzato','export'=>'Esporta','no_data'=>'Nessun dato.'],
    'kds' => ['title'=>'Display cucina','ticket'=>'Ticket #{id}','bump'=>'Completa','recall'=>'Richiama','allergen_ack'=>'Conferma allergeni','new_ticket'=>'Nuovo ticket','in_progress'=>'In corso','ready'=>'Pronto','allergen_warn'=>'Allergene: {allergens}'],
    'branches' => ['title'=>'Sedi','add'=>'Aggiungi sede','name'=>'Nome','address'=>'Indirizzo','phone'=>'Telefono','hours'=>'Orari','status'=>'Stato'],
    'roles' => ['title'=>'Ruoli e permessi','add'=>'Aggiungi ruolo','name'=>'Nome ruolo','permissions'=>'Permessi','system_role'=>'Ruolo di sistema','custom_role'=>'Ruolo personalizzato','assign'=>'Assegna'],
    'notifications' => ['title'=>'Notifiche','mark_read'=>'Segna come letto','mark_all'=>'Segna tutto come letto','no_new'=>'Nessuna nuova notifica.','view_all'=>'Vedi tutto'],
    'landing_cms' => ['title'=>'Pagina iniziale','template'=>'Modello','custom_css'=>'CSS personalizzato','seo'=>'SEO','content_blocks'=>'Blocchi di contenuto','featured_items'=>'Piatti in evidenza','social_feeds'=>'Social feed','gallery'=>'Galleria','reviews'=>'Recensioni','supported_locales'=>'Lingue supportate','locale_en_us'=>'Inglese — USA','locale_en_gb'=>'Inglese — UK','locale_fr_fr'=>'Francese','locale_es_es'=>'Spagnolo','locale_de_de'=>'Tedesco — Germania','locale_de_at'=>'Tedesco — Austria','locale_pl_pl'=>'Polacco','locale_it_it'=>'Italiano'],
    'portal' => ['title'=>'Portale clienti','subtitle'=>'Visualizza la tua fedeltà, prenotazioni e ordini','login'=>'Accedi','register'=>'Registrati','or_login'=>'Hai già un account? Accedi','or_register'=>'Nuovo? Crea account','phone'=>'Telefono','first_name'=>'Nome','last_name'=>'Cognome','login_failed'=>'Accesso non riuscito.','register_failed'=>'Registrazione non riuscita.','select_restaurant'=>'Seleziona ristorante','choose_restaurant'=>'Scegli un ristorante per vedere la tua fedeltà e prenotazioni.','loyalty'=>'Fedeltà','points'=>'{points} pt','tier'=>'Livello','total_spend'=>'Spesa totale','total_visits'=>'Visite totali','next_tier'=>'Progresso al livello successivo','recent_activity'=>'Attività recente','no_activity'=>'Nessuna attività.','bookings'=>'Prenotazioni eventi','no_bookings'=>'Nessuna prenotazione.','reservations'=>'Prenotazioni tavoli','no_reservations'=>'Nessuna prenotazione.','profile'=>'Profilo','sign_out'=>'Esci','tx_earn'=>'Guadagnato','tx_redeem'=>'Riscattato','tx_expire'=>'Scaduto','tx_reverse'=>'Annullato','tx_bonus'=>'Bonus','tx_adjustment'=>'Rettifica'],
```

For **`en-GB/web.php`**: Copy en-US entirely, with these British spelling changes: `colour` instead of `color` in any string, `favour` instead of `favor`, and change any USD currency symbols in strings to GBP `£`.

- [ ] **Step 4: Commit**

```bash
cd /Users/deepak/Projects/ChefLogik/api
git add lang/
git commit -m "feat(i18n): complete all non-en-US web.php translation files"
```

---

## Task 4 — Complete non-en-US `admin.php` lang files

**Files:**
- Modify: `api/lang/fr-FR/admin.php`, `api/lang/de-DE/admin.php`, `api/lang/de-AT/admin.php`, `api/lang/es-ES/admin.php`, `api/lang/pl-PL/admin.php`, `api/lang/it-IT/admin.php`, `api/lang/en-GB/admin.php`

Current coverage:
- `fr-FR`: has nav, common, auth, tenants, health — missing: billing, analytics, audit, support, users, flags
- `de-DE`, `es-ES`, `pl-PL`, `it-IT`: have nav, common, tenants — missing: auth, billing, analytics, health, audit, support, users, flags
- `de-AT`: empty
- `en-GB`: empty

- [ ] **Step 1: Complete `fr-FR/admin.php` — add missing sections**

```php
    'billing' => [
        'title'    => 'Facturation',
        'plan'     => 'Forfait',
        'price'    => 'Prix',
        'features' => 'Fonctionnalités',
        'limits'   => 'Limites',
    ],

    'analytics' => [
        'title'          => 'Analytique plateforme',
        'total_tenants'  => 'Total locataires',
        'active_tenants' => 'Locataires actifs',
        'total_orders'   => 'Total commandes',
        'revenue'        => 'Revenus plateforme',
        'period'         => 'Période',
    ],

    'audit' => [
        'title'     => 'Journal d\'audit',
        'actor'     => 'Auteur',
        'action'    => 'Action',
        'resource'  => 'Ressource',
        'tenant'    => 'Locataire',
        'ip'        => 'Adresse IP',
        'timestamp' => 'Horodatage',
    ],

    'support' => [
        'title'   => 'Support',
        'tickets' => 'Tickets',
        'open'    => 'Ouverts',
        'resolved'=> 'Résolus',
    ],

    'users' => [
        'title'      => 'Administrateurs',
        'add'        => 'Ajouter un administrateur',
        'name'       => 'Nom',
        'email'      => 'E-mail',
        'role'       => 'Rôle',
        'last_login' => 'Dernière connexion',
    ],

    'flags' => [
        'title'  => 'Drapeaux de fonctionnalités',
        'flag'   => 'Drapeau',
        'enabled'=> 'Activé',
        'toggle' => 'Basculer',
    ],
```

- [ ] **Step 2: Complete remaining locales**

For **`de-DE/admin.php`** add auth + all missing sections:
```php
    'auth' => ['sign_in'=>'Anmelden','sign_out'=>'Abmelden','email'=>'E-Mail-Adresse','password'=>'Passwort','verify_code'=>'Code verifizieren','send_code'=>'Code senden','code_sent'=>'Code gesendet an {email}','invalid'=>'Ungültige Anmeldedaten.','session_expired'=>'Sitzung abgelaufen. Bitte erneut anmelden.'],
    'billing' => ['title'=>'Abrechnung','plan'=>'Tarif','price'=>'Preis','features'=>'Funktionen','limits'=>'Limits'],
    'analytics' => ['title'=>'Plattform-Analysen','total_tenants'=>'Mandanten gesamt','active_tenants'=>'Aktive Mandanten','total_orders'=>'Bestellungen gesamt','revenue'=>'Plattformumsatz','period'=>'Zeitraum'],
    'health' => ['title'=>'Systemgesundheit','database'=>'Datenbank','redis'=>'Redis','queue'=>'Warteschlange','storage'=>'Speicher','ok'=>'OK','degraded'=>'Eingeschränkt','down'=>'Ausgefallen','latency'=>'Latenz: {ms}ms'],
    'audit' => ['title'=>'Auditprotokoll','actor'=>'Akteur','action'=>'Aktion','resource'=>'Ressource','tenant'=>'Mandant','ip'=>'IP-Adresse','timestamp'=>'Zeitstempel'],
    'support' => ['title'=>'Support','tickets'=>'Tickets','open'=>'Offen','resolved'=>'Gelöst'],
    'users' => ['title'=>'Administratoren','add'=>'Administrator hinzufügen','name'=>'Name','email'=>'E-Mail','role'=>'Rolle','last_login'=>'Letzte Anmeldung'],
    'flags' => ['title'=>'Feature-Flags','flag'=>'Flag','enabled'=>'Aktiviert','toggle'=>'Umschalten'],
```

Apply the same pattern for `de-AT` (copy `de-DE`), `es-ES`, `pl-PL`, `it-IT`, and `en-GB` with translations in those languages. The pattern is identical — translate the string values.

**`es-ES/admin.php`** missing sections:
```php
    'auth' => ['sign_in'=>'Iniciar sesión','sign_out'=>'Cerrar sesión','email'=>'Correo electrónico','password'=>'Contraseña','verify_code'=>'Verificar código','send_code'=>'Enviar código','code_sent'=>'Código enviado a {email}','invalid'=>'Credenciales inválidas.','session_expired'=>'Sesión expirada. Vuelve a iniciar sesión.'],
    'billing' => ['title'=>'Facturación','plan'=>'Plan','price'=>'Precio','features'=>'Funciones','limits'=>'Límites'],
    'analytics' => ['title'=>'Analítica de plataforma','total_tenants'=>'Total inquilinos','active_tenants'=>'Inquilinos activos','total_orders'=>'Total pedidos','revenue'=>'Ingresos de plataforma','period'=>'Período'],
    'health' => ['title'=>'Salud del sistema','database'=>'Base de datos','redis'=>'Redis','queue'=>'Cola','storage'=>'Almacenamiento','ok'=>'OK','degraded'=>'Degradado','down'=>'Caído','latency'=>'Latencia: {ms}ms'],
    'audit' => ['title'=>'Registro de auditoría','actor'=>'Actor','action'=>'Acción','resource'=>'Recurso','tenant'=>'Inquilino','ip'=>'Dirección IP','timestamp'=>'Marca de tiempo'],
    'support' => ['title'=>'Soporte','tickets'=>'Tickets','open'=>'Abiertos','resolved'=>'Resueltos'],
    'users' => ['title'=>'Administradores','add'=>'Añadir administrador','name'=>'Nombre','email'=>'Correo','role'=>'Rol','last_login'=>'Último acceso'],
    'flags' => ['title'=>'Indicadores de función','flag'=>'Indicador','enabled'=>'Habilitado','toggle'=>'Alternar'],
```

**`pl-PL/admin.php`** missing sections:
```php
    'auth' => ['sign_in'=>'Zaloguj się','sign_out'=>'Wyloguj się','email'=>'Adres e-mail','password'=>'Hasło','verify_code'=>'Zweryfikuj kod','send_code'=>'Wyślij kod','code_sent'=>'Kod wysłany na {email}','invalid'=>'Nieprawidłowe dane.','session_expired'=>'Sesja wygasła. Zaloguj się ponownie.'],
    'billing' => ['title'=>'Rozliczenia','plan'=>'Plan','price'=>'Cena','features'=>'Funkcje','limits'=>'Limity'],
    'analytics' => ['title'=>'Analityka platformy','total_tenants'=>'Łącznie najemców','active_tenants'=>'Aktywni najemcy','total_orders'=>'Łącznie zamówień','revenue'=>'Przychód platformy','period'=>'Okres'],
    'health' => ['title'=>'Stan systemu','database'=>'Baza danych','redis'=>'Redis','queue'=>'Kolejka','storage'=>'Magazyn','ok'=>'OK','degraded'=>'Zdegradowany','down'=>'Niedostępny','latency'=>'Opóźnienie: {ms}ms'],
    'audit' => ['title'=>'Dziennik audytu','actor'=>'Aktor','action'=>'Działanie','resource'=>'Zasób','tenant'=>'Najemca','ip'=>'Adres IP','timestamp'=>'Znacznik czasu'],
    'support' => ['title'=>'Wsparcie','tickets'=>'Zgłoszenia','open'=>'Otwarte','resolved'=>'Rozwiązane'],
    'users' => ['title'=>'Administratorzy','add'=>'Dodaj administratora','name'=>'Imię','email'=>'E-mail','role'=>'Rola','last_login'=>'Ostatnie logowanie'],
    'flags' => ['title'=>'Flagi funkcji','flag'=>'Flaga','enabled'=>'Włączona','toggle'=>'Przełącz'],
```

**`it-IT/admin.php`** missing sections:
```php
    'auth' => ['sign_in'=>'Accedi','sign_out'=>'Esci','email'=>'Indirizzo e-mail','password'=>'Password','verify_code'=>'Verifica codice','send_code'=>'Invia codice','code_sent'=>'Codice inviato a {email}','invalid'=>'Credenziali non valide.','session_expired'=>'Sessione scaduta. Accedi di nuovo.'],
    'billing' => ['title'=>'Fatturazione','plan'=>'Piano','price'=>'Prezzo','features'=>'Funzionalità','limits'=>'Limiti'],
    'analytics' => ['title'=>'Analisi piattaforma','total_tenants'=>'Tenant totali','active_tenants'=>'Tenant attivi','total_orders'=>'Ordini totali','revenue'=>'Ricavi piattaforma','period'=>'Periodo'],
    'health' => ['title'=>'Stato sistema','database'=>'Database','redis'=>'Redis','queue'=>'Coda','storage'=>'Archiviazione','ok'=>'OK','degraded'=>'Degradato','down'=>'Non disponibile','latency'=>'Latenza: {ms}ms'],
    'audit' => ['title'=>'Registro audit','actor'=>'Autore','action'=>'Azione','resource'=>'Risorsa','tenant'=>'Tenant','ip'=>'Indirizzo IP','timestamp'=>'Data/ora'],
    'support' => ['title'=>'Supporto','tickets'=>'Ticket','open'=>'Aperti','resolved'=>'Risolti'],
    'users' => ['title'=>'Amministratori','add'=>'Aggiungi amministratore','name'=>'Nome','email'=>'E-mail','role'=>'Ruolo','last_login'=>'Ultimo accesso'],
    'flags' => ['title'=>'Flag funzionalità','flag'=>'Flag','enabled'=>'Abilitato','toggle'=>'Attiva/disattiva'],
```

**`en-GB/admin.php`**: Copy `en-US/admin.php` entirely (no meaningful spelling differences for admin strings).

- [ ] **Step 3: Commit**

```bash
cd /Users/deepak/Projects/ChefLogik/api
git add lang/
git commit -m "feat(i18n): complete all non-en-US admin.php translation files"
```

---

## Task 5 — Wire translations in `/admin` ✅ COMPLETE

**Files:**
- Modify: `admin/src/routes/login.tsx` — ✅ DONE
- Modify: `admin/src/components/layout/AdminHeader.tsx` — ✅ DONE
- Modify: `admin/src/components/layout/AdminSidebar.tsx` — ✅ DONE
- Modify: all 9 `admin/src/routes/_authenticated/*.tsx` screens — ✅ DONE

### `login.tsx` — key replacements

- [x] **Step 1: Replace hardcoded strings in `admin/src/routes/login.tsx`** ✅ DONE

Add `import { useT } from '@/hooks/useT'` at the top of `LoginForm`.
Add `const t = useT()` as first line inside `LoginForm`.

Replace these specific strings:

| Current hardcoded string | Replace with |
|---|---|
| `'Platform Admin'` (badge) | `t('auth.sign_in')` → actually keep "Platform Admin" — this is a product name, not a UI string |
| `'Secure access\nto your platform'` | keep as-is (marketing copy, not translatable UI) |
| `'Sign in'` (h1) | `t('auth.sign_in')` |
| `'Platform admin access only'` | keep as-is (internal product string) |
| `'Email address'` (label) | `t('auth.email')` |
| `'Password'` (label) | `t('auth.password')` |
| `'Continue'` (button) | `t('common.next')` |
| `'Check your email'` (h1 OTP step) | `t('auth.verify_code')` — add key `'check_email': 'Check your email'` to en-US admin.php, or reuse `verify_code` |
| `'A 6-digit code was sent to'` | `t('auth.code_sent', { email: platform.emailHint ?? email })` |
| `'← Back'` | `t('common.back')` |
| `'Verify & Sign in'` (button) | `t('auth.verify_code')` |

Add these two keys to `en-US/admin.php` `auth` section first:
```php
'check_email'    => 'Check your email',
'verify_sign_in' => 'Verify & Sign in',
```

Then replace in `login.tsx`:
```tsx
import { useT } from '@/hooks/useT'

// inside LoginForm:
const t = useT()

// Step credentials:
<h1 ...>{t('auth.sign_in')}</h1>
<label ...>{t('auth.email')}</label>
<label ...>{t('auth.password')}</label>
<button ...>{platform.isLoading && <Loader size="sm" />}{t('common.next')}</button>

// Step MFA:
<button ...>← {t('common.back')}</button>
<h1 ...>{t('auth.check_email')}</h1>
<p ...>{t('auth.code_sent', { email: platform.emailHint ?? email })}</p>
<button ...>{platform.isLoading && <Loader size="sm" />}{t('auth.verify_sign_in')}</button>
```

- [x] **Step 2: Wire `AdminHeader.tsx`** ✅ DONE

The `ROUTE_LABELS` map currently has hardcoded English route labels. Replace with translation key lookups.

Change:
```tsx
const ROUTE_LABELS: Record<string, string> = {
  '/dashboard':  'Dashboard',
  '/tenants':    'Tenants',
  ...
}
```

To:
```tsx
const ROUTE_KEYS: Record<string, string> = {
  '/dashboard':  'nav.dashboard',
  '/tenants':    'nav.tenants',
  '/billing':    'nav.billing',
  '/health':     'nav.health',
  '/flags':      'nav.flags',
  '/analytics':  'nav.analytics',
  '/users':      'nav.users',
  '/audit':      'nav.audit',
  '/support':    'nav.support',
}
```

And in the component body:
```tsx
const t = useT()
const pageLabel = t(ROUTE_KEYS[location.pathname] ?? 'nav.dashboard')
```

Also replace:
```tsx
// BEFORE
'All systems operational'
'Sign out'

// AFTER
t('health.ok')  // or add key 'health.all_systems_ok' => 'All systems operational'
t('auth.sign_out')
```

Add to `en-US/admin.php` `health` section:
```php
'all_systems_ok' => 'All systems operational',
```

Then in the component:
```tsx
{t('health.all_systems_ok')}
...
{t('auth.sign_out')}
```

- [x] **Step 3: Wire `AdminSidebar.tsx`** ✅ DONE

Check the sidebar nav labels. Read the file first:
```bash
cat /Users/deepak/Projects/ChefLogik/admin/src/components/layout/AdminSidebar.tsx
```
Replace hardcoded nav labels with `t('nav.*')` calls using the same `ROUTE_KEYS` pattern as AdminHeader.

- [x] **Step 4: Wire all 9 route screen files** ✅ COMPLETE

For each file, follow the pattern: add `const t = useT()`, replace strings. The key mappings per screen:

**`dashboard.tsx`** — strings map to `dashboard.*` and `common.*`

**`tenants.tsx`** — extensive strings. Add `const t = useT()`. Replace:
- `'All'`, `'Active'`, `'Trial'`, `'Suspended'`, `'Cancelled'` filter tabs → `t('common.all')`, `t('tenants.active')`, add `tenants.trial`, `tenants.cancelled` keys
- Modal header text, field labels → `t('tenants.*')` and `t('common.*')`
- `'Tenants'` page title → `t('tenants.title')`
- `'Add tenant'` button → `t('tenants.add')`
- `'Search tenants…'` → `t('common.search')`
- Column headers `Name`, `Slug`, `Plan`, `Status`, `Branches`, `Orders (30d)`, `Created` → `t('tenants.name')`, `t('tenants.slug')`, etc.
- Action buttons `Suspend`, `Reactivate`, `Impersonate` → `t('tenants.suspend')`, `t('tenants.reactivate')`, `t('tenants.impersonate')`

Add to `en-US/admin.php` `tenants` section:
```php
'trial'     => 'Trial',
'cancelled' => 'Cancelled',
'filter_all'=> 'All',
```

**`billing.tsx`** → `t('billing.*')`
**`analytics.tsx`** → `t('analytics.*')`
**`health.tsx`** → `t('health.*')`
**`audit.tsx`** → `t('audit.*')`
**`support.tsx`** → `t('support.*')`
**`users.tsx`** → `t('users.*')`
**`flags.tsx`** → `t('flags.*')`

- [x] **Step 5: Run lint** ✅ DONE (pre-existing 7 errors only, none in touched files)

- [x] **Step 6: Commit** ✅ DONE

---

## Task 6 — Wire translations in `/web` — Sidebar + Layout ✅ COMPLETE (BranchSwitcher unchecked)

**Files:**
- Modify: `web/src/components/layout/Sidebar.tsx` — ✅ DONE
- Modify: `web/src/components/layout/Header.tsx` — ✅ DONE
- Modify: `web/src/components/layout/UserDropdown.tsx` — ✅ DONE
- Modify: `web/src/components/layout/UserMenu.tsx` — ✅ DONE
- Modify: `web/src/components/layout/NotifDropdown.tsx` — ✅ DONE
- Modify: `web/src/components/layout/MessagesDropdown.tsx` — ✅ DONE
- Modify: `web/src/components/layout/BranchSwitcher.tsx` — ✅ DONE (no_branches_yet, select_branch, all_branches)
- Modify: `web/src/components/layout/NoBranchSelected.tsx` — ✅ DONE (rewritten as observer)
- Modify: `web/src/components/layout/AppFooter.tsx` — ✅ DONE (rewritten as observer)

### `Sidebar.tsx` — structural change for NAV_GROUPS

- [x] **Step 1: Change `NAV_GROUPS` to use `tKey` instead of `label`** ✅ COMPLETE

The `NavItem` interface uses `label: string`. Change to `tKey: string`:

```tsx
// Change interface
interface NavItem {
  to: string
  tKey: string          // was: label: string
  icon: React.ElementType
  permission?: string
  permissionAny?: string[]
  badge?: number
  children?: NavItem[]
}

interface NavGroup {
  tKey: string          // was: label: string
  items: NavItem[]
}
```

Update `NAV_GROUPS`:
```tsx
const NAV_GROUPS: NavGroup[] = [
  {
    tKey: 'sidebar.group_operations',
    items: [
      { to: '/dashboard',    tKey: 'nav.dashboard',            icon: LayoutDashboard },
      { to: '/orders',       tKey: 'nav.orders',               icon: ShoppingCart,   permission: 'orders.view' },
      { to: '/kds',          tKey: 'nav.kds',                  icon: Monitor,        permissionAny: ['kds.view', 'kds.manage'] },
      { to: '/reservations', tKey: 'nav.reservations',         icon: CalendarDays,   permission: 'reservations.view' },
      { to: '/events',       tKey: 'nav.events',               icon: CalendarClock,  permission: 'events.view' },
    ],
  },
  {
    tKey: 'sidebar.group_management',
    items: [
      { to: '/menu',      tKey: 'nav.menu',          icon: UtensilsCrossed, permission: 'menu.view' },
      { to: '/inventory', tKey: 'nav.inventory',     icon: Package,         permission: 'inventory.view_stock' },
      {
        to: '/staff',
        tKey: 'nav.staff',
        icon: UserCog,
        permissionAny: ['staff.view_all', 'staff.view_own_branch'],
        children: [
          { to: '/staff/shifts',     tKey: 'nav.shifts',      icon: CalendarDays,  permissionAny: ['shifts.view', 'shifts.manage'] },
          { to: '/staff/attendance', tKey: 'nav.attendance',  icon: ClipboardList, permissionAny: ['attendance.view', 'staff.view_attendance'] },
          { to: '/staff/leave',      tKey: 'nav.leave',       icon: CalendarOff,   permissionAny: ['staff.view_all', 'attendance.view'] },
          { to: '/staff/payroll',    tKey: 'nav.payroll',     icon: DollarSign,    permission: 'payroll.export' },
        ],
      },
      { to: '/customers',   tKey: 'nav.customers',  icon: Users, permissionAny: ['customers.view_basic', 'customers.view_full'] },
      { to: '/landing-cms', tKey: 'nav.landing_cms',icon: Globe, permission: 'landing.manage_content' },
    ],
  },
  {
    tKey: 'sidebar.group_insights',
    items: [
      { to: '/analytics', tKey: 'nav.analytics', icon: BarChart3, permissionAny: ['analytics.owner_dashboard', 'analytics.branch_dashboard', 'analytics.customer_dashboard'] },
    ],
  },
  {
    tKey: 'sidebar.group_settings',
    items: [
      { to: '/branches', tKey: 'nav.branches', icon: Building2, permission: 'branches.view' },
      { to: '/roles',    tKey: 'nav.roles',    icon: Shield,    permissionAny: ['roles.view', 'staff.manage_roles'] },
      { to: '/settings', tKey: 'nav.settings', icon: Settings },
    ],
  },
]
```

Add to `en-US/web.php` `nav` section:
```php
'shifts'     => 'Shifts',
'attendance' => 'Attendance',
'leave'      => 'Leave',
'payroll'    => 'Payroll',
```

Add to `en-US/web.php` new `sidebar` section:
```php
'sidebar' => [
    'group_operations' => 'Operations',
    'group_management' => 'Management',
    'group_insights'   => 'Insights',
    'group_settings'   => 'Settings',
],
```

Add `const t = useT()` inside the `Sidebar` component, and replace all `{item.label}` / `{group.label}` / `{child.label}` with `{t(item.tKey)}` / `{t(group.tKey)}` / `{t(child.tKey)}`.

Also do the same in `ExpandableNavItem` and `SidebarItem` components:
```tsx
// SidebarItem props — change label to tKey
interface SidebarItemProps {
  to: string
  tKey: string   // was: label: string
  ...
}
// In render: {t(tKey)}
```

- [x] **Step 2: Wire layout components** ✅ DONE — all except BranchSwitcher (needs check)

For each remaining layout file, add `const t = useT()` and replace strings.

**`Header.tsx`** ✅ DONE — `ROUTE_KEYS` map with translation keys; `const t = useT()` inside component; `pageLabel = t(ROUTE_KEYS[...] ?? 'nav.dashboard')`; search placeholder = `t('common.search_hint')`

**`UserDropdown.tsx` / `UserMenu.tsx`** — typical strings:
- `'Profile'` → `t('profile.title')`
- `'Sign out'` / `'Log out'` → `t('auth.sign_out')`
- `'Settings'` → `t('nav.settings')`

**`NotifDropdown.tsx`**:
- `'Notifications'` → `t('notifications.title')`
- `'Mark all as read'` → `t('notifications.mark_all')`
- `'No new notifications.'` → `t('notifications.no_new')`
- `'View all'` → `t('notifications.view_all')`

**`MessagesDropdown.tsx`**:
- `'Messages'` → `t('nav.messages')`

**`NoBranchSelected.tsx`**:
- Add `no_branch_selected` key to `en-US/web.php` `branches`:
  ```php
  'no_branch_selected' => 'No branch selected. Please select a branch to continue.',
  ```
- Replace with `t('branches.no_branch_selected')`

- [x] **Step 3: Sync the fr/de/es/pl/it lang files with the new keys** ✅ DONE
  - Added notifications unread/none/see_all/mark_all_read + messages section + footer section to all 6 non-en-US web.php files
  - NOTE: nav.shifts/attendance/leave/payroll and sidebar.* group keys still need adding to non-en-US files (part of Task 3 completion)

- [x] **Step 4: Run lint** ✅ DONE (pre-existing 71 errors, none in layout files)

- [x] **Step 5: Commit** ✅ DONE

---

## Task 7 — Wire translations in `/web` — Auth screens ✅ COMPLETE

**Files:**
- Modify: `web/src/components/auth/LoginPage.tsx` ✅
- Modify: `web/src/components/auth/ForgotPasswordPage.tsx` ✅
- Modify: `web/src/components/auth/screens/SignInScreen.tsx` ✅
- Modify: `web/src/components/auth/screens/OTPScreen.tsx` ✅
- Modify: `web/src/components/auth/screens/ForgotPasswordScreen.tsx` ✅
- Modify: `web/src/components/auth/screens/SetNewPasswordScreen.tsx` ✅
- Modify: `web/src/components/auth/screens/AccountLockedScreen.tsx` ✅
- Modify: `web/src/components/auth/screens/OnboardingScreen.tsx` ✅

- [x] **Step 1: Wire `SignInScreen.tsx`** ✅

Add `import { useT } from '@/hooks/useT'` and `const t = useT()`.

| Hardcoded string | Key |
|---|---|
| `'Sign in'` (h2) | `t('auth.sign_in')` |
| `'Welcome back to ChefLogik'` | add `auth.welcome_back` = `'Welcome back to ChefLogik'` |
| `'or continue with email'` | add `auth.or_email` = `'or continue with email'` |
| `'Email address'` (FormField label) | `t('common.email')` |
| `'Password'` (label) | `t('common.password')` — add `common.password` = `'Password'` |
| `'Forgot password?'` (link) | `t('auth.forgot_password')` |
| `'Restaurant ID'` (FormField label) | add `auth.restaurant_id` = `'Restaurant ID'` |
| `'Remember me for 30 days'` | add `auth.remember_me` = `'Remember me for 30 days'` |
| `'Sign in'` (Button) | `t('auth.sign_in')` |
| `'New to ChefLogik? '` | add `auth.new_to_cheflogik` = `'New to ChefLogik?'` |
| `'Set up your account'` | add `auth.setup_account` = `'Set up your account'` |

Add these to `en-US/web.php` `auth` section, then also add them to all non-en-US web.php files.

- [x] **Step 2: Wire `OTPScreen.tsx`, `ForgotPasswordScreen.tsx`, `SetNewPasswordScreen.tsx`, `AccountLockedScreen.tsx`, `OnboardingScreen.tsx`** ✅

- [x] **Step 3: Wire `LoginPage.tsx` and `ForgotPasswordPage.tsx`** ✅

- [x] **Step 4: Lint and commit** ✅

---

## Task 8 — Wire translations in `/web` — Dashboard, Orders, KDS ✅ COMPLETE

**Files:**
- Modify: `web/src/components/dashboard/DashboardScreen.tsx` ✅
- Modify: all files under `web/src/routes/_authenticated/orders/` ✅
- Modify: all files under `web/src/routes/_authenticated/kds/` ✅

- [x] **Step 1: Wire `DashboardScreen.tsx`** ✅

Add `const t = useT()`. Replace:
- `'Dashboard'` (PageHeader title) → `t('dashboard.title')`
- `'Live view'` → add `dashboard.live_view` = `'Live view'`
- `'Active Orders'` (StatCard label) → `t('dashboard.open_orders')`
- `'+ Walk-in'` button → add `dashboard.walkin` = `'Walk-in'`; render as `+ ${t('dashboard.walkin')}`
- `'+ Reservation'` button → `+ ${t('reservations.new')}`
- Other StatCard labels — map to `dashboard.*` keys, add any missing

Add to `en-US/web.php` `dashboard`:
```php
'live_view'    => 'Live view',
'walkin'       => 'Walk-in',
'alerts'       => 'Alerts',
```

- [x] **Step 2: Wire orders route files** ✅
- [x] **Step 3: Wire KDS files** ✅
- [x] **Step 4: Lint and commit** ✅

---

## Task 9 — Wire translations in `/web` — Menu, Inventory ✅ COMPLETE

**Files:**
- All files under `web/src/routes/_authenticated/menu/`
- All `web/src/components/inventory/` and `web/src/routes/_authenticated/inventory/`

### Menu files status:
- [x] `menu/index.tsx` ✅
- [x] `menu/items/new.tsx` ✅
- [x] `menu/items/$itemId.tsx` ✅
- [x] `menu/modifier-groups/index.tsx` ✅
- [x] `menu/modifier-groups/new.tsx` ✅
- [x] `menu/modifier-groups/$groupId.tsx` ✅
- [x] `menu/categories/new.tsx` ✅ — `common.new` badge wired
- [x] `menu/categories/$categoryId.tsx` ✅ — photo upload buttons, error states, save buttons all wired

- [x] **Step 2: Wire inventory module files** ✅

Files wired (in `/web/src/routes/_authenticated/inventory/`):
- `index.tsx` ✅
- `grns.tsx` ✅
- `purchase-orders.tsx` ✅
- `recipes.tsx` ✅
- `stocktakes.tsx` ✅
- `suppliers.tsx` ✅
- `waste-logs.tsx` ✅
- `items/new.tsx` ✅
- `items/$itemId.tsx` ✅

- [x] **Step 3: Lint and commit** ✅

Committed: `feat(i18n): wire t() in menu, inventory, orders, KDS, and BranchSwitcher`

---

## Task 10 — Wire translations in `/web` — Reservations, Events, Staff ✅ COMPLETE

**Files:**
- All files under `web/src/routes/_authenticated/reservations/`
- All `web/src/components/reservations/`
- All files under `web/src/routes/_authenticated/events/`
- All files under `web/src/routes/_authenticated/staff/`
- All `web/src/components/staff/`

- [x] **Step 1: Wire reservations files** ✅

All route files wired. Floor designer components:
- `EditToolbar.tsx` ✅ — snap, overlap_warning, unsaved_changes, discard, save_layout
- `ToolboxPanel.tsx` ✅ — moved `PALETTE_ELEMENTS` inside component; floors_section, add_floor, add_tables, add_elements, floor_settings, floor_shape, floor_width, floor_height, bg_grid
- `ViewLeftSidebar.tsx` ✅ — renamed `STATUS_CONFIG.label` → `labelKey`; fixed `.filter(t =>` → `.filter(tbl =>`; floor_status, status_free/reserved/occupied/cleaning/blocked, upcoming, tonight_count, no_upcoming, walkin_waitlist, waitlist_empty, select_free_table; `WaitlistRow` sub-component wired separately
- `ViewRightPanel.tsx` ✅ — no_table_selected, no_table_selected_hint, guest_label, special_requests, time/party_size/duration/channel StatCards, seat, clear, merge, split
- `TablePopup.tsx` ✅ — header buttons wired; `FreeBody`: ready_to_seat, seats_label, section, turn_time, `analytics.today`, suggested, good_fit, fits, large_party, guests_count, seat; `OccupiedBody`: guests_count, seated_by, elapsed, course, server, `common.total`, special_requests, open_order

- [x] **Step 2: Wire events files** ✅

All 6 events route files wired. Variable shadowing fixes: `OCCASION_TYPES.map((t) =>` → `(ot) =>`, `tasks.filter((t) =>` → `(tk) =>`, `transitions.map((t) =>` → `(tr) =>`

- [x] **Step 3: Wire staff module** ✅

All 10 staff route files wired plus `PermissionPicker.tsx`. Key notes:
- Moved module-level `EMPLOYMENT_TYPE_OPTIONS` array inside components in `staff/new.tsx` and `staff/$staffId_.edit.tsx`
- `staff/attendance/index.tsx`: sched_start, sched_end, late, overtime, attendance_subtitle, no_attendance, select_branch_view, clock_in/clock_out, refresh
- `staff/shifts/new.tsx`: new_shift, create_shift, shift_draft_hint, shift_published/hint, open_shift_option, assign_staff_label/hint
- `staff/new.tsx` / `staff/$staffId_.edit.tsx`: emp_section, emp_type, emp_full/part/casual/contractor, hourly_rate, salary, edit_staff, edit_staff_subtitle (with `{name}` var)
- `staff/$staffId_.profile.tsx`: edit_profile, edit_profile_subtitle (with `{name}` var), profile_photo, personal_info
- `PermissionPicker.tsx`: common.loading, roles.no_permissions, common.all, common.none

- [x] **Step 4: Lint and commit** ✅

New en-US keys added in this task (reservations section): snap, floor_status, floor_settings, floors_section, add_tables, add_tables_hint, add_elements, add_floor, floor_shape, floor_width, floor_height, bg_grid, status_free/reserved/occupied/cleaning/blocked, upcoming, tonight_count, no_upcoming, walkin_waitlist, waitlist_empty, select_free_table, no_table_selected, no_table_selected_hint, guest_label, ready_to_seat, seats_label, section, turn_time, suggested, good_fit, fits, large_party, hold, block, seat_next, clear, elapsed, server, overlap_warning, merge, split, course, open_order, seated_by, guests_count

New en-US keys (staff section): sched_start, sched_end, late, overtime, attendance_subtitle, no_attendance, select_branch_view, new_shift, new_shift_subtitle, create_shift, shift_draft_hint, shift_published, shift_published_hint, open_shift_option, assign_staff_label, assign_staff_hint, new_staff_member, new_staff_subtitle, create_staff, emp_section, emp_type, emp_full_time, emp_part_time, emp_casual, emp_contractor, hourly_rate, salary, edit_staff, edit_staff_subtitle, edit_profile, edit_profile_subtitle, profile_photo, personal_info

New en-US keys (common section): refresh, discard, unsaved_changes, full_name, notes, start_time, end_time, draft, save_changes, start_date

New en-US key (roles section): no_permissions

Committed (api): `feat(i18n): add floor designer and staff module translation keys`
Committed (web): `feat(i18n): wire t() in reservations floor-designer and staff module`

---

## Task 11 — Wire translations in `/web` — Customers, Analytics, Settings, Branches, Roles

**Files:**
- All files under `web/src/routes/_authenticated/customers/`
- All files under `web/src/routes/_authenticated/analytics/`
- All files under `web/src/routes/_authenticated/settings/`
- All files under `web/src/routes/_authenticated/branches/`
- All files under `web/src/routes/_authenticated/roles/`
- `web/src/components/analytics/AnalyticsNav.tsx`
- `web/src/components/settings/SettingsNav.tsx`

- [ ] **Step 1: Wire customers module** using `t('customers.*')` keys
- [ ] **Step 2: Wire analytics module** using `t('analytics.*')` keys

`AnalyticsNav.tsx` likely has tab labels (Revenue, Orders, Covers, etc.) — map to `analytics.*`.

- [ ] **Step 3: Wire settings module** using `t('settings.*')` keys
- [ ] **Step 4: Wire branches module** using `t('branches.*')` keys
- [ ] **Step 5: Wire roles module** using `t('roles.*')` keys
- [ ] **Step 6: Lint and commit**

```bash
cd /Users/deepak/Projects/ChefLogik/web && npm run lint
git add src/
git commit -m "feat(i18n): wire t() in customers, analytics, settings, branches, and roles"
```

---

## Task 12 — Wire translations in `/web` — Profile, Notifications, Landing CMS, Portal

**Files:**
- All `web/src/components/profile/*.tsx`
- `web/src/routes/_authenticated/notifications.tsx` (if exists) and notification components
- All `web/src/components/LandingCms/*.tsx`
- All `web/src/routes/portal/*.tsx`

- [ ] **Step 1: Wire profile components**

`ProfilePage.tsx` — already imports `useI18n` but passes the store to `AppearanceSettings`. Change to use `useT()` directly for all its own strings:
```tsx
// Remove: const i18nStore = useI18n()
const t = useT()

// Replace section titles (currently hardcoded in <Section title="...">):
<Section title={t('profile.personal_info')}>
<Section title={t('profile.change_password')}>  // was 'Change Password'
<Section title={t('profile.contact')}>           // add key 'contact' = 'Contact & Address'
<Section title={t('profile.bank_details')}>      // add key 'bank_details' = 'Bank Details'
<Section title={t('staff.leave')}>
<Section title={t('notifications.title')}>
<Section title={t('profile.appearance')}>
```

`AppearanceSettings.tsx` — remove `i18nStore` prop, use `useT()` + `useI18n()` internally:
```tsx
// Wire the Language label
<label ...>{t('profile.language')}</label>
// Wire theme label
<p ...>{t('profile.theme_help')}</p>  // add key if needed
```

Other profile components (`PersonalInfoForm`, `ChangePasswordForm`, `ContactDetailsForm`, `BankDetailsForm`, `DocumentsSection`, `EmploymentInfo`, `LeaveSnapshot`, `NotificationSettings`, `PhotoUpload`) — each has form labels. Map to `profile.*` and `common.*`.

Add any missing keys to `en-US/web.php` `profile` section.

- [ ] **Step 2: Wire notification components**

Replace using `t('notifications.*')` keys.

- [ ] **Step 3: Wire Landing CMS components**

Replace using `t('landing_cms.*')` keys:
- `'Template'` → `t('landing_cms.template')`
- `'SEO'` → `t('landing_cms.seo')`
- `'Content blocks'` → `t('landing_cms.content_blocks')`
- etc.

- [ ] **Step 4: Wire portal routes**

All `web/src/routes/portal/*.tsx` files. Replace using `t('portal.*')` keys from the section added in Task 2:
- `'Customer Portal'` → `t('portal.title')`
- `'Log in'` / `'Login'` → `t('portal.login')`
- `'Register'` → `t('portal.register')`
- `'Select a restaurant'` → `t('portal.select_restaurant')`
- `'Loyalty'` → `t('portal.loyalty')`
- `'Bookings'` → `t('portal.bookings')`
- `'Reservations'` → `t('portal.reservations')`
- Transaction type labels → `t('portal.tx_earn')` etc.

- [ ] **Step 5: Lint and commit**

```bash
cd /Users/deepak/Projects/ChefLogik/web && npm run lint
git add src/
git commit -m "feat(i18n): wire t() in profile, notifications, landing CMS, and portal"
```

---

## Task 13 — Wire shared UI components

**Files:**
- `web/src/components/ui/ConfirmModal.tsx`
- `web/src/components/shared/DataTable.tsx`
- `web/src/components/ui/PageHeader.tsx`
- `web/src/components/shared/KanbanBoard.tsx`
- `web/src/components/shared/KanbanColumn.tsx`
- Any other shared/ui files with hardcoded strings

- [ ] **Step 1: Wire shared UI**

Check each file for hardcoded strings. Typical candidates:
- `ConfirmModal` — `'Confirm'`, `'Cancel'`, `'Are you sure?'` → `t('common.confirm')`, `t('common.cancel')`, add `common.are_you_sure`
- `DataTable` — `'No results found.'`, `'Loading…'` → `t('common.no_results')`, `t('common.loading')`
- `PageHeader` — usually renders props, but any default strings
- `KanbanBoard` / `KanbanColumn` — any status labels

- [ ] **Step 2: Final lint pass across both apps**

```bash
cd /Users/deepak/Projects/ChefLogik/web && npm run lint
cd /Users/deepak/Projects/ChefLogik/admin && npm run lint
```

Expected: no errors in either app.

- [ ] **Step 3: Final grep to confirm no hardcoded strings remain**

Run a spot-check grep for obvious English literals in component JSX. This is not exhaustive but catches common patterns:
```bash
# Should return very few results (product names, copyright, placeholders are OK)
grep -r "Loading\.\.\." /Users/deepak/Projects/ChefLogik/web/src --include="*.tsx" | grep -v "t('"
grep -r "No results" /Users/deepak/Projects/ChefLogik/web/src --include="*.tsx" | grep -v "t('"
grep -r "Save\b" /Users/deepak/Projects/ChefLogik/web/src --include="*.tsx" | grep -v "t('" | grep -v "//\|import\|const\|type\|interface"
```

Any remaining hits should be either: (a) inside a `t('...')` call, (b) a prop/placeholder string (acceptable), or (c) product name strings like `'ChefLogik'` (acceptable — brand names are not translated).

- [ ] **Step 4: Final commit**

```bash
cd /Users/deepak/Projects/ChefLogik/web
git add src/
git commit -m "feat(i18n): wire t() in shared UI components — string extraction complete"

cd /Users/deepak/Projects/ChefLogik/admin
git add src/
git commit -m "feat(i18n): complete i18n wiring for admin app"
```

---

## Self-Review

**Spec coverage check:**
- ✓ `/admin` `useT()` hook — Task 1 ✅ DONE
- ✓ `portal` lang section — Task 2 ✅ DONE
- ○ Non-en-US web.php completion — Task 3 ⚠️ PARTIAL (new keys from sessions 8–9 not yet translated)
- ✓ Non-en-US admin.php completion — Task 4 ✅ DONE
- ✓ Admin app full wiring — Task 5 ✅ DONE
- ✓ Web Sidebar structural change (tKey) — Task 6 ✅ DONE
- ✓ Web layout components — Task 6 ✅ DONE
- ✓ Web auth screens — Task 7 ✅ DONE
- ✓ Web dashboard + orders + KDS — Task 8 ✅ DONE
- ✓ Web menu + inventory — Task 9 ✅ DONE
- ✓ Web reservations + events + staff — Task 10 ✅ DONE
- ○ Web customers + analytics + settings + branches + roles — Task 11 ⬜ NOT STARTED
- ○ Web profile + notifications + landing CMS + portal — Task 12 ⬜ NOT STARTED
- ○ Shared UI components — Task 13 ⬜ NOT STARTED

**Acceptable un-translated strings (do NOT replace):**
- Product/brand names: `'ChefLogik'`, `'Platform Admin'`, `'SOC 2 Type II'`, `'AES-256 Encryption'`
- Route paths and API keys
- Email/URL placeholders like `'admin@cheflogik.com'`
- CSS class names and inline styles
- Copyright text
