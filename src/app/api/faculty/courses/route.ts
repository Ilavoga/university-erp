import { auth } from "@/auth";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { NextResponse } from "next/server";
import { z } from "zod";

const courseSchema = z.object({
  code: z.string().min(3),
  title: z.string().min(3),
});

export async function POST(req: Request) {
  const session = await auth();

  if (!session || session.user.role !== "FACULTY") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { code, title } = courseSchema.parse(body);

    const [course] = await db.insert(courses).values({
      code,
      title,
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
