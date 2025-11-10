# Student Portal Design Specification — High-Level Plan

Date: 2025-11-02

This document captures the high-level design plan and implementation roadmap for the Student Portal / Mobile application as requested. It reflects the refined and compartmentalized requirements and a developer-ready plan for moving forward.

## One-sentence summary
Produce a developer-ready specification and phased implementation roadmap covering recommendations, academic progress, recent activity, housing, health services, transport (Kenyan matatu model), and the student marketplace — with real-time, responsive, and accessible UI patterns.

## Contract (inputs / outputs / success criteria)
- Inputs: requirements provided by stake-holder, existing stack constraints (Next.js + Prisma + TS), auth model (JWT/session), and optional third-party providers.
- Outputs: annotated wireframes, API contracts (OpenAPI-style), data models, real-time architecture, component inventory, accessibility checklist, tests and phased implementation plan.
- Success criteria: the spec is detailed enough for frontend and backend teams to implement without major follow-ups and includes edge cases, test cases, and real-time channel design.

---

## High-level deliverables (mapped to your numbered sections)

1) Recommendations & Academic Progress
- "Explore" hub wireframe: grouped, filterable, and personalized recommendations (courses, events, resources) with AI rationale snippets and actions: Save, Enroll, View Details.
- Academic Progress detail page: timeline, module completion, grade breakdown, predicted completion, assignments & badges, and real-time updates for grade changes or submissions.
- Example APIs: `GET /recommendations?userId=...`, `GET /recommendations/{id}`, `GET /courses/{id}/progress`.
- Realtime channel: `user:<id>:recommendations-updates`.

2) User Engagement & Information Flow
- Recent Activity tab: reverse-chronological feed with contextual actions linking to courses, events, messages. Real-time streaming of new activity items.
- Account Settings & Notifications: full settings page and notifications center with mark-read and bulk actions.
- Example APIs: `GET /users/{id}/settings`, `PUT /users/{id}/settings`, `GET /users/{id}/notifications`, `POST /notifications/mark-read`.
- Realtime channel: `user:<id>:notifications`.

3) Housing & Health Services
- Housing listing cards with a dynamic "View Details" button redirecting to `/housing/{id}`, contact agent/landlord flows (contact modal/form, click-to-call), image gallery, location map, and real-time availability tag.
- Health Services: services listing with "Book Appointment" and per-service "Book Now" actions. Upcoming appointments with Reschedule and Cancel.
- Example APIs: `GET /housing`, `GET /housing/{id}`, `POST /housing/{id}/contact`, `GET /health/appointments`, `POST /health/appointments`.
- Realtime channels: `housing:<listingId>:availability`, `user:<id>:appointments`.

4) Transportation (Kenyan Matatu model)
- Route-and-stop-first design: show routes and stops, not fixed vehicle IDs. Provide live route status, next departures from stops, and live locations when available.
- Flexible schedule UI: "Currently Nearby", "Next from Stop", and route-level live status indicators.
- APIs: `GET /transport/routes`, `GET /transport/routes/{id}/stops`, `GET /transport/routes/{id}/status`.
- Realtime channels: `transport:route:<id>:positions`, `transport:stop:<id>:departures`.

5) Marketplace
- Listing cards with a dynamic "View Deal" redirect to `/marketplace/{id}` including seller info, safe contact flows, images and condition tags.
- Filter bar supporting category, price, condition, campus pickup, and search.
- APIs: `GET /marketplace`, `GET /marketplace/{id}`, `POST /marketplace/{id}/inquire`.
- Optional realtime: `marketplace:<id>:status` for availability/offer updates.

---

## Data model highlights (examples)
- User: `{ id, name, email, role, preferences, contactVerified }`
- Recommendation: `{ id, userId, type, score, reasonText, createdAt, metadata }`
- CourseProgress: `{ courseId, userId, modules: [{id, completed, grade}], overallPercent, predictedCompletion }`
- HousingListing: `{ id, title, price, status, landlordContact, images, location }`
- Appointment: `{ id, userId, serviceId, time, status }`
- Route: `{ id, name, stops: [{id, name, coords}], approxFrequency, status }`

Full OpenAPI/JSON-schema will be created in the next step when approved.

---

## Real-time architecture options & recommendation
Options:
- WebSockets (Socket.IO or raw WebSocket), SSE (Server-Sent Events), or managed pub/sub (Pusher, Supabase Realtime, Ably, Firebase).
Recommendation:
- Use a managed pub/sub provider (e.g., Supabase Realtime or Pusher) for quick wins and scalability; provide SSE fallback for lower-complexity endpoints.
- Channel examples: `user:<userId>:notifications`, `housing:<listingId>:availability`, `transport:route:<id>:positions`, `appointments:<userId>`.
- Security: JWT-authenticated channel joins, server-side subscription validation, fine-grained event authorization, and rate limiting.

---

## UI components & design system
Reusable components:
- Card (listing, marketplace, course)
- Dialog / Modal (confirmations, contact forms)
- Tag / Status pill (availability, booking status)
- Table / List / Timeline components
- Buttons: Primary, Secondary, Destructive, Contextual
- Inputs: Search, Filters, Range sliders, Date/time pickers
- ActivityItem (for Recent Activity feed)

Accessibility/Design tokens:
- Breakpoints: mobile-first with explicit phone/tablet/desktop rules
- A11y: keyboard focus, aria-labels, color contrast >= AA, focus-visible outlines

---

## UX flows & key interaction details
- "View Details" redirects open detail pages in new route and support deep-linking.
- Booking flows: confirmation modal, optimistic UI update, server finalization, rollback on error.
- Housing contact: protected contact details until verification; contact log created server-side.
- Matatu ETA fallback: when no live data, show estimated next departures with confidence indicators.
- Offline/slow networks: queue user actions (bookings, messages) with retry & clear error messaging.

Edge cases covered: missing data, conflicting updates (versioning), rate-limit considerations, privacy for contact info.

---

## Testing strategy
- Unit tests for utilities and components (Jest/Testing Library)
- Integration tests for API endpoints (supertest or similar)
- E2E tests for primary flows (Playwright/Cypress)
- Realtime tests: event simulation and UI reaction assertions
- Performance testing for frequent realtime updates (transport and notifications)

---

## Phased implementation (MVP → phases)
MVP (Phase 1, ~2-3 weeks):
- Explore hub (read-only recommendations)
- Academic Progress page (basic progress and modules)
- Recent Activity feed (polling or SSE)
- Account Settings
- Marketplace list + filter + View Deal

Phase 2 (3-4 weeks):
- Housing details + contact flow
- Health Services basic booking
- Notifications center + realtime notifications

Phase 3 (3-4 weeks):
- Transport routes & live statuses (map + stops)
- Real-time availability tags and appointment reschedule/cancel flows

Phase 4: polishing, analytics, localization and repeated user testing

Estimates are rough and depend on backend availability and team size.

---

## Implementation artifacts to produce on approval
- OpenAPI spec for all APIs
- JSON-schema for core models
- Annotated wireframes (mobile + desktop)
- Component library spec with accessibility notes
- Realtime channel map and server/client snippets
- Example tests (unit and E2E)
- Phased task list with estimates and branch names

---

## Files likely to change in the repo
- Frontend pages: `src/app/explore/page.tsx`, `src/app/courses/[id]/progress/page.tsx`, etc.
- Components: `src/components/*` (cards, dialogs, tables)
- Server routes/APIs: `src/app/api/*` route files
- Lib: `src/lib/*` for models and realtime utilities
- Contexts/hooks: `src/contexts/*` for `useRealtime`, `useNotifications`

---

## Edge-case checklist (short)
- Missing/partial data: show placeholders and inline explanations
- Conflicting updates: use versioning or last-write-with-confirmation
- Rate limiting/spam for contact/booking flows
- Privacy-sensitive fields masked until verification
- Map/geo fallbacks when coordinates missing

---

## Next steps (pick one)
- A: Expand item #3 (Data models & API contracts) into a full OpenAPI + sample payloads.
- B: Produce annotated wireframes + component inventory for the Explore hub + Academic Progress.
- C: Draft realtime channel map with exact event payloads and sample server + client snippets (pick provider).
- D: Create an MVP implementation plan with task-level estimates and PR checklist.

Please reply with which next step you want me to expand (A/B/C/D) or any edits to this document.

---

*Saved from the interactive design session.*
