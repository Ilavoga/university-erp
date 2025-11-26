
import { db } from "@/db";
import { courses, users } from "@/db/schema";
import { eq } from "drizzle-orm";

async function run() {
  console.log("--- Admin Academics Flow Test ---");

  // 1. Create a course as Admin (Simulated)
  // In the real app, the API handles this. Here we just verify DB insertion works.
  console.log("Creating course...");
  const [newCourse] = await db.insert(courses).values({
    title: "Admin Created Course",
    code: "ADM101",
    description: "Created by Admin",
    credits: 3,
    capacity: 50,
    // lecturerId: adminId // Optional, might be null if created by admin without assigning lecturer
  }).returning();

  console.log(`Created course: ${newCourse.code} - ${newCourse.title}`);

  // 2. Update the course
  console.log("Updating course...");
  await db.update(courses)
    .set({ title: "Admin Updated Course" })
    .where(eq(courses.id, newCourse.id));

  const updatedCourse = await db.query.courses.findFirst({
    where: eq(courses.id, newCourse.id),
  });

  if (updatedCourse?.title === "Admin Updated Course") {
    console.log("✅ Course updated successfully.");
  } else {
    console.error("❌ Failed to update course.");
  }

  // 3. Delete the course
  console.log("Deleting course...");
  await db.delete(courses).where(eq(courses.id, newCourse.id));

  const deletedCourse = await db.query.courses.findFirst({
    where: eq(courses.id, newCourse.id),
  });

  if (!deletedCourse) {
    console.log("✅ Course deleted successfully.");
  } else {
    console.error("❌ Failed to delete course.");
  }
}

run().catch((e) => {
    console.error(e);
    process.exit(1);
});
