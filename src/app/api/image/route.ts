import { NextRequest, NextResponse } from "next/server";
import { verifyApiRequest } from "@/lib/api-security";

export const runtime = "edge"; // Use Edge for speed if possible, or nodejs if incompatible. 
// Standard api routes on Cloud Run are nodejs usually, but let's stick to nodejs runtime for env var stability on Cloud Run.
// Actually implementation_plan says standard route.

// However, handling binary streams in Node.js runtime is fine.

export async function GET(request: NextRequest) {
  // Security Check
  const securityRes = verifyApiRequest(request);
  if (securityRes) return securityRes;

  const searchParams = request.nextUrl.searchParams;
  const name = searchParams.get("name");
  
  // Parameter Clamping for Safety/Cost
  let maxWidth = parseInt(searchParams.get("maxWidthPx") || "400", 10);
  let maxHeight = parseInt(searchParams.get("maxHeightPx") || "400", 10);

  // Enforce limits (Max 400px)
  if (isNaN(maxWidth) || maxWidth > 400) maxWidth = 400;
  if (isNaN(maxHeight) || maxHeight > 400) maxHeight = 400;

  if (!name) {
    return new NextResponse("Missing photo name", { status: 400 });
  }

  // Basic validation to prevent arbitrary URL fetching if needed, though 'name' is appended.
  // Google Places Photo API format: places/PLACE_ID/photos/PHOTO_ID
  // We can just trust the API to reject invalid ones safely.

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
      console.error("GOOGLE_MAPS_API_KEY is missing on server");
      return new NextResponse("Server Configuration Error", { status: 500 });
  }

  const googleUrl = `https://places.googleapis.com/v1/${name}/media?maxHeightPx=${maxHeight}&maxWidthPx=${maxWidth}&key=${apiKey}`;

  try {
    const googleRes = await fetch(googleUrl);
    
    if (!googleRes.ok) {
        console.error(`Failed to fetch image from Google: ${googleRes.status} ${googleRes.statusText}`);
        return new NextResponse("Failed to fetch image", { status: googleRes.status });
    }

    const contentType = googleRes.headers.get("content-type") || "image/jpeg";
    const buffer = await googleRes.arrayBuffer();

    return new NextResponse(buffer, {
        headers: {
            "Content-Type": contentType,
            // Cache for 1 day as requested
            "Cache-Control": "public, max-age=86400", 
        }
    });

  } catch (error) {
      console.error("Image Proxy Error:", error);
      return new NextResponse("Internal Server Error", { status: 500 });
  }
}
