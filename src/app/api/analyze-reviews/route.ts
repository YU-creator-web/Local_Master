import { NextRequest, NextResponse } from "next/server";
import { getPlaceDetails } from "@/lib/places";
import { analyzeShopReviews } from "@/lib/vertex";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { placeId, shopName } = await request.json();

    if (!placeId || !shopName) {
      return NextResponse.json({ error: "Missing placeId or shopName" }, { status: 400 });
    }

    // 1. Fetch Reviews (Cost incurs here: Places Details API)
    // We intentionally fetch details here on-demand to save costs on the main list.
    const details = await getPlaceDetails(placeId);
    if (!details) {
      return NextResponse.json({ error: "Shop details not found" }, { status: 404 });
    }

    const reviews = details.reviews?.map((r: any) => r.text?.text).filter(Boolean) || [];

    if (reviews.length === 0) {
      return NextResponse.json({ 
        analysis: {
          is_suspicious: false,
          suspicion_level: "low",
          suspicion_reason: "口コミが見つかりませんでした",
          negative_points: [],
          reality_summary: "口コミがないため分析不能"
        }
      });
    }

    // 2. Perform AI Analysis
    const analysis = await analyzeShopReviews(shopName, reviews);

    return NextResponse.json({ analysis });

  } catch (error) {
    console.error("Analysis API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
