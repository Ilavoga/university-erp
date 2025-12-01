import { auth } from "@/auth";
import { db } from "@/db";
import { listingInquiries, externalListings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createNotification } from "@/lib/activity-logger";

/**
 * GET /api/housing/inquiries
 * Fetches inquiries:
 * - For students: their own inquiries
 * - For landlords: inquiries about their listings
 */
export async function GET() {
  const session = await auth();

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    if (session.user.role === "STUDENT") {
      // Fetch student's inquiries
      const inquiries = await db.query.listingInquiries.findMany({
        where: eq(listingInquiries.studentId, session.user.id),
        with: {
          listing: {
            with: {
              landlord: {
                columns: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: (inquiries, { desc }) => [desc(inquiries.createdAt)],
      });

      return NextResponse.json(inquiries);
    } else if (session.user.role === "LANDLORD") {
      // Fetch inquiries about landlord's listings
      const landlordListings = await db
        .select({ id: externalListings.id })
        .from(externalListings)
        .where(eq(externalListings.landlordId, session.user.id));

      const listingIds = landlordListings.map((l) => l.id);

      const inquiries = await db.query.listingInquiries.findMany({
        where: (inquiries, { inArray }) => inArray(inquiries.listingId, listingIds),
        with: {
          student: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
          listing: true,
        },
        orderBy: (inquiries, { desc }) => [desc(inquiries.createdAt)],
      });

      return NextResponse.json(inquiries);
    } else {
      return new NextResponse("Forbidden", { status: 403 });
    }
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

/**
 * POST /api/housing/inquiries
 * Creates a new inquiry about a listing (students only)
 */
export async function POST(request: Request) {
  const session = await auth();

  if (!session || session.user.role !== "STUDENT") {
    return new NextResponse("Unauthorized - Students only", { status: 401 });
  }

  try {
    const body = await request.json();
    const { listingId, message } = body;

    if (!listingId || !message) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Verify listing exists
    const listing = await db.query.externalListings.findFirst({
      where: eq(externalListings.id, listingId),
    });

    if (!listing) {
      return new NextResponse("Listing not found", { status: 404 });
    }

    // Create inquiry
    const [inquiry] = await db
      .insert(listingInquiries)
      .values({
        studentId: session.user.id,
        listingId,
        message,
      })
      .returning();

    // Notify landlord
    await createNotification({
      userId: listing.landlordId,
      title: 'New Listing Inquiry',
      message: `${session.user.name} sent an inquiry about your listing "${listing.title}".`,
      type: 'INFO',
      link: '/housing',
    });

    // Notify student (confirmation)
    await createNotification({
      userId: session.user.id,
      title: 'Inquiry Sent',
      message: `Your inquiry about "${listing.title}" has been sent to the landlord.`,
      type: 'SUCCESS',
      link: '/housing',
    });

    return NextResponse.json(inquiry, { status: 201 });
  } catch (error) {
    console.error("Error creating inquiry:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
