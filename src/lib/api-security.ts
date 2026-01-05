import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_BASE_URL || "https://shinise-master-2026-e4a9e.web.app";

/**
 * Verifies that the request is coming from an allowed origin and uses the correct method.
 * @param request The incoming NextRequest
 * @returns NextResponse if rejected, null if allowed
 */
export function verifyApiRequest(request: NextRequest): NextResponse | null {
  // 1. Method Check
  if (request.method !== "GET") {
    return new NextResponse("Method Not Allowed", { status: 405 });
  }

  // 2. Origin Check
  // Note: Origin header might be missing in some server-to-server calls or local dev.
  // We strictly require it for browser-initiated API calls to prevent CSRF/Hotlinking.
  const origin = request.headers.get("origin") || request.headers.get("referer");
  
  // Allow localhost for development
  if (origin?.includes("localhost") || origin?.includes("127.0.0.1")) {
      return null;
  }

  // In production, strictly check against ALLOWED_ORIGIN or the Firebase Hosting domain
  if (origin && !origin.startsWith(ALLOWED_ORIGIN) && !origin.includes("shinise-master")) {
      console.warn(`[Security Block] Blocked request from unauthorized origin: ${origin}`);
      return new NextResponse("Forbidden: Unauthorized Origin", { status: 403 });
  }

  return null;
}
