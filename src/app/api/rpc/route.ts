import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const rpcUrl = process.env.NEXT_PUBLIC_TATUM_RPC_URL || "https://sui-mainnet.gateway.tatum.io/";
    const apiKey = process.env.NEXT_PUBLIC_TATUM_API_KEY || "";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey) {
      headers["x-api-key"] = apiKey;
    }

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers,
      body,
    });

    const data = await response.text();

    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/json",
      },
    });
  } catch (error: any) {
    console.error("RPC proxy error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
