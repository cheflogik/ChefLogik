# Messages (Staff Chat) — Testing Guide

## Overview
The Messages module is an internal real-time chat system for staff members within the same restaurant (tenant). Staff can send direct messages or participate in group conversations. Messages are delivered via WebSocket (Laravel Reverb). This module is for internal staff communication only — it is not visible to customers.

## Prerequisites
- Logged in to the `@web` staff app (`http://localhost:5500`)
- At least two staff member accounts must exist (you need at least one other person to message)
- Both staff members must be logged in simultaneously to test real-time delivery
- A branch is selected in the sidebar

## Sub-sections

### Messages Inbox (Conversation List)

**Purpose**
View all conversations the current staff member is part of.

**How to access**
Click **Messages** icon in the header (envelope/chat icon) or navigate to `/messages`. Alternatively, the header shows a **Messages** dropdown bell-style indicator.

**Test Cases**

#### Test 1: Messages page loads
- **Steps**:
  1. Navigate to `/messages`.
  2. The page shows a two-column layout: conversation list on the left, message thread on the right.
- **Expected result**: Conversation list is visible (may be empty if no conversations started yet).
- **Edge cases to check**:
  - No conversations yet → left panel shows empty state: "No conversations yet. Start one by selecting a colleague."

#### Test 2: Start a new conversation
- **Steps**:
  1. On the Messages page, look for a **New Message** button or a compose icon (`+`).
  2. Click it.
  3. A search or picker appears — type a colleague's name (e.g. `James Chen`).
  4. Select James Chen from the results.
  5. Type a message: `"Hi James, are you working the lunch shift?"`.
  6. Press **Enter** or click **Send**.
- **Expected result**: A new conversation appears in the left panel with James Chen's name. The message appears in the right panel thread. James receives the message in his session without a page refresh.
- **Common mistakes**: Trying to message yourself — the system should not allow this.
- **Edge cases to check**:
  - Start a conversation with a staff member who already has an existing conversation → the existing conversation opens instead of creating a duplicate.

#### Test 3: Conversation list shows unread indicator
- **Precondition**: A new message has arrived that the current user has not yet read.
- **Steps**:
  1. Log in as User A (James Chen) in one browser window.
  2. Log in as User B (Maria Rossi) in another.
  3. User B sends a message to User A.
  4. In User A's session, look at the conversation list.
- **Expected result**: The conversation with Maria shows an unread indicator (bold text, blue dot, or badge count). The header messages bell may also show a badge count.

---

### Message Thread

**Purpose**
Read and send messages within a specific conversation.

**How to access**
Click any conversation in the left panel to open its thread on the right.

**Test Cases**

#### Test 4: Send a message in an existing conversation
- **Precondition**: A conversation exists.
- **Steps**:
  1. Click a conversation to open it.
  2. In the message input at the bottom, type: `"Please check table 7 when you get a moment"`.
  3. Press **Enter** or click the **Send** button (arrow icon).
- **Expected result**: Message appears in the thread with your name/avatar, current timestamp, and message text. The other participant receives it in real time.

#### Test 5: Real-time message delivery
- **Precondition**: Both User A and User B are logged in, viewing the same conversation.
- **Steps**:
  1. User A types and sends a message.
  2. Watch User B's thread.
- **Expected result**: User B's thread shows the message within 1–2 seconds without any page refresh.

#### Test 6: Message timestamp display
- **Steps**:
  1. Send a message.
  2. Look at the timestamp next to the message bubble.
- **Expected result**: Time shows in a human-readable format (e.g. `"2:34 PM"` for today, `"Mon 2:34 PM"` for a different day).

#### Test 7: Send an empty message
- **Steps**:
  1. In the message input, leave it blank.
  2. Press Enter or click Send.
- **Expected result**: Nothing is sent. The input may shake or show a validation indicator, but no empty message bubble appears.

#### Test 8: Long message display
- **Steps**:
  1. Send a very long message (500+ characters).
- **Expected result**: The message bubble wraps the text correctly without overflowing the chat container.

---

### Header Messages Dropdown

**Purpose**
Quick preview of recent messages from the app header without navigating to the full Messages page.

**How to access**
Click the message/envelope icon in the app header (top of the page, usually next to the notification bell).

**Test Cases**

#### Test 9: Messages dropdown shows recent conversations
- **Steps**:
  1. Click the messages icon in the header.
  2. A dropdown appears listing recent conversations with sender name, message preview, and time.
- **Expected result**: The 3–5 most recent conversations are shown. Clicking any entry navigates to `/messages` and opens that conversation.

#### Test 10: Unread badge count on header icon
- **Precondition**: Unread messages exist.
- **Steps**:
  1. Have another user send you a message.
  2. Look at the messages icon in the header.
- **Expected result**: A red or blue badge with the unread count (e.g. `3`) is overlaid on the icon.

---

## Known Relationships
- Messages are between staff members of the same tenant — cross-tenant messaging is not possible.
- The messages icon in the header uses the same data as the `/messages` page.
- WebSocket connectivity is required for real-time delivery — if Reverb is not running, messages may only appear on page refresh.

## Checklist
- [ ] Messages page loads with two-column layout
- [ ] Empty state shown when no conversations exist
- [ ] New conversation can be started with a colleague search
- [ ] Duplicate conversation not created if one already exists
- [ ] Message sent and appears in thread
- [ ] Real-time delivery — other user receives without refresh
- [ ] Unread indicator appears on new messages
- [ ] Message timestamp is legible
- [ ] Empty message not sent
- [ ] Long messages wrap correctly
- [ ] Header dropdown shows recent conversations
- [ ] Header icon shows badge count for unread messages
