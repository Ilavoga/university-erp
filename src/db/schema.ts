import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import type { AdapterAccount } from 'next-auth/adapters';

export const users = sqliteTable('user', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: integer('emailVerified', { mode: 'timestamp_ms' }),
  image: text('image'),
  passwordHash: text('password_hash'), // For credentials provider
  role: text('role', { enum: ['STUDENT', 'ADMIN', 'FACULTY', 'LANDLORD'] }).notNull().default('STUDENT'),
  profileData: text('profile_data', { mode: 'json' }).$type<Record<string, unknown>>(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const accounts = sqliteTable(
  'account',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccount['type']>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = sqliteTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: integer('expires', { mode: 'timestamp_ms' }).notNull(),
});

export const verificationTokens = sqliteTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: integer('expires', { mode: 'timestamp_ms' }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Phase 1: Academic Progress & Recommendations

export const courses = sqliteTable('course', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text('code').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  credits: integer('credits').notNull().default(3),
  capacity: integer('capacity').notNull().default(30),
  lecturerId: text('lecturer_id').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const enrollments = sqliteTable('enrollment', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  studentId: text('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: text('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['ACTIVE', 'COMPLETED', 'DROPPED'] }).notNull().default('ACTIVE'),
  enrolledAt: integer('enrolled_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const assignments = sqliteTable('assignment', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  courseId: text('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  totalMarks: integer('total_marks').notNull(),
  dueDate: integer('due_date', { mode: 'timestamp_ms' }),
});

export const grades = sqliteTable('grade', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  enrollmentId: text('enrollment_id').notNull().references(() => enrollments.id, { onDelete: 'cascade' }),
  assignmentId: text('assignment_id').notNull().references(() => assignments.id, { onDelete: 'cascade' }),
  scoreObtained: integer('score_obtained').notNull(),
  gradedAt: integer('graded_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const attendance = sqliteTable('attendance', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  enrollmentId: text('enrollment_id').notNull().references(() => enrollments.id, { onDelete: 'cascade' }),
  date: integer('date', { mode: 'timestamp_ms' }).notNull(),
  status: text('status', { enum: ['PRESENT', 'ABSENT', 'EXCUSED'] }).notNull(),
});

export const recommendations = sqliteTable('recommendation', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['COURSE', 'RESOURCE', 'EVENT'] }).notNull(),
  resourceLink: text('resource_link'),
  reason: text('reason'),
  relevanceScore: integer('relevance_score'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
});

// Phase 2: User Engagement & Notifications

export const activityLogs = sqliteTable('activity_log', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  actionType: text('action_type', { 
    enum: ['ENROLLED', 'DROPPED', 'GRADE_RECEIVED', 'ASSIGNMENT_SUBMITTED', 'ATTENDANCE_MARKED', 'COURSE_CREATED', 'PROFILE_UPDATED'] 
  }).notNull(),
  referenceId: text('reference_id'), // ID of related entity (courseId, assignmentId, etc.)
  referenceType: text('reference_type'), // Type of reference (course, assignment, etc.)
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const notifications = sqliteTable('notification', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type', { enum: ['INFO', 'SUCCESS', 'WARNING', 'ERROR'] }).notNull().default('INFO'),
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  link: text('link'), // Optional link to navigate to
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const usersRelations = relations(users, ({ many }) => ({
  enrollments: many(enrollments),
  activityLogs: many(activityLogs),
  notifications: many(notifications),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  enrollments: many(enrollments),
}));

export const enrollmentsRelations = relations(enrollments, ({ one, many }) => ({
  student: one(users, {
    fields: [enrollments.studentId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
  grades: many(grades),
}));

export const assignmentsRelations = relations(assignments, ({ one }) => ({
  course: one(courses, {
    fields: [assignments.courseId],
    references: [courses.id],
  }),
}));

export const gradesRelations = relations(grades, ({ one }) => ({
  enrollment: one(enrollments, {
    fields: [grades.enrollmentId],
    references: [enrollments.id],
  }),
  assignment: one(assignments, {
    fields: [grades.assignmentId],
    references: [assignments.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Phase 3: Housing (Internal & External)

export const hostelBlocks = sqliteTable('hostel_block', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  location: text('location'), // e.g., "North Wing", "Campus A"
  genderRestriction: text('gender_restriction', { enum: ['MALE', 'FEMALE', 'MIXED'] }).default('MIXED'),
  images: text('images', { mode: 'json' }).$type<string[]>(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const hostelRooms = sqliteTable('hostel_room', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  blockId: text('block_id').notNull().references(() => hostelBlocks.id, { onDelete: 'cascade' }),
  roomNumber: text('room_number').notNull(),
  capacity: integer('capacity').notNull().default(2),
  currentOccupancy: integer('current_occupancy').notNull().default(0),
  pricePerSemester: integer('price_per_semester').notNull(),
  images: text('images', { mode: 'json' }).$type<string[]>(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const roomBookings = sqliteTable('room_booking', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  studentId: text('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roomId: text('room_id').notNull().references(() => hostelRooms.id, { onDelete: 'cascade' }),
  semester: text('semester').notNull(), // e.g., "Fall 2025"
  status: text('status', { enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED'] }).notNull().default('PENDING'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const externalListings = sqliteTable('external_listing', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  landlordId: text('landlord_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  location: text('location').notNull(),
  price: integer('price').notNull(), // Monthly rent
  images: text('images', { mode: 'json' }).$type<string[]>(),
  isAvailable: integer('is_available', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const listingInquiries = sqliteTable('listing_inquiry', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  studentId: text('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  listingId: text('listing_id').notNull().references(() => externalListings.id, { onDelete: 'cascade' }),
  message: text('message').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const hostelBlocksRelations = relations(hostelBlocks, ({ many }) => ({
  rooms: many(hostelRooms),
}));

export const hostelRoomsRelations = relations(hostelRooms, ({ one, many }) => ({
  block: one(hostelBlocks, {
    fields: [hostelRooms.blockId],
    references: [hostelBlocks.id],
  }),
  bookings: many(roomBookings),
}));

export const roomBookingsRelations = relations(roomBookings, ({ one }) => ({
  student: one(users, {
    fields: [roomBookings.studentId],
    references: [users.id],
  }),
  room: one(hostelRooms, {
    fields: [roomBookings.roomId],
    references: [hostelRooms.id],
  }),
}));

export const externalListingsRelations = relations(externalListings, ({ one, many }) => ({
  landlord: one(users, {
    fields: [externalListings.landlordId],
    references: [users.id],
  }),
  inquiries: many(listingInquiries),
}));

export const listingInquiriesRelations = relations(listingInquiries, ({ one }) => ({
  student: one(users, {
    fields: [listingInquiries.studentId],
    references: [users.id],
  }),
  listing: one(externalListings, {
    fields: [listingInquiries.listingId],
    references: [externalListings.id],
  }),
}));

// Type exports
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

// Phase 4: Transportation (Routes, Stops, Fleet)

export const routes = sqliteTable('route', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  startPoint: text('start_point').notNull(),
  endPoint: text('end_point').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const routeStops = sqliteTable('route_stop', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  routeId: text('route_id').notNull().references(() => routes.id, { onDelete: 'cascade' }),
  stopName: text('stop_name').notNull(),
  sequenceOrder: integer('sequence_order').notNull(),
});

export const vehicles = sqliteTable('vehicle', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  plateNumber: text('plate_number').notNull().unique(),
  capacity: integer('capacity').notNull(),
  currentRouteId: text('current_route_id').references(() => routes.id),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const vehicleStatuses = sqliteTable('vehicle_status', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  vehicleId: text('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  currentStopId: text('current_stop_id').references(() => routeStops.id),
  status: text('status', { enum: ['LOADING', 'DEPARTED', 'EN_ROUTE'] }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const vehicleBookings = sqliteTable('vehicle_booking', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  studentId: text('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  vehicleId: text('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  routeId: text('route_id').notNull().references(() => routes.id),
  pickupStopId: text('pickup_stop_id').references(() => routeStops.id),
  dropoffStopId: text('dropoff_stop_id').references(() => routeStops.id),
  status: text('status', { enum: ['CONFIRMED', 'CANCELLED', 'COMPLETED'] }).notNull().default('CONFIRMED'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const routesRelations = relations(routes, ({ many }) => ({
  stops: many(routeStops),
  vehicles: many(vehicles),
  bookings: many(vehicleBookings),
}));

export const routeStopsRelations = relations(routeStops, ({ one }) => ({
  route: one(routes, {
    fields: [routeStops.routeId],
    references: [routes.id],
  }),
}));

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  currentRoute: one(routes, {
    fields: [vehicles.currentRouteId],
    references: [routes.id],
  }),
  statuses: many(vehicleStatuses),
  bookings: many(vehicleBookings),
}));

export const vehicleStatusesRelations = relations(vehicleStatuses, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [vehicleStatuses.vehicleId],
    references: [vehicles.id],
  }),
  currentStop: one(routeStops, {
    fields: [vehicleStatuses.currentStopId],
    references: [routeStops.id],
  }),
}));

export const vehicleBookingsRelations = relations(vehicleBookings, ({ one }) => ({
  student: one(users, {
    fields: [vehicleBookings.studentId],
    references: [users.id],
  }),
  vehicle: one(vehicles, {
    fields: [vehicleBookings.vehicleId],
    references: [vehicles.id],
  }),
  route: one(routes, {
    fields: [vehicleBookings.routeId],
    references: [routes.id],
  }),
  pickupStop: one(routeStops, {
    fields: [vehicleBookings.pickupStopId],
    references: [routeStops.id],
  }),
  dropoffStop: one(routeStops, {
    fields: [vehicleBookings.dropoffStopId],
    references: [routeStops.id],
  }),
}));

// Type exports for Phase 4
export type Route = typeof routes.$inferSelect;
export type NewRoute = typeof routes.$inferInsert;
export type RouteStop = typeof routeStops.$inferSelect;
export type NewRouteStop = typeof routeStops.$inferInsert;
export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;
export type VehicleStatus = typeof vehicleStatuses.$inferSelect;
export type NewVehicleStatus = typeof vehicleStatuses.$inferInsert;
export type VehicleBooking = typeof vehicleBookings.$inferSelect;
export type NewVehicleBooking = typeof vehicleBookings.$inferInsert;


