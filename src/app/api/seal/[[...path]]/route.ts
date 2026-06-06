import { NextRequest, NextResponse } from "next/server";

const TARGET_BASE_URL = "https://open-seal-mainnet.nodeinfra.com";

async function handleProxy(req: NextRequest) {
  try {
    const pathname = req.nextUrl.pathname;
    const search = req.nextUrl.search;
    
    // Strip the '/api/seal' prefix to get the subpath (e.g. /v1/encrypt)
    const pathSuffix = pathname.replace(/^\/api\/seal/, "");
    
    const targetUrl = `${TARGET_BASE_URL}${pathSuffix}${search}`;

    const reqHeaders = new Headers();
    // Forward safe headers
    req.headers.forEach((value, key) => {
      if (!["host", "connection", "content-length"].includes(key.toLowerCase())) {
        reqHeaders.set(key, value);
      }
    });

    const fetchOptions: RequestInit = {
      method: req.method,
      headers: reqHeaders,
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      fetchOptions.body = await req.arrayBuffer();
    }

    const response = await fetch(targetUrl, fetchOptions);
    const responseBody = await response.arrayBuffer();

    const resHeaders = new Headers();
    // Forward response headers, stripping encoding headers that Next.js will handle
    response.headers.forEach((value, key) => {
      if (!["content-encoding", "transfer-encoding"].includes(key.toLowerCase())) {
        resHeaders.set(key, value);
      }
    });

    return new NextResponse(responseBody, {
      status: response.status,
      headers: resHeaders,
    });
  } catch (error: any) {
    console.error("Seal proxy error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) { return handleProxy(req); }
export async function POST(req: NextRequest) { return handleProxy(req); }
export async function OPTIONS(req: NextRequest) { return handleProxy(req); }
export async function PUT(req: NextRequest) { return handleProxy(req); }
export async function DELETE(req: NextRequest) { return handleProxy(req); }
