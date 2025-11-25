import { auth } from "@/auth";
import { db } from "@/db";
import { roomBookings, hostelRooms } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createNotification } from "@/lib/activity-logger";

/**
 * PATCH /api/housing/bookings/[id]
 * Updates booking status (for admins) or cancels booking (for students)
 */
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
    const { status } = body;

    // Verify booking exists
    const [booking] = await db
      .select()
      .from(roomBookings)
      .where(eq(roomBookings.id, id));

    if (!booking) {
      return new NextResponse("Booking not found", { status: 404 });
    }

    // Students can only cancel their own bookings
    if (session.user.role === "STUDENT") {
      if (booking.studentId !== session.user.id) {
        return new NextResponse("Forbidden", { status: 403 });
      }
      if (status !== "CANCELLED") {
        return new NextResponse("Students can only cancel bookings", { status: 400 });
      }
    }

    // Admins can update to any status
    if (session.user.role !== "ADMIN" && session.user.role !== "STUDENT") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const oldStatus = booking.status;

    // Update booking
    const [updated] = await db
      .update(roomBookings)
      .set({ status })
      .where(eq(roomBookings.id, id))
      .returning();

    // If cancelling or rejecting, decrement room occupancy
    if ((status === 'CANCELLED' || status === 'REJECTED') && 
        (oldStatus === 'PENDING' || oldStatus === 'CONFIRMED')) {
      await db
        .update(hostelRooms)
        .set({ currentOccupancy: sql`${hostelRooms.currentOccupancy} - 1` })
        .where(eq(hostelRooms.id, booking.roomId));
    }

    // Notify student of status change
    let notificationMessage = '';
    let notificationType: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'INFO';

    switch (status) {
      case 'CONFIRMED':
        notificationMessage = 'Your room booking has been confirmed!';
        notificationType = 'SUCCESS';
        break;
      case 'REJECTED':
        notificationMessage = 'Your room booking has been rejected. Please contact administration for more details.';
        notificationType = 'ERROR';
        break;
      case 'CANCELLED':
        notificationMessage = 'Your room booking has been cancelled.';
        notificationType = 'WARNING';
        break;
    }

    if (notificationMessage) {
      await createNotification({
        userId: booking.studentId,
        title: 'Booking Status Update',
        message: notificationMessage,
        type: notificationType,
        link: '/housing',
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating booking:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
