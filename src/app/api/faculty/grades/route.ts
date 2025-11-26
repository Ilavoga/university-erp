import { auth } from "@/auth";
import { db } from "@/db";
import { assignments, attendance, courses, enrollments, grades } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logGradeReceived, logAttendanceMarked } from "@/lib/activity-logger";

const gradeSchema = z.object({
  enrollmentId: z.string(),
  assignmentId: z.string(),
  scoreObtained: z.number().min(0),
});

const attendanceSchema = z.object({
  enrollmentId: z.string(),
  date: z.string().datetime(), // Expect ISO string
  status: z.enum(["PRESENT", "ABSENT", "EXCUSED"]),
});

export async function POST(req: Request) {
  const session = await auth();

  if (!session || (session.user.role !== "FACULTY" && session.user.role !== "ADMIN")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { type } = body; // 'grade' or 'attendance'

    if (type === "grade") {
      const { enrollmentId, assignmentId, scoreObtained } = gradeSchema.parse(body);
      
      // Verify enrollment exists and get related data
      const enrollment = await db.query.enrollments.findFirst({
        where: eq(enrollments.id, enrollmentId),
        with: {
          student: true,
          course: true,
        },
      });

      if (!enrollment) return new NextResponse("Enrollment not found", { status: 404 });

      // Get assignment details
      const assignment = await db.query.assignments.findFirst({
        where: eq(assignments.id, assignmentId),
      });

      if (!assignment) return new NextResponse("Assignment not found", { status: 404 });

      // Check for existing grade
      const existingGrade = await db.query.grades.findFirst({
        where: and(
          eq(grades.enrollmentId, enrollmentId),
          eq(grades.assignmentId, assignmentId)
        ),
      });

      if (existingGrade) {
        await db.update(grades)
          .set({ scoreObtained, gradedAt: new Date() })
          .where(eq(grades.id, existingGrade.id));
      } else {
        await db.insert(grades).values({
          enrollmentId,
          assignmentId,
          scoreObtained,
        });
      }

      // Log activity and send notification to student
      await logGradeReceived(
        enrollment.studentId,
        enrollment.courseId,
        enrollment.course.title,
        assignment.title,
        scoreObtained,
        assignment.totalMarks
      );

      return NextResponse.json({ success: true });
    } 
    
    if (type === "attendance") {
      const { enrollmentId, date, status } = attendanceSchema.parse(body);
      const attendanceDate = new Date(date);

      // Get enrollment with related data
      const enrollment = await db.query.enrollments.findFirst({
        where: eq(enrollments.id, enrollmentId),
        with: {
          course: true,
        },
      });

      if (!enrollment) return new NextResponse("Enrollment not found", { status: 404 });

      // Check for existing attendance
      const existingAttendance = await db.query.attendance.findFirst({
        where: and(
          eq(attendance.enrollmentId, enrollmentId),
          eq(attendance.date, attendanceDate)
        ),
      });

      if (existingAttendance) {
        await db.update(attendance)
          .set({ status })
          .where(eq(attendance.id, existingAttendance.id));
      } else {
        await db.insert(attendance).values({
          enrollmentId,
          date: attendanceDate,
          status,
        });
      }

      // Log activity and send notification (only for ABSENT/EXCUSED)
      await logAttendanceMarked(
        enrollment.studentId,
        enrollment.courseId,
        enrollment.course.title,
        attendanceDate,
        status
      );

      return NextResponse.json({ success: true });
    }

    return new NextResponse("Invalid type", { status: 400 });

  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
