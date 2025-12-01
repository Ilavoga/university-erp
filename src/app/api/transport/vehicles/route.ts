import { NextResponse } from "next/server";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { z } from "zod";

const createVehicleSchema = z.object({
  plateNumber: z.string().min(1),
  capacity: z.number().int().min(1),
  currentRouteId: z.string().optional(),
});

export async function GET() {
  try {
    const allVehicles = await db.select().from(vehicles);
    return NextResponse.json(allVehicles);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch vehicles" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createVehicleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error }, { status: 400 });
    }

    const [vehicle] = await db.insert(vehicles).values({
      plateNumber: parsed.data.plateNumber,
      capacity: parsed.data.capacity,
      currentRouteId: parsed.data.currentRouteId ?? null,
    }).returning();

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create vehicle" }, { status: 500 });
  }
}
