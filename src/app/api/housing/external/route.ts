import { auth } from "@/auth";
import { db } from "@/db";
import { externalListings } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * GET /api/housing/external
 * Fetches all external listings
 */
export async function GET(request: Request) {
  const session = await auth();

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const availableOnly = searchParams.get("available") === "true";

  try {
    const listings = availableOnly
      ? await db
          .select()
          .from(externalListings)
          .where(eq(externalListings.isAvailable, true))
          .orderBy(desc(externalListings.createdAt))
      : await db
          .select()
          .from(externalListings)
          .orderBy(desc(externalListings.createdAt));

    // Fetch landlord info for each listing
    const enrichedListings = await Promise.all(
      listings.map(async (listing) => {
        const landlordInfo = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.id, listing.landlordId),
          columns: {
            id: true,
            name: true,
            email: true,
          },
        });

        return {
          ...listing,
          landlord: landlordInfo,
        };
      })
    );

    return NextResponse.json(enrichedListings);
  } catch (error) {
    console.error("Error fetching external listings:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

/**
 * POST /api/housing/external
 * Creates a new external listing (landlords only)
 */
export async function POST(request: Request) {
  const session = await auth();

  if (!session || session.user.role !== "LANDLORD") {
    return new NextResponse("Unauthorized - Landlords only", { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, location, price, images } = body;

    if (!title || !location || !price) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const [listing] = await db
      .insert(externalListings)
      .values({
        landlordId: session.user.id,
        title,
        description,
        location,
        price,
        images: images || [],
        isAvailable: true,
      })
      .returning();

    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    console.error("Error creating listing:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
