
import { auth } from "@/auth";
import { db } from "@/db";
import { courses, enrollments } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const courseSchema = z.object({
  code: z.string().min(3),
  title: z.string().min(3),
  description: z.string().optional(),
  credits: z.coerce.number().min(1).default(3),
  capacity: z.coerce.number().min(1).default(30),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "FACULTY") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { courseId } = await params;
    const json = await req.json();
    const body = courseSchema.parse(json);

    const [updatedCourse] = await db
      .update(courses)
      .set({
        title: body.title,
        code: body.code,
        description: body.description,
        credits: body.credits,
        capacity: body.capacity,
      })
      .where(eq(courses.id, courseId))
      .returning();

    return NextResponse.json(updatedCourse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 });
    }
    return new NextResponse(null, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "FACULTY") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { courseId } = await params;

    // Check for enrollments
    const enrollmentCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(enrollments)
      .where(eq(enrollments.courseId, courseId));

    if (enrollmentCount[0].count > 0) {
      return new NextResponse(
        "Cannot delete course with active enrollments",
        { status: 400 }
      );
    }

    await db.delete(courses).where(eq(courses.id, courseId));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}
