import { GoogleGenAI } from "@google/genai";
import { db } from "@/db";
import { users, enrollments } from "@/db/schema";
import { eq } from "drizzle-orm";

const apiKey = process.env.GOOGLE_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface Recommendation {
  type: "RESOURCE" | "EVENT" | "COURSE";
  title: string;
  description: string;
  resourceLink?: string;
  reason: string;
  relevanceScore: number;
}

export async function generateRecommendations(userId: string): Promise<Recommendation[]> {
  if (!ai) {
    console.warn("GOOGLE_API_KEY is not set. Skipping recommendations.");
    return [];
  }

  try {
    // 1. Fetch User Profile
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        name: true,
        role: true,
        profileData: true,
      },
    });

    if (!user) {
      console.warn(`User ${userId} not found.`);
      return [];
    }

    // 2. Fetch Enrolled Courses
    const userEnrollments = await db.query.enrollments.findMany({
      where: eq(enrollments.studentId, userId),
      with: {
        course: true,
        grades: {
          with: {
            assignment: true,
          },
        },
      },
    });

    const enrolledCourses = userEnrollments.map((e) => ({
      code: e.course.code,
      title: e.course.title,
      description: e.course.description,
      status: e.status,
      grades: e.grades.map((g) => ({
        assignment: g.assignment.title,
        score: g.scoreObtained,
      })),
    }));

    // 3. Construct Prompt
    const prompt = `
      As an academic advisor for a university student, analyze the following profile and course history to suggest 3 relevant academic resources, events, or future courses.

      Student Profile:
      - Name: ${user.name}
      - Role: ${user.role}
      - Interests/Data: ${JSON.stringify(user.profileData || {})}

      Current Enrollments & Performance:
      ${JSON.stringify(enrolledCourses, null, 2)}

      Task:
      Suggest 3 academic resources, events, or courses that would be helpful for this student's growth.
      
      Return ONLY a JSON array with objects having these fields:
      - type: "RESOURCE" or "EVENT" or "COURSE"
      - title: string
      - description: string
      - resourceLink: a valid URL (use placeholder if needed)
      - reason: short explanation of why this is recommended based on their profile/performance
      - relevanceScore: number between 0-100

      Do not include markdown formatting like \`\`\`json. Just return the raw JSON array.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });

    let text = response.text;
    
    if (text) {
        text = text.replace(/```json\n?|\n?```/g, "").trim();
        return JSON.parse(text) as Recommendation[];
    }
    
    return [];

  } catch (error) {
    console.error("Error generating recommendations:", error);
    return [];
  }
}
