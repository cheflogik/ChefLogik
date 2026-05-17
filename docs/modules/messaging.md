# Module: Internal Staff Messaging

Direct 1-to-1 messaging between staff members within the same tenant. All conversations are tenant-scoped and private.

## Schema

```sql
chat_conversations
  id              UUID PK
  tenant_id       UUID FK tenants         -- HasTenantScope applied
  type            VARCHAR(20)             -- 'direct' only (group reserved for future)
  created_by      UUID FK users
  created_at / updated_at TIMESTAMPTZ

INDEX chat_conv_tenant_updated_idx ON (tenant_id, updated_at)  -- inbox list query

chat_participants
  id              UUID PK
  conversation_id UUID FK chat_conversations
  user_id         UUID FK users
  last_read_at    TIMESTAMPTZ nullable
  joined_at       TIMESTAMPTZ

UNIQUE chat_part_conv_user_unique ON (conversation_id, user_id)
INDEX  chat_part_user_conv_idx    ON (user_id, conversation_id)  -- unread count join

chat_messages
  id              UUID PK
  tenant_id       UUID FK tenants         -- HasTenantScope applied
  conversation_id UUID FK chat_conversations
  sender_id       UUID FK users
  body            TEXT NOT NULL
  created_at / updated_at TIMESTAMPTZ
```

## Permission

Single permission slug: `messaging.access`

All staff with this permission can send and receive messages. Check it via `Gate::authorize('messaging.access')` in every messaging controller action.

## API Endpoints

```
GET  /api/v1/messaging/conversations               ← all conversations for auth user (with unread count)
POST /api/v1/messaging/conversations/direct        ← get-or-create a direct conv with peer_user_id
GET  /api/v1/messaging/conversations/{id}          ← single conversation detail
POST /api/v1/messaging/conversations/{id}/read     ← mark as read (updates last_read_at)
GET  /api/v1/messaging/conversations/{id}/messages ← paginated messages (30/page, newest first)
POST /api/v1/messaging/conversations/{id}/messages ← send a message
GET  /api/v1/messaging/unread-count                ← total unread count across all conversations
```

## Key Service Patterns

**Get or create a direct conversation (idempotent):**
```php
$conversation = $this->chat->getOrCreateDirect($user, $peer);
// Finds existing conversation shared by both users before creating a new one
```

**Send a message (always via ChatService):**
```php
$message = $this->chat->sendMessage($conversation, $sender, $body);
// Creates record, touches conversation.updated_at, dispatches MessageSent event
// MessageSent broadcasts via Reverb on private channel 'chat.{conversationId}'
```

**Participant guard (call before any message read/write):**
```php
$this->chat->assertParticipant($conversation, $user);
// abort(403) if user is not in chat_participants for this conversation
```

**Mark as read:**
```php
$this->chat->markRead($conversation, $user);
// Updates chat_participants.last_read_at
// Unread count = messages.created_at > last_read_at from other senders
```

## WebSocket Channel

```
Private channel: chat.{conversationId}
Event: message.sent (via MessageSent::broadcastAs())

Payload:
{
  id,
  conversation_id,
  sender: { id, name, initials },
  body,
  created_at
}
```

Channel authorization must verify the user is a participant:
```php
Broadcast::channel('chat.{conversationId}',
    function (User $user, string $conversationId) {
        return ChatParticipant::where('conversation_id', $conversationId)
            ->where('user_id', $user->id)
            ->exists();
    }
);
```

## Pagination

Messages are returned **newest first** (page 1 = most recent 30). The frontend renders them bottom-up — reverse before display, load older pages by incrementing `?page=`.

## Tenant Isolation

Both `chat_conversations` and `chat_messages` have `tenant_id` and use `HasTenantScope`. The `ChatConversation::forUser($user)` scope joins through `chat_participants` and filters by `tenant_id` to prevent cross-tenant access.

## MST Store Pattern (Frontend)

```typescript
// MessagesStore.ts
openConversation(conversationId: string) {
  self.activeConversationId = conversationId
  subscribeToChat(conversationId, (msg) => {
    self.prependMessage(msg)       // newest-first order
  })
}

// Unread badge: poll GET /messaging/unread-count on focus,
// or increment from WebSocket event
```
