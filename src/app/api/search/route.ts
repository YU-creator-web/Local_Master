import { NextRequest, NextResponse } from "next/server";
import { searchNearby, getPlaceDetails, searchByText } from "@/lib/places";
import { generateOldShopScore, OldShopScoreResult } from "@/lib/vertex";

export const runtime = "nodejs"; // Vertex AI Node SDK works best in Node runtime

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = parseFloat(searchParams.get("lat") || "0");
  const lng = parseFloat(searchParams.get("lng") || "0");
  const radius = parseInt(searchParams.get("radius") || "1000", 10);
  
  let targetLat = lat;
  let targetLng = lng;
  const station = searchParams.get("station");

  // Geocoding if station is provided and lat/lng are missing
  if ((!targetLat || !targetLng) && station) {
    try {
      const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(station)}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();
      
      if (geoData.results && geoData.results.length > 0) {
        targetLat = geoData.results[0].geometry.location.lat;
        targetLng = geoData.results[0].geometry.location.lng;
      } else {
        return NextResponse.json({ error: "Station not found" }, { status: 404 });
      }
    } catch (e) {
      console.error("Geocoding error:", e);
      return NextResponse.json({ error: "Geocoding failed" }, { status: 500 });
    }
  }
  
const genre = searchParams.get("genre");
  
  if (!targetLat || !targetLng) {
    return NextResponse.json({ error: "Missing lat/lng or valid station" }, { status: 400 });
  }

  try {
    // 1. Search Places
    let places;
    if (genre) {
        places = await searchByText(genre, targetLat, targetLng, radius);
    } else {
        places = await searchNearby(targetLat, targetLng, radius);
    }

    if (places.length === 0) {
      return NextResponse.json({ shops: [] });
    }

    // 2. Score shops (Optimized: Score only top 5 for MVP performance)
    const topPlaces = places.slice(0, 5);
    const restPlaces = places.slice(5);

    const scoredShopsPromises = topPlaces.map(async (place) => {
      // Need details (reviews) for AI scoring
      const details = await getPlaceDetails(place.id);
      
      let aiScore: OldShopScoreResult;
      
      if (details) {
        // Collect reviews text
        const reviews = details.reviews?.map((r: any) => r.text?.text).filter(Boolean) || [];
        
        aiScore = await generateOldShopScore({
          name: place.displayName.text,
          address: place.formattedAddress,
          types: place.types,
          reviews: reviews
        });
      } else {
        // Fallback if details fail
        aiScore = { score: 0, reasoning: "詳細情報取得失敗", short_summary: "-", is_shinise: false };
      }

      return {
        ...place,
        aiAnalysis: aiScore
      };
    });

    const scoredShops = await Promise.all(scoredShopsPromises);

    // 3. Combine results
    // For non-scored shops, return basic structure
    const unScoredShops = restPlaces.map(place => ({
      ...place,
      aiAnalysis: { score: 0, reasoning: "未判定", short_summary: "-", is_shinise: false }
    }));

    const allShops = [...scoredShops, ...unScoredShops];
    
    // Sort by score if available
    allShops.sort((a, b) => b.aiAnalysis.score - a.aiAnalysis.score);

    return NextResponse.json({ shops: allShops });

  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
