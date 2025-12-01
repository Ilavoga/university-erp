import { NextResponse } from "next/server";
import { db } from "@/db";
import { routes, routeStops, vehicles, vehicleStatuses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const createRouteSchema = z.object({
  name: z.string().min(1),
  startPoint: z.string().min(1),
  endPoint: z.string().min(1),
  stops: z.array(z.object({
    stopName: z.string().min(1),
    sequenceOrder: z.number().int().min(1),
  })).optional(),
});

export async function GET() {
  try {
    const allRoutes = await db.select().from(routes);

    const routeIds = allRoutes.map((r) => r.id);
    // Fetch all stops for all routes, ordered by sequence
    const stopsByRoute: Record<string, Array<{
      id: string;
      routeId: string;
      stopName: string;
      sequenceOrder: number;
    }>> = {};
    if (routeIds.length) {
      const stops = await db.select().from(routeStops);
      for (const s of stops) {
        const list = stopsByRoute[s.routeId] ?? [];
        list.push(s);
        stopsByRoute[s.routeId] = list;
      }
      for (const rid of Object.keys(stopsByRoute)) {
        stopsByRoute[rid].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
      }
    }

    // Vehicles per route + latest status
    const allVehicles = await db.select().from(vehicles);
    const statuses = await db.select().from(vehicleStatuses);
    const latestStatusByVehicle: Record<string, typeof statuses[number]> = {};
    for (const s of statuses) {
      const prev = latestStatusByVehicle[s.vehicleId];
      if (!prev || (s.updatedAt ?? 0) > (prev.updatedAt ?? 0)) {
        latestStatusByVehicle[s.vehicleId] = s;
      }
    }

    const vehiclesByRoute: Record<string, Array<{ vehicle: typeof allVehicles[number]; status?: typeof statuses[number] }>> = {};
    for (const v of allVehicles) {
      const rid = v.currentRouteId ?? "";
      if (!rid) continue;
      const list = vehiclesByRoute[rid] ?? [];
      list.push({ vehicle: v, status: latestStatusByVehicle[v.id] });
      vehiclesByRoute[rid] = list;
    }

    const result = allRoutes.map((r) => ({
      route: r,
      stops: stopsByRoute[r.id] ?? [],
      vehicles: vehiclesByRoute[r.id] ?? [],
      availableSeats: vehiclesByRoute[r.id]?.reduce((sum, v) => sum + v.vehicle.capacity, 0) ?? 0,
    }));

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch routes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createRouteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error }, { status: 400 });
    }

    const { stops, ...routeData } = parsed.data;

    const [route] = await db.insert(routes).values(routeData).returning();

    if (stops && stops.length > 0) {
      await db.insert(routeStops).values(
        stops.map((s) => ({
          routeId: route.id,
          stopName: s.stopName,
          sequenceOrder: s.sequenceOrder,
        }))
      );
    }

    const createdStops = await db.select().from(routeStops).where(eq(routeStops.routeId, route.id));

    return NextResponse.json({ route, stops: createdStops }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create route" }, { status: 500 });
  }
}
