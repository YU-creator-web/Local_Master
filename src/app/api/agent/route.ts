import { NextRequest, NextResponse } from "next/server";
import { executeAgent, AgentRequest } from "@/lib/agents/core";

export const runtime = 'nodejs'; // Use Node.js runtime for Vertex AI
export const maxDuration = 300; // Allow 5 minutes for long processing
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentType, shopName, shopAddress, shopId } = body as AgentRequest;

    if (!agentType || !shopName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Agent execution wrapper
    const performAgentExecution = async () => {
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
               return data?.result;
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

      return result;
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
                  clearInterval(intervalId);
              }
          }, 1000);
  
          try {
              const result = await performAgentExecution();
              
              clearInterval(intervalId);
              controller.enqueue(encoder.encode(JSON.stringify(result)));
              controller.close();
          } catch (error: any) {
              clearInterval(intervalId);
              console.error("Agent Execution Error:", error);
              
              const errorResponse = { 
                  agentType,
                  agentName: "Error",
                  icon: "❌",
                  summary: "通信エラー",
                  details: [error.message || "Internal Server Error"],
                  riskLevel: "caution"
              };
              controller.enqueue(encoder.encode(JSON.stringify(errorResponse)));
              controller.close();
          }
      }
    });
  
    return new NextResponse(stream, {
      headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive'
      }
    });

  } catch (error: any) {
    console.error("Agent API Init Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
