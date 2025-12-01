import { NextResponse } from "next/server";
import { db } from "@/db";
import { vehicles, vehicleStatuses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateVehicleSchema = z.object({
  plateNumber: z.string().min(1).optional(),
  capacity: z.number().int().min(1).optional(),
  currentRouteId: z.string().nullable().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, params.id));
    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    const statuses = await db.select().from(vehicleStatuses).where(eq(vehicleStatuses.vehicleId, params.id));
    statuses.sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));

    return NextResponse.json({ vehicle, statuses });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch vehicle" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const parsed = updateVehicleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error }, { status: 400 });
    }

    const [existing] = await db.select().from(vehicles).where(eq(vehicles.id, params.id));
    if (!existing) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    await db.update(vehicles).set(parsed.data).where(eq(vehicles.id, params.id));

    const [updated] = await db.select().from(vehicles).where(eq(vehicles.id, params.id));

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update vehicle" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const [existing] = await db.select().from(vehicles).where(eq(vehicles.id, params.id));
    if (!existing) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    await db.delete(vehicles).where(eq(vehicles.id, params.id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete vehicle" }, { status: 500 });
  }
}
