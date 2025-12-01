import { NextResponse } from "next/server";
import { db } from "@/db";
import { vehicles, vehicleStatuses, routeStops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["LOADING", "DEPARTED", "EN_ROUTE"]),
  currentStopId: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const { status, currentStopId } = parsed.data;

    // Ensure vehicle exists
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, params.id));
    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    // Optional: validate stop belongs to the vehicle's current route
    if (currentStopId && vehicle.currentRouteId) {
      const [stop] = await db.select().from(routeStops).where(eq(routeStops.id, currentStopId));
      if (!stop || stop.routeId !== vehicle.currentRouteId) {
        return NextResponse.json({ error: "Stop does not belong to vehicle route" }, { status: 400 });
      }
    }

    const now = new Date();
    await db.insert(vehicleStatuses).values({
      vehicleId: params.id,
      currentStopId: currentStopId ?? null,
      status,
      updatedAt: now,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
