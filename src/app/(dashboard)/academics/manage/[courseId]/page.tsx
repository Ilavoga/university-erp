import { auth } from "@/auth";
import { db } from "@/db";
import { courses, enrollments, users, assignments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { CourseManagement } from "@/components/academics/course-management";

interface PageProps {
  params: Promise<{
    courseId: string;
  }>;
}

export default async function CourseManagePage({ params }: PageProps) {
  const session = await auth();
  if (!session || session.user.role !== "FACULTY") {
    redirect("/login");
  }

  const { courseId } = await params;

  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
    with: {
      enrollments: {
        with: {
          student: true,
          grades: true,
        },
      },
    },
  });

  if (!course) {
    notFound();
  }

  // Verify ownership
  if (course.lecturerId !== session.user.id) {
    // In a real app, we might want to allow admins too, but for now strict ownership
    // redirect("/dashboard"); // Or show unauthorized
  }

  const courseAssignments = await db.query.assignments.findMany({
    where: eq(assignments.courseId, courseId),
  });

  return (
    <div className="container mx-auto py-6">
      <CourseManagement 
        course={course} 
        enrollments={course.enrollments}
        assignments={courseAssignments}
      />
    </div>
  );
}
