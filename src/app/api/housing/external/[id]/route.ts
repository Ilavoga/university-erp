import { auth } from "@/auth";
import { db } from "@/db";
import { externalListings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * GET /api/housing/external/[id]
 * Fetches a single external listing
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  try {
    const listing = await db.query.externalListings.findFirst({
      where: eq(externalListings.id, id),
      with: {
        landlord: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!listing) {
      return new NextResponse("Listing not found", { status: 404 });
    }

    return NextResponse.json(listing);
  } catch (error) {
    console.error("Error fetching listing:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

/**
 * PATCH /api/housing/external/[id]
 * Updates an external listing (landlord only)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session || session.user.role !== "LANDLORD") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();

    // Verify ownership
    const [existing] = await db
      .select()
      .from(externalListings)
      .where(eq(externalListings.id, id));

    if (!existing) {
      return new NextResponse("Listing not found", { status: 404 });
    }

    if (existing.landlordId !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const [updated] = await db
      .update(externalListings)
      .set({
        ...body,
        landlordId: session.user.id, // Prevent landlord ID from being changed
      })
      .where(eq(externalListings.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating listing:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

/**
 * DELETE /api/housing/external/[id]
 * Deletes an external listing (landlord only)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session || session.user.role !== "LANDLORD") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  try {
    // Verify ownership
    const [existing] = await db
      .select()
      .from(externalListings)
      .where(eq(externalListings.id, id));

    if (!existing) {
      return new NextResponse("Listing not found", { status: 404 });
    }

    if (existing.landlordId !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    await db.delete(externalListings).where(eq(externalListings.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting listing:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
