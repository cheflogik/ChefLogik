# Module: In-App Notifications

Server-generated notifications delivered to individual staff or customer recipients. Stored in `app_notifications` (NOT Laravel's built-in `notifications` table — custom table to avoid collision). Real-time delivery via Reverb.

## Schema

```sql
app_notifications
  id              UUID PK
  tenant_id       UUID FK tenants nullable  -- null for platform-level notifications
  recipient_type  VARCHAR(20)               -- 'staff' | 'customer'
  recipient_id    UUID                      -- references users.id or customer_profiles.id
  type            VARCHAR(80)               -- dot-namespaced slug (see Types below)
  title           VARCHAR(255) NOT NULL
  body            TEXT NOT NULL
  data            JSONB nullable            -- arbitrary context (order_id, reservation_id, etc.)
  read_at         TIMESTAMPTZ nullable
  created_at / updated_at TIMESTAMPTZ

INDEX (recipient_type, recipient_id, read_at)     -- unread count query
INDEX (recipient_type, recipient_id, created_at)  -- inbox list (newest first)
```

The `Notification` model does NOT use `HasTenantScope` — notifications are scoped to the recipient, not the tenant, to allow platform-level notifications (`tenant_id = null`). All queries must explicitly filter by `recipient_type` + `recipient_id`.

## API Endpoints (staff guard)

```
GET    /api/v1/notifications              ← paginated inbox (30/page, newest first)
GET    /api/v1/notifications/unread-count ← { count: N }
PATCH  /api/v1/notifications/{id}/read   ← mark single as read
POST   /api/v1/notifications/read-all    ← mark all unread as read
```

`recipient_id` is **never** taken from the request — always derived from `$request->user()->id`.

## Security

```php
// Enforce on every single-record endpoint
abort_if(
    (string) $notification->recipient_id !== (string) $request->user()->id,
    403
);
```

## Creating Notifications

Never insert directly in controllers. Use a service or listener:

```php
Notification::create([
    'tenant_id'      => $user->tenant_id,
    'recipient_type' => 'staff',
    'recipient_id'   => $user->id,
    'type'           => 'reservation.confirmed',
    'title'          => 'Reservation confirmed',
    'body'           => "Table 4 for {$reservation->guest_name} at {$reservation->time}.",
    'data'           => ['reservation_id' => $reservation->id],
]);
```

After creating, broadcast via Reverb:
```php
broadcast(new NewNotification($notification))->toOthers();
// Channel: private-notifications.staff.{userId}
// Payload: { id, type, title, body, data, created_at }
```

## Notification Type Slugs

No enum constraint on the `type` column — new types can be added freely. Current catalogue:

| Slug | When fired |
|---|---|
| `reservation.confirmed` | Booking confirmed by staff |
| `reservation.cancelled` | Booking cancelled |
| `reservation.reminder_2h` | 2h pre-arrival reminder sent to customer |
| `86.item_unavailable` | Item 86'd (broadcast to all branch staff) |
| `kds.allergen_unacknowledged` | Allergen not acknowledged within 30s |
| `order.payment_failed` | Stripe payment failure |
| `staff.shift_published` | Weekly schedule published by Branch Manager |
| `staff.leave_approved` | Leave request approved |
| `staff.leave_rejected` | Leave request rejected |
| `inventory.low_stock` | Item below reorder_point |
| `events.task_overdue` | Pre-event task overdue |
| `staff.document_expiring` | Staff document expiring within 30 days |

## Real-Time Delivery

```typescript
// NotificationStore.ts (MST)
fetchUnreadCount()       // GET /notifications/unread-count → self.unreadCount
fetchRecent()            // GET /notifications → self.notifications.replace(...)
markRead(id)             // PATCH /notifications/{id}/read
markAllRead()            // POST /notifications/read-all → self.unreadCount = 0

// Reverb subscription (established after auth in root.ts)
subscribeToNotificationChannel(auth.userId, (notif) => {
  notifications.prepend(notif)
  notifications.incrementUnread()
})
```

Channel: `private-notifications.staff.{userId}` — authenticated to the specific recipient only.
