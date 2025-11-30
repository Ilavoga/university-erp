
import { auth } from "@/auth";
import { db } from "@/db";
import { courses, enrollments } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logEnrollment } from "@/lib/activity-logger";

const enrollSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const json = await req.json();
    const body = enrollSchema.parse(json);

    // Check if course exists and has capacity
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, body.courseId),
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    // Check if already enrolled
    const existingEnrollment = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.studentId, session.user.id),
        eq(enrollments.courseId, body.courseId)
      ),
    });

    if (existingEnrollment) {
      return new NextResponse("Already enrolled", { status: 400 });
    }

    // Check capacity
    const currentEnrollments = await db
      .select({ count: sql<number>`count(*)` })
      .from(enrollments)
      .where(eq(enrollments.courseId, body.courseId));

    if (currentEnrollments[0].count >= course.capacity) {
      return new NextResponse("Course is full", { status: 400 });
    }

    // Enroll student
    await db.insert(enrollments).values({
      studentId: session.user.id,
      courseId: body.courseId,
      status: "ACTIVE",
      enrolledAt: new Date(),
    });

    // Log activity and send notification
    await logEnrollment(session.user.id, body.courseId, course.title);

    return new NextResponse("Enrolled successfully", { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 });
    }
    return new NextResponse(null, { status: 500 });
  }
}
