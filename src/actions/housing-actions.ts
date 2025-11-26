"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { roomBookings, hostelRooms, listingInquiries, externalListings } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { uploadImage } from "@/lib/storage";
import { supabaseAdmin } from "@/lib/supabase";

export async function createListingAction(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "LANDLORD") {
    throw new Error("Unauthorized");
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const location = formData.get("location") as string;
  const price = parseInt(formData.get("price") as string);
  const images = formData.getAll("images") as File[];

  if (!title || !location || !price) {
    throw new Error("Missing required fields");
  }

  const imageUrls: string[] = [];

  for (const file of images) {
    if (file.size > 0 && file.type.startsWith("image/")) {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "");
      const path = `listings/${session.user.id}/${timestamp}-${safeName}`;
      
      // Use admin client for server-side upload
      const url = await uploadImage(file, path, undefined, supabaseAdmin || undefined);
      if (url) imageUrls.push(url);
    }
  }

  await db.insert(externalListings).values({
    landlordId: session.user.id,
    title,
    description,
    location,
    price,
    images: imageUrls,
    isAvailable: true,
  });

  revalidatePath("/housing/external");
  revalidatePath("/housing/landlord");
  redirect("/housing/landlord");
}

export async function toggleListingAvailabilityAction(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "LANDLORD") {
    throw new Error("Unauthorized");
  }

  const listingId = formData.get("listingId") as string;
  const isAvailable = formData.get("isAvailable") === "true";

  await db
    .update(externalListings)
    .set({ isAvailable: !isAvailable })
    .where(and(eq(externalListings.id, listingId), eq(externalListings.landlordId, session.user.id)));

  revalidatePath("/housing/external");
  revalidatePath("/housing/landlord");
  revalidatePath(`/housing/external/${listingId}`);
}

export async function bookRoomAction(formData: FormData) {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const roomId = formData.get("roomId") as string;
  const semester = formData.get("semester") as string;

  if (!roomId || !semester) {
    throw new Error("Missing required fields");
  }

  // Check availability again (race condition check)
  const room = await db.query.hostelRooms.findFirst({
    where: eq(hostelRooms.id, roomId),
  });

  if (!room) {
    throw new Error("Room not found");
  }

  if (room.currentOccupancy >= room.capacity) {
    throw new Error("Room is full");
  }

  // Create booking
  await db.insert(roomBookings).values({
    studentId: session.user.id,
    roomId,
    semester,
    status: "PENDING",
  });

  // Update occupancy
  await db
    .update(hostelRooms)
    .set({ currentOccupancy: sql`${hostelRooms.currentOccupancy} + 1` })
    .where(eq(hostelRooms.id, roomId));

  revalidatePath("/housing/internal");
  revalidatePath(`/housing/internal/${room.blockId}`);
  redirect("/housing/internal?success=true");
}

export async function sendInquiryAction(formData: FormData) {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const listingId = formData.get("listingId") as string;
  const message = formData.get("message") as string;

  if (!listingId || !message) {
    throw new Error("Missing required fields");
  }

  await db.insert(listingInquiries).values({
    studentId: session.user.id,
    listingId,
    message,
  });

  revalidatePath(`/housing/external/${listingId}`);
  return { success: true };
}

export async function updateBookingStatusAction(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const bookingId = formData.get("bookingId") as string;
  const status = formData.get("status") as "CONFIRMED" | "REJECTED" | "PENDING";

  if (!bookingId || !status) {
    throw new Error("Missing required fields");
  }

  await db
    .update(roomBookings)
    .set({ status })
    .where(eq(roomBookings.id, bookingId));

  revalidatePath("/housing/admin");
}
