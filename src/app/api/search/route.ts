import { NextRequest, NextResponse } from "next/server";
import { searchNearby, getPlaceDetails, searchByText } from "@/lib/places";
import { generateOldShopScore, findShiniseCandidates, OldShopScoreResult } from "@/lib/vertex";

export const runtime = "nodejs";
console.log("[DEBUG] Loading /api/search/route.ts...");

// Helper to format SSE-like JSON chunks
function jsonChunk(data: any): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(JSON.stringify(data) + "\n");
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = parseFloat(searchParams.get("lat") || "0");
  const lng = parseFloat(searchParams.get("lng") || "0");
  const baseRadius = parseInt(searchParams.get("radius") || "1000", 10);
  const station = searchParams.get("station");
  const genre = searchParams.get("genre");

  // Basic validation
  // Note: We'll do geocoding inside the stream logic or before to fail fast. 
  // Let's do Geocoding separately first as it's quick.
  let targetLat = lat;
  let targetLng = lng;

  if ((!targetLat || !targetLng) && station) {
    try {
      const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(station)}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
      console.log(`[DEBUG] Geocoding using Key: ${process.env.GOOGLE_MAPS_API_KEY ? 'Present' : 'MISSING'} (${process.env.GOOGLE_MAPS_API_KEY?.slice(0,5)}...)`);
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();
      console.log(`[DEBUG] Geocoding Response:`, JSON.stringify(geoData).substring(0, 200));
      
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

  // Create Streaming Response
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 0. Check Cache
        // Create a unique key for this search query
        // e.g. "Tokyo_sushi" or "Tokyo_all"
        const cleanStation = station?.trim() || "current_loc"; // simplified for now
        const cleanGenre = genre?.trim() || "all";
        const forceRefresh = searchParams.get("force") === "true";
        // Use a safe ID format (maybe base64 or just text if robust). 
        // For hackathon, simple text is fine usually, but let's be safe with basic sanitization if needed.
        // Actually, Firestore IDs can handle Japanese.
        const cacheKey = `${cleanStation}_${cleanGenre}`;
        
        // Import adminDb dynamically if needed or used top-level. 
        // We need to import it at top of file, but let's assume I'll add the import in a separate step or included here if I can edit imports?
        // Wait, replace_file_content replaces a block. I need to ensure imports are there.
        // I will add the import `import { adminDb } from "@/lib/firebase/admin";` to the top in a separate edit or assume it's added. 
        // Better to add it in this tool call if possible? No, imports are at top. 
        // I will focus on the Logic implementation here. 
        
        // Dynamic import to avoid top-level await issues if any (Next.js is fine usually)
        // actually adminDb is already initialized.
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
                // Non-blocking, proceed to live search
            }
        } else {
            console.log(`[Force Refresh] Skipping cache for: ${cacheKey}`);
        }

        if (cachedShops) {
            console.log(`[Cache Hit] Streaming search results for: ${cacheKey}`);
            controller.enqueue(jsonChunk({ type: "status", message: "過去の検索結果を表示します (高速モード) ⚡" }));
            
            for (const shop of cachedShops) {
                controller.enqueue(jsonChunk({ type: "shop", data: shop }));
                // Small delay for visual effect? No, speed is king.
            }
            controller.enqueue(jsonChunk({ type: "complete" }));
            controller.close();
            return;
        }

        console.log(`[Cache Miss] Starting fresh search for: ${cacheKey}`);
        
        // Buffer to save later
        const shopsToCache: any[] = [];

        let places: any[] = [];
        let isAiSourced = false;

        // 1. Discovery (AI or Legacy)
        if (station) {
            // ... (Existing AI Search Logic) ...
            console.log(`🤖 Starting AI Candidate Search for ${station}...`);
            controller.enqueue(jsonChunk({ type: "status", message: "AIが老舗候補を探しています..." }));
            
            const candidates = await findShiniseCandidates(station, genre || undefined);
            
            if (candidates.length > 0) {
                isAiSourced = true;
                controller.enqueue(jsonChunk({ type: "status", message: `${candidates.length}軒の候補が見つかりました\n詳細情報を取得中...` }));

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
            controller.enqueue(jsonChunk({ type: "status", message: "Google Mapsで周辺店舗を検索中..." }));
            if (genre) {
                places = await searchByText(genre, targetLat, targetLng, baseRadius);
            } else {
                places = await searchNearby(targetLat, targetLng, baseRadius);
            }
        }

        if (places.length === 0) {
            controller.enqueue(jsonChunk({ type: "error", message: "店舗が見つかりませんでした。" }));
            controller.close();
            return;
        }

        controller.enqueue(jsonChunk({ type: "status", message: "老舗度を判定中..." }));

        // 2. Scoring & Streaming
        const processLimit = isAiSourced ? 10 : 5;
        const targetPlaces = places.slice(0, processLimit); 
        const restPlaces = places.slice(processLimit); 

        const scoringPromises = targetPlaces.map(async (place) => {
            try {
                // Get Details
                const details = await getPlaceDetails(place.id);
                let aiScore: OldShopScoreResult;

                if (details) {
                    const reviews = details.reviews?.map((r: any) => r.text?.text).filter(Boolean) || [];
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
                
                // Emit shop data immediately
                controller.enqueue(jsonChunk({ type: "shop", data: resultShop }));
                // Buffer
                shopsToCache.push(resultShop);

            } catch (err) {
                console.error(`Error processing shop ${place.displayName.text}:`, err);
                const failedShop = { 
                    ...place, 
                    aiAnalysis: { score: 0, reasoning: "解析エラー", short_summary: "エラー", is_shinise: false, founding_year: "不明", tabelog_rating: 0 } 
                };
                controller.enqueue(jsonChunk({ type: "shop", data: failedShop }));
                shopsToCache.push(failedShop);
            }
        });

        restPlaces.forEach(place => {
            const unscoredShop = {
                ...place,
                aiAnalysis: { score: 0, reasoning: "未判定", short_summary: "-", is_shinise: false, founding_year: "-", tabelog_rating: 0 }
            };
            controller.enqueue(jsonChunk({ type: "shop", data: unscoredShop }));
            shopsToCache.push(unscoredShop);
        });

        await Promise.all(scoringPromises);

        // 3. Save to Cache
        try {
            if (shopsToCache.length > 0) {
                // Fire and forget caching (don't block the stream completion too much, but maybe await is safer to ensure it writes)
                // We await to be safe since this is a serverless function (could be terminated)
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

        // Done
        controller.enqueue(jsonChunk({ type: "complete" }));
        controller.close();

      } catch (error) {
        console.error("Stream Error:", error);
        controller.enqueue(jsonChunk({ type: "error", message: "Internal Server Error" }));
        controller.close();
      }
    }
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
