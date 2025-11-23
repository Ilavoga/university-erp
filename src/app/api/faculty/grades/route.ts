import { auth } from "@/auth";
import { db } from "@/db";
import { assignments, attendance, courses, enrollments, grades } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

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

  if (!session || session.user.role !== "FACULTY") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { type } = body; // 'grade' or 'attendance'

    if (type === "grade") {
      const { enrollmentId, assignmentId, scoreObtained } = gradeSchema.parse(body);
      
      // Verify enrollment exists
      const enrollment = await db.query.enrollments.findFirst({
        where: eq(enrollments.id, enrollmentId),
      });

      if (!enrollment) return new NextResponse("Enrollment not found", { status: 404 });

      await db.insert(grades).values({
        enrollmentId,
        assignmentId,
        scoreObtained,
      });

      return NextResponse.json({ success: true });
    } 
    
    if (type === "attendance") {
      const { enrollmentId, date, status } = attendanceSchema.parse(body);

      await db.insert(attendance).values({
        enrollmentId,
        date: new Date(date),
        status,
      });

      return NextResponse.json({ success: true });
    }

    return new NextResponse("Invalid type", { status: 400 });

  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
