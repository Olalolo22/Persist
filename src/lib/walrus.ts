/**
 * Walrus Decentralised Storage Integration
 *
 * Persist uses Walrus to permanently store encrypted capsule data.
 * Because Walrus is a public network, we ONLY upload AES-encrypted blobs.
 */

const WALRUS_PUBLISHER =
  "https://publisher.walrus-testnet.walrus.space/v1/blobs?epochs=5";
const WALRUS_AGGREGATOR = "https://aggregator.walrus-testnet.walrus.space/v1/blobs";

/**
 * Uploads an encrypted ArrayBuffer to Walrus.
 * Returns the Blob ID which gets stored on-chain in the PersistCapsule.
 */
export async function uploadToWalrus(
  encryptedBuffer: ArrayBuffer | Uint8Array,
): Promise<string> {
  const response = await fetch(WALRUS_PUBLISHER, {
    method: "PUT",
    body: encryptedBuffer as any,
  });

  if (!response.ok) {
    throw new Error(`Walrus upload failed: ${response.statusText}`);
  }

  const data = await response.json();

  // Walrus returns either newlyCreated or alreadyCertified
  if (data.newlyCreated) {
    return data.newlyCreated.blobObject.blobId;
  } else if (data.alreadyCertified) {
    return data.alreadyCertified.blobId;
  }

  throw new Error("Unexpected response from Walrus publisher");
}

/**
 * Fetches an encrypted blob from Walrus using its Blob ID.
 */
export async function fetchFromWalrus(blobId: string, retries = 3, delayMs = 2000): Promise<ArrayBuffer> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`/api/walrus/${blobId}`);

      if (!response.ok) {
        throw new Error(`Walrus fetch failed: ${response.statusText}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      if (attempt === retries) {
        throw new Error(`Failed to fetch capsule after ${retries} attempts. Walrus may be experiencing high latency.`);
      }
      console.warn(`Walrus fetch attempt ${attempt} failed, retrying in ${delayMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  
  throw new Error("Failed to fetch capsule from Walrus.");
}
