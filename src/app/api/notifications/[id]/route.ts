import { auth } from "@/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { isRead } = body;

    // Verify the notification belongs to the user
    const [notification] = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, session.user.id)));

    if (!notification) {
      return new NextResponse("Notification not found", { status: 404 });
    }

    // Update the notification
    const [updated] = await db
      .update(notifications)
      .set({ isRead: isRead ?? true })
      .where(eq(notifications.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating notification:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  try {
    // Verify the notification belongs to the user
    const [notification] = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, session.user.id)));

    if (!notification) {
      return new NextResponse("Notification not found", { status: 404 });
    }

    await db.delete(notifications).where(eq(notifications.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
