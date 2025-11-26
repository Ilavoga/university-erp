import { db } from "./index";
import { users, courses, enrollments, assignments, grades, hostelBlocks, hostelRooms, externalListings } from "./schema";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

// Use public URLs instead of signed URLs (signed URLs expire)
// Public URL format: https://[project_id].supabase.co/storage/v1/object/public/[bucket]/[filename]
const HOUSING_IMAGES = [
  "https://bwnjplrvmxmdixjwnvgd.supabase.co/storage/v1/object/public/housing-images/bernd-dittrich-pqgPtnEJ9uM-unsplash.jpg",
  "https://bwnjplrvmxmdixjwnvgd.supabase.co/storage/v1/object/public/housing-images/danist-soh-n_crSnNw1no-unsplash.jpg",
  "https://bwnjplrvmxmdixjwnvgd.supabase.co/storage/v1/object/public/housing-images/forest-plum-dx3p-YtcOCw-unsplash.jpg",
  "https://bwnjplrvmxmdixjwnvgd.supabase.co/storage/v1/object/public/housing-images/jisun-han-yC2TmgRjld8-unsplash.jpg",
  "https://bwnjplrvmxmdixjwnvgd.supabase.co/storage/v1/object/public/housing-images/marcin-czerniawski--BSQ4StaN7w-unsplash.jpg",
  "https://bwnjplrvmxmdixjwnvgd.supabase.co/storage/v1/object/public/housing-images/michal-balog-uiqx-n5RVhg-unsplash.jpg",
  "https://bwnjplrvmxmdixjwnvgd.supabase.co/storage/v1/object/public/housing-images/richard-stachmann--XUvtKvnNyc-unsplash.jpg",
  "https://bwnjplrvmxmdixjwnvgd.supabase.co/storage/v1/object/public/housing-images/sheikh-abir-ali-aY5B_p7t1KY-unsplash.jpg",
  "https://bwnjplrvmxmdixjwnvgd.supabase.co/storage/v1/object/public/housing-images/tarun-anand-giri-yA1jueUBSGk-unsplash.jpg",
  "https://bwnjplrvmxmdixjwnvgd.supabase.co/storage/v1/object/public/housing-images/West%20View%20-%20Downing%20Students%20Accommodation%20&%20Housing.jfif"
];

const getImages = (offset: number = 0) => 
  Array.from({ length: 6 }, (_, i) => HOUSING_IMAGES[(i + offset) % HOUSING_IMAGES.length]);

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

  // 6. Hostel Blocks & Rooms (Phase 3)
  const [block1] = await db
    .insert(hostelBlocks)
    .values({
      id: "block-01",
      name: "Block A",
      location: "North Campus",
      genderRestriction: "MIXED",
      images: getImages(0),
    })
    .onConflictDoUpdate({
      target: hostelBlocks.id,
      set: { name: "Block A", images: getImages(0) },
    })
    .returning();

  const [block2] = await db
    .insert(hostelBlocks)
    .values({
      id: "block-02",
      name: "Block B",
      location: "South Campus",
      genderRestriction: "FEMALE",
      images: getImages(1),
    })
    .onConflictDoUpdate({
      target: hostelBlocks.id,
      set: { name: "Block B", images: getImages(1) },
    })
    .returning();

  console.log("✅ Hostel Blocks seeded");

  // Create rooms
  await db
    .insert(hostelRooms)
    .values([
      {
        id: "room-a-101",
        blockId: block1.id,
        roomNumber: "A101",
        capacity: 2,
        currentOccupancy: 1,
        pricePerSemester: 5000,
        images: getImages(2),
      },
      {
        id: "room-a-102",
        blockId: block1.id,
        roomNumber: "A102",
        capacity: 4,
        currentOccupancy: 0,
        pricePerSemester: 4000,
        images: getImages(3),
      },
      {
        id: "room-b-201",
        blockId: block2.id,
        roomNumber: "B201",
        capacity: 2,
        currentOccupancy: 2,
        pricePerSemester: 5500,
        images: getImages(4),
      },
      {
        id: "room-b-202",
        blockId: block2.id,
        roomNumber: "B202",
        capacity: 3,
        currentOccupancy: 1,
        pricePerSemester: 4800,
        images: getImages(5),
      },
    ])
    .onConflictDoUpdate({
      target: hostelRooms.id,
      set: { images: sql`excluded.images` },
    });

  console.log("✅ Hostel Rooms seeded");

  // 7. Landlord & External Listings
  const landlordPassword = await bcrypt.hash("landlord", 10);
  
  const [landlord] = await db
    .insert(users)
    .values({
      id: "user-landlord-01",
      name: "Mr. Johnson",
      email: "johnson.properties@email.com",
      passwordHash: landlordPassword,
      role: "LANDLORD",
    })
    .onConflictDoUpdate({
      target: users.email,
      set: { passwordHash: landlordPassword, role: "LANDLORD" },
    })
    .returning();

  await db
    .insert(externalListings)
    .values([
      {
        id: "listing-01",
        landlordId: landlord.id,
        title: "Cozy 2-Bedroom Apartment",
        description: "Fully furnished apartment near campus with WiFi and utilities included.",
        location: "Downtown, 5 min walk to campus",
        price: 8000,
        images: getImages(6),
        isAvailable: true,
      },
      {
        id: "listing-02",
        landlordId: landlord.id,
        title: "Shared Student House",
        description: "Large house with 4 bedrooms, shared kitchen and living area.",
        location: "University District",
        price: 6000,
        images: getImages(7),
        isAvailable: true,
      },
    ])
    .onConflictDoUpdate({
      target: externalListings.id,
      set: { images: sql`excluded.images` },
    });

  console.log("✅ External Listings seeded");
  console.log("🌱 Seeding complete!");
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
