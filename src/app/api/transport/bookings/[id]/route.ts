import { NextResponse } from "next/server";
import { db } from "@/db";
import { vehicleBookings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateBookingSchema = z.object({
  status: z.enum(["CONFIRMED", "CANCELLED", "COMPLETED"]),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const [booking] = await db.select().from(vehicleBookings).where(eq(vehicleBookings.id, params.id));
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json(booking);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch booking" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const parsed = updateBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error }, { status: 400 });
    }

    const [existing] = await db.select().from(vehicleBookings).where(eq(vehicleBookings.id, params.id));
    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    await db.update(vehicleBookings).set({ status: parsed.data.status }).where(eq(vehicleBookings.id, params.id));

    const [updated] = await db.select().from(vehicleBookings).where(eq(vehicleBookings.id, params.id));

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const [existing] = await db.select().from(vehicleBookings).where(eq(vehicleBookings.id, params.id));
    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    await db.delete(vehicleBookings).where(eq(vehicleBookings.id, params.id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete booking" }, { status: 500 });
  }
}
