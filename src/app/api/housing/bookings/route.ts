import { auth } from "@/auth";
import { db } from "@/db";
import { roomBookings, hostelRooms } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { logActivity, createNotification } from "@/lib/activity-logger";

/**
 * GET /api/housing/bookings
 * Fetches current user's booking history
 */
export async function GET() {
  const session = await auth();

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const userBookings = await db.query.roomBookings.findMany({
      where: eq(roomBookings.studentId, session.user.id),
      with: {
        room: {
          with: {
            block: true,
          },
        },
      },
      orderBy: (bookings, { desc }) => [desc(bookings.createdAt)],
    });

    return NextResponse.json(userBookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

/**
 * POST /api/housing/bookings
 * Creates a new room booking
 */
export async function POST(request: Request) {
  const session = await auth();

  if (!session || session.user.role !== "STUDENT") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { roomId, semester } = body;

    if (!roomId || !semester) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Check if room exists and has availability
    const [room] = await db
      .select()
      .from(hostelRooms)
      .where(eq(hostelRooms.id, roomId));

    if (!room) {
      return new NextResponse("Room not found", { status: 404 });
    }

    if (room.currentOccupancy >= room.capacity) {
      return new NextResponse("Room is full", { status: 400 });
    }

    // Check if user already has a booking for this semester
    const existingBooking = await db
      .select()
      .from(roomBookings)
      .where(
        and(
          eq(roomBookings.studentId, session.user.id),
          eq(roomBookings.semester, semester),
          sql`${roomBookings.status} IN ('PENDING', 'CONFIRMED')`
        )
      );

    if (existingBooking.length > 0) {
      return new NextResponse("You already have an active booking for this semester", { status: 400 });
    }

    // Create booking
    const [booking] = await db
      .insert(roomBookings)
      .values({
        studentId: session.user.id,
        roomId,
        semester,
        status: 'PENDING',
      })
      .returning();

    // Update room occupancy
    await db
      .update(hostelRooms)
      .set({ currentOccupancy: sql`${hostelRooms.currentOccupancy} + 1` })
      .where(eq(hostelRooms.id, roomId));

    // Log activity
    await logActivity({
      userId: session.user.id,
      actionType: 'PROFILE_UPDATED', // Using this as a placeholder for booking
      referenceId: booking.id,
      referenceType: 'room_booking',
      metadata: { roomNumber: room.roomNumber, semester },
    });

    // Create notification
    await createNotification({
      userId: session.user.id,
      title: 'Room Booking Submitted',
      message: `Your booking request for Room ${room.roomNumber} (${semester}) is pending approval.`,
      type: 'INFO',
      link: '/housing',
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Error creating booking:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
