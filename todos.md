# Student Portal Implementation Plan (Next.js + SQLite)

## Phase 0: Core Infrastructure & Auth
*Objective: Set up the base environment, database connection, and role-based authentication.*

### Database & Schema
- [x] **Initialize Project:** Setup Next.js 14+ (App Router), install SQLite driver (better-sqlite3) and ORM (Prisma/Drizzle).
- [x] **Schema - Users:** Define `User` table with fields: `id`, `email`, `password_hash`, `role` (ENUM: 'STUDENT', 'ADMIN', 'FACULTY', 'LANDLORD'), `profile_data` (JSON).
- [x] **Schema - Sessions:** Define session management tables (if using NextAuth database adapter).

### API & Logic
- [x] **Auth Configuration:** Implement NextAuth.js/Auth.js with role-based middleware protection.
- [x] **User Endpoints:** Create `GET /api/user/me` to fetch current user context.

### UI / Client
- [x] **Layout:** Create root layout with conditional navigation bars based on User Role.
- [x] **Login/Register:** Create responsive authentication forms.

---

## Phase 1: Academic Progress & Recommendations (AI)
*Objective: Track student performance and suggest resources.*

### Database & Schema
- [ ] **Schema - Academics:** Create tables:
    - `Course` (id, code, title, lecturer_id).
    - `Enrollment` (student_id, course_id, status).
    - `Assignment` (course_id, total_marks).
    - `Grade` (enrollment_id, assignment_id, score_obtained).
    - `Attendance` (enrollment_id, date, status).
- [ ] **Schema - Recommendations:** Create `Recommendation` table (user_id, type, resource_link, reason, relevance_score).

### API & Logic
- [ ] **Faculty Logic:** Create endpoints for Faculty to input grades and attendance (`POST /api/faculty/grades`).
- [ ] **Progress Logic:** Create `GET /api/student/progress` to aggregate grades and calculate GPA/Completion % in real-time.
- [ ] **Recommendation Engine:** Implement a utility function that analyzes `Enrollment` history to seed the `Recommendation` table (Mock AI or OpenAI API integration).

### UI / Client
- [ ] **Course List:** Create component to list active courses.
- [ ] **Progress Details Page:** Create `/academics/progress/[courseId]` displaying charts (recharts/chart.js) of grades and attendance.
- [ ] **Explore Page:** Create `/academics/explore` rendering the recommendation feed.

---

## Phase 2: User Engagement & Notifications
*Objective: Centralized activity feed and settings.*

### Database & Schema
- [ ] **Schema - Activity:** Create `ActivityLog` table (user_id, action_type, reference_id, timestamp).
- [ ] **Schema - Notifications:** Create `Notification` table (user_id, message, is_read, type, link).

### API & Logic
- [ ] **Event Triggers:** Implement database hooks/middleware to insert into `ActivityLog` whenever a User creates a booking, submits an assignment, or posts a listing.
- [ ] **Notification Endpoint:** `GET /api/notifications` (polled every 30s) and `PATCH /api/notifications/[id]` (mark read).

### UI / Client
- [ ] **Recent Activity Tab:** Create a widget showing a chronological list of `ActivityLog` entries.
- [ ] **Account Settings:** Create dynamic forms to update `User.profile_data`.
- [ ] **Notification Center:** Create a dropdown/page for notifications with "Mark all read" functionality.

---

## Phase 3: Housing (Internal Hostels & External Marketplace)
*Objective: Dual-system for on-campus booking and off-campus listings.*

### Database & Schema
- [ ] **Schema - Internal:** Create `HostelBlock`, `HostelRoom` (capacity, current_occupancy), `RoomBooking` (student_id, room_id, semester).
- [ ] **Schema - External:** Create `ExternalListing` (landlord_id, location, price, images, is_available), `ListingInquiry` (student_id, listing_id, message).

### API & Logic
- [ ] **Availability Logic (Internal):** API to check `HostelRoom` capacity before allowing a `POST` to `RoomBooking`.
- [ ] **Management (Landlord):** Endpoint for Landlords to toggle `is_available` on `ExternalListing`.
- [ ] **Contact Logic:** `POST /api/housing/inquiry` to send internal message/email to Landlord.

### UI / Client
- [ ] **Listing Cards:** Create reusable card component. Add a "Live" availability badge (Green/Red) based on `is_available` or `occupancy`.
- [ ] **Internal Booking Flow:** Step-by-step wizard for selecting Hostel -> Room -> Bed.
- [ ] **External Details Page:** Page displaying images, map, and a "Contact Landlord" form.

---

## Phase 4: Transportation (The 'Matatu' Model) 🇰🇪
*Objective: Route-based flexible transport tracking.*

### Database & Schema
- [ ] **Schema - Infrastructure:** Create `Route` (name, start_point, end_point) and `RouteStop` (route_id, stop_name, sequence_order).
- [ ] **Schema - Fleet:** Create `Vehicle` (plate_number, capacity, current_route_id) and `VehicleStatus` (vehicle_id, current_stop_id, status: 'LOADING', 'DEPARTED', 'EN_ROUTE').

### API & Logic
- [ ] **Status Updates (Admin/Driver):** Endpoint `PATCH /api/transport/vehicle/[id]` to update location/status.
- [ ] **Student Query:** `GET /api/transport/routes` returning routes with nested active vehicles.

### UI / Client
- [ ] **Route List:** Display available routes (e.g., "Town to Campus", "Main Gate to Hostels").
- [ ] **Live Status View:** Dynamic list showing vehicles: *"KCB 123K - At Main Gate (Loading)"*.
- [ ] **Map Integration (Optional):** Embed Google/Leaflet map showing stop markers.

---

## Phase 5: Health Services
*Objective: Booking and schedule management.*

### Database & Schema
- [ ] **Schema - Services:** Create `HealthService` (name, duration_mins).
- [ ] **Schema - Appointments:** Create `Appointment` (student_id, service_id, date_time, status: 'CONFIRMED', 'CANCELLED', 'COMPLETED').

### API & Logic
- [ ] **Slot Generator:** Logic to generate available time slots excluding existing `Appointment` records.
- [ ] **Booking Actions:** Server actions for `bookAppointment`, `cancelAppointment`, `rescheduleAppointment`.

### UI / Client
- [ ] **Service Tab:** List of services with "Book Now" buttons.
- [ ] **Upcoming Widget:** List of active appointments with "Reschedule" (modal trigger) and "Cancel" (destructive action) buttons.

---

## Phase 6: Student Marketplace
*Objective: Peer-to-peer commerce.*

### Database & Schema
- [ ] **Schema - Market:** Create `MarketItem` (seller_id, title, description, price, category, status).
- [ ] **Schema - Saved:** `SavedItem` (user_id, item_id) for wishlists.

### API & Logic
- [ ] **Filtering API:** `GET /api/market?category=books&minPrice=100` using Prisma/SQL `WHERE` clauses.
- [ ] **Deal Flow:** Endpoint to mark item as `SOLD` or generate a "View Deal" link (could redirect to WhatsApp API with pre-filled message).

### UI / Client
- [ ] **Filter Bar:** Component with Category dropdown and Price Range slider.
- [ ] **Market Grid:** Responsive grid of items.
- [ ] **Item Details:** Page with "View Deal" button that handles the redirect logic.

---

## Phase 7: Admin & Faculty Dashboards
*Objective: Management interfaces.*

### UI / Client (Admin)
- [ ] **User Management:** Table to view/ban users or verify Landlords.
- [ ] **System Overview:** Stats on total bookings, active listings.

### UI / Client (Faculty)
- [ ] **Course Manager:** Interface to upload course materials and input grades.
- [ ] **Student Lookup:** View academic progress of enrolled students.
