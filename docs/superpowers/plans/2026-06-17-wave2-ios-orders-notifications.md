# Wave 2 (iOS) — Orders + Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the native-iOS Wave 2 gate slice — Orders (list/detail/transitions/cancel/create/payment+refund display) and Notifications (list/unread/mark-read/deep-link) — over real-time Pusher, the `/sync` offline cache, and the food-safety-aware outbox, proving every cross-cutting concern once.

**Architecture:** MVVM with `@Observable` view models; one repository per module (`OrderRepository`, `NotificationRepository`) over the existing `APIClient` actor + SwiftData. Local DB is the read source of truth, refreshed by delta `/sync` and live Pusher upserts; status/cancel writes go through the existing offline outbox (with the `out_of_stock`/food-safety carve-out). Online-only: create-order and payment/refund.

**Tech Stack:** Swift 6 (strict concurrency), SwiftUI, SwiftData, Swift Testing, XcodeGen, PusherSwift (new SPM dependency, user-approved).

**Reference:** spec `docs/superpowers/specs/2026-06-17-wave2-orders-notifications-design.md`; parity source `/web` (`src/types/orders.ts`, `OrderService.ts`, `Kds/NotificationStore`, `websocket/orderChannel.ts`, `notificationChannel.ts`); API `api/routes/api.php` staff group.

**Conventions for every task:**
- After adding/removing any Swift file run `cd ios && xcodegen generate` before building (XcodeGen globs sources at generation time).
- Test: `cd ios && xcodebuild -scheme ChefLogik -destination 'platform=iOS Simulator,name=iPhone 17' test`
- Tests use Swift Testing (`import Testing`, `@Test`, `#expect`) — mirror `Tests/OfflineSyncTests.swift`.
- Commit after each task. Branch off first (repo `ios` — confirm not on a protected branch).

---

## File structure (created/modified)

**Core (shared plumbing):**
- Modify `Sources/Core/Networking/APIClient.swift` — conform to new `Replaying` protocol; `replay` throws `APIError.server(status:)` already carries the code.
- Create `Sources/Core/Offline/Replaying.swift` — protocol abstracting `replay(...)` for testability.
- Modify `Sources/Core/Offline/OutboxReplayer.swift` — 4xx-drop vs 5xx/transport-halt; depend on `Replaying`.
- Modify `Sources/Core/Offline/Outbox.swift` — register `OrderEntity` + `NotificationEntity` in the container.
- Create `Sources/Core/Realtime/PusherRealtimeClient.swift` — concrete `RealtimeClient` over PusherSwift + `/broadcasting/auth`.
- Modify `Sources/App/AppEnvironment.swift` — build the realtime client, offline `ModelContainer`, repositories; expose on the graph.
- Modify `Sources/Core/Auth/SessionStore.swift` — connect/disconnect realtime on login/logout; expose `tenantId`, `userId`.

**Orders module:**
- Create `Sources/Features/Orders/OrderModels.swift` — Codable DTOs + enums mirroring `web/src/types/orders.ts`.
- Create `Sources/Features/Orders/OrderEntity.swift` — SwiftData `@Model` + DTO↔entity mapping.
- Create `Sources/Features/Orders/OrderRepository.swift` — sync, local fetch, upsert, mutations, Pusher.
- Create `Sources/Features/Orders/OrdersListViewModel.swift` + `OrdersListView.swift`.
- Create `Sources/Features/Orders/OrderDetailViewModel.swift` + `OrderDetailView.swift`.
- Create `Sources/Features/Orders/NewOrderViewModel.swift` + `NewOrderView.swift`.

**Notifications module:**
- Create `Sources/Features/Notifications/NotificationModels.swift`, `NotificationEntity.swift`, `NotificationRepository.swift`, `NotificationsViewModel.swift`, `NotificationsView.swift`.

**Routing / push:**
- Modify `Sources/Features/Root/RootTabView.swift` — real Orders + Notifications tabs, unread badge, deep-link target.
- Modify `Sources/Core/Push/PushBridge.swift` — surface tapped-notification routing intent.

**Decisions/memory:**
- Modify `decisions.md` (amend Decision 50). Modify memory files.

---

## Phase A — Shared plumbing

### Task 1: Make the outbox replayer testable + 4xx-drop / 5xx-halt

**Files:**
- Create: `ios/Sources/Core/Offline/Replaying.swift`
- Modify: `ios/Sources/Core/Networking/APIClient.swift` (add conformance)
- Modify: `ios/Sources/Core/Offline/OutboxReplayer.swift`
- Test: `ios/Tests/OutboxReplayerTests.swift`

- [ ] **Step 1: Define the `Replaying` protocol**

Create `Sources/Core/Offline/Replaying.swift`:

```swift
import Foundation

/// Abstracts `APIClient.replay` so the outbox replayer can be unit-tested with a stub.
protocol Replaying: Sendable {
    func replay(method: String, path: String, body: Data?, idempotencyKey: String) async throws
}
```

- [ ] **Step 2: Conform `APIClient`**

In `Sources/Core/Networking/APIClient.swift`, change the declaration:

```swift
actor APIClient: Replaying {
```

(`replay` already has the exact signature — no body change.)

- [ ] **Step 3: Write the failing test**

Create `Tests/OutboxReplayerTests.swift`:

```swift
import Foundation
import Testing
@testable import ChefLogik

private actor StubReplayer: Replaying {
    enum Outcome { case ok, fail(APIError) }
    var outcomes: [String: Outcome]   // keyed by path
    private(set) var calls: [String] = []
    init(_ outcomes: [String: Outcome]) { self.outcomes = outcomes }
    func replay(method: String, path: String, body: Data?, idempotencyKey: String) async throws {
        calls.append(path)
        switch outcomes[path] ?? .ok {
        case .ok: return
        case let .fail(e): throw e
        }
    }
    func callCount() -> Int { calls.count }
}

@MainActor
struct OutboxReplayerTests {
    private func repo() throws -> OutboxRepository {
        let c = try OfflineStore.makeContainer(inMemory: true)
        return OutboxRepository(context: c.mainContext)
    }

    @Test func dropsPermanent4xxAndContinues() async throws {
        let repo = try repo()
        try repo.enqueue(OutboxEntry(method: "POST", path: "/orders/1/status"))
        try repo.enqueue(OutboxEntry(method: "POST", path: "/orders/2/status"))
        let stub = StubReplayer([
            "/orders/1/status": .fail(.server(status: 422, message: "invalid transition")),
            "/orders/2/status": .ok,
        ])
        let replayer = OutboxReplayer(api: stub, repo: repo)
        let n = await replayer.drain()
        #expect(n == 1)                                  // only the 2nd succeeded
        #expect(try repo.autoReplayable().isEmpty)       // both removed (1 dropped, 2 succeeded)
    }

    @Test func haltsOnRetryable5xxKeepingOrder() async throws {
        let repo = try repo()
        try repo.enqueue(OutboxEntry(method: "POST", path: "/orders/1/status"))
        try repo.enqueue(OutboxEntry(method: "POST", path: "/orders/2/status"))
        let stub = StubReplayer([
            "/orders/1/status": .fail(.server(status: 503, message: nil)),
            "/orders/2/status": .ok,
        ])
        let replayer = OutboxReplayer(api: stub, repo: repo)
        let n = await replayer.drain()
        #expect(n == 0)
        #expect(try repo.autoReplayable().count == 2)    // both kept; order preserved
    }
}
```

- [ ] **Step 4: Run the test, verify it fails to compile/fails**

Run: `cd ios && xcodegen generate && xcodebuild -scheme ChefLogik -destination 'platform=iOS Simulator,name=iPhone 17' test -only-testing:ChefLogikTests/OutboxReplayerTests`
Expected: FAIL — `OutboxReplayer(api:)` currently requires a concrete `APIClient`, and 4xx isn't dropped.

- [ ] **Step 5: Refactor `OutboxReplayer`**

Replace `Sources/Core/Offline/OutboxReplayer.swift`:

```swift
import Foundation

/// Drains the offline write outbox when connectivity returns (Decision 50).
/// Replays auto-replayable entries (food-safety entries are excluded by the repo)
/// in FIFO order with their idempotency key. Permanent 4xx (e.g. a stale queued
/// transition the order has already passed → 422) are DROPPED so they can't wedge
/// the queue; retryable transport / 5xx errors HALT the drain to preserve order.
@MainActor
struct OutboxReplayer {
    let api: Replaying
    let repo: OutboxRepository

    @discardableResult
    func drain() async -> Int {
        let entries = (try? repo.autoReplayable()) ?? []
        var replayed = 0
        for entry in entries {
            do {
                try await api.replay(
                    method: entry.method,
                    path: entry.path,
                    body: entry.payload,
                    idempotencyKey: entry.idempotencyKey
                )
                try? repo.delete(entry)
                replayed += 1
            } catch let APIError.server(status, _) where (400..<500).contains(status) && status != 429 {
                // Permanent client error — the mutation is no longer valid (stale state
                // machine, gone resource). Drop it; do not retry forever.
                try? repo.delete(entry)
            } catch {
                // Transport / 5xx / 429 — keep order, retry on the next drain.
                break
            }
        }
        return replayed
    }
}
```

- [ ] **Step 6: Run the tests, verify pass**

Run: `cd ios && xcodebuild -scheme ChefLogik -destination 'platform=iOS Simulator,name=iPhone 17' test -only-testing:ChefLogikTests/OutboxReplayerTests`
Expected: PASS (2 tests). Also run the full suite to confirm the existing `OfflineSyncTests` still pass.

- [ ] **Step 7: Commit**

```bash
cd ios && git add Sources/Core/Offline/Replaying.swift Sources/Core/Networking/APIClient.swift Sources/Core/Offline/OutboxReplayer.swift Tests/OutboxReplayerTests.swift
git commit -m "feat(ios): outbox replayer drops permanent 4xx, halts on 5xx; inject Replaying"
```

---

### Task 2: Add PusherSwift + concrete RealtimeClient

**Files:**
- Modify: `ios/project.yml` (SPM package + dependency)
- Create: `ios/Sources/Core/Realtime/PusherRealtimeClient.swift`

- [ ] **Step 1: Add the SPM package to `project.yml`**

Add a top-level `packages:` block and a target dependency:

```yaml
packages:
  PusherSwift:
    url: https://github.com/pusher/pusher-websocket-swift
    minVersion: 10.1.5
```

Under `targets: ChefLogik:` add:

```yaml
    dependencies:
      - package: PusherSwift
```

Also add the Reverb host config to `Sources/Core/Config/AppConfig.swift` (read the file; add `static let reverb...` constants for key/host/port/scheme alongside `apiBaseURL`, sourced from the same env mechanism). Mirror `web/src/websocket/echo.ts` for the key/host/port values.

- [ ] **Step 2: Implement `PusherRealtimeClient`**

Create `Sources/Core/Realtime/PusherRealtimeClient.swift`. Authorize private channels via `POST /broadcasting/auth` with the bearer token (PusherSwift `AuthRequestBuilderProtocol`). Conform to the existing `RealtimeClient` protocol exactly (`connect`/`disconnect`/`subscribe(channel:event:handler:)`/`unsubscribe`). Bind events by name; pass the event payload `Data` to the handler.

```swift
import Foundation
import PusherSwift

/// Concrete `RealtimeClient` over Reverb (Pusher protocol). Authorizes private
/// channels through `POST /broadcasting/auth` with the staff bearer token.
final class PusherRealtimeClient: RealtimeClient, @unchecked Sendable {
    private let baseURL: URL
    private var pusher: Pusher?
    private var token: String?
    private var subscriptions: [String: PusherChannel] = [:]
    private let lock = NSLock()

    init(baseURL: URL = AppConfig.apiBaseURL) { self.baseURL = baseURL }

    func connect(token: String) async {
        lock.lock(); self.token = token; lock.unlock()
        let options = PusherClientOptions(
            authMethod: .authRequestBuilder(authRequestBuilder: self),
            host: .host(AppConfig.reverbHost),
            port: AppConfig.reverbPort,
            useTLS: AppConfig.reverbUseTLS
        )
        let p = Pusher(key: AppConfig.reverbKey, options: options)
        p.connect()
        lock.lock(); self.pusher = p; lock.unlock()
    }

    func disconnect() async {
        lock.lock(); let p = pusher; pusher = nil; subscriptions.removeAll(); lock.unlock()
        p?.disconnect()
    }

    func subscribe(channel: String, event: String, handler: @escaping @Sendable (Data) -> Void) async {
        lock.lock(); let p = pusher; lock.unlock()
        guard let p else { return }
        let ch = p.subscribe(channelName: channel)
        lock.lock(); subscriptions[channel] = ch; lock.unlock()
        ch.bind(eventName: event, eventCallback: { (event: PusherEvent) in
            if let raw = event.data, let data = raw.data(using: .utf8) { handler(data) }
        })
    }

    func unsubscribe(channel: String) async {
        lock.lock(); let p = pusher; subscriptions[channel] = nil; lock.unlock()
        p?.unsubscribe(channel)
    }
}

extension PusherRealtimeClient: AuthRequestBuilderProtocol {
    func requestFor(socketID: String, channelName: String) -> URLRequest? {
        var req = URLRequest(url: baseURL.appendingPathComponent("broadcasting/auth"))
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        lock.lock(); let t = token; lock.unlock()
        if let t { req.setValue("Bearer \(t)", forHTTPHeaderField: "Authorization") }
        let body = ["socket_id": socketID, "channel_name": channelName]
        req.httpBody = try? JSONSerialization.data(withJSONObject: body)
        return req
    }
}
```

- [ ] **Step 3: Generate + build**

Run: `cd ios && xcodegen generate && xcodebuild -scheme ChefLogik -destination 'platform=iOS Simulator,name=iPhone 17' build`
Expected: BUILD SUCCEEDED (PusherSwift resolves via SPM). If `AppConfig.reverb*` constants are missing, add them.

- [ ] **Step 4: Commit**

```bash
cd ios && git add project.yml Sources/Core/Realtime/PusherRealtimeClient.swift Sources/Core/Config/AppConfig.swift
git commit -m "feat(ios): add PusherSwift; concrete RealtimeClient over /broadcasting/auth"
```

---

### Task 3: Wire realtime + offline container + repositories into the graph

**Files:**
- Modify: `ios/Sources/App/AppEnvironment.swift`
- Modify: `ios/Sources/Core/Auth/SessionStore.swift`

- [ ] **Step 1: Expose identity on `SessionStore` + connect/disconnect realtime**

In `SessionStore.swift`: add a `realtime: RealtimeClient` dependency to `init` (and store it). Add computed accessors:

```swift
var tenantId: String? { user?.tenantId }
var userId: String? { user?.id }
```

In `completeLogin` and `loadUserAndEnterApp`, after `applyUser(...)`, connect realtime with the token:
```swift
await realtime.connect(token: <token>)
```
(in `completeLogin` use `session.token`; in `unlock`/`loadUserAndEnterApp` use the Keychain token already set on the API). In `signOut` and `handleServerUnauthorized`, call `await realtime.disconnect()`.

- [ ] **Step 2: Build the container + repositories in `AppEnvironment`**

Replace `AppEnvironment.make()` to construct a shared `ModelContainer` (via `OfflineStore.makeContainer()`), a `PusherRealtimeClient`, the `OutboxRepository`/`OutboxReplayer`, and the two feature repositories; expose them on `Graph`:

```swift
struct Graph {
    let session: SessionStore
    let auth: AuthService
    let location: LocationProvider
    let orders: OrderRepository
    let notifications: NotificationRepository
}
```

Pass the same `APIClient`, `ModelContainer.mainContext`, `SyncService`, `SyncCursorStore`, `OutboxRepository`, and `realtime` into both repositories. Inject `realtime` into `SessionStore`.

- [ ] **Step 3: Inject the repositories into the SwiftUI environment**

Read `Sources/App/CheflogikApp.swift`; add the repositories (and `ModelContainer`) to the view hierarchy via `.environment(...)` / `.modelContainer(...)` so views/view-models can resolve them. Mirror how `SessionStore` is currently injected.

- [ ] **Step 4: Build**

Run: `cd ios && xcodegen generate && xcodebuild -scheme ChefLogik -destination 'platform=iOS Simulator,name=iPhone 17' build`
Expected: BUILD SUCCEEDED. (Repositories don't exist yet — do Step 2/3 wiring referencing them only after Task 6/14 create them, OR stub the graph fields and fill in once repos exist. Recommended order: implement Tasks 4–6 (orders repo) and Task 10 (notifications repo) first, then return to complete this task's Step 2–3. Mark this task blocked-by Task 6 + Task 10.)

- [ ] **Step 5: Commit** (after repos exist)

```bash
cd ios && git add Sources/App/AppEnvironment.swift Sources/App/CheflogikApp.swift Sources/Core/Auth/SessionStore.swift
git commit -m "feat(ios): wire realtime connect/disconnect + offline container + repositories into graph"
```

---

## Phase B — Orders

### Task 4: Order domain models (DTOs + enums)

**Files:**
- Create: `ios/Sources/Features/Orders/OrderModels.swift`
- Test: `ios/Tests/OrderDecodingTests.swift`

- [ ] **Step 1: Write the failing decoding test**

Create `Tests/OrderDecodingTests.swift`:

```swift
import Foundation
import Testing
@testable import ChefLogik

struct OrderDecodingTests {
    @Test func decodesOrderWithItemsAndStatus() throws {
        let json = """
        {"id":"o1","order_number":"A-1001","branch_id":"b1","source":"dine_in_pos",
         "status":"preparing","payment_status":"pending","payment_method":null,
         "subtotal_cents":1200,"total_cents":1320,"currency":"EUR",
         "customer_name":"Sam","allergen_note":null,
         "items":[{"id":"i1","name":"Soup","quantity":2,"unit_price_cents":600,
                   "note":null,"modifiers":[]}],
         "status_history":[{"status":"new","changed_at":"2026-06-17T10:00:00Z","note":null}],
         "updated_at":"2026-06-17T10:05:00Z"}
        """
        let order = try JSONDecoder().decode(OrderDTO.self, from: Data(json.utf8))
        #expect(order.id == "o1")
        #expect(order.status == .preparing)
        #expect(order.source == .dineInPos)
        #expect(order.items.count == 1)
        #expect(order.items.first?.quantity == 2)
        #expect(OrderStatus.preparing.nextTransitions.map(\.status) == [.ready])
    }
}
```

- [ ] **Step 2: Run, verify fail** — `OrderDTO` undefined.

- [ ] **Step 3: Implement the models**

Create `Sources/Features/Orders/OrderModels.swift` mirroring `web/src/types/orders.ts` (9-stage status, 7 sources, payment enums, cancel reason codes, `NEXT_TRANSITIONS`):

```swift
import Foundation

enum OrderStatus: String, Codable, Sendable, CaseIterable {
    case new, confirmed, preparing, ready
    case outForDelivery = "out_for_delivery"
    case delivered, served
    case billSettled = "bill_settled"
    case completed, cancelled

    var isTerminal: Bool { self == .completed || self == .cancelled }

    struct Transition: Equatable { let status: OrderStatus; let label: String }

    /// Mirrors NEXT_TRANSITIONS in web/src/types/orders.ts (UI only; API re-validates).
    var nextTransitions: [Transition] {
        switch self {
        case .new:            return [.init(status: .confirmed, label: "Confirm")]
        case .confirmed:      return [.init(status: .preparing, label: "Start Preparing")]
        case .preparing:      return [.init(status: .ready, label: "Mark Ready")]
        case .ready:          return [.init(status: .served, label: "Served"),
                                      .init(status: .outForDelivery, label: "Dispatch")]
        case .outForDelivery: return [.init(status: .delivered, label: "Delivered")]
        case .delivered:      return [.init(status: .completed, label: "Complete")]
        case .served:         return [.init(status: .billSettled, label: "Bill Settled")]
        case .billSettled:    return [.init(status: .completed, label: "Complete")]
        default:              return []
        }
    }

    var label: String { rawValue.replacingOccurrences(of: "_", with: " ").capitalized }
}

enum OrderSource: String, Codable, Sendable, CaseIterable {
    case dineInPos = "dine_in_pos"
    case dineInQr = "dine_in_qr"
    case takeawayCounter = "takeaway_counter"
    case takeawayPhone = "takeaway_phone"
    case online
    case uberEats = "uber_eats"
    case wolt
    var label: String { rawValue.replacingOccurrences(of: "_", with: " ").capitalized }
}

enum PaymentStatus: String, Codable, Sendable { case pending, paid, refunded, partialRefund = "partial_refund" }
enum CancelReasonCode: String, Codable, Sendable, CaseIterable {
    case customerRequest = "customer_request"
    case outOfStock = "out_of_stock"
    case restaurantClosed = "restaurant_closed"
    case deliveryFailure = "delivery_failure"
    case duplicate, other
    var label: String { rawValue.replacingOccurrences(of: "_", with: " ").capitalized }
    /// Food-safety: stock-driven cancels must never auto-replay (Decision 50).
    var isFoodSafety: Bool { self == .outOfStock }
}

struct OrderModifierDTO: Codable, Sendable, Hashable { let name: String; let priceCents: Int?
    enum CodingKeys: String, CodingKey { case name; case priceCents = "price_cents" } }

struct OrderItemDTO: Codable, Sendable, Hashable {
    let id: String; let name: String; let quantity: Int; let unitPriceCents: Int
    let note: String?; let modifiers: [OrderModifierDTO]
    enum CodingKeys: String, CodingKey { case id, name, quantity, note, modifiers
        case unitPriceCents = "unit_price_cents" }
}

struct OrderStatusHistoryDTO: Codable, Sendable, Hashable {
    let status: OrderStatus; let changedAt: String; let note: String?
    enum CodingKeys: String, CodingKey { case status, note; case changedAt = "changed_at" }
}

struct OrderDTO: Codable, Sendable, Identifiable {
    let id: String
    let orderNumber: String
    let branchId: String
    let source: OrderSource
    let status: OrderStatus
    let paymentStatus: PaymentStatus?
    let paymentMethod: String?
    let subtotalCents: Int
    let totalCents: Int
    let currency: String
    let customerName: String?
    let allergenNote: String?
    let items: [OrderItemDTO]
    let statusHistory: [OrderStatusHistoryDTO]?
    let updatedAt: String?
    enum CodingKeys: String, CodingKey {
        case id, source, status, currency, items
        case orderNumber = "order_number"
        case branchId = "branch_id"
        case paymentStatus = "payment_status"
        case paymentMethod = "payment_method"
        case subtotalCents = "subtotal_cents"
        case totalCents = "total_cents"
        case customerName = "customer_name"
        case allergenNote = "allergen_note"
        case statusHistory = "status_history"
        case updatedAt = "updated_at"
    }
}

// Mutation request bodies (mirror OrderService.ts).
struct StatusChangeBody: Encodable, Sendable { let status: String; let notes: String? }
struct CancelBody: Encodable, Sendable { let reasonCode: String; let reasonNote: String?
    enum CodingKeys: String, CodingKey { case reasonCode = "reason_code"; case reasonNote = "reason_note" } }
struct CreateOrderItemBody: Encodable, Sendable { let menuItemId: String; let quantity: Int; let note: String?
    enum CodingKeys: String, CodingKey { case menuItemId = "menu_item_id"; case quantity, note } }
struct CreateOrderBody: Encodable, Sendable { let branchId: String; let source: String; let items: [CreateOrderItemBody]
    enum CodingKeys: String, CodingKey { case branchId = "branch_id"; case source, items } }
```

> Before finalizing field names, open `api/app/Http/Resources/OrderResource.php` and confirm the JSON keys (snake_case names above are derived from `web/src/types/orders.ts`). If any key differs, fix the `CodingKeys` to match the Resource — the Resource is the contract.

- [ ] **Step 4: Run, verify pass** — `OrderDecodingTests` green.

- [ ] **Step 5: Commit**

```bash
cd ios && git add Sources/Features/Orders/OrderModels.swift Tests/OrderDecodingTests.swift
git commit -m "feat(ios): order domain models + enums mirroring web orders types"
```

---

### Task 5: OrderEntity (SwiftData) + mapping

**Files:**
- Create: `ios/Sources/Features/Orders/OrderEntity.swift`
- Modify: `ios/Sources/Core/Offline/Outbox.swift` (register the model)
- Test: `ios/Tests/OrderEntityTests.swift`

- [ ] **Step 1: Write the failing mapping test**

```swift
import Foundation
import SwiftData
import Testing
@testable import ChefLogik

@MainActor
struct OrderEntityTests {
    @Test func roundTripsThroughEntity() throws {
        let container = try OfflineStore.makeContainer(inMemory: true)
        let dto = OrderDTO(id: "o1", orderNumber: "A-1", branchId: "b1", source: .dineInPos,
            status: .preparing, paymentStatus: .pending, paymentMethod: nil,
            subtotalCents: 1200, totalCents: 1320, currency: "EUR", customerName: "Sam",
            allergenNote: nil, items: [.init(id: "i1", name: "Soup", quantity: 2,
            unitPriceCents: 600, note: nil, modifiers: [])],
            statusHistory: nil, updatedAt: "2026-06-17T10:05:00Z")
        let entity = OrderEntity(dto: dto)
        container.mainContext.insert(entity)
        try container.mainContext.save()
        let back = entity.toDTO()
        #expect(back.id == "o1")
        #expect(back.status == .preparing)
        #expect(back.items.first?.quantity == 2)
    }
}
```

- [ ] **Step 2: Run, verify fail** — `OrderEntity` undefined.

- [ ] **Step 3: Implement the entity + mapping**

Create `Sources/Features/Orders/OrderEntity.swift`. Store the full DTO payload as encoded `Data` plus the columns we filter/sort on (status, branch, updatedAt, orderNumber) so list queries stay cheap:

```swift
import Foundation
import SwiftData

@Model
final class OrderEntity {
    @Attribute(.unique) var id: String
    var orderNumber: String
    var branchId: String
    var statusRaw: String
    var sourceRaw: String
    var updatedAt: String?
    var payload: Data           // encoded OrderDTO (source of truth for detail)

    init(dto: OrderDTO) {
        self.id = dto.id
        self.orderNumber = dto.orderNumber
        self.branchId = dto.branchId
        self.statusRaw = dto.status.rawValue
        self.sourceRaw = dto.source.rawValue
        self.updatedAt = dto.updatedAt
        self.payload = (try? JSONEncoder().encode(dto)) ?? Data()
    }

    func apply(_ dto: OrderDTO) {
        orderNumber = dto.orderNumber; branchId = dto.branchId
        statusRaw = dto.status.rawValue; sourceRaw = dto.source.rawValue
        updatedAt = dto.updatedAt
        payload = (try? JSONEncoder().encode(dto)) ?? Data()
    }

    func toDTO() -> OrderDTO {
        (try? JSONDecoder().decode(OrderDTO.self, from: payload))
            ?? OrderDTO(id: id, orderNumber: orderNumber, branchId: branchId,
                source: OrderSource(rawValue: sourceRaw) ?? .dineInPos,
                status: OrderStatus(rawValue: statusRaw) ?? .new,
                paymentStatus: nil, paymentMethod: nil, subtotalCents: 0, totalCents: 0,
                currency: "EUR", customerName: nil, allergenNote: nil, items: [],
                statusHistory: nil, updatedAt: updatedAt)
    }
}
```

- [ ] **Step 4: Register the model in the container**

In `Sources/Core/Offline/Outbox.swift`, update `makeContainer`:

```swift
return try ModelContainer(for: OutboxEntry.self, OrderEntity.self, NotificationEntity.self, configurations: config)
```

> `NotificationEntity` is created in Task 10. Until then, register only `OutboxEntry.self, OrderEntity.self`, and add `NotificationEntity.self` in Task 10.

- [ ] **Step 5: Run, verify pass** — `OrderEntityTests` green.

- [ ] **Step 6: Commit**

```bash
cd ios && git add Sources/Features/Orders/OrderEntity.swift Sources/Core/Offline/Outbox.swift Tests/OrderEntityTests.swift
git commit -m "feat(ios): OrderEntity SwiftData model + DTO mapping; register in container"
```

---

### Task 6: OrderRepository — sync, fetch, mutations

**Files:**
- Create: `ios/Sources/Features/Orders/OrderRepository.swift`
- Test: `ios/Tests/OrderRepositoryTests.swift`

- [ ] **Step 1: Write failing tests for sync upsert/delete + food-safety enqueue**

```swift
import Foundation
import SwiftData
import Testing
@testable import ChefLogik

@MainActor
struct OrderRepositoryTests {
    private func makeRepo() throws -> (OrderRepository, ModelContext, OutboxRepository) {
        let c = try OfflineStore.makeContainer(inMemory: true)
        let outbox = OutboxRepository(context: c.mainContext)
        let repo = OrderRepository(
            context: c.mainContext,
            api: APIClient(),                // not exercised in these tests
            outbox: outbox
        )
        return (repo, c.mainContext, outbox)
    }

    @Test func upsertInsertsThenUpdates() throws {
        let (repo, ctx, _) = try makeRepo()
        let dto = OrderDTO(id: "o1", orderNumber: "A-1", branchId: "b1", source: .dineInPos,
            status: .new, paymentStatus: nil, paymentMethod: nil, subtotalCents: 0, totalCents: 0,
            currency: "EUR", customerName: nil, allergenNote: nil, items: [], statusHistory: nil,
            updatedAt: "t1")
        repo.upsert([dto])
        #expect(try ctx.fetchCount(FetchDescriptor<OrderEntity>()) == 1)
        repo.upsert([OrderDTO(id: "o1", orderNumber: "A-1", branchId: "b1", source: .dineInPos,
            status: .confirmed, paymentStatus: nil, paymentMethod: nil, subtotalCents: 0, totalCents: 0,
            currency: "EUR", customerName: nil, allergenNote: nil, items: [], statusHistory: nil,
            updatedAt: "t2")])
        #expect(try ctx.fetchCount(FetchDescriptor<OrderEntity>()) == 1)   // updated, not duplicated
        #expect(repo.order(id: "o1")?.status == .confirmed)
    }

    @Test func applyDeletesRemovesRows() throws {
        let (repo, ctx, _) = try makeRepo()
        repo.upsert([OrderDTO(id: "o1", orderNumber: "A", branchId: "b1", source: .dineInPos,
            status: .new, paymentStatus: nil, paymentMethod: nil, subtotalCents: 0, totalCents: 0,
            currency: "EUR", customerName: nil, allergenNote: nil, items: [], statusHistory: nil, updatedAt: "t")])
        repo.applyDeletes(["o1"])
        #expect(try ctx.fetchCount(FetchDescriptor<OrderEntity>()) == 0)
    }

    @Test func cancelOutOfStockEnqueuesAsManualReplay() throws {
        let (repo, _, outbox) = try makeRepo()
        repo.upsert([OrderDTO(id: "o1", orderNumber: "A", branchId: "b1", source: .dineInPos,
            status: .new, paymentStatus: nil, paymentMethod: nil, subtotalCents: 0, totalCents: 0,
            currency: "EUR", customerName: nil, allergenNote: nil, items: [], statusHistory: nil, updatedAt: "t")])
        repo.queueCancel(orderId: "o1", reason: .outOfStock, note: nil)
        #expect(try outbox.autoReplayable().isEmpty)   // food-safety excluded from auto-replay
    }

    @Test func queueTransitionIsAutoReplayable() throws {
        let (repo, _, outbox) = try makeRepo()
        repo.upsert([OrderDTO(id: "o1", orderNumber: "A", branchId: "b1", source: .dineInPos,
            status: .new, paymentStatus: nil, paymentMethod: nil, subtotalCents: 0, totalCents: 0,
            currency: "EUR", customerName: nil, allergenNote: nil, items: [], statusHistory: nil, updatedAt: "t")])
        repo.queueTransition(orderId: "o1", to: .confirmed, notes: nil)
        #expect(try outbox.autoReplayable().count == 1)
        #expect(repo.order(id: "o1")?.status == .confirmed)   // optimistic local update
    }
}
```

- [ ] **Step 2: Run, verify fail** — `OrderRepository` undefined.

- [ ] **Step 3: Implement `OrderRepository`**

Create `Sources/Features/Orders/OrderRepository.swift`:

```swift
import Foundation
import SwiftData

/// Source of truth for order reads is the local SwiftData store. Refreshed by
/// delta `/sync` and live Pusher upserts. Status/cancel mutations update locally
/// (optimistic) and enqueue to the outbox; out_of_stock cancels are food-safety
/// (manual replay). Create-order and payment are online-only (not queued).
@MainActor
final class OrderRepository {
    private let context: ModelContext
    private let api: APIClient
    private let outbox: OutboxRepository
    private let sync: SyncService
    private let cursors: SyncCursorStore
    private let realtime: RealtimeClient
    private let encoder = JSONEncoder()

    init(context: ModelContext, api: APIClient, outbox: OutboxRepository,
         sync: SyncService? = nil, cursors: SyncCursorStore = SyncCursorStore(),
         realtime: RealtimeClient = NoopRealtimeClient()) {
        self.context = context
        self.api = api
        self.outbox = outbox
        self.sync = sync ?? SyncService(api: api)
        self.cursors = cursors
        self.realtime = realtime
    }

    // MARK: Local reads
    func orders(branchId: String?, status: OrderStatus?, source: OrderSource?) -> [OrderDTO] {
        let descriptor = FetchDescriptor<OrderEntity>(sortBy: [SortDescriptor(\.updatedAt, order: .reverse)])
        let entities = (try? context.fetch(descriptor)) ?? []
        return entities.map { $0.toDTO() }.filter {
            (branchId == nil || $0.branchId == branchId) &&
            (status == nil || $0.status == status) &&
            (source == nil || $0.source == source)
        }
    }

    func order(id: String) -> OrderDTO? { entity(id)?.toDTO() }

    private func entity(_ id: String) -> OrderEntity? {
        try? context.fetch(FetchDescriptor<OrderEntity>(predicate: #Predicate { $0.id == id })).first
    }

    // MARK: Cache maintenance
    func upsert(_ dtos: [OrderDTO]) {
        for dto in dtos {
            if let e = entity(dto.id) { e.apply(dto) } else { context.insert(OrderEntity(dto: dto)) }
        }
        try? context.save()
    }

    func applyDeletes(_ ids: [String]) {
        for id in ids { if let e = entity(id) { context.delete(e) } }
        try? context.save()
    }

    /// Delta-sync the orders resource to exhaustion (cold start / foreground / reconnect).
    func refresh(branchId: String?) async {
        var cursor = cursors.cursor(for: "orders")
        repeat {
            do {
                let page: SyncPage<OrderDTO> = try await sync.page(
                    resource: "orders", cursor: cursor, branchId: branchId)
                upsert(page.data)
                applyDeletes(page.meta.deletedIds)
                cursors.setCursor(page.meta.nextCursor, for: "orders")
                cursor = page.meta.nextCursor
                if !page.meta.hasMore { break }
            } catch { break }   // offline / error → keep cached state, retry next time
        } while true
    }

    // MARK: Mutations (status + cancel are queueable; create/payment online-only)
    func queueTransition(orderId: String, to status: OrderStatus, notes: String?) {
        if let e = entity(orderId) {                       // optimistic local update
            e.apply(rewrite(e.toDTO(), status: status)); try? context.save()
        }
        let body = try? encoder.encode(StatusChangeBody(status: status.rawValue, notes: notes))
        try? outbox.enqueue(OutboxEntry(method: "POST", path: "/orders/\(orderId)/status", payload: body))
    }

    func queueCancel(orderId: String, reason: CancelReasonCode, note: String?) {
        let body = try? encoder.encode(CancelBody(reasonCode: reason.rawValue, reasonNote: note))
        try? outbox.enqueue(OutboxEntry(
            method: "POST", path: "/orders/\(orderId)/cancel", payload: body,
            requiresManualReplay: reason.isFoodSafety))    // out_of_stock never auto-replays
    }

    /// Online-only create (no offline temp-id reconciliation in this wave).
    func create(branchId: String, source: OrderSource, items: [CreateOrderItemBody]) async throws -> OrderDTO {
        struct Wrapper: Decodable { let data: OrderDTO }
        let body = CreateOrderBody(branchId: branchId, source: source.rawValue, items: items)
        let res: Wrapper = try await api.post("/orders", body: body)
        upsert([res.data])
        return res.data
    }

    private func rewrite(_ dto: OrderDTO, status: OrderStatus) -> OrderDTO {
        OrderDTO(id: dto.id, orderNumber: dto.orderNumber, branchId: dto.branchId, source: dto.source,
            status: status, paymentStatus: dto.paymentStatus, paymentMethod: dto.paymentMethod,
            subtotalCents: dto.subtotalCents, totalCents: dto.totalCents, currency: dto.currency,
            customerName: dto.customerName, allergenNote: dto.allergenNote, items: dto.items,
            statusHistory: dto.statusHistory, updatedAt: dto.updatedAt)
    }

    // MARK: Realtime
    func subscribe(tenantId: String, branchId: String) async {
        let channel = RealtimeChannels.orders(tenantId: tenantId, branchId: branchId)
        for event in ["OrderStatusChanged", "NewOrderReceived"] {   // confirm names vs api broadcast events
            await realtime.subscribe(channel: channel, event: event) { [weak self] data in
                guard let self else { return }
                struct Env: Decodable { let order: OrderDTO? }
                if let env = try? JSONDecoder().decode(Env.self, from: data), let o = env.order {
                    Task { @MainActor in self.upsert([o]); await self.refresh(branchId: branchId) }
                } else {
                    Task { @MainActor in await self.refresh(branchId: branchId) }
                }
            }
        }
        await refresh(branchId: branchId)   // gap-fill on (re)subscribe
    }
}
```

> Clean up the `orders(...)` method (the trailing `_ = descriptor` is a placeholder from drafting — remove it and the unused `var`). Confirm the broadcast event names (`OrderStatusChanged` / `NewOrderReceived`) and the payload envelope shape against `api` broadcast events + `web/src/websocket/orderChannel.ts`; adjust the inner `Env` decode to match the real payload (web types: `OrderStatusChangedPayload`, `NewOrderReceivedPayload`).

- [ ] **Step 4: Run, verify pass** — `OrderRepositoryTests` (4 tests) green.

- [ ] **Step 5: Commit**

```bash
cd ios && git add Sources/Features/Orders/OrderRepository.swift Tests/OrderRepositoryTests.swift
git commit -m "feat(ios): OrderRepository — sync/upsert/deletes, optimistic queued transition+cancel, online create"
```

- [ ] **Step 6: Return to Task 3** and complete the graph wiring now that `OrderRepository` exists.

---

### Task 7: Orders list view-model + view

**Files:**
- Create: `ios/Sources/Features/Orders/OrdersListViewModel.swift`
- Create: `ios/Sources/Features/Orders/OrdersListView.swift`
- Test: `ios/Tests/OrdersListViewModelTests.swift`

- [ ] **Step 1: Write failing filter test**

```swift
import Foundation
import SwiftData
import Testing
@testable import ChefLogik

@MainActor
struct OrdersListViewModelTests {
    @Test func appliesStatusFilter() throws {
        let c = try OfflineStore.makeContainer(inMemory: true)
        let repo = OrderRepository(context: c.mainContext, api: APIClient(),
            outbox: OutboxRepository(context: c.mainContext))
        repo.upsert([
            OrderDTO(id: "o1", orderNumber: "A", branchId: "b1", source: .dineInPos, status: .new,
                paymentStatus: nil, paymentMethod: nil, subtotalCents: 0, totalCents: 0, currency: "EUR",
                customerName: nil, allergenNote: nil, items: [], statusHistory: nil, updatedAt: "t1"),
            OrderDTO(id: "o2", orderNumber: "B", branchId: "b1", source: .wolt, status: .preparing,
                paymentStatus: nil, paymentMethod: nil, subtotalCents: 0, totalCents: 0, currency: "EUR",
                customerName: nil, allergenNote: nil, items: [], statusHistory: nil, updatedAt: "t2"),
        ])
        let vm = OrdersListViewModel(repo: repo, branchId: "b1")
        vm.statusFilter = .preparing
        vm.reload()
        #expect(vm.orders.map(\.id) == ["o2"])
    }
}
```

- [ ] **Step 2: Run, verify fail.**

- [ ] **Step 3: Implement the view-model**

```swift
import Foundation
import Observation

@MainActor
@Observable
final class OrdersListViewModel {
    private let repo: OrderRepository
    var branchId: String?
    var statusFilter: OrderStatus?
    var sourceFilter: OrderSource?
    private(set) var orders: [OrderDTO] = []
    var isRefreshing = false

    init(repo: OrderRepository, branchId: String?) {
        self.repo = repo; self.branchId = branchId
        reload()
    }

    func reload() {
        orders = repo.orders(branchId: branchId, status: statusFilter, source: sourceFilter)
    }

    func refresh() async {
        isRefreshing = true; defer { isRefreshing = false }
        await repo.refresh(branchId: branchId)
        reload()
    }
}
```

- [ ] **Step 4: Run, verify pass.**

- [ ] **Step 5: Implement the view**

Create `Sources/Features/Orders/OrdersListView.swift` — a `List` of order rows (number, source, total, `StatusBadge(status.label)`), a status filter (`Menu`/`Picker` over `OrderStatus.allCases`), `.refreshable { await vm.refresh() }`, `NavigationLink` to `OrderDetailView`. Use `Brand`/`Spacing`. Resolve `OrderRepository` from the environment; gate the whole tab on `session.can("orders.view")`.

```swift
import SwiftUI

struct OrdersListView: View {
    @Environment(SessionStore.self) private var session
    let repo: OrderRepository
    @State private var vm: OrdersListViewModel

    init(repo: OrderRepository, branchId: String?) {
        self.repo = repo
        _vm = State(initialValue: OrdersListViewModel(repo: repo, branchId: branchId))
    }

    var body: some View {
        NavigationStack {
            List(vm.orders) { order in
                NavigationLink(value: order.id) {
                    HStack {
                        VStack(alignment: .leading, spacing: Spacing.xs) {
                            Text(order.orderNumber).font(.headline)
                            Text(order.source.label).font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                        VStack(alignment: .trailing, spacing: Spacing.xs) {
                            Text(money(order.totalCents, order.currency)).font(.subheadline.weight(.semibold))
                            StatusBadge(text: order.status.label, color: color(order.status))
                        }
                    }
                }
            }
            .navigationTitle("Orders")
            .refreshable { await vm.refresh() }
            .navigationDestination(for: String.self) { id in
                OrderDetailView(repo: repo, orderId: id)
            }
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Menu("Filter") {
                        Button("All") { vm.statusFilter = nil; vm.reload() }
                        ForEach(OrderStatus.allCases, id: \.self) { s in
                            Button(s.label) { vm.statusFilter = s; vm.reload() }
                        }
                    }
                }
            }
            .task { await vm.refresh() }
        }
    }

    private func color(_ s: OrderStatus) -> Color {
        s == .cancelled ? Brand.danger : (s.isTerminal ? Brand.success : Brand.secondary)
    }
    private func money(_ cents: Int, _ ccy: String) -> String {
        String(format: "%@ %.2f", ccy, Double(cents) / 100)
    }
}
```

- [ ] **Step 6: Build** — `xcodegen generate && xcodebuild ... build`. Expected: BUILD SUCCEEDED.

- [ ] **Step 7: Commit**

```bash
cd ios && git add Sources/Features/Orders/OrdersListViewModel.swift Sources/Features/Orders/OrdersListView.swift Tests/OrdersListViewModelTests.swift
git commit -m "feat(ios): orders list view-model + view with status filter and pull-to-refresh"
```

---

### Task 8: Order detail view-model + view (transitions, cancel, payment display)

**Files:**
- Create: `ios/Sources/Features/Orders/OrderDetailViewModel.swift`
- Create: `ios/Sources/Features/Orders/OrderDetailView.swift`
- Test: `ios/Tests/OrderDetailViewModelTests.swift`

- [ ] **Step 1: Write failing test for available actions + cancel-reason gating**

```swift
import Foundation
import SwiftData
import Testing
@testable import ChefLogik

@MainActor
struct OrderDetailViewModelTests {
    private func vm(status: OrderStatus) throws -> OrderDetailViewModel {
        let c = try OfflineStore.makeContainer(inMemory: true)
        let repo = OrderRepository(context: c.mainContext, api: APIClient(),
            outbox: OutboxRepository(context: c.mainContext))
        repo.upsert([OrderDTO(id: "o1", orderNumber: "A", branchId: "b1", source: .dineInPos, status: status,
            paymentStatus: .pending, paymentMethod: nil, subtotalCents: 100, totalCents: 100, currency: "EUR",
            customerName: nil, allergenNote: nil, items: [], statusHistory: nil, updatedAt: "t")])
        return OrderDetailViewModel(repo: repo, orderId: "o1")
    }

    @Test func nextActionsFollowStateMachine() throws {
        let v = try vm(status: .ready)
        #expect(v.availableTransitions.map(\.status) == [.served, .outForDelivery])
    }

    @Test func transitionUpdatesOptimistically() throws {
        let v = try vm(status: .new)
        v.transition(to: .confirmed)
        #expect(v.order?.status == .confirmed)
    }
}
```

- [ ] **Step 2: Run, verify fail.**

- [ ] **Step 3: Implement the view-model**

```swift
import Foundation
import Observation

@MainActor
@Observable
final class OrderDetailViewModel {
    private let repo: OrderRepository
    let orderId: String
    private(set) var order: OrderDTO?

    init(repo: OrderRepository, orderId: String) {
        self.repo = repo; self.orderId = orderId
        order = repo.order(id: orderId)
    }

    var availableTransitions: [OrderStatus.Transition] { order?.status.nextTransitions ?? [] }
    var canCancel: Bool { !(order?.status.isTerminal ?? true) }

    func transition(to status: OrderStatus) {
        repo.queueTransition(orderId: orderId, to: status, notes: nil)
        order = repo.order(id: orderId)
    }

    func cancel(reason: CancelReasonCode, note: String?) {
        repo.queueCancel(orderId: orderId, reason: reason, note: note)
        // local status stays until the server confirms (cancel is not optimistically applied)
    }

    func reload() { order = repo.order(id: orderId) }
}
```

- [ ] **Step 4: Run, verify pass.**

- [ ] **Step 5: Implement the view**

Create `Sources/Features/Orders/OrderDetailView.swift`: sections for items (name × qty, modifiers, note), totals (subtotal/total), payment (status + method + refund display), status history, transition buttons (`PrimaryButton` per `availableTransitions`, each gated on the relevant `orders.*` slug via `session.can`), and a cancel flow (confirmation dialog with `CancelReasonCode.allCases`; selecting `out_of_stock` shows an inline note that it requires manual confirmation when offline). Payment/refund are display-only this wave. Resolve order from `vm.order`.

- [ ] **Step 6: Build** — BUILD SUCCEEDED.

- [ ] **Step 7: Commit**

```bash
cd ios && git add Sources/Features/Orders/OrderDetailViewModel.swift Sources/Features/Orders/OrderDetailView.swift Tests/OrderDetailViewModelTests.swift
git commit -m "feat(ios): order detail — state-machine transitions, cancel reasons, payment display"
```

---

### Task 9: New order (thin picker)

**Files:**
- Create: `ios/Sources/Features/Orders/NewOrderViewModel.swift`
- Create: `ios/Sources/Features/Orders/NewOrderView.swift`
- Test: `ios/Tests/NewOrderViewModelTests.swift`

- [ ] **Step 1: Define a minimal menu-item DTO + read from the `menu_items` `/sync` cache.**

Add to `OrderModels.swift` (or a `MenuPickModels.swift`): a `MenuPickItem` DTO (`id`, `name`, `price_cents`, `is_available`) decoded from `/sync/menu_items` rows. For the gate, the New Order screen fetches `SyncService.page<MenuPickItem>(resource: "menu_items", ...)` once on appear (no separate Menu entity/cache — that's Wave 4) and holds the list in the view-model.

> Confirm the `menu_items` `/sync` row shape against `api` `MenuItemResource` / the SyncController serialization; adjust `MenuPickItem` keys to match.

- [ ] **Step 2: Write failing test for cart total + payload build**

```swift
import Foundation
import Testing
@testable import ChefLogik

@MainActor
struct NewOrderViewModelTests {
    @Test func buildsCreateItemsFromCart() {
        let vm = NewOrderViewModel(repo: nil, branchId: "b1", source: .takeawayCounter)
        vm.add(MenuPickItem(id: "m1", name: "Soup", priceCents: 600, isAvailable: true))
        vm.add(MenuPickItem(id: "m1", name: "Soup", priceCents: 600, isAvailable: true))
        vm.add(MenuPickItem(id: "m2", name: "Bread", priceCents: 200, isAvailable: true))
        #expect(vm.totalCents == 1400)
        let items = vm.buildItems()
        #expect(items.first(where: { $0.menuItemId == "m1" })?.quantity == 2)
    }
}
```

- [ ] **Step 3: Run, verify fail.**

- [ ] **Step 4: Implement the view-model** (`add`, `remove`, `qty` map, `totalCents`, `buildItems()`, `submit()` calling `repo.create(...)`; `repo` optional so the cart logic is testable without a live API).

- [ ] **Step 5: Run, verify pass.**

- [ ] **Step 6: Implement the view** — searchable list of available `MenuPickItem`s, tap to add, a cart summary with qty steppers + free-text note per line, source picker (`OrderSource.allCases`), and a Create button (`PrimaryButton`, `isLoading` during submit). Gate on `session.can("orders.create")` (confirm slug).

- [ ] **Step 7: Build** — BUILD SUCCEEDED.

- [ ] **Step 8: Commit**

```bash
cd ios && git add Sources/Features/Orders/NewOrder*.swift Sources/Features/Orders/OrderModels.swift Tests/NewOrderViewModelTests.swift
git commit -m "feat(ios): new-order thin picker over menu_items sync cache (online create)"
```

---

## Phase C — Notifications

### Task 10: Notification models + entity + repository

**Files:**
- Create: `ios/Sources/Features/Notifications/NotificationModels.swift`
- Create: `ios/Sources/Features/Notifications/NotificationEntity.swift`
- Create: `ios/Sources/Features/Notifications/NotificationRepository.swift`
- Modify: `ios/Sources/Core/Offline/Outbox.swift` (add `NotificationEntity.self`)
- Test: `ios/Tests/NotificationРepositoryTests.swift`

- [ ] **Step 1: Write failing tests (decode + unread count + mark-read local)**

```swift
import Foundation
import SwiftData
import Testing
@testable import ChefLogik

struct NotificationDecodingTests {
    @Test func decodesNotification() throws {
        let json = """
        {"id":"n1","type":"order.status_changed","title":"Order ready","body":"A-1001 is ready",
         "data":{"order_id":"o1"},"read_at":null,"created_at":"2026-06-17T10:00:00Z"}
        """
        let n = try JSONDecoder().decode(NotificationDTO.self, from: Data(json.utf8))
        #expect(n.id == "n1")
        #expect(n.orderId == "o1")
        #expect(n.isRead == false)
    }
}

@MainActor
struct NotificationRepositoryTests {
    private func makeRepo() throws -> (NotificationRepository, ModelContext) {
        let c = try OfflineStore.makeContainer(inMemory: true)
        return (NotificationRepository(context: c.mainContext, api: APIClient()), c.mainContext)
    }
    @Test func unreadCountCountsUnread() throws {
        let (repo, _) = try makeRepo()
        repo.upsert([
            NotificationDTO(id: "n1", type: "t", title: "a", body: "b", data: ["order_id": "o1"], readAt: nil, createdAt: "t1"),
            NotificationDTO(id: "n2", type: "t", title: "a", body: "b", data: nil, readAt: "2026-06-17T11:00:00Z", createdAt: "t2"),
        ])
        #expect(repo.unreadCount() == 1)
    }
    @Test func markReadLocallyFlipsState() throws {
        let (repo, _) = try makeRepo()
        repo.upsert([NotificationDTO(id: "n1", type: "t", title: "a", body: "b", data: nil, readAt: nil, createdAt: "t1")])
        repo.markReadLocally("n1")
        #expect(repo.unreadCount() == 0)
    }
}
```

- [ ] **Step 2: Run, verify fail.**

- [ ] **Step 3: Implement models + entity + repository.**

`NotificationDTO` (`id`, `type`, `title`, `body`, `data: [String:String]?` with an `orderId` convenience reading `data["order_id"]`, `readAt`, `createdAt`; `isRead` = `readAt != nil`). `NotificationEntity` `@Model` (mirror `OrderEntity`: unique `id`, `readAt`, `createdAt`, `payload`). `NotificationRepository`: `upsert`, `applyDeletes`, `unreadCount()`, `list()`, `markReadLocally(_:)`, `refresh()` (delta `/sync` resource `notifications`), `markRead(id:)` (`PATCH /notifications/{id}/read` + local flip), `markAllRead()` (`POST /notifications/mark-all-read` + local flip all), `subscribe(userId:)` (Pusher `user.{uid}.notifications` → upsert + refresh). Register `NotificationEntity.self` in `OfflineStore.makeContainer`.

> Confirm notification JSON keys + the broadcast event/payload against `api` `NotificationResource` + `web/src/websocket/notificationChannel.ts` and `web/src/types/notifications.ts`.

- [ ] **Step 4: Run, verify pass.**

- [ ] **Step 5: Commit**

```bash
cd ios && git add Sources/Features/Notifications/Notification*.swift Sources/Core/Offline/Outbox.swift Tests/Notification*Tests.swift
git commit -m "feat(ios): notification models/entity/repository — sync, unread count, mark-read"
```

---

### Task 11: Notifications view + unread badge

**Files:**
- Create: `ios/Sources/Features/Notifications/NotificationsViewModel.swift`
- Create: `ios/Sources/Features/Notifications/NotificationsView.swift`

- [ ] **Step 1: Implement the view-model** (`@Observable`: `items`, `unreadCount`, `refresh()`, `markRead(id:)`, `markAllRead()`, `reload()`).

- [ ] **Step 2: Implement the view** — `List` of notifications (title, body, relative time, unread dot), swipe/tap → `markRead`, a "Mark all read" toolbar button, `.refreshable`, and `.task { await vm.refresh() }`. Tapping a notification with an `orderId` navigates to `OrderDetailView` (shared navigation — see Task 12).

- [ ] **Step 3: Build** — BUILD SUCCEEDED.

- [ ] **Step 4: Commit**

```bash
cd ios && git add Sources/Features/Notifications/NotificationsView*.swift
git commit -m "feat(ios): notifications list + unread badge + mark-all-read"
```

---

## Phase D — Routing, push deep-link, real-time activation

### Task 12: RootTabView — real tabs, unread badge, deep-link target

**Files:**
- Modify: `ios/Sources/Features/Root/RootTabView.swift`

- [ ] **Step 1: Replace the Orders placeholder tab** with `OrdersListView(repo: orders, branchId: session.currentBranchId)` gated on `session.can("orders.view")`. Add a Notifications tab gated on presence of the notifications repo, showing `.badge(notificationsVM.unreadCount)`.
- [ ] **Step 2: Add a shared deep-link route** — hold a `@State var deepLinkOrderId: String?`; when set, push `OrderDetailView`. Expose a method the push layer can call (Task 13).
- [ ] **Step 3: Resolve `orders`/`notifications` repos** from the environment (injected in Task 3).
- [ ] **Step 4: Build + on-simulator smoke** — `xcodebuild ... build`, then launch on the iPhone 17 sim, sign in against staging, confirm the Orders list loads and the Notifications tab shows a badge. Screenshot both.
- [ ] **Step 5: Commit**

```bash
cd ios && git add Sources/Features/Root/RootTabView.swift
git commit -m "feat(ios): real Orders + Notifications tabs with unread badge and deep-link target"
```

---

### Task 13: Push tap → deep-link into order detail

**Files:**
- Modify: `ios/Sources/Core/Push/PushBridge.swift`
- Modify: `ios/Sources/App/AppDelegate.swift` (UNUserNotificationCenter delegate tap handling, if not already present)
- Modify: `ios/Sources/Features/Root/RootTabView.swift` (consume the routing intent)

- [ ] **Step 1: Read `PushBridge.swift` + `AppDelegate.swift`** to see the current APNs token path. Add a tap handler: on `userNotificationCenter(_:didReceive:)`, read `response.notification.request.content.userInfo["order_id"]` (the FCM/APNs `data` payload set by `SendPushNotificationJob`) and publish it through a `@MainActor` observable routing intent on `PushBridge` (e.g. `var pendingOrderId: String?`).
- [ ] **Step 2: Consume the intent** in `RootTabView` via `.onChange(of: pushBridge.pendingOrderId)` → select the Orders tab and set `deepLinkOrderId`. If the order isn't cached, `OrderDetailView` already loads it from the repo; add an on-demand `GET /orders/{id}` fallback to `OrderRepository` (method `fetch(id:)`) and call it from `OrderDetailViewModel.init`/`.task` when `order == nil`.
- [ ] **Step 3: Build** — BUILD SUCCEEDED.
- [ ] **Step 4: Verify** the tap path with a simulator push payload:

```bash
cd ios && xcrun simctl push booted com.cheflogik.staff /tmp/push.json
```
where `/tmp/push.json` is `{"aps":{"alert":{"title":"Order ready","body":"A-1001"}},"order_id":"<a real cached order id>"}`. Expected: tapping the banner opens that order's detail. Screenshot.

- [ ] **Step 5: Commit**

```bash
cd ios && git add Sources/Core/Push/PushBridge.swift Sources/App/AppDelegate.swift Sources/Features/Root/RootTabView.swift Sources/Features/Orders/OrderRepository.swift Sources/Features/Orders/OrderDetailViewModel.swift
git commit -m "feat(ios): push tap deep-links into order detail (with on-demand fetch fallback)"
```

---

### Task 14: Activate real-time on session + branch

**Files:**
- Modify: `ios/Sources/Features/Root/RootTabView.swift` (or a session-scoped `.task`)
- Modify: `ios/Sources/Features/Orders/OrderRepository.swift` / `NotificationRepository.swift` (already have `subscribe`)

- [ ] **Step 1: On entering the signed-in shell**, call `await orders.subscribe(tenantId:branchId:)` and `await notifications.subscribe(userId:)` using `session.tenantId` / `session.currentBranchId` / `session.userId`. Re-subscribe orders on branch change (`.onChange(of: session.currentBranchId)` → `unsubscribe` old channel, `subscribe` new). `SessionStore` already connected the Pusher socket on login (Task 3).
- [ ] **Step 2: Verify live update end-to-end:** on the simulator (signed in), change an order's status from `/web` for the same branch → the native list/detail updates within ~1–2s without a manual refresh; create a notification → the tab badge increments. Screenshot before/after.
- [ ] **Step 3: Commit**

```bash
cd ios && git add Sources/Features/Root/RootTabView.swift Sources/Features/Orders/OrderRepository.swift Sources/Features/Notifications/NotificationRepository.swift
git commit -m "feat(ios): subscribe orders+notifications channels on session; re-subscribe on branch switch"
```

---

## Phase E — Decisions, memory, gate verification

### Task 15: Record the Decision 50 amendment + update memory

**Files:**
- Modify: `decisions.md`
- Modify: `~/.claude/projects/-Users-deepak-Projects-ChefLogik-web/memory/native-mobile-apps-program.md` + `MEMORY.md`

- [ ] **Step 1: Amend Decision 50** in `decisions.md` — add a dated note: W2 gate is **Orders + Notifications** (KDS removed from native apps entirely; the 30s allergen-ack rule is KDS-only and stays web-only). Record Pusher client libs (PusherSwift / pusher-java-client), offline-queueable writes = status transition + cancel only, new-order = thin picker, outbox 4xx-drop refinement.
- [ ] **Step 2: Update the program memory file** with iOS Wave 2 status as tasks land (repositories, Pusher client, screens), and the MEMORY.md pointer if needed.
- [ ] **Step 3: Commit** (docs repo, on a branch):

```bash
cd /Users/deepak/Projects/ChefLogik && git add decisions.md
git commit -m "docs(decision-50): amend W2 gate to Orders+Notifications; KDS removed from native apps"
```

---

### Task 16: Full gate verification

**Files:** none (verification only)

- [ ] **Step 1: Full test suite green**

Run: `cd ios && xcodegen generate && xcodebuild -scheme ChefLogik -destination 'platform=iOS Simulator,name=iPhone 17' test`
Expected: all tests pass (existing 12 + the new Order/Notification/Replayer suites).

- [ ] **Step 2: Walk the gate checklist on the simulator against staging** and screenshot each:
  - Orders list loads (filter by branch/status/source); order detail shows items/totals/payment/history.
  - A status transition + a cancel succeed online; the order reflects the new state.
  - Create a thin-picker order online.
  - Airplane mode: cached orders + notifications still read; queue a status transition + a normal cancel → restore connectivity → outbox replays (order updates server-side); queue an `out_of_stock` cancel → confirm it is NOT auto-replayed (stays pending manual confirm).
  - Push tap deep-links to the right order.
  - Live: `/web` status change + new notification reflect on device without manual refresh.
  - A role lacking `orders.view` does not see the Orders tab (permission parity).
- [ ] **Step 3: PushNotification** to the user summarizing pass/fail per checklist item; do NOT claim done unless every item passed (verification-before-completion).

---

## Self-review notes (author)

- **Spec coverage:** every §1 matrix row maps to a task — list/filter (T7), detail (T8), online mutations (T8/T9), offline outbox + idempotent replay (T1/T6), `/sync` cache (T6/T10), real-time (T2/T14), push deep-link (T13), permission gating (T7/T8/T9/T12), food-safety carve-out (T6 `queueCancel` + T1 drop semantics). ✔
- **Type consistency:** `OrderRepository.queueTransition/queueCancel/create/refresh/upsert/applyDeletes/order(id:)/orders(...)/subscribe` are referenced consistently across T7/T8/T9/T12/T14. `Replaying.replay` matches `APIClient.replay`. `OrderStatus.nextTransitions` used in T4/T8. ✔
- **Known follow-ups flagged inline (must verify against `/api` during implementation, NOT placeholders):** exact JSON keys in `OrderResource`/`MenuItemResource`/`NotificationResource`; broadcast event names + payload envelopes; `orders.create` slug. These are contract confirmations against the live API, not unwritten code.
- **Android mirror** is a separate plan, written after this iOS slice is solid (spec §7, iOS-first pattern).
