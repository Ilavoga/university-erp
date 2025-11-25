import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity-logger";

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, profileData } = body;

    // Get current user data
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id));

    if (!currentUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Merge new profile data with existing
    const mergedProfileData = {
      ...(currentUser.profileData || {}),
      ...profileData,
    };

    // Update user
    const [updated] = await db
      .update(users)
      .set({
        name: name || currentUser.name,
        profileData: mergedProfileData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))
      .returning();

    // Log the activity
    await logActivity({
      userId: session.user.id,
      actionType: 'PROFILE_UPDATED',
      metadata: {
        fieldsUpdated: Object.keys(profileData || {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating profile:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET() {
  const session = await auth();

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        image: users.image,
        profileData: users.profileData,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, session.user.id));

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
