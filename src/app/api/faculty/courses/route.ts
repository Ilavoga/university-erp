import { auth } from "@/auth";
import { db } from "@/db";
import { courses, enrollments } from "@/db/schema";
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";

const courseSchema = z.object({
  code: z.string().min(3),
  title: z.string().min(3),
  description: z.string().optional(),
  credits: z.coerce.number().min(1).default(3),
  capacity: z.coerce.number().min(1).default(30),
});

export async function GET(req: Request) {
  const session = await auth();

  if (!session || session.user.role !== "FACULTY") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const allCourses = await db
      .select({
        id: courses.id,
        title: courses.title,
        code: courses.code,
        description: courses.description,
        credits: courses.credits,
        capacity: courses.capacity,
        enrollmentCount: sql<number>`count(${enrollments.id})`.mapWith(Number),
      })
      .from(courses)
      .leftJoin(enrollments, eq(courses.id, enrollments.courseId))
      .groupBy(courses.id);

    return NextResponse.json(allCourses);
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session || session.user.role !== "FACULTY") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { code, title, description, credits, capacity } = courseSchema.parse(body);

    const [course] = await db.insert(courses).values({
      code,
      title,
      description,
      credits,
      capacity,
      lecturerId: session.user.id,
    }).returning();

    return NextResponse.json(course);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid input", { status: 400 });
    }
    // Handle unique constraint violation for code
    if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
        return new NextResponse("Course code already exists", { status: 409 });
    }
    console.error(error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
