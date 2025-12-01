import { auth } from "@/auth";
import { db } from "@/db";
import { enrollments, courses } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { CourseCard, CourseProgress } from "@/components/academics/course-card";
import { FacultyDashboard } from "@/components/academics/faculty-dashboard";
import { StudentCourseCatalog } from "@/components/academics/student-course-catalog";

export default async function AcademicsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  if (session.user.role === "FACULTY" || session.user.role === "ADMIN") {
    return <FacultyDashboard />;
  }

  // Fetch student's enrolled courses
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

  const enrolledCourseIds = studentEnrollments.map(e => e.courseId);

  const myCourses: CourseProgress[] = studentEnrollments.map(enrollment => {
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

  // Fetch all available courses for the catalog
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

  return (
    <div className="container mx-auto py-8 space-y-12">
      <div>
        <h1 className="text-3xl font-bold mb-6">My Academics</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {myCourses.map(course => (
            <CourseCard key={course.courseId} data={course} />
          ))}
        </div>
        {myCourses.length === 0 && (
          <div className="text-center text-muted-foreground mt-10 p-8 border rounded-lg border-dashed">
            You are not enrolled in any courses yet.
          </div>
        )}
      </div>

      <StudentCourseCatalog 
        courses={allCourses} 
        enrolledCourseIds={enrolledCourseIds} 
      />
    </div>
  );
}

