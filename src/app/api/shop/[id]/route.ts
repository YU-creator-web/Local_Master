import { NextRequest, NextResponse } from "next/server";
import { getPlaceDetails } from "@/lib/places";
import { generateShopGuide } from "@/lib/vertex";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const placeId = resolvedParams.id;

  if (!placeId) {
    return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  }

  try {
    // 1. Get Details
    const details = await getPlaceDetails(placeId);
    if (!details) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    // 2. Generate AI Guide
    const reviews = details.reviews?.map((r: any) => r.text?.text).filter(Boolean) || [];
    
    const apiGuide = await generateShopGuide({
      name: details.displayName?.text || "",
      address: details.formattedAddress,
      types: details.types,
      reviews: reviews
    });

    return NextResponse.json({
      shop: details,
      aiGuide: apiGuide
    });

  } catch (error) {
    console.error("Shop Detail API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
