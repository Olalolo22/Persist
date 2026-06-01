/**
 * Walrus Decentralised Storage Integration
 *
 * Persist uses Walrus to permanently store encrypted capsule data.
 * Because Walrus is a public network, we ONLY upload AES-encrypted blobs.
 */

const WALRUS_PUBLISHER =
  "https://publisher.walrus-testnet.walrus.space/v1/store?epochs=5";
const WALRUS_AGGREGATOR = "https://aggregator.walrus-testnet.walrus.space/v1";

/**
 * Uploads an encrypted ArrayBuffer to Walrus.
 * Returns the Blob ID which gets stored on-chain in the PersistCapsule.
 */
export async function uploadToWalrus(
  encryptedBuffer: ArrayBuffer,
): Promise<string> {
  const response = await fetch(WALRUS_PUBLISHER, {
    method: "PUT",
    body: encryptedBuffer,
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
export async function fetchFromWalrus(blobId: string): Promise<ArrayBuffer> {
  const response = await fetch(`${WALRUS_AGGREGATOR}/${blobId}`);

  if (!response.ok) {
    throw new Error(`Walrus fetch failed: ${response.statusText}`);
  }

  return await response.arrayBuffer();
}
