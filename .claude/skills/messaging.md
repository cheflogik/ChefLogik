# Skill: Internal Staff Messaging (Chat)

## Overview
Direct 1-to-1 messaging between staff members within the same tenant. Only `direct` conversations
exist today; `group` is reserved for a future phase. All conversations are tenant-scoped.

## Schema
```
chat_conversations   id, tenant_id, type ('direct'), created_by → users.id, timestamps
chat_participants    id, conversation_id, user_id, last_read_at, joined_at
chat_messages        id, tenant_id, conversation_id, sender_id → users.id, body (text), timestamps
```

Indexes:
- `chat_conv_tenant_updated_idx` on `(tenant_id, updated_at)` — powers the inbox list query
- `chat_part_conv_user_unique` UNIQUE on `(conversation_id, user_id)` — prevents duplicate participants
- `chat_part_user_conv_idx` on `(user_id, conversation_id)` — unread count joins

## Permission
Single slug: `messaging.access` — all staff with this permission can send/receive messages.
Check it in every messaging controller action via `Gate::authorize('messaging.access')`.

## API Endpoints
```
GET  /api/v1/messaging/conversations              ← all conversations for auth user (with unread count)
POST /api/v1/messaging/conversations/direct       ← get-or-create a direct conv with peer_user_id
GET  /api/v1/messaging/conversations/{id}         ← show single conversation
POST /api/v1/messaging/conversations/{id}/read    ← mark as read (updates last_read_at)
GET  /api/v1/messaging/conversations/{id}/messages ← paginated messages (30/page, newest first)
POST /api/v1/messaging/conversations/{id}/messages ← send a message
GET  /api/v1/messaging/unread-count               ← total unread count across all conversations
```

## ChatService — Key Patterns

### Get or create a direct conversation
```php
// ChatService::getOrCreateDirect() — idempotent
// Finds existing direct conversation shared by both users before creating a new one
$conversation = $this->chat->getOrCreateDirect($user, $peer);
```

### Send a message (always via ChatService)
```php
// ChatService::sendMessage() — creates the record, touches conversation, dispatches MessageSent event
$message = $this->chat->sendMessage($conversation, $sender, $body);
// MessageSent event broadcasts via Reverb on the private channel 'chat.{conversationId}'
```

### Participant guard — call before any message read/write
```php
$this->chat->assertParticipant($conversation, $user);
// abort(403) if user is not in chat_participants for this conversation
```

### Mark read
```php
$this->chat->markRead($conversation, $user);
// Updates chat_participants.last_read_at for this user
// Unread count is computed as messages.created_at > last_read_at from other senders
```

## WebSocket Channel
```
Private channel: chat.{conversationId}
Event broadcasted: message.sent (via MessageSent::broadcastAs())

Payload:
{
  id, conversation_id,
  sender: { id, name, initials },
  body, created_at
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

## MST Store Pattern
```typescript
// MessagesStore.ts — subscribe to the active conversation's channel
openConversation(conversationId: string) {
  self.activeConversationId = conversationId
  subscribeToChat(conversationId, (msg) => {
    self.prependMessage(msg)          // newest-first order
  })
}

// Unread badge: poll GET /messaging/unread-count on focus, or update from WS event
```

## Pagination
Messages are returned **newest first** (page 1 = most recent 30). The frontend renders them
bottom-up — reverse before display, load older pages by incrementing `?page=`.

## Tenant Isolation
`chat_conversations` and `chat_messages` both carry `tenant_id`.
`ChatConversation::forUser($user)` scope joins through `chat_participants` and also filters
by the user's `tenant_id` to ensure cross-tenant access is impossible.
