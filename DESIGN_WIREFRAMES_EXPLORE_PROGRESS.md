# Explore Hub & Academic Progress — Wireframes and Component Inventory

Date: 2025-11-02

Scope: low-fidelity annotated wireframes (mobile + desktop) and a developer-ready component inventory for:
- Explore (AI-powered Recommendations) hub — destination of the `Explore` button
- Academic Progress detail page — destination of `View Details` from courses list

This is step B from the plan. It focuses on designs that are dynamic, responsive and ready for realtime updates.

---

## Assumptions
- Auth exists (JWT/session). Endpoints include a `userId` context.
- Backend supports the OpenAPI endpoints in `openapi/student_portal.{yaml,json}` created earlier.
- Realtime will be added later; wireframes include realtime-aware elements (live badges, availability tags, activity feed entries).
- Primary platform is web (Next.js). Mobile-first responsive breakpoints will be provided.

---

## Breakpoints (mobile-first)
- xs / phone: 0–639px
- sm / tablet: 640–1023px
- md / small desktop: 1024–1279px
- lg / desktop: 1280px+

Design tokens (examples):
- spacing unit: 8px
- border-radius: 8px
- color-primary: #0f172a (indigo-900)
- color-accent: #06b6d4 (cyan-500)

---

## Explore Hub — Purpose & Contract
Purpose: central hub listing all individualized recommendations (courses, events, resources, marketplace items) with filters, grouping, AI rationale snippets, and actions (Save, Enroll, View Details).

Contract (data): each card consumes `Recommendation` schema from `openapi/student_portal`.

Primary interactions:
- Tap `Explore` → route `/explore`
- Filter by type / score / category
- `View Details` navigates to resource detail (e.g., course detail or event page)
- `Save` adds to user's saved list (optimistic UI)
- `Enroll` for course recommendations (opens enroll modal)


### Desktop wireframe (low-fidelity)

Header: [Logo] [Search bar wide] [Nav: Explore | Courses | Learning | Housing | Marketplace | Transport | Notifications (bell)] [Profile avatar]

Left rail (200–260px): Filters
- Type (checkboxes): Courses | Events | Resources | Marketplace
- Sort: Relevance | New | High score
- Tags / Categories

Main content (two-column responsive grid):
- Top: Hero area — "Recommendations for you" with `Explain` toggle (shows AI rationale highlights)
- Grid: Recommendation cards (3 columns at lg, 2 at md, 1 at sm)
  Card fields:
  - Type tag (Course/Event/Resource)
  - Title
  - Short description / AI reason snippet (truncate)
  - Score (0.0–1.0) + small sparkline optional
  - Actions: [Save] [Enroll/View Details] (primary)
  - Realtime badge: small dot if "new"

Right rail (optional): Quick actions / Saved items / Upcoming enrollments

Footer

Annotations (desktop):
- Cards load progressively; skeleton loaders used while fetching.
- Filters update results via debounced queries; for realtime recommendations, a small "new recommendations available" toast appears when server pushes updates.
- Accessibility: each card is keyboard focusable, actions have aria-labels (e.g., "Save recommendation for Data Science 101").


### Mobile wireframe (low-fidelity)

Top: [Hamburger] [Logo] [Search icon] [Profile avatar]

Page body:
- Hero: "Recommended for you" (compact)
- Horizontal filter strip (chips): All | Courses | Events | Resources | Marketplace
- Vertical list: Recommendation cards (1 column)
  Card layout:
  - Row 1: Type tag, Title, Score
  - Row 2: AI reason snippet (single line)
  - Row 3: Buttons: [Save] [Enroll/View Details]

Bottom nav: Home | Explore (active) | Learning | Marketplace | Profile

Annotations (mobile):
- Cards are tappable; long press opens context menu (save/share)
- Use bottom-sheet modal for `Enroll` confirmation to preserve context


### States and edge cases (Explore hub)
- Empty state: friendly illustration + CTA "Take the interest quiz" or "Browse catalog"
- Error state: inline banner with retry button
- Partial data: placeholder text in cards
- Large result sets: paginated or infinite scroll; recommend paginated cursor-based API


---

## Academic Progress Page — Purpose & Contract
Purpose: detailed, real-time view of a student's progress in a course. Accessed via `View Details` from the courses list. Uses `CourseProgress` schema.

Primary interactions:
- View module completion statuses, grades, predicted completion, upcoming assignments, achievements/badges, and options to message instructor or view resources.
- Realtime: new grade posted, assignment submission status updates, or peer feedback appear live.


### Desktop wireframe (low-fidelity)

Header: same global header

Top banner: Course title, instructor, overall percent (circular progress), `View Transcript` `Message Instructor` buttons

Two-column layout:
- Left (main, 60%):
  - Timeline / Module list (vertical): each module card contains title, completion status, grade, key assignments with due dates, and quick links to resources
  - Assignments table: name, due date, status, grade
- Right (40%):
  - Quick stats: hours spent, last active, predicted completion date
  - Badges / achievements (scrollable)
  - Course actions: Enroll/Drop (if allowed), Request extension

Annotations:
- Module completion uses progress bars and checkmarks. Clicking a module opens module detail in a side-drawer.
- Grades update via realtime channel `user:<id>:courses:<courseId>:grades` (subscribe only when on page)
- Predicted completion computed client-side from server-provided model; show confidence band and last-updated timestamp.


### Mobile wireframe (low-fidelity)

Top: Course title + small progress ring

Body (vertical):
- Overview card: overall percent + predicted completion + action buttons
- Modules: collapsible list of modules
- Assignments: list with status pills and action buttons
- Badges stacked horizontally scrollable

Annotations (mobile):
- Use sticky CTA for `Message Instructor` and `View Resources` at the bottom as floating actions
- When offline, allow viewing cached progress; show offline badge and disable actions that require network


### States and edge cases (Progress page)
- Missing grades: show "Not Graded" with ETA if available
- Conflicting updates: version the course progress payload and reconcile on client with server's authoritative version; surface conflict if local edits (e.g., manual completion) occur.
- Very large course (many modules): allow module search and collapse all.


---

## Component Inventory (for Explore + Progress)
Each component entry includes purpose, props (data contract), accessibility notes, and interaction behavior.

1) RecommendationCard
- Purpose: show a single recommendation in Explore hub.
- Props:
  - id, type, title, shortDescription, score, createdAt, metadata
- Actions: onSave(), onPrimaryAction() (Enroll / View Details), onShare()
- Accessibility: role="article", aria-labelledby -> title id; primary action has aria-label
- States: loading, error, newBadge

2) FilterPanel (left rail)
- Purpose: filter and sort recommendations
- Props: selectedFilters, onChange
- Accessibility: all inputs labeled; keyboard navigable; chips are accessible buttons

3) ProgressRing
- Purpose: show overall percent
- Props: percent (0–100), size
- Accessibility: aria-valuenow, aria-valuemin, aria-valuemax, title text describing percent

4) ModuleList / ModuleItem
- Purpose: display modules with completion status
- Props: module {id,title,completed,grade,dueDate,resources[]}
- Interaction: expand/collapse, open resource
- Accessibility: ARIA tree or list with toggle buttons

5) AssignmentTableRow
- Purpose: row in assignments table
- Props: id, title, dueDate, status, grade, actions
- States: dueSoon highlight, overdue highlight

6) StatusTag
- Purpose: show availability/status (e.g., Available / Hold / Taken) or notification badges
- Props: text, color, live (boolean)
- Accessibility: visually hidden text for screen readers when color conveys info

7) ActionButton
- Purpose: standardized button (primary, secondary, destructive)
- Props: variant, disabled, loading, onClick, ariaLabel

8) SkeletonLoader
- Purpose: placeholder while data loads
- Usage: card lists, module lists, progress ring

9) Toast / NotificationCenter
- Purpose: show ephemeral messages and a link to full Notifications page
- Props: message, type (success/error/info), action

10) BottomSheet (mobile)
- Purpose: confirm enroll or booking actions; offers more details without full navigation
- Accessibility: focus trap, aria-modal

11) SideDrawer
- Purpose: show module or course resource details on desktop
- Accessibility: focus trap, keyboard close


---

## Interaction specs (focused)
- View Details (Explore -> resource): navigate to resource route and open analytics event `ui.recommendation.clicked` with context.
- Enroll (course): open enroll confirmation modal; on confirm, optimistically add to "My Courses" list and show toast; revert on server error.
- Save (recommendation): toggle saved state locally, sync to server; if offline, queue action and show queued state.
- Live updates: components that display time-sensitive data (status tags, grades, notifications) should accept an event handler `onRealtimeEvent(event)` to update local state.

Error handling:
- Failures show inline messages on the component, and global errors surface in top banner.
- For booking/enrollments, show a contextual retry button in the toast.

Security & privacy notes (for implementation):
- Contact flows must not leak phone/email unless the server marks the user verified and the listing owner consented.
- Rate-limit contact/inquiry endpoints to avoid spam.


---

## Developer Handoff checklist (for these pages)
- Link to API: `openapi/student_portal.yaml` and `openapi/student_portal.json` (already in repo)
- Provide component props and sample fixtures (we'll supply JSON fixtures next): RecommendationCard fixture, CourseProgress fixture
- Accessibility notes: provide aria labels, keyboard flow, and contrast tokens
- Realtime hooks: `useRealtime(channel, handler)` will be recommended — subscribe on mount and unsubscribe on unmount, with exponential backoff.


---

## Next small steps (for testing / iteration)
1. I'll produce JSON fixtures for RecommendationCard and CourseProgress so frontend devs can wire up components and run storybook-like tests.
2. Optionally, I can add simple React component stubs (TSX) inside `src/components/` to accelerate implementation — tell me if you want code scaffolding now.


---

Saved artifact: `DESIGN_WIREFRAMES_EXPLORE_PROGRESS.md` — review and tell me if you'd like JSON fixtures next (recommended) or for me to scaffold the actual components and pages.
