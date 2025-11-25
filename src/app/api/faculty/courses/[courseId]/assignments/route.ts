import { auth } from "@/auth";
import { db } from "@/db";
import { assignments, courses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const assignmentSchema = z.object({
  title: z.string().min(1),
  totalMarks: z.number().min(1),
  dueDate: z.string().nullable(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "FACULTY") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { courseId } = await params;
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    if (course.lecturerId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const json = await req.json();
    const body = assignmentSchema.parse(json);

    const [newAssignment] = await db.insert(assignments).values({
      courseId: courseId,
      title: body.title,
      totalMarks: body.totalMarks,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    }).returning();

    return NextResponse.json(newAssignment);
  } catch (error) {
    console.error("Failed to create assignment:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
