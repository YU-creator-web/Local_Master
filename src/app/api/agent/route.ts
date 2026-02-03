import { NextRequest, NextResponse } from "next/server";
import { executeAgent, AgentRequest } from "@/lib/agents/core";

export const runtime = 'nodejs'; // Use Node.js runtime for Vertex AI
export const maxDuration = 60; // Allow longer timeout for agent operations

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentType, shopName, shopAddress, shopId } = body as AgentRequest;

    if (!agentType || !shopName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // --- DB Cache Check (Read-Through) ---
    if (shopId) {
       try {
          const { adminDb } = await import("@/lib/firebase/admin"); 
          const cacheKey = `${shopId}_${agentType}`;
          const docRef = adminDb.collection('agent_results').doc(cacheKey);
          const docSnap = await docRef.get();

          if (docSnap.exists) {
             const data = docSnap.data();
             console.log(`[Cache Hit] Returning DB result for Agent: ${cacheKey}`);
             return NextResponse.json(data?.result);
          }
       } catch (dbError) {
          console.error("DB Cache Read Failed (skipping):", dbError); 
       }
    }

    console.log(`🤖 [Agent API] Deploying ${agentType} for ${shopName}...`);

    const result = await executeAgent({
      agentType,
      shopName, 
      shopAddress: shopAddress || "",
      shopId, // Pass through
      reviews: [] 
    });

    // --- DB Cache Write ---
    if (shopId) {
       try {
          const { adminDb } = await import("@/lib/firebase/admin"); 
          const cacheKey = `${shopId}_${agentType}`;
          
          // Sanitize data (remove undefined)
          const cleanResult = JSON.parse(JSON.stringify(result));
          
          await adminDb.collection('agent_results').doc(cacheKey).set({
             result: cleanResult,
             shopId,
             agentType,
             cachedAt: new Date().toISOString(),
             shopName
          });
          console.log(`[Cache Write] Saved Agent result: ${cacheKey}`);
       } catch (dbError) {
          console.error("DB Cache Write Failed:", dbError);
       }
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Agent API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
