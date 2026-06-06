import { NextRequest, NextResponse } from "next/server";

// Simple in-memory cache: request body -> { data, timestamp }
const rpcCache = new Map<string, { data: string; timestamp: number }>();
const CACHE_TTL_MS = 5000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const rpcUrl = process.env.NEXT_PUBLIC_TATUM_RPC_URL || "https://sui-mainnet.gateway.tatum.io/";
    const apiKey = process.env.NEXT_PUBLIC_TATUM_API_KEY || "";

    // 1. Check Cache
    const cached = rpcCache.get(body);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return new NextResponse(cached.data, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-RPC-Cache": "HIT",
        },
      });
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey) {
      headers["x-api-key"] = apiKey;
    }

    // 2. Fetch with Retry Logic
    let response: Response | null = null;
    let retries = 3;
    let delay = 500; // ms

    while (retries > 0) {
      response = await fetch(rpcUrl, {
        method: "POST",
        headers,
        body,
      });

      if (response.status === 429) {
        retries--;
        if (retries === 0) break;
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        break; // Success or non-429 error
      }
    }

    if (!response) {
      throw new Error("Failed to execute RPC call");
    }

    const data = await response.text();

    // 3. Update Cache (Only cache successful HTTP 200s)
    if (response.status === 200) {
      rpcCache.set(body, { data, timestamp: Date.now() });
    }

    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/json",
        "X-RPC-Cache": "MISS",
      },
    });
  } catch (error: any) {
    console.error("RPC proxy error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
