import { auth } from "@/auth";
import { db } from "@/db";
import { enrollments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { CourseCard, CourseProgress } from "@/components/academics/course-card";

export default async function AcademicsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  // Fetch data directly (Server Component)
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

  const courses: CourseProgress[] = studentEnrollments.map(enrollment => {
    const totalPossibleMarks = enrollment.grades.reduce((acc, grade) => acc + grade.assignment.totalMarks, 0);
    const totalObtainedMarks = enrollment.grades.reduce((acc, grade) => acc + grade.scoreObtained, 0);
    
    const percentage = totalPossibleMarks > 0 
      ? (totalObtainedMarks / totalPossibleMarks) * 100 
      : 0;

    let gpa = 0.0;
    if (percentage >= 80) gpa = 4.0;
    else if (percentage >= 70) gpa = 3.0;
    else if (percentage >= 60) gpa = 2.0;
    else if (percentage >= 50) gpa = 1.0;

    return {
      courseId: enrollment.course.id,
      courseCode: enrollment.course.code,
      courseTitle: enrollment.course.title,
      percentage: parseFloat(percentage.toFixed(2)),
      gpa,
      status: enrollment.status as "ACTIVE" | "COMPLETED" | "DROPPED"
    };
  });

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">My Academics</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map(course => (
          <CourseCard key={course.courseId} data={course} />
        ))}
      </div>
      {courses.length === 0 && (
        <div className="text-center text-muted-foreground mt-10">
          You are not enrolled in any courses yet.
        </div>
      )}
    </div>
  );
}
