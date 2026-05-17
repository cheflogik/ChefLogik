# Frontend Architecture — React + TypeScript + MobX-State-Tree

## Core Principles

1. **MST owns all server state.** Never use `useState` or `useReducer` for data that comes from the API. MST stores are the single source of truth.
2. **TypeScript strict mode.** Every file. No `any`. No type assertions without comment.
3. **Permission checks are ubiquitous.** Every privileged UI element checks `authStore.can('slug')`. Missing a check is a bug.
4. **WebSocket updates flow into stores.** Reverb events call store actions directly — components re-render automatically via MST reactivity.

---

## Design System & Theming

### Color Tokens (`src/index.css`)
The app uses a Moniex-inspired Navy palette, not the default shadcn greyscale:

| Token role | Value / description |
|---|---|
| App background | Neutral light grey (`#F5F5F5` style) |
| Cards & islands | Pure white |
| Primary accent | Steel Blue `#4A7FA7` — sidebar active pills, secondary buttons |
| Secondary accent | Dark Navy `#1A3D63` — primary buttons, active states |
| Hover / muted accent | Light Steel Blue `#B3CFE5` |

### Typography
- **Font**: `Plus Jakarta Sans` (replaces Geist Variable)
- **Base font size**: `15px`
- **Heading letter-spacing**: `-0.015em`

### Theme Switcher (`src/lib/theme.ts`)
Three brand themes are supported, switched dynamically via `data-theme` on `<html>`:

| Theme key | Colour |
|---|---|
| `ocean` | Navy Blue (default) |
| `forest` | Green |
| `orange` | Sunrise |

Theme selection is persisted in a cookie (`cl_theme`) and hydrated in `main.tsx` **before** the first React render to prevent a flash of unstyled content.

The `UserMenu.tsx` dropdown contains a colour-swatch picker that switches the theme instantly alongside user session info and logout.

---

## Layout — Island Design

### AppShell
The layout uses a modern "island" pattern — **not** a top-nav bar layout:

- **Sidebar island**: Fixed `w-56` white card with navigation links; dark navy active pill for the selected route.
- **Content island**: Flexible white card wrapping all page content.
- **Header**: Transparent (no background, no border) — blends into the page background. Contains search, notification bell, and user menu (`UserMenu.tsx`).
- **AppFooter** (`components/layout/AppFooter.tsx`): Sits below the content island; contains copyright, terms, privacy, and contact links.

Spacing details: logo slot widened, header height `h-16`, sidebar padding `px-3 py-4`, body layout gaps expanded for a spacious feel.

---

## Authentication Pages

### LoginPage (`pages/auth/`)
Split-screen layout:
- **Left panel (58%)**: Branded showcase — ChefLogik logo, marketing tagline, abstract geometric navy background image (`public/login-bg.png`) with gradient overlay.
- **Right panel (42%)**: Clean centred login form using the global input style (see below). Three fields: email, password, Restaurant ID (`tenant_id`).

### ForgotPasswordPage (`pages/auth/`)
Same split-screen template as LoginPage. Handles two states:
1. **Input state** — email address form
2. **Success state** — "check your inbox" confirmation

Route: `/forgot-password` (configured in `src/routes/forgot-password.tsx` via TanStack Router).

---

## Form Elements — Design System Components Only (`/web`)

**Never use raw HTML form elements in the `/web` staff app.** Always use the pre-built components from `@/components/ui/`. This rule applies when building new forms and when modifying existing forms.

| Do NOT use | Use instead |
|---|---|
| `<button>` | `<Button>` or `<IconButton>` |
| `<input type="text">` | `<Input>` |
| `<input type="number">` | `<NumberInput>` |
| `<input type="date">` | `<DatePicker>` |
| `<input type="checkbox">` | `<Checkbox>` |
| `<select>` | `<Select>` |
| `<textarea>` | `<Textarea>` |
| on/off toggle | `<Switch>` |

These components handle consistent styling, accessibility, error states, and disabled states. Bypassing them creates visual inconsistency and breaks the design system.

When the design system component does not yet exist for a use case, **ask before creating a raw element** — the component may need to be built and added to `@/components/ui/` first.

## Global Form Field Standard (underlying style)

The design system input components all apply this Tailwind className internally:

```
w-full rounded-xl bg-muted border border-transparent px-4 py-3 text-sm text-foreground
focus:outline-none focus:border-primary/30 focus:bg-background focus:ring-2 focus:ring-primary/20
```

Do not replicate this on raw HTML elements — use the components.

---

## AuthStore — The Foundation

```typescript
// stores/AuthStore.ts
const AuthStore = types
  .model('AuthStore', {
    userId: types.maybeNull(types.string),
    tenantId: types.maybeNull(types.string),
    tenantName: types.maybeNull(types.string),
    roleSlug: types.maybeNull(types.string),
    branchIds: types.array(types.string),      // empty = all branches (owner)
    permissions: types.array(types.string),    // flat list of permission slugs
    isAuthenticated: types.optional(types.boolean, false),
    currentBranchId: types.maybeNull(types.string),
  })
  .views(self => ({
    // Core permission check — use this everywhere
    can(permission: string): boolean {
      return self.permissions.includes(permission);
    },
    canAny(permissions: string[]): boolean {
      return permissions.some(p => self.permissions.includes(p));
    },
    canAll(permissions: string[]): boolean {
      return permissions.every(p => self.permissions.includes(p));
    },
    get isOwner(): boolean {
      return self.roleSlug === 'owner';
    },
    get hasAllBranchAccess(): boolean {
      return self.branchIds.length === 0;  // empty = all
    },
  }))
  .actions(self => ({
    async login(email: string, password: string) {
      const response = await AuthService.login(email, password);
      self.userId = response.user.id;
      self.tenantId = response.user.tenantId;
      self.permissions = response.user.permissions;
      self.branchIds = response.user.branchIds;
      self.isAuthenticated = true;
      // Initialise WebSocket with tenant context
      initEcho(response.token, response.user.tenantId);
    },
    logout() {
      // Clear all stores
      getRoot(self).reset();
    },
  }));
```

## RootStore

The staff app (`/web`) uses a RootStore that aggregates all domain stores. The admin app (`/admin`) has no RootStore — it uses a single `PlatformStore` singleton.

```typescript
// stores/root.ts  (staff app only)
const RootStore = types
  .model('RootStore', {
    auth: types.optional(AuthStore, {}),
    orders: types.optional(OrderStore, {}),
    menu: types.optional(MenuStore, {}),
    reservations: types.optional(ReservationStore, {}),
    inventory: types.optional(InventoryStore, {}),
    customers: types.optional(CustomerStore, {}),
    events: types.optional(EventStore, {}),
    analytics: types.optional(AnalyticsStore, {}),
    staff: types.optional(StaffStore, {}),
    ui: types.optional(UIStore, {}),
  })
  .actions(self => ({
    reset() {
      // Called on logout — reset all stores to initial state
      applySnapshot(self, {});
    },
  }));

// Singleton + React context
const rootStore = RootStore.create({});
const RootStoreContext = createContext(rootStore);

export const useStore = () => useContext(RootStoreContext);
export const useAuthStore = () => useStore().auth;
export const useOrderStore = () => useStore().orders;
// etc.
```

## PermissionGate Component

```typescript
// components/guards/PermissionGate.tsx
interface PermissionGateProps {
  permission: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export const PermissionGate = observer(({ permission, fallback = null, children }: PermissionGateProps) => {
  const { auth } = useStore();
  return auth.can(permission) ? <>{children}</> : <>{fallback}</>;
});

// Usage
<PermissionGate permission="orders.cancel">
  <CancelOrderButton orderId={order.id} />
</PermissionGate>

<PermissionGate permission="analytics.owner_dashboard" fallback={<BranchDashboard />}>
  <OwnerDashboard />
</PermissionGate>
```

## WebSocket Integration

```typescript
// websocket/channels/orderChannel.ts
export function subscribeToOrderChannel(tenantId: string, branchId: string, store: IOrderStore) {
  const channel = echo.private(`tenant.${tenantId}.branch.${branchId}.orders`);

  channel
    .listen('OrderStatusChanged', (payload: OrderStatusPayload) => {
      store.updateStatus(payload.orderId, payload.status);
    })
    .listen('NewOrderReceived', (payload: NewOrderPayload) => {
      store.addOrder(payload.order);
      store.ui.playNewOrderSound();
    })
    .listen('OrderModified', (payload: OrderModifiedPayload) => {
      store.updateOrder(payload.orderId, payload.changes);
    });

  return () => channel.unsubscribe();
}

// In the OrderStore
.actions(self => ({
  subscribeToChannel() {
    const { auth } = getRoot(self);
    if (!auth.tenantId || !auth.currentBranchId) return;

    self.unsubscribeFromChannel = subscribeToOrderChannel(
      auth.tenantId,
      auth.currentBranchId,
      self
    );
  },
  unsubscribeFromChannel: types.optional(types.frozen(), null),
}))
```

## API Service Layer

```typescript
// api/services/OrderService.ts
import { apiClient } from '../client';
import type { Order, CreateOrderPayload, PaginatedResponse } from '../../types/api';

export const OrderService = {
  async getActive(branchId: string): Promise<Order[]> {
    const { data } = await apiClient.get<{ data: Order[] }>('/orders', {
      params: { branch_id: branchId, status: 'active' }
    });
    return data.data;
  },

  async create(payload: CreateOrderPayload): Promise<Order> {
    const { data } = await apiClient.post<{ data: Order }>('/orders', payload);
    return data.data;
  },

  async cancel(orderId: string, reason: string): Promise<Order> {
    const { data } = await apiClient.post<{ data: Order }>(`/orders/${orderId}/cancel`, { reason });
    return data.data;
  },
};

// api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/v1`,
  headers: { 'Accept': 'application/json' },
});

apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  const branchId = sessionStorage.getItem('current_branch_id');

  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (branchId) config.headers['X-Branch-Id'] = branchId;

  return config;
});

apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      rootStore.auth.logout();
    }
    return Promise.reject(error);
  }
);
```

## Routing — TanStack Router (file-based)

Both apps use TanStack Router v1 with the Vite plugin (`@tanstack/router-plugin`). Routes are defined as files under `src/routes/`; `routeTree.gen.ts` is auto-generated on `vite dev` / `vite build` — never edit it manually.

### Staff app routing pattern

```typescript
// routes/_authenticated.tsx — pathless layout route
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context }) => {
    if (!rootStore.auth.isAuthenticated) throw redirect({ to: '/login' })
    // Handle cross-app impersonation token from query params
    const params = new URLSearchParams(window.location.search)
    const token = params.get('impersonate_token')
    if (token) { /* store token, strip from URL */ }
  },
  component: () => <AppShell><Outlet /></AppShell>,
})

// routes/_authenticated/orders.tsx
export const Route = createFileRoute('/_authenticated/orders')({
  component: OrdersPage,
})
```

Permission gating is done inside page components using `authStore.can('permission.slug')` or `<PermissionGate permission="...">`. There is no route-level permission enforcement — the API always re-validates.

### Admin app routing pattern

```typescript
// routes/_authenticated.tsx
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: () => {
    if (!platformStore.isAuthenticated) throw redirect({ to: '/login' })
  },
  component: () => <AdminShell><Outlet /></AdminShell>,
})
```

---

## Platform Admin App (`/admin`)

The admin app is a fully independent Vite project — it does **not** share code with the staff app.

### Architecture differences vs staff app

| | Staff app (`/web`) | Admin app (`/admin`) |
|---|---|---|
| Store | `RootStore` with many sub-stores | Single `PlatformStore` |
| WebSocket | Laravel Echo + Reverb | None |
| Design tokens | Moniex Navy palette | ADM: dark-indigo sidebar `#1E293B`, accent `#6366F1` |
| Auth guard | `authStore.isAuthenticated` | `platformStore.isAuthenticated` |
| Session key | `cl_token` | `cl_admin_token` |

### PlatformStore singleton

```typescript
// stores/context.ts
export const platformStore: PlatformStoreType = PlatformStore.create({})
export function usePlatformStore(): PlatformStoreType { return platformStore }
```

No React context is needed — routes import `platformStore` directly.

### Cross-app impersonation flow

1. Admin clicks **Impersonate** on a tenant row in `/admin/tenants`
2. API issues a short-lived impersonation token scoped to that tenant
3. Admin app calls `window.open(\`${STAFF_APP_URL}/dashboard?impersonate_token=TOKEN&tenant_name=NAME\`, '_blank')`
4. Staff app `_authenticated.tsx` reads params on load via `useEffect`, sets `localStorage` + API token, strips params from URL with `window.history.replaceState`
5. Staff app's `AppShell` shows an impersonation banner; clicking **End** clears the token and redirects back to `VITE_ADMIN_URL`

### ADM design tokens

Defined in `/admin/src/index.css` using Tailwind v4 `@theme inline`:

| Token | Value |
|---|---|
| `--adm-bg` | `#F4F6F9` |
| `--adm-sidebar` | `#1E293B` |
| `--adm-accent` | `#6366F1` |
| `--adm-accent-light` | `#EEF2FF` |
| `--adm-text` | `#0F172A` |
| `--adm-muted` | `#64748B` |
| `--adm-border` | `#E2E8F0` |
