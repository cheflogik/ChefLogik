# Skill: React + TypeScript + MobX-State-Tree

## ApiService Base URL — Do Not Change This

The `ApiService` base URL already includes `/v1`:

```typescript
// src/services/api.ts
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'
```

**All service files must use paths WITHOUT a `/v1/` prefix** — the base URL provides it. Auth paths in `AuthStore.ts` also omit the `/v1/` prefix:

```typescript
// AuthStore.ts — correct paths (never add /v1/ back)
api.post('/auth/staff/login', { email, password, tenant_id: tenantId })  // login
api.get('/auth/staff/me')                                                 // rehydrate
api.post('/auth/staff/logout')                                            // logout
```

**`tenant_id` is required on login.** The backend `POST /api/v1/auth/staff/login` rejects requests without it. The login form must always include a Restaurant ID field that maps to `tenant_id` in the request body.

```typescript
// AuthStore login() signature
login(email: string, password: string, tenantId: string)

// LoginPage — must have all three fields
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [tenantId, setTenantId] = useState('')

await auth.login(email, password, tenantId)
```

## Backend API Response Shape — Do Not Change These Types

The backend wraps all responses in a `data` envelope. Auth responses also use **snake_case** field names. The frontend types in `src/types/auth.ts` reflect this exactly — do not "fix" them to camelCase on the raw types.

```typescript
// POST /v1/auth/staff/login — actual response shape
{
  data: {
    token: string
    expires_at: string
    user: {
      id: string
      name: string
      email: string
      tenant_id: string        // snake_case — NOT tenantId
      tenant_name?: string
      role_slug: string        // snake_case — NOT roleSlug
      branch_ids: string[]     // snake_case — NOT branchIds
      permissions: string[]
    }
  }
}
```

`AuthStore._applyUser()` maps these snake_case fields to camelCase for the MST model:

```typescript
// RawApiUser (snake_case) → MST model (camelCase)
self.tenantId   = user.tenant_id
self.roleSlug   = user.role_slug
self.branchIds.replace(user.branch_ids)
```

Login reads from the `data` wrapper — `res.data.token` and `res.data.user`, not `res.token`:

```typescript
const res: LoginResponse = yield api.post<LoginResponse>('/v1/auth/staff/login', ...)
localStorage.setItem(TOKEN_KEY, res.data.token)   // NOT res.token
api.setToken(res.data.token)
_applyUser(res.data.user)
```

The `GET /v1/auth/staff/me` response follows the same `{ data: RawApiUser }` pattern.

---

## Nav Permission Slugs — Use Exact Slugs from config/permissions.php

The AppShell nav gates each link on a permission slug. These must match `config/permissions.php` exactly — the owner role has all real slugs, so a wrong slug means the nav item never appears for anyone.

```
orders.view              → Orders nav
menu.view                → Menu nav          (NOT menu.manage — doesn't exist)
reservations.view        → Reservations nav
inventory.view_stock     → Inventory nav     (NOT inventory.view — doesn't exist)
customers.view_basic     → Customers nav     (canAny with customers.view_full)
events.view              → Events nav
analytics.owner_dashboard → Analytics nav   (canAny across all 5 dashboard slugs)
staff.view_all           → Staff nav         (canAny with staff.view_own_branch)
```

---

## Core Pattern: MST for All Server State
```typescript
// ✅ Server data → MST store → component via observer()
// ❌ Never: const [orders, setOrders] = useState([])  for API data

const OrderListPage = observer(() => {
  const { orders, auth } = useStore();

  useEffect(() => {
    orders.fetchActive(auth.currentBranchId!);
  }, [auth.currentBranchId]);

  return (
    <div>
      {orders.activeOrders.map(order => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
});
```

## MST Model Definition Pattern
```typescript
// types/api.ts — mirror the Laravel API Resource exactly
interface ApiOrder {
  id: string;
  orderRef: string;
  status: OrderStatus;
  source: OrderSource;
  branchId: string;
  total: number;
  // ...
}

// models/Order.ts
const OrderModel = types
  .model('Order', {
    id: types.identifier,
    orderRef: types.string,
    status: types.enumeration<OrderStatus>('OrderStatus', Object.values(OrderStatus)),
    source: types.enumeration<OrderSource>('OrderSource', Object.values(OrderSource)),
    branchId: types.string,
    total: types.number,
    customerName: types.maybeNull(types.string),
    allergenNote: types.maybeNull(types.string),
    createdAt: types.string,
  })
  .views(self => ({
    get isActive() {
      return !['completed', 'cancelled'].includes(self.status);
    },
    get isDelivery() {
      return ['uber_eats', 'doordash', 'online'].includes(self.source);
    },
    get elapsedMinutes() {
      return Math.floor((Date.now() - new Date(self.createdAt).getTime()) / 60000);
    },
  }))
  .actions(self => ({
    setStatus(status: OrderStatus) {
      self.status = status;
    },
  }));
```

## Permission Checking — Always use authStore.can()
```typescript
// In components
const CancelButton = observer(({ order }: { order: IOrder }) => {
  const { auth } = useStore();

  if (!auth.can('orders.cancel')) return null;
  if (!order.isActive) return null;

  return <button onClick={() => cancelOrder(order.id)}>Cancel</button>;
});

// usePermission hook for complex checks
export const usePermission = (permission: string) => {
  const { auth } = useStore();
  return auth.can(permission);
};

// PermissionGate component for wrapping UI blocks
<PermissionGate permission="analytics.owner_dashboard">
  <CrossBranchMetrics />
</PermissionGate>
```

## WebSocket Updates → Store Actions
```typescript
// In the component that mounts the order dashboard
useEffect(() => {
  const cleanup = subscribeToOrderChannel(
    auth.tenantId!,
    auth.currentBranchId!,
    orders  // Pass the MST store — it has the update actions
  );
  return cleanup;
}, [auth.tenantId, auth.currentBranchId]);

// The channel subscription calls store actions directly:
channel.listen('OrderStatusChanged', ({ orderId, status }) => {
  orders.updateStatus(orderId, status);  // MST action → reactive update → component re-renders
});
```

## TypeScript Strict Mode Patterns
```typescript
// No any — type all API responses
type ApiResponse<T> = { data: T; meta?: PaginationMeta };

// Use discriminated unions for status types
type OrderStatus =
  | 'new' | 'confirmed' | 'preparing' | 'ready'
  | 'out_for_delivery' | 'delivered' | 'served'
  | 'bill_settled' | 'completed' | 'cancelled';

// Type guard for non-null assertions
function assertDefined<T>(val: T | null | undefined, msg: string): asserts val is T {
  if (val == null) throw new Error(msg);
}

// Use satisfies for config objects
const PERMISSION_LABELS = {
  'orders.view': 'View orders',
  'orders.cancel': 'Cancel orders',
} satisfies Record<string, string>;
```

## Global Form Field Standard

Every form input in the app must use this exact Tailwind className. Do not create ad-hoc input styles.

```tsx
<input
  className="w-full rounded-xl bg-muted border border-transparent px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/30 focus:bg-background focus:ring-2 focus:ring-primary/20"
/>
```

This applies to `<input>`, `<textarea>`, and `<select>` elements alike.

---

## Theme Switcher Pattern

Themes are stored in a cookie (`cl_theme`) and applied as a `data-theme` attribute on `<html>`. Hydrate **before** the first render in `main.tsx` to avoid flash.

```typescript
// src/lib/theme.ts
export type Theme = 'ocean' | 'forest' | 'orange';

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.cookie = `cl_theme=${theme};path=/;max-age=31536000`;
}

export function getStoredTheme(): Theme {
  const match = document.cookie.match(/cl_theme=([^;]+)/);
  return (match?.[1] as Theme) ?? 'ocean';
}
```

Switching is exposed via the `UserMenu.tsx` colour-swatch picker — not a settings page. Supported themes: `ocean` (Navy, default), `forest` (Green), `orange` (Sunrise).

---

## Layout Islands — Do Not Break This Pattern

AppShell uses island layout — sidebar island (fixed `w-56`) + content island (white card). The header is transparent (no bg, no border). `AppFooter.tsx` sits below the content island.

- Never add a top nav bar — the design uses a sidebar-only nav.
- Never add background/border to the header — it must blend into `#F5F5F5`.
- Sidebar active state: dark navy pill (`#1A3D63`), not underlines or highlights.

---

## Authentication Page Layout

`LoginPage` and `ForgotPasswordPage` both use a **split-screen** layout:
- Left 58%: branded panel (logo + tagline + `public/login-bg.png` + gradient overlay)
- Right 42%: centred form using the global input standard

When building any future auth pages (e.g. reset-password), replicate this same split-screen template.

---

## Branch Switcher Pattern
```typescript
// The active branch is stored in sessionStorage and sent as X-Branch-Id header
const BranchSwitcher = observer(() => {
  const { auth, orders, reservations } = useStore();

  const switchBranch = async (branchId: string) => {
    sessionStorage.setItem('current_branch_id', branchId);
    auth.setCurrentBranch(branchId);

    // Reload data for new branch
    await Promise.all([
      orders.fetchActive(branchId),
      reservations.fetchForBranch(branchId),
    ]);
  };

  return (
    <select onChange={e => switchBranch(e.target.value)} value={auth.currentBranchId ?? ''}>
      {auth.accessibleBranches.map(b => (
        <option key={b.id} value={b.id}>{b.name}</option>
      ))}
    </select>
  );
});
```
