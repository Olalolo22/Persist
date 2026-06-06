import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ blobId: string }> }
) {
  const { blobId } = await params;

  if (!blobId) {
    return new NextResponse("Missing blobId", { status: 400 });
  }

  const aggregator = process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR || "https://aggregator.walrus-testnet.walrus.space/v1/blobs";
  const walrusUrl = `${aggregator}/${blobId}`;

  try {
    const response = await fetch(walrusUrl);

    if (!response.ok) {
      return new NextResponse(`Walrus responded with ${response.status}`, {
        status: response.status,
      });
    }

    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error proxying to Walrus:", error);
    return new NextResponse("Failed to fetch from Walrus", { status: 500 });
  }
}
