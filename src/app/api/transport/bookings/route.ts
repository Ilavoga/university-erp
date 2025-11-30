import { NextResponse } from "next/server";
import { db } from "@/db";
import { vehicleBookings, vehicles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const createBookingSchema = z.object({
  studentId: z.string().min(1),
  vehicleId: z.string().min(1),
  routeId: z.string().min(1),
  pickupStopId: z.string().optional(),
  dropoffStopId: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const vehicleId = searchParams.get("vehicleId");

    let query = db.select().from(vehicleBookings);

    if (studentId) {
      query = query.where(eq(vehicleBookings.studentId, studentId)) as any;
    } else if (vehicleId) {
      query = query.where(eq(vehicleBookings.vehicleId, vehicleId)) as any;
    }

    const bookings = await query;
    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error }, { status: 400 });
    }

    const { vehicleId, studentId, routeId, pickupStopId, dropoffStopId } = parsed.data;

    // Check vehicle capacity
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, vehicleId));
    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    // Count CONFIRMED bookings only (not CANCELLED or COMPLETED)
    const confirmedBookings = await db
      .select()
      .from(vehicleBookings)
      .where(
        and(
          eq(vehicleBookings.vehicleId, vehicleId),
          eq(vehicleBookings.status, "CONFIRMED")
        )
      );

    const availableSeats = vehicle.capacity - confirmedBookings.length;
    if (availableSeats <= 0) {
      return NextResponse.json({ error: "Vehicle is fully booked", availableSeats: 0 }, { status: 400 });
    }

    const [booking] = await db.insert(vehicleBookings).values({
      studentId,
      vehicleId,
      routeId,
      pickupStopId: pickupStopId ?? null,
      dropoffStopId: dropoffStopId ?? null,
      status: "CONFIRMED",
    }).returning();

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
