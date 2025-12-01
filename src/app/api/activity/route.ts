import { auth } from "@/auth";
import { db } from "@/db";
import { activityLogs, courses, assignments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  try {
    const activities = await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, session.user.id))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);

    // Enrich activities with related data
    const enrichedActivities = await Promise.all(
      activities.map(async (activity) => {
        let relatedData: Record<string, unknown> = {};

        if (activity.referenceType === 'course' && activity.referenceId) {
          const [course] = await db
            .select({ title: courses.title, code: courses.code })
            .from(courses)
            .where(eq(courses.id, activity.referenceId));
          relatedData = { course };
        } else if (activity.referenceType === 'assignment' && activity.referenceId) {
          const [assignment] = await db
            .select({ title: assignments.title })
            .from(assignments)
            .where(eq(assignments.id, activity.referenceId));
          relatedData = { assignment };
        }

        return {
          ...activity,
          relatedData,
        };
      })
    );

    return NextResponse.json(enrichedActivities);
  } catch (error) {
    console.error("Error fetching activity log:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
