
import { db } from "./index";
import { users, courses, enrollments, assignments, grades } from "./schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function seed() {
  console.log("🌱 Seeding database...");

  // 1. Users
  const facultyPassword = await bcrypt.hash("faculty", 10);
  const studentPassword = await bcrypt.hash("student", 10);

  const [faculty] = await db
    .insert(users)
    .values({
      id: "user-faculty-01",
      name: "Dr. Wilson",
      email: "dr.wilson@university.edu",
      passwordHash: facultyPassword,
      role: "FACULTY",
    })
    .onConflictDoUpdate({
      target: users.email,
      set: { passwordHash: facultyPassword, role: "FACULTY" },
    })
    .returning();

  const [student] = await db
    .insert(users)
    .values({
      id: "user-student-01",
      name: "John Doe",
      email: "john.doe@university.edu",
      passwordHash: studentPassword,
      role: "STUDENT",
    })
    .onConflictDoUpdate({
      target: users.email,
      set: { passwordHash: studentPassword, role: "STUDENT" },
    })
    .returning();

  console.log("✅ Users seeded");

  // 2. Courses
  const [course] = await db
    .insert(courses)
    .values({
      id: "course-cs101",
      code: "CS101",
      title: "Introduction to Computer Science",
      lecturerId: faculty.id,
    })
    .onConflictDoUpdate({
      target: courses.code,
      set: { title: "Introduction to Computer Science", lecturerId: faculty.id },
    })
    .returning();

  console.log("✅ Courses seeded");

  // 3. Enrollments
  // Check if enrollment exists to avoid duplicates if we run seed multiple times
  // (Since we don't have a unique constraint on studentId + courseId in schema yet, though we should)
  const existingEnrollment = await db.query.enrollments.findFirst({
    where: (enrollments, { and, eq }) => and(
      eq(enrollments.studentId, student.id),
      eq(enrollments.courseId, course.id)
    )
  });

  let enrollmentId = existingEnrollment?.id;

  if (!existingEnrollment) {
    const [enrollment] = await db
      .insert(enrollments)
      .values({
        id: "enrollment-student-01-cs101",
        studentId: student.id,
        courseId: course.id,
        status: "ACTIVE",
      })
      .returning();
    enrollmentId = enrollment.id;
  }

  console.log("✅ Enrollments seeded");

  // 4. Assignments
  const [assignment] = await db
    .insert(assignments)
    .values({
      id: "assignment-cs101-midterm",
      courseId: course.id,
      title: "Midterm Exam",
      totalMarks: 100,
    })
    .onConflictDoNothing() // Assuming ID is stable
    .returning();
    
  // If onConflictDoNothing returned nothing, fetch it
  const assignmentId = assignment?.id || "assignment-cs101-midterm";

  console.log("✅ Assignments seeded");

  // 5. Grades
  if (enrollmentId) {
      await db
        .insert(grades)
        .values({
          id: "grade-student-01-midterm",
          enrollmentId: enrollmentId,
          assignmentId: assignmentId,
          scoreObtained: 85,
        })
        .onConflictDoUpdate({
            target: grades.id,
            set: { scoreObtained: 85 }
        });
  }

  console.log("✅ Grades seeded");
  console.log("🌱 Seeding complete!");
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
