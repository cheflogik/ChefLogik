# Module: Menu Management
Full requirements: 93 numbered requirements (MM-01 through NF-MM-14).

## 4-Level Hierarchy
Category → Sub-category → Menu Item → Modifier Groups → Modifiers

## Branch Override Model
Master menu owned by Owner. Branches inherit and can override: price, description, photo, availability.
Allergen/dietary flags: Owner-only writes (safety-critical — editing these requires `menu.edit_allergens` permission).

## 86 Management — Two Trigger Types
1. Manual 86: staff action via `menu.86_item` permission
2. Inventory-linked 86: triggered automatically when ingredient stock hits zero (IK-18)

CRITICAL: Inventory-linked 86 events NEVER auto-restore. Manual 86 events CAN have auto-restore modes configured.
The `eighty_six_log.trigger_type` field distinguishes these. Restoration logic must check trigger_type first.

## 86 Propagation SLAs
Local channels (QR menu, POS): within 5 seconds — via Reverb WebSocket broadcast
Delivery platforms (Uber Eats, Wolt): within 60 seconds — via queued SyncEightySixToPlatformsJob on 'high' queue

## Platform Sync
Full menu sync on publish (all items pushed to both platforms)
Incremental sync on: item create, price change, 86, restore, image update
Internal SKU ↔ platform item_id mapping table required for Uber Eats + Wolt
Price verification on incoming platform orders: if platform price differs from our price by >$0.10, flag the order

## QR Menu
Branch-specific QR code → digital menu page (public, no auth required)
Filtered by 86 status in real time (WebSocket subscription or polling)
Dietary filters applied based on customer preferences if they are logged in to the customer portal
