import { NextResponse } from "next/server";
import { db } from "@/db";
import { routes, routeStops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const routeSchema = z.object({
  name: z.string().min(1),
  startPoint: z.string().min(1),
  endPoint: z.string().min(1),
});

const stopSchema = z.object({
  stopName: z.string().min(1),
  sequenceOrder: z.number().int().min(1),
});

const updateRouteSchema = routeSchema.extend({
  stops: z.array(stopSchema).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const [route] = await db.select().from(routes).where(eq(routes.id, params.id));
    if (!route) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    const stops = await db.select().from(routeStops).where(eq(routeStops.routeId, params.id));
    stops.sort((a, b) => a.sequenceOrder - b.sequenceOrder);

    return NextResponse.json({ route, stops });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch route" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const parsed = updateRouteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error }, { status: 400 });
    }

    const [existing] = await db.select().from(routes).where(eq(routes.id, params.id));
    if (!existing) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    const { stops, ...routeData } = parsed.data;

    await db.update(routes).set(routeData).where(eq(routes.id, params.id));

    // If stops provided, replace them
    if (stops) {
      await db.delete(routeStops).where(eq(routeStops.routeId, params.id));
      if (stops.length > 0) {
        await db.insert(routeStops).values(
          stops.map((s) => ({
            routeId: params.id,
            stopName: s.stopName,
            sequenceOrder: s.sequenceOrder,
          }))
        );
      }
    }

    const [updated] = await db.select().from(routes).where(eq(routes.id, params.id));
    const updatedStops = await db.select().from(routeStops).where(eq(routeStops.routeId, params.id));

    return NextResponse.json({ route: updated, stops: updatedStops });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update route" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const [existing] = await db.select().from(routes).where(eq(routes.id, params.id));
    if (!existing) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    await db.delete(routes).where(eq(routes.id, params.id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete route" }, { status: 500 });
  }
}
