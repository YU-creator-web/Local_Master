import { NextRequest, NextResponse } from "next/server";
import { searchNearby, getPlaceDetails, searchByText } from "@/lib/places";
import { generateOldShopScore, findShiniseCandidates, OldShopScoreResult } from "@/lib/vertex";
import { verifyApiRequest } from "@/lib/api-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // Keep for dynamic processing
export const maxDuration = 300; // Allow 5 minutes for long processing

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
  const mode = searchParams.get("mode") === 'adventure' ? 'adventure' : 'standard';

  // Validate Lat/Lng
  if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  // Wrapper function for the heavy search logic
  const performSearch = async () => {
    // Basic validation
    let targetLat = lat;
    let targetLng = lng;

    if ((!targetLat || !targetLng) && station) {
      try {
        const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(station)}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();
        
        if (geoData.results && geoData.results.length > 0) {
          targetLat = geoData.results[0].geometry.location.lat;
          targetLng = geoData.results[0].geometry.location.lng;
        } else {
          throw new Error("Station not found");
        }
      } catch (e) {
        console.error("Geocoding error:", e);
        throw new Error("Geocoding failed");
      }
    }

    if (!targetLat || !targetLng) {
      throw new Error("Missing lat/lng or valid station");
    }

    // 0. Check Cache
    const cleanStation = station?.trim() || "current_loc";
    const cleanGenre = genre?.trim() || "all";
    const forceRefresh = searchParams.get("force") === "true";
    const cacheKey = `${cleanStation}_${cleanGenre}_${mode}_v2`; // Include mode in cache key
    
    // Dynamic import to avoid circular dependency issues if any
    const { adminDb } = await import("@/lib/firebase/admin"); 
    
    let cachedShops: any[] | null = null;
    if (!forceRefresh) {
        try {
           // ... existing cache check logic ...
           const docSnap = await adminDb.collection('searches').doc(cacheKey).get();
           if (docSnap.exists) {
             const data = docSnap.data();
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
        return { shops: cachedShops, status: "Cache Hit" };
    }

    console.log(`[Cache Miss] Starting fresh search for: ${cacheKey}`);
    
    const shopsToCache: any[] = [];

    // 1. Discovery (AI First)
    if (station) {
        console.log(`🤖 Starting AI Candidate Search (Tabelog Top 10) for ${station}...`);
        
        // Get Candidates with scores directly from AI
        const candidates = await findShiniseCandidates(station, genre || undefined, mode);
        
        if (candidates.length > 0) {
            // 2. Hydrate with Places API (Basic info only)
            const hydratePromises = candidates.map(async (candidate) => {
                try {
                  // Search by name to get coordinates and photos
                  // Use a slightly larger radius to ensure we find the specific shop
                  const results = await searchByText(candidate.name, targetLat, targetLng, 2000);
                  
                  if (results.length > 0) {
                      const place = results[0];
                      // Calculate score: Tabelog * 30 (No cap to ensure correct sorting for high rated shops)
                      const shiniseScore = Math.round(candidate.tabelog_rating * 30);

                      return {
                          ...place,
                          aiAnalysis: {
                              score: shiniseScore,
                              reasoning: candidate.reasoning, // Use AI reasoning from list generation
                              short_summary: `食べログ: ${candidate.tabelog_rating}`,
                              is_shinise: true, // Assumed by filter
                              founding_year: candidate.founding_year || "不明", // Use AI fetched year
                              tabelog_rating: candidate.tabelog_rating,
                              tabelog_name: candidate.name // Pass the name found by AI (likely pure Tabelog name)
                          }
                      };
                  }
                  return null;
                } catch (e) {
                    console.error(`Hydration failed for ${candidate.name}:`, e);
                    return null;
                }
            });

            const hydrated = await Promise.all(hydratePromises);
            const validShops = hydrated.filter((p) => p !== null);
            shopsToCache.push(...validShops);
        }
    }

    // If AI fails or returns nothing (fallback to old logic / empty)
    if (shopsToCache.length === 0) {
        console.log("⚠️ AI search returned 0 candidates. Falling back to keyword search.");
        
        // Improved Fallback: Search by text with genre to ensure relevance
        // e.g. "Asakusa Yakitori"
        const query = `${cleanStation} ${cleanGenre !== 'all' ? cleanGenre : 'Old Shop'}`;
        const places = await searchByText(query, targetLat, targetLng, baseRadius);
        
        // No AI scoring for fallback to save money, but we provide basic info
         const fallbackShops = places.slice(0, 10).map(place => ({
            ...place,
            aiAnalysis: {
                score: 50, // Give a neutral score
                reasoning: "AIによる厳選候補が見つかりませんでしたが、条件に合うお店を表示します。",
                short_summary: "キーワード検索結果",
                is_shinise: false,
                founding_year: "-",
                tabelog_rating: place.rating || 0
            }
        }));
        shopsToCache.push(...fallbackShops);
    }

    // Sort by Score (Desc)
    shopsToCache.sort((a, b) => (b.aiAnalysis?.score || 0) - (a.aiAnalysis?.score || 0));

    // 3. Save to Cache
    try {
        if (shopsToCache.length > 0) {
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

    return { shops: shopsToCache };
  };

  // --- STREAMING RESPONSE ---
  const stream = new ReadableStream({
    async start(controller) {
        const encoder = new TextEncoder();
        
        // Keep-alive timer: send a space every second to keep connection open
        const intervalId = setInterval(() => {
            try {
                controller.enqueue(encoder.encode(" "));
            } catch (err) {
                // Stream likely closed
                clearInterval(intervalId);
            }
        }, 1000);

        try {
            console.log("Starting search stream execution...");
            const result = await performSearch();
            
            clearInterval(intervalId);
            
            // Send the actual JSON data
            controller.enqueue(encoder.encode(JSON.stringify(result)));
            controller.close();
            console.log("Search stream completed successfully.");
        } catch (error: any) {
            clearInterval(intervalId);
            console.error("Stream Execution Error:", error);
            
            const errorResponse = { error: error.message || "Internal Server Error" };
            controller.enqueue(encoder.encode(JSON.stringify(errorResponse)));
            controller.close();
        }
    }
  });

  return new NextResponse(stream, {
    headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-transform', // Prevent buffering
        'Connection': 'keep-alive'
    }
  });
}
