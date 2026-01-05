import { NextRequest, NextResponse } from "next/server";
import { searchNearby, getPlaceDetails, searchByText } from "@/lib/places";
import { generateOldShopScore, findShiniseCandidates, OldShopScoreResult } from "@/lib/vertex";
import { verifyApiRequest } from "@/lib/api-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // Keep for dynamic processing

console.log("[DEBUG] Loading /api/search/route.ts...");

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // 1. Security Check
  const securityRes = verifyApiRequest(request);
  if (securityRes) return securityRes;

  const lat = parseFloat(searchParams.get("lat") || "0");
  const lng = parseFloat(searchParams.get("lng") || "0");
  const baseRadius = parseInt(searchParams.get("radius") || "1000", 10);
  const station = searchParams.get("station");
  const genre = searchParams.get("genre");

  // Validate Lat/Lng
  if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  // Basic validation
  let targetLat = lat;
  let targetLng = lng;

  if ((!targetLat || !targetLng) && station) {
    try {
      // Note: We should move this key usage to a server-side env var if not already. 
      // It uses process.env.GOOGLE_MAPS_API_KEY which is correct.
      const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(station)}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
      // Log removed for security (Key leak prevention)
      // console.log(`[DEBUG] Geocoding...`);
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

  if (!targetLat || !targetLng) {
    return NextResponse.json({ error: "Missing lat/lng or valid station" }, { status: 400 });
  }

  try {
      // 0. Check Cache
      const cleanStation = station?.trim() || "current_loc";
      const cleanGenre = genre?.trim() || "all";
      const forceRefresh = searchParams.get("force") === "true";
      const cacheKey = `${cleanStation}_${cleanGenre}`;
      
      const { adminDb } = await import("@/lib/firebase/admin"); 
      
      let cachedShops: any[] | null = null;
      if (!forceRefresh) {
          try {
             const docSnap = await adminDb.collection('searches').doc(cacheKey).get();
             if (docSnap.exists) {
               const data = docSnap.data();
               
               // TTL Check (90 days)
               const cachedAt = new Date(data?.cachedAt || 0).getTime();
               const now = Date.now();
               const threeMonthsMs = 90 * 24 * 60 * 60 * 1000;
  
               if (now - cachedAt > threeMonthsMs) {
                  console.log(`[Cache Expired] Search results are older than 90 days: ${cacheKey}`);
               } else if (data?.shops && Array.isArray(data.shops) && data.shops.length > 0) {
                  cachedShops = data.shops;
               }
             }
          } catch (err) {
              console.error("Cache Check Error:", err);
          }
      } else {
          console.log(`[Force Refresh] Skipping cache for: ${cacheKey}`);
      }

      if (cachedShops) {
          console.log(`[Cache Hit] Returning cached results for: ${cacheKey}`);
          // Should we sort? Let's assume cache is sorted or client sorts.
          // Client sort logic: (b.aiAnalysis?.score || 0) - (a.aiAnalysis?.score || 0)
          return NextResponse.json({ shops: cachedShops, status: "Cache Hit" });
      }

      console.log(`[Cache Miss] Starting fresh search for: ${cacheKey}`);
      
      let places: any[] = [];
      let isAiSourced = false;

      // 1. Discovery (AI or Legacy)
      if (station) {
          console.log(`🤖 Starting AI Candidate Search for ${station}...`);
          
          const candidates = await findShiniseCandidates(station, genre || undefined);
          
          if (candidates.length > 0) {
              isAiSourced = true;
              const hydratePromises = candidates.map(async (name) => {
                  const results = await searchByText(name, targetLat, targetLng, 2000);
                  return results.length > 0 ? results[0] : null;
              });
              const hydrated = await Promise.all(hydratePromises);
              places = hydrated.filter((p) => p !== null);
          }
      }

      // Fallback
      if (places.length === 0) {
          if (genre) {
              places = await searchByText(genre, targetLat, targetLng, baseRadius);
          } else {
              places = await searchNearby(targetLat, targetLng, baseRadius);
          }
      }

      if (places.length === 0) {
          return NextResponse.json({ shops: [], message: "店舗が見つかりませんでした。" });
      }

      // 2. Scoring
      const processLimit = isAiSourced ? 10 : 5;
      const targetPlaces = places.slice(0, processLimit); 
      const restPlaces = places.slice(processLimit); 
      
      const shopsToCache: any[] = [];

      const scoringPromises = targetPlaces.map(async (place) => {
          try {
              // Get Details
              const details = await getPlaceDetails(place.id);
              let aiScore: OldShopScoreResult;

              if (details) {
                  const reviews = details.reviews?.map((r: any) => r.text?.text).filter(Boolean) || [];
                  // Limit review length/count here is handled in vertex.ts theoretically, but let's trust the current flow for now.
                  // User asked to update getPlaceDetails/reviews later.
                  aiScore = await generateOldShopScore({
                      name: place.displayName.text,
                      address: place.formattedAddress,
                      types: place.types,
                      reviews: reviews
                  });
              } else {
                  aiScore = { score: 0, reasoning: "詳細取得失敗", short_summary: "-", is_shinise: false, founding_year: "不明", tabelog_rating: 0 };
              }

              const resultShop = { ...place, aiAnalysis: aiScore };
              shopsToCache.push(resultShop);

          } catch (err) {
              console.error(`Error processing shop ${place.displayName.text}:`, err);
              const failedShop = { 
                  ...place, 
                  aiAnalysis: { score: 0, reasoning: "解析エラー", short_summary: "エラー", is_shinise: false, founding_year: "不明", tabelog_rating: 0 } 
              };
              shopsToCache.push(failedShop);
          }
      });

      await Promise.all(scoringPromises);

      restPlaces.forEach(place => {
          const unscoredShop = {
              ...place,
              aiAnalysis: { score: 0, reasoning: "未判定", short_summary: "-", is_shinise: false, founding_year: "-", tabelog_rating: 0 }
          };
          shopsToCache.push(unscoredShop);
      });

      // Sort before cache/return?
      // Sorting makes logical sense.
      shopsToCache.sort((a, b) => (b.aiAnalysis?.score || 0) - (a.aiAnalysis?.score || 0));

      // 3. Save to Cache
      try {
          if (shopsToCache.length > 0) {
              // Fire and forget caching (but await safely)
              await adminDb.collection('searches').doc(cacheKey).set({
                  shops: shopsToCache,
                  count: shopsToCache.length,
                  cachedAt: new Date().toISOString()
              });
              console.log(`[Cache Write] Saved search results for: ${cacheKey}`);
          }
      } catch (err) {
          console.error("Cache Write Error:", err);
      }

      return NextResponse.json({ shops: shopsToCache });

  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
