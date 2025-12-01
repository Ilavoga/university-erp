import { auth } from "@/auth";
import { db } from "@/db";
import { hostelBlocks, hostelRooms, roomBookings } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * GET /api/housing/internal
 * Fetches all hostel blocks with their rooms and availability
 */
export async function GET() {
  const session = await auth();

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Fetch all blocks with their rooms
    const blocks = await db.query.hostelBlocks.findMany({
      with: {
        rooms: true,
      },
    });

    // Enrich with availability status
    const enrichedBlocks = blocks.map((block) => ({
      ...block,
      rooms: block.rooms.map((room) => ({
        ...room,
        isAvailable: room.currentOccupancy < room.capacity,
        spotsLeft: room.capacity - room.currentOccupancy,
      })),
    }));

    return NextResponse.json(enrichedBlocks);
  } catch (error) {
    console.error("Error fetching hostel data:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
