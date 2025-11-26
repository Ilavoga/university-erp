import { auth } from "@/auth";
import { db } from "@/db";
import { attendance, enrollments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await auth();
  if (!session || (session.user.role !== "FACULTY" && session.user.role !== "ADMIN")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { courseId } = await params;
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");

  if (!dateStr) {
    return new NextResponse("Date is required", { status: 400 });
  }

  const targetDate = new Date(dateStr);

  try {
    const records = await db
      .select({
        enrollmentId: attendance.enrollmentId,
        status: attendance.status,
      })
      .from(attendance)
      .innerJoin(enrollments, eq(attendance.enrollmentId, enrollments.id))
      .where(
        and(
          eq(enrollments.courseId, courseId),
          eq(attendance.date, targetDate)
        )
      );

    return NextResponse.json(records);
  } catch (error) {
    console.error("Failed to fetch attendance:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
