"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { roomBookings, hostelRooms, listingInquiries, externalListings, hostelBlocks } from "@/db/schema";
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

  console.log(`[createListingAction] Processing ${images.length} images for user ${session.user.id}`);

  for (const file of images) {
    if (file.size > 0 && file.type.startsWith("image/")) {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "");
      const path = `listings/${session.user.id}/${timestamp}-${safeName}`;
      
      console.log(`[createListingAction] Uploading: ${path}, size: ${file.size} bytes`);
      
      // Use admin client for server-side upload
      const url = await uploadImage(file, path, undefined, supabaseAdmin || undefined);
      console.log(`[createListingAction] Uploaded, URL: ${url}`);
      
      if (url) imageUrls.push(url);
    }
  }

  console.log(`[createListingAction] Final imageUrls:`, imageUrls);

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

export async function updateListingAction(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "LANDLORD") {
    throw new Error("Unauthorized");
  }

  const listingId = formData.get("listingId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const location = formData.get("location") as string;
  const price = parseInt(formData.get("price") as string);
  const existingImagesJson = formData.get("existingImages") as string;
  const newImages = formData.getAll("images") as File[];

  if (!listingId || !title || !location || !price) {
    throw new Error("Missing required fields");
  }

  // Verify ownership
  const listing = await db.query.externalListings.findFirst({
    where: and(
      eq(externalListings.id, listingId),
      eq(externalListings.landlordId, session.user.id)
    ),
  });

  if (!listing) {
    throw new Error("Listing not found or unauthorized");
  }

  // Parse existing images that were kept
  const existingImages: string[] = existingImagesJson ? JSON.parse(existingImagesJson) : [];

  // Upload new images
  const newImageUrls: string[] = [];
  for (const file of newImages) {
    if (file.size > 0 && file.type.startsWith("image/")) {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "");
      const path = `listings/${session.user.id}/${timestamp}-${safeName}`;
      
      const url = await uploadImage(file, path, undefined, supabaseAdmin || undefined);
      if (url) newImageUrls.push(url);
    }
  }

  // Combine existing and new images
  const allImages = [...existingImages, ...newImageUrls];

  await db
    .update(externalListings)
    .set({
      title,
      description,
      location,
      price,
      images: allImages,
    })
    .where(eq(externalListings.id, listingId));

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

export async function sendInquiryAction(formData: FormData): Promise<void> {
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

export async function createHostelBlockAction(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const location = formData.get("location") as string;
  const genderRestriction = (formData.get("genderRestriction") as string) ?? "MIXED";
  const imageFiles = formData.getAll("images") as File[];

  if (!name || !location) {
    throw new Error("Missing required fields");
  }

  const MAX_IMAGES = 6;
  const imageUrls: string[] = [];
  for (const file of imageFiles.slice(0, MAX_IMAGES)) {
    if (file && file.size > 0 && file.type.startsWith("image/")) {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "");
      const path = `hostels/${timestamp}-${safeName}`;
      const { uploadImage } = await import("@/lib/storage");
      const { supabaseAdmin } = await import("@/lib/supabase");
      const url = await uploadImage(file, path, undefined, supabaseAdmin || undefined);
      if (url) imageUrls.push(url);
    }
  }

  await db.insert(hostelBlocks).values({
    name,
    location,
    genderRestriction: genderRestriction as "MALE" | "FEMALE" | "MIXED",
    images: imageUrls,
  });

  revalidatePath("/housing/admin");
}

export async function updateHostelBlockAction(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const blockId = formData.get("blockId") as string;
  const name = formData.get("name") as string;
  const location = formData.get("location") as string;
  const genderRestriction = formData.get("genderRestriction") as string;
  const existingImagesJson = formData.get("existingImages") as string;
  const imagesToRemoveJson = formData.get("imagesToRemove") as string;
  const newImageFiles = formData.getAll("images") as File[];

  if (!blockId || !name || !location) {
    throw new Error("Missing required fields");
  }

  // Parse existing images data
  const existingImages: string[] = existingImagesJson ? JSON.parse(existingImagesJson) : [];
  const imagesToRemove: string[] = imagesToRemoveJson ? JSON.parse(imagesToRemoveJson) : [];

  // Calculate remaining slots for new images
  const MAX_IMAGES = 6;
  const remainingSlots = Math.max(0, MAX_IMAGES - existingImages.length);

  // Upload new images
  const newImageUrls: string[] = [];
  if (remainingSlots > 0) {
    for (const file of newImageFiles.slice(0, remainingSlots)) {
      if (file && file.size > 0 && file.type.startsWith("image/")) {
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "");
        const path = `hostels/${blockId}/${timestamp}-${safeName}`;
        const { uploadImage } = await import("@/lib/storage");
        const { supabaseAdmin } = await import("@/lib/supabase");
        const url = await uploadImage(file, path, undefined, supabaseAdmin || undefined);
        if (url) newImageUrls.push(url);
      }
    }
  }

  // Combine existing (not removed) images with new uploads
  const finalImages = [...existingImages, ...newImageUrls];

  // TODO: Optionally delete removed images from Supabase storage
  // for (const url of imagesToRemove) {
  //   // Delete from storage
  // }

  await db
    .update(hostelBlocks)
    .set({
      name,
      location,
      genderRestriction: genderRestriction as "MALE" | "FEMALE" | "MIXED",
      images: finalImages,
    })
    .where(eq(hostelBlocks.id, blockId));

  revalidatePath("/housing/admin");
}

// Hostel Room Management Actions
export async function createHostelRoomAction(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const blockId = formData.get("blockId") as string;
  const roomNumber = formData.get("roomNumber") as string;
  const capacity = parseInt(formData.get("capacity") as string);
  const pricePerSemester = parseInt(formData.get("pricePerSemester") as string);
  const imageFiles = formData.getAll("images") as File[];

  if (!blockId || !roomNumber || !capacity || !pricePerSemester) {
    throw new Error("Missing required fields");
  }

  if (capacity < 1 || pricePerSemester < 0) {
    throw new Error("Invalid capacity or price");
  }

  const MAX_IMAGES = 6;
  const imageUrls: string[] = [];
  for (const file of imageFiles.slice(0, MAX_IMAGES)) {
    if (file && file.size > 0 && file.type.startsWith("image/")) {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "");
      const path = `hostels/${blockId}/rooms/${timestamp}-${safeName}`;
      const { uploadImage } = await import("@/lib/storage");
      const { supabaseAdmin } = await import("@/lib/supabase");
      const url = await uploadImage(file, path, undefined, supabaseAdmin || undefined);
      if (url) imageUrls.push(url);
    }
  }

  await db.insert(hostelRooms).values({
    blockId,
    roomNumber,
    capacity,
    currentOccupancy: 0,
    pricePerSemester,
    images: imageUrls,
  });

  revalidatePath("/housing/admin");
}

export async function updateHostelRoomAction(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const roomId = formData.get("roomId") as string;
  const blockId = formData.get("blockId") as string;
  const roomNumber = formData.get("roomNumber") as string;
  const capacity = parseInt(formData.get("capacity") as string);
  const pricePerSemester = parseInt(formData.get("pricePerSemester") as string);
  const existingImagesJson = formData.get("existingImages") as string;
  const imagesToRemoveJson = formData.get("imagesToRemove") as string;
  const newImageFiles = formData.getAll("images") as File[];

  if (!roomId || !blockId || !roomNumber || !capacity || !pricePerSemester) {
    throw new Error("Missing required fields");
  }

  if (capacity < 1 || pricePerSemester < 0) {
    throw new Error("Invalid capacity or price");
  }

  const existingImages: string[] = existingImagesJson ? JSON.parse(existingImagesJson) : [];
  const imagesToRemove: string[] = imagesToRemoveJson ? JSON.parse(imagesToRemoveJson) : [];

  const MAX_IMAGES = 6;
  const remainingSlots = Math.max(0, MAX_IMAGES - existingImages.length);

  const newImageUrls: string[] = [];
  if (remainingSlots > 0) {
    for (const file of newImageFiles.slice(0, remainingSlots)) {
      if (file && file.size > 0 && file.type.startsWith("image/")) {
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "");
        const path = `hostels/${blockId}/rooms/${timestamp}-${safeName}`;
        const { uploadImage } = await import("@/lib/storage");
        const { supabaseAdmin } = await import("@/lib/supabase");
        const url = await uploadImage(file, path, undefined, supabaseAdmin || undefined);
        if (url) newImageUrls.push(url);
      }
    }
  }

  const finalImages = [...existingImages, ...newImageUrls];

  await db
    .update(hostelRooms)
    .set({
      roomNumber,
      capacity,
      pricePerSemester,
      images: finalImages,
    })
    .where(eq(hostelRooms.id, roomId));

  revalidatePath("/housing/admin");
}

export async function deleteHostelRoomAction(roomId: string) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  if (!roomId) {
    throw new Error("Room ID is required");
  }

  // Check if room has active bookings
  const activeBookings = await db.query.roomBookings.findFirst({
    where: eq(roomBookings.roomId, roomId),
  });

  if (activeBookings && activeBookings.status === "CONFIRMED") {
    throw new Error("Cannot delete room with confirmed bookings");
  }

  await db.delete(hostelRooms).where(eq(hostelRooms.id, roomId));

  revalidatePath("/housing/admin");
}
