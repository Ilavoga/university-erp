import { db } from "@/db";
import { recommendations, enrollments } from "@/db/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// AI Recommendation Engine
export async function generateRecommendations(userId: string) {
  // 1. Fetch user's enrollment history
  const userEnrollments = await db.query.enrollments.findMany({
    where: eq(enrollments.studentId, userId),
    with: {
      course: true
    }
  });

  const enrolledCourses = userEnrollments.map(e => ({
    code: e.course.code,
    title: e.course.title
  }));

  if (enrolledCourses.length === 0) {
    return [];
  }

  // 2. Call OpenAI API
  try {
    const prompt = `
      Based on the following courses a student is enrolled in:
      ${JSON.stringify(enrolledCourses)}

      Suggest 3 academic resources or events that would be helpful.
      Return ONLY a JSON array with objects having these fields:
      - type: "RESOURCE" or "EVENT" or "COURSE"
      - resourceLink: a valid URL (use placeholder if needed)
      - reason: short explanation
      - relevanceScore: number between 0-100
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;
    if (!content) return [];

    const result = JSON.parse(content);
    const suggestions = result.recommendations || result.resources || result; // Handle potential variations in JSON structure

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newRecommendations = Array.isArray(suggestions) ? suggestions.map((item: any) => ({
      userId,
      type: item.type,
      resourceLink: item.resourceLink,
      reason: item.reason,
      relevanceScore: item.relevanceScore
    })) : [];

    // 3. Seed Database
    if (newRecommendations.length > 0) {
      // Filter out invalid types if necessary, or trust the AI
      const validTypes = ["COURSE", "RESOURCE", "EVENT"];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const validRecommendations = newRecommendations.filter((r: any) => validTypes.includes(r.type));
      
      if (validRecommendations.length > 0) {
         const inserted = await db.insert(recommendations).values(validRecommendations).returning();
         return inserted;
      }
    }

    return [];

  } catch (error) {
    console.error("OpenAI API Error:", error);
    // Fallback to empty or cached recommendations
    return [];
  }
}
