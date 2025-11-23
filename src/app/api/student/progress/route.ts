import { auth } from "@/auth";
import { db } from "@/db";
import { assignments, courses, enrollments, grades } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session || session.user.role !== "STUDENT") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const studentEnrollments = await db.query.enrollments.findMany({
      where: eq(enrollments.studentId, session.user.id),
      with: {
        course: true,
        grades: {
          with: {
            assignment: true
          }
        }
      }
    });

    const progressData = studentEnrollments.map(enrollment => {
      const totalPossibleMarks = enrollment.grades.reduce((acc, grade) => acc + grade.assignment.totalMarks, 0);
      const totalObtainedMarks = enrollment.grades.reduce((acc, grade) => acc + grade.scoreObtained, 0);
      
      const percentage = totalPossibleMarks > 0 
        ? (totalObtainedMarks / totalPossibleMarks) * 100 
        : 0;

      // Simple GPA calculation (Example: >80 = 4.0, >70 = 3.0, etc.)
      let gpa = 0.0;
      if (percentage >= 80) gpa = 4.0;
      else if (percentage >= 70) gpa = 3.0;
      else if (percentage >= 60) gpa = 2.0;
      else if (percentage >= 50) gpa = 1.0;

      return {
        courseCode: enrollment.course.code,
        courseTitle: enrollment.course.title,
        percentage: parseFloat(percentage.toFixed(2)),
        gpa,
        status: enrollment.status
      };
    });

    return NextResponse.json(progressData);

  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
