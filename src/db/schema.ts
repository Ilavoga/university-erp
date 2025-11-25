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
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
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
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const enrollments = sqliteTable('enrollment', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  studentId: text('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: text('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['ACTIVE', 'COMPLETED', 'DROPPED'] }).notNull().default('ACTIVE'),
  enrolledAt: integer('enrolled_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const assignments = sqliteTable('assignment', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  courseId: text('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  totalMarks: integer('total_marks').notNull(),
  dueDate: integer('due_date', { mode: 'timestamp' }),
});

export const grades = sqliteTable('grade', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  enrollmentId: text('enrollment_id').notNull().references(() => enrollments.id, { onDelete: 'cascade' }),
  assignmentId: text('assignment_id').notNull().references(() => assignments.id, { onDelete: 'cascade' }),
  scoreObtained: integer('score_obtained').notNull(),
  gradedAt: integer('graded_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const attendance = sqliteTable('attendance', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  enrollmentId: text('enrollment_id').notNull().references(() => enrollments.id, { onDelete: 'cascade' }),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  status: text('status', { enum: ['PRESENT', 'ABSENT', 'EXCUSED'] }).notNull(),
});

export const recommendations = sqliteTable('recommendation', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['COURSE', 'RESOURCE', 'EVENT'] }).notNull(),
  resourceLink: text('resource_link'),
  reason: text('reason'),
  relevanceScore: integer('relevance_score'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
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
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const notifications = sqliteTable('notification', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type', { enum: ['INFO', 'SUCCESS', 'WARNING', 'ERROR'] }).notNull().default('INFO'),
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  link: text('link'), // Optional link to navigate to
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
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
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const hostelRooms = sqliteTable('hostel_room', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  blockId: text('block_id').notNull().references(() => hostelBlocks.id, { onDelete: 'cascade' }),
  roomNumber: text('room_number').notNull(),
  capacity: integer('capacity').notNull().default(2),
  currentOccupancy: integer('current_occupancy').notNull().default(0),
  pricePerSemester: integer('price_per_semester').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const roomBookings = sqliteTable('room_booking', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  studentId: text('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roomId: text('room_id').notNull().references(() => hostelRooms.id, { onDelete: 'cascade' }),
  semester: text('semester').notNull(), // e.g., "Fall 2025"
  status: text('status', { enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED'] }).notNull().default('PENDING'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
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
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const listingInquiries = sqliteTable('listing_inquiry', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  studentId: text('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  listingId: text('listing_id').notNull().references(() => externalListings.id, { onDelete: 'cascade' }),
  message: text('message').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
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


