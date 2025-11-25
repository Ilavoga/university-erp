import { db } from "@/db";
import { activityLogs, notifications, type NewActivityLog, type NewNotification } from "@/db/schema";

type ActionType = 
  | 'ENROLLED' 
  | 'DROPPED' 
  | 'GRADE_RECEIVED' 
  | 'ASSIGNMENT_SUBMITTED' 
  | 'ATTENDANCE_MARKED' 
  | 'COURSE_CREATED' 
  | 'PROFILE_UPDATED';

interface LogActivityParams {
  userId: string;
  actionType: ActionType;
  referenceId?: string;
  referenceType?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Logs a user activity to the activity_log table.
 * @param params - The activity details to log
 * @returns The created activity log entry
 */
export async function logActivity(params: LogActivityParams) {
  const { userId, actionType, referenceId, referenceType, metadata } = params;

  const [activity] = await db.insert(activityLogs).values({
    userId,
    actionType,
    referenceId,
    referenceType,
    metadata,
  }).returning();

  return activity;
}

type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
}

/**
 * Creates a notification for a user.
 * @param params - The notification details
 * @returns The created notification entry
 */
export async function createNotification(params: CreateNotificationParams) {
  const { userId, title, message, type = 'INFO', link } = params;

  const [notification] = await db.insert(notifications).values({
    userId,
    title,
    message,
    type,
    link,
  }).returning();

  return notification;
}

// Helper functions for common activity + notification patterns

/**
 * Logs enrollment activity and notifies the student.
 */
export async function logEnrollment(
  studentId: string, 
  courseId: string, 
  courseName: string
) {
  await logActivity({
    userId: studentId,
    actionType: 'ENROLLED',
    referenceId: courseId,
    referenceType: 'course',
    metadata: { courseName },
  });

  await createNotification({
    userId: studentId,
    title: 'Course Enrollment',
    message: `You have successfully enrolled in ${courseName}.`,
    type: 'SUCCESS',
    link: `/academics/progress/${courseId}`,
  });
}

/**
 * Logs when a student drops a course and notifies them.
 */
export async function logDropCourse(
  studentId: string, 
  courseId: string, 
  courseName: string
) {
  await logActivity({
    userId: studentId,
    actionType: 'DROPPED',
    referenceId: courseId,
    referenceType: 'course',
    metadata: { courseName },
  });

  await createNotification({
    userId: studentId,
    title: 'Course Dropped',
    message: `You have dropped ${courseName}.`,
    type: 'WARNING',
  });
}

/**
 * Logs grade posting and notifies the student.
 */
export async function logGradeReceived(
  studentId: string,
  courseId: string,
  courseName: string,
  assignmentTitle: string,
  score: number,
  totalMarks: number
) {
  await logActivity({
    userId: studentId,
    actionType: 'GRADE_RECEIVED',
    referenceId: courseId,
    referenceType: 'course',
    metadata: { courseName, assignmentTitle, score, totalMarks },
  });

  const percentage = Math.round((score / totalMarks) * 100);
  await createNotification({
    userId: studentId,
    title: 'New Grade Posted',
    message: `You received ${score}/${totalMarks} (${percentage}%) on "${assignmentTitle}" in ${courseName}.`,
    type: 'INFO',
    link: `/academics/progress/${courseId}`,
  });
}

/**
 * Logs attendance marking and notifies the student.
 */
export async function logAttendanceMarked(
  studentId: string,
  courseId: string,
  courseName: string,
  date: Date,
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED'
) {
  await logActivity({
    userId: studentId,
    actionType: 'ATTENDANCE_MARKED',
    referenceId: courseId,
    referenceType: 'course',
    metadata: { courseName, date: date.toISOString(), status },
  });

  // Only notify if absent or excused
  if (status !== 'PRESENT') {
    await createNotification({
      userId: studentId,
      title: 'Attendance Recorded',
      message: `You were marked as ${status.toLowerCase()} for ${courseName} on ${date.toLocaleDateString()}.`,
      type: status === 'ABSENT' ? 'WARNING' : 'INFO',
      link: `/academics/progress/${courseId}`,
    });
  }
}

/**
 * Logs course creation by faculty.
 */
export async function logCourseCreated(
  facultyId: string,
  courseId: string,
  courseName: string
) {
  await logActivity({
    userId: facultyId,
    actionType: 'COURSE_CREATED',
    referenceId: courseId,
    referenceType: 'course',
    metadata: { courseName },
  });

  await createNotification({
    userId: facultyId,
    title: 'Course Created',
    message: `Your course "${courseName}" has been created successfully.`,
    type: 'SUCCESS',
    link: `/academics/manage/${courseId}`,
  });
}
