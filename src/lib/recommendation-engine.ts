import { db } from "@/db";
import { recommendations, enrollments, courses } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

// Mock AI Recommendation Engine
export async function generateRecommendations(userId: string) {
  // 1. Fetch user's enrollment history
  const userEnrollments = await db.query.enrollments.findMany({
    where: eq(enrollments.studentId, userId),
    with: {
      course: true
    }
  });

  const enrolledCourseCodes = userEnrollments.map(e => e.course.code);

  // 2. Simple Rule-Based Logic (Mocking AI)
  const newRecommendations = [];

  // Rule: If taking CS101, recommend "Intro to Algorithms" resource
  if (enrolledCourseCodes.some(code => code.includes("CS101"))) {
    newRecommendations.push({
      userId,
      type: "RESOURCE" as const,
      resourceLink: "https://example.com/algorithms-101",
      reason: "Based on your enrollment in CS101",
      relevanceScore: 95
    });
  }

  // Rule: If taking MATH101, recommend "Calculus Study Group" event
  if (enrolledCourseCodes.some(code => code.includes("MATH101"))) {
    newRecommendations.push({
      userId,
      type: "EVENT" as const,
      resourceLink: "https://university.edu/events/math-study-group",
      reason: "Recommended for MATH101 students",
      relevanceScore: 80
    });
  }

  // 3. Seed Database
  if (newRecommendations.length > 0) {
    await db.insert(recommendations).values(newRecommendations);
  }

  return newRecommendations;
}
