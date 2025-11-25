import { db } from "@/db";
import { recommendations, enrollments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;

// AI Recommendation Engine
export async function generateRecommendations(userId: string) {
  if (!genAI) {
    console.warn("Gemini API key not found. Skipping recommendations.");
    return [];
  }

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

  // 2. Call Gemini API
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
      
      Do not include markdown formatting like \`\`\`json. Just return the raw JSON array.
    `;

    const response = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });

    // Extract text directly from the response property
    let text = response.text;
    if (!text) {
      throw new Error("No text generated");
    }

    // Clean up markdown if present
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const suggestions = JSON.parse(text);
    
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
    console.error("Gemini API Error:", error);
    // Fallback to empty or cached recommendations
    return [];
  }
}
