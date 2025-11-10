# Real-time Architecture & Channel Map

Date: 2025-11-02

Purpose: developer-ready real-time architecture design for the Student Portal. This file defines channel naming, event payloads, providers, security, fallbacks/scale, and short server/client snippets to implement subscriptions for notifications, housing availability, transport (matatu) routes, and appointments.

## Goals
- Real-time, low-latency updates for UI elements listed in the design (notifications, availability tags, transport statuses, recommendations, appointments, grades)
- Secure subscriptions so users only receive events they are authorized to see
- Scalable to many users (university scale) and frequent events (transport/notifications)
- Simple fallbacks (SSE/polling) where necessary

---

## Provider options & recommendation

Options:
- Managed pub/sub: Supabase Realtime, Pusher, Ably, Firebase (Realtime/Firestore)
  - Pros: easy to set up, built-in auth bindings, scaled infra
  - Cons: vendor cost, vendor lock-in
- Self-hosted WebSockets: Socket.IO / ws on Node / Deno
  - Pros: full control, no vendor lock-in
  - Cons: operational complexity, scaling requires Pub/Sub (Redis/Message Broker)
- SSE (Server-Sent Events): Unidirectional stream (server → client)
  - Pros: simple, works well for read-only streams
  - Cons: no bi-directional messaging, limited reconnection control in some old browsers

Recommendation (practical): Use a managed pub/sub (Supabase Realtime or Pusher) for MVP to accelerate delivery. Design server events and channel names to be provider-agnostic so switching providers remains feasible. Provide SSE fallback for pages with read-only streaming (e.g., Recent Activity) if avoiding third-party vendor is preferred.

---

## Channel naming conventions
Use colon-delimited hierarchical names. All channels/events should be authenticated; clients must present a short-lived auth token when subscribing.

- user:{userId}:notifications
  - Purpose: user-specific notifications (messages, system alerts)
- user:{userId}:recommendations
  - Purpose: personalized recommendation updates (new recs, rescoring)
- user:{userId}:appointments
  - Purpose: appointment created/updated/cancelled
- housing:{listingId}:availability
  - Purpose: availability changes for a given housing listing
- marketplace:{itemId}:status
  - Purpose: availability or price changes for a marketplace item
- transport:route:{routeId}:positions
  - Purpose: live vehicle positions/heartbeats for a route (matatu)
- transport:stop:{stopId}:departures
  - Purpose: next departures/ETAs for a stop
- course:{courseId}:grades
  - Purpose: grade posted/updated for course (should contain minimally identifying info and only for enrolled students)

Notes:
- Channels scoped to resource IDs reduce fanout and simplify authorization checks.
- For broadcast events (e.g., campus-wide alerts), use `broadcast:alerts` with server-side permission checks to write only.

---

## Event types & example payloads
Keep payloads compact. Include an `event` field (type) and a `data` object.

1) Notification event (user notifications)

Channel: user:{userId}:notifications
Example payload:
{
  "event": "notification.created",
  "data": {
    "id": "notif_123",
    "title": "Assignment graded",
    "message": "Your assignment 'Essay 1' has been graded.",
    "link": "/courses/abc/assignments/xyz",
    "createdAt": "2025-11-02T08:02:00Z",
    "meta": { "severity": "info" }
  }
}

2) Recommendation update
Channel: user:{userId}:recommendations
{
  "event": "recommendation.added",
  "data": { "id": "rec_456", "type": "course", "score": 0.92, "title": "Intro to ML", "reason": "Matches interest in AI" }
}

3) Housing availability
Channel: housing:{listingId}:availability
{
  "event": "housing.availability.changed",
  "data": { "listingId": "h_10", "status": "available", "updatedAt": "2025-11-02T07:45:00Z" }
}

4) Appointment event
Channel: user:{userId}:appointments
{
  "event": "appointment.updated",
  "data": { "id": "apt_1", "serviceId": "svc_5", "time": "2025-11-10T09:00:00Z", "status": "rescheduled" }
}

5) Transport route positions (high-frequency)
Channel: transport:route:{routeId}:positions
{
  "event": "vehicle.position",
  "data": { "vehicleId": "v_12", "coords": [ -1.2921, 36.8219 ], "speed": 28.2, "heading": 45, "timestamp": "2025-11-02T07:58:05Z" }
}

6) Transport stop departures
Channel: transport:stop:{stopId}:departures
{
  "event": "stop.departure",
  "data": { "stopId": "stop_9", "routeId": "r_3", "eta": "2025-11-02T08:05:00Z", "confidence": 0.7 }
}

7) Course grade posted
Channel: course:{courseId}:grades (server should only publish to channels for enrolled users or gate at subscriber)
{
  "event": "grade.posted",
  "data": { "courseId": "c_1", "userId": "user_123", "assignmentId": "a_5", "grade": "A-", "publishedAt": "2025-11-02T03:00:00Z" }
}

Security note: event payloads must avoid leaking PII. For example, `grade.posted` only contains `userId` when authorized; broadcasting course-level events should only include aggregates or route clients through server to filter per-user events.

---

## Authorization & authentication

- Use short-lived tokens for channel subscribe requests (JWT with limited TTL, or Supabase client JWT). Tokens signed server-side and including audience and channel scopes.
- When a client requests to subscribe to a channel, validate server-side that the user is allowed to subscribe (e.g., confirm enrollment before subscribing to `course:{courseId}:grades`).
- Avoid letting clients subscribe directly to channels by ID without server validation. If using Pusher or Supabase, use their auth hooks to validate subscription.

Example auth flow (generic):
1. Client requests to open Realtime connection and asks to subscribe to channels.
2. Server validates requested channels against the user's identity and returns an auth token or approves subscription.
3. Client subscribes with token; provider validates token signature and channel scopes.

---

## Scaling & performance considerations

- High-frequency channels (transport:route:{routeId}:positions) can produce many events per second. Strategies:
  - Reduce frequency: aggregate position updates server-side and publish every N seconds (e.g., 2-5s) for UI.
  - Use fanout pattern: publish positions to route channel and let subscribers filter by stop proximity client-side.
  - Shard route channels by routeId and attach only users who explicitly view the route (subscribe on page mount, unsubscribe on unmount).
- For wide-fanout events (broadcast campus alert), use provider broadcast endpoints to avoid heavy server work.
- Retain a small, recent event buffer server-side (or provider-side) for late-joining clients; publish a `state.snapshot` event at subscribe time with the latest relevant state.

---

## Fallback strategies
- SSE fallback: for read-only streams, provide an SSE endpoint (e.g., `/sse/user/:userId/notifications`) that the client can open; SSE reconnect built-in but less robust for high-frequency.
- Polling: for rarely-changing resources or where realtime is not critical, use short-interval polling (e.g., 15–30s).
- Snapshot on connect: when connecting to any channel, fetch current state via REST before subscribing to avoid missing events during reconnect window.

---

## Server-side snippet (Node.js + Express) — publish example
(Conceptual example; adapt to your stack and provider)

// pseudo-code
const publishHousingAvailability = async (listingId, status) => {
  const event = { event: 'housing.availability.changed', data: { listingId, status, updatedAt: new Date().toISOString() } };
  // If using Pusher
  // await pusher.trigger(`housing:${listingId}:availability`, 'housing.availability.changed', event.data);

  // If using Supabase Realtime with Postgres, insert to a table that triggers broadcast, or use server SDK
};

Notes: always validate the actor who triggers a publish and sanitize `data` to avoid leaking private fields.

---

## Client-side snippets (conceptual)

1) WebSocket generic subscribe/unsubscribe

const connect = () => {
  const ws = new WebSocket('wss://realtime.example.com?token=JWT_TOKEN');
  ws.onopen = () => {
    // subscribe to channels you need
    ws.send(JSON.stringify({ action: 'subscribe', channel: 'user:user_123:notifications' }));
  };
  ws.onmessage = (msg) => {
    const payload = JSON.parse(msg.data);
    handleRealtime(payload);
  };
  return ws;
};

2) Using Pusher (JS SDK)

const pusher = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER, authEndpoint: '/api/pusher/auth' });
const channel = pusher.subscribe('private-user_user_123_notifications');
channel.bind('notification.created', (data) => { /* update UI */ });

3) Supabase Realtime (JS)

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const subscription = supabase
  .channel('public:user_123_notifications')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.user_123` }, (payload) => {
    // handle notification
  })
  .subscribe();

Remember to unsubscribe on unmount:
subscription.unsubscribe();

---

## Client design recommendations
- Subscribe only to channels needed by the current page. Reconnect logic must be exponential backoff with jitter.
- On reconnect, fetch a REST snapshot of the latest state before processing live events to avoid gaps.
- Provide UI indicators for connection state: connected / reconnecting / offline.
- For high-frequency updates (transport positions), throttle UI updates to 1–2x per second to avoid excessive re-rendering.

---

## Security checklist
- Enforce server-side authorization for subscriptions.
- Use TLS (wss / https) for all connections.
- Limit token TTL for subscription tokens (e.g., 5–15 minutes).
- Sanitize event payloads — avoid including emails/phone numbers unless the subscriber is authorized and user consent exists.
- Rate-limit publish endpoints to prevent spam.

---

## Example channel usage patterns (UI)
- Notifications icon: subscribe to `user:{userId}:notifications` if logged-in; show badge count from REST snapshot and update live.
- Housing detail page: subscribe to `housing:{listingId}:availability` on page mount to update availability tag in real-time.
- Transport route page: subscribe to `transport:route:{routeId}:positions` when viewing a route; show vehicle markers as they arrive.
- Appointments page: subscribe to `user:{userId}:appointments` to update upcoming appointments list with reschedule/cancel actions.

---

## Deliverables in repo (next)
- This file: `DESIGN_REALTIME.md` (you have it now)
- Optionally: add `src/lib/realtime.ts` with a small `useRealtime` hook and provider adapters (Pusher/Supabase/WS) — I can scaffold this next.
- Tests: include a small test harness that simulates events and asserts UI updates in Storybook or Playwright.

---

If you'd like, I can:
- Scaffold `src/lib/realtime.ts` and a `useRealtime` React hook with providers adapters (Pusher and WebSocket) next.
- Add server example routes to publish events via a secure endpoint for testing (e.g., `POST /api/test/publish`).

Which would you prefer I do next: scaffold the client hook, or add test publish routes in the repo?