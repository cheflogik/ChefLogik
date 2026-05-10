# Skill: In-App Notifications

## Overview
Server-generated notifications delivered to individual staff or customer recipients.
Stored in `app_notifications` (custom table — NOT Laravel's built-in `notifications` table, to
avoid the collision). Notifications are created by backend services/listeners and read by the
frontend via REST. Real-time delivery happens over Reverb.

## Schema
```
app_notifications
  id              UUID PK
  tenant_id       UUID FK tenants (nullable — platform-level notifs have no tenant)
  recipient_type  VARCHAR(20)  — 'staff' | 'customer'
  recipient_id    UUID         — references users.id or customer_profiles.id
  type            VARCHAR(80)  — dot-namespaced slug, e.g. 'reservation.confirmed', '86.item_unavailable'
  title           VARCHAR
  body            TEXT
  data            JSONB nullable  — arbitrary context (e.g. { order_id, reservation_id })
  read_at         TIMESTAMPTZ nullable
  created_at / updated_at
```

Key indexes:
- `(recipient_type, recipient_id, read_at)` — powers unread count query
- `(recipient_type, recipient_id, created_at)` — powers inbox list (newest first)

## API Endpoints (staff guard)
```
GET    /api/v1/notifications              ← paginated inbox (30/page, newest first)
GET    /api/v1/notifications/unread-count ← { count: N }
PATCH  /api/v1/notifications/{id}/read   ← mark single as read
POST   /api/v1/notifications/read-all    ← mark all unread as read
```

No `recipient_id` is ever taken from the request — always `$request->user()->id`.

## Creating Notifications — Always Through a Service or Listener
```php
// Never insert directly in a controller. Use a dedicated creator or listener.

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

## Notification Type Slugs (examples)
```
reservation.confirmed        ← booking confirmed by staff
reservation.cancelled        ← booking cancelled
reservation.reminder_2h      ← 2h pre-arrival reminder sent to customer
86.item_unavailable          ← item 86'd (broadcast to all branch staff)
kds.allergen_unacknowledged  ← allergen not acknowledged within 30s
order.payment_failed         ← Stripe payment failure
staff.shift_published        ← weekly schedule published
staff.leave_approved         ← leave request approved/rejected
inventory.low_stock          ← item below reorder_point
```
New types can be added freely; the type column has no enum constraint.

## Real-Time Delivery
After creating a notification, fire an event to broadcast it via Reverb:
```php
// Broadcast on a per-user private channel
broadcast(new NewNotification($notification))->toOthers();
// Channel: private-notifications.staff.{userId}
// Payload: { id, type, title, body, data, created_at }
```
The `NotificationStore` in the frontend subscribes to this channel on login and increments
the badge count when an event arrives.

## MST Store Pattern
```typescript
// NotificationStore.ts
fetchUnreadCount()       // GET /notifications/unread-count → self.unreadCount
fetchRecent()            // GET /notifications → self.notifications.replace(...)
markRead(id)             // PATCH /notifications/{id}/read
markAllRead()            // POST /notifications/read-all → self.unreadCount = 0

// Reverb subscription (in root.ts after auth)
subscribeToNotificationChannel(auth.userId, (notif) => {
  notifications.prepend(notif)
  notifications.incrementUnread()
})
```

## Security Rules
- `abort_if((string) $notification->recipient_id !== (string) $request->user()->id, 403)` — enforced on every single-record endpoint to prevent reading another user's notifications.
- The `Notification` model does NOT use `HasTenantScope` — notifications are scoped to the recipient, not the tenant, to allow platform-level notifications (`tenant_id = null`). All queries must explicitly filter by `recipient_type` + `recipient_id`.
