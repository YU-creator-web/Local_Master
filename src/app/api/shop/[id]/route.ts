import { NextRequest, NextResponse } from "next/server";
import { getPlaceDetails } from "@/lib/places";
import { generateShopGuide } from "@/lib/vertex";
import { adminDb } from "@/lib/firebase/admin";

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
    // 0. Check Cache (Firestore)
    const docRef = adminDb.collection('shops').doc(placeId);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const cachedData = docSnap.data();
      
      // TTL Check (90 days)
      const cachedAt = new Date(cachedData?.cachedAt || 0).getTime();
      const now = Date.now();
      const threeMonthsMs = 90 * 24 * 60 * 60 * 1000;

      if (now - cachedAt > threeMonthsMs) {
        console.log(`[Cache Expired] Data is older than 90 days: ${placeId}`);
        // Fall through to fetch fresh data
      } else if (cachedData?.shop && cachedData?.aiGuide) {
        console.log(`[Cache Hit] Serving from Firestore: ${placeId}`);
        return NextResponse.json(cachedData); 
      }
    }

    console.log(`[Cache Miss] Fetching fresh data: ${placeId}`);

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

    const responseData = {
      shop: details,
      aiGuide: apiGuide,
      cachedAt: new Date().toISOString() // Metadata
    };

    // 3. Save to Cache (Fire & Forget, or await depending on critical need. Await is safer for now)
    await docRef.set(responseData);
    console.log(`[Cache Write] Saved to Firestore: ${placeId}`);

    return NextResponse.json(responseData);

  } catch (error) {
    console.error("Shop Detail API Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Internal Server Error: ${errorMessage}` }, { status: 500 });
  }
}
