import { auth } from "@/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unread") === "true";
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  try {
    const whereClause = unreadOnly
      ? and(eq(notifications.userId, session.user.id), eq(notifications.isRead, false))
      : eq(notifications.userId, session.user.id);

    const userNotifications = await db
      .select()
      .from(notifications)
      .where(whereClause)
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    // Get unread count
    const unreadCount = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, session.user.id), eq(notifications.isRead, false)));

    return NextResponse.json({
      notifications: userNotifications,
      unreadCount: unreadCount.length,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { markAllRead } = body;

    if (markAllRead) {
      // Mark all notifications as read for this user
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, session.user.id));

      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    }

    return new NextResponse("Bad Request", { status: 400 });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
