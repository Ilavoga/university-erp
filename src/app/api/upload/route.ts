import { auth } from "@/auth";
import { uploadImage } from "@/lib/storage";
import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new NextResponse("No file provided", { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return new NextResponse("File must be an image", { status: 400 });
    }

    // Create a unique path: uploads/{userId}/{timestamp}-{filename}
    const timestamp = Date.now();
    // Sanitize filename
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "");
    const path = `uploads/${session.user.id}/${timestamp}-${safeName}`;

    // Use admin client if available to bypass RLS
    const url = await uploadImage(file, path, undefined, supabaseAdmin || undefined);

    if (!url) {
      return new NextResponse("Upload failed", { status: 500 });
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload error:", error);
    return new NextResponse(`Internal Server Error: ${error instanceof Error ? error.message : String(error)}`, { status: 500 });
  }
}
