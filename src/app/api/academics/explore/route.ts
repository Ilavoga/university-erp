import { auth } from "@/auth";
import { generateRecommendations } from "@/lib/recommendation-engine";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Trigger the engine to seed/update recommendations
    const recommendations = await generateRecommendations(session.user.id);
    
    return NextResponse.json(recommendations);
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
