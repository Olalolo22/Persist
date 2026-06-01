/**
 * WebCrypto Utilities for Client-Side File Encryption (AES-GCM)
 *
 * Persist uses AES-GCM (256-bit) to encrypt files locally before
 * they are uploaded to Walrus permanent decentralised storage.
 * Nothing leaves the browser unencrypted.
 */

// Generate a random 256-bit AES-GCM key
export async function generateSymmetricKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true, // extractable — we need to export and store the raw key on-chain
    ["encrypt", "decrypt"],
  );
}

// Export the key to raw bytes so it can be stored on-chain (encrypted to nominee in Phase 1)
export async function exportKeyToRaw(key: CryptoKey): Promise<Uint8Array> {
  const exported = await window.crypto.subtle.exportKey("raw", key);
  return new Uint8Array(exported);
}

// Import raw bytes back into a CryptoKey for decryption
export async function importRawKey(rawKey: Uint8Array): Promise<CryptoKey> {
  return await window.crypto.subtle.importKey(
    "raw",
    rawKey.buffer,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"],
  );
}

/**
 * Encrypts an ArrayBuffer using AES-GCM.
 * Generates a random 12-byte IV, encrypts the data,
 * and PREPENDS the IV to the ciphertext.
 * Output format: [12-byte IV][ciphertext + GCM tag]
 */
export async function encryptFileBuffer(
  fileBuffer: ArrayBuffer,
  key: CryptoKey,
): Promise<ArrayBuffer> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    fileBuffer,
  );

  // Prepend the 12-byte IV to the encrypted data
  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedBuffer), iv.length);

  return combined.buffer;
}

/**
 * Decrypts an ArrayBuffer that has a 12-byte IV prepended.
 * Input format: [12-byte IV][ciphertext + GCM tag]
 */
export async function decryptFileBuffer(
  combinedBuffer: ArrayBuffer,
  key: CryptoKey,
): Promise<ArrayBuffer> {
  const combined = new Uint8Array(combinedBuffer);
  const iv = combined.slice(0, 12);
  const encryptedData = combined.slice(12);

  return await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encryptedData.buffer,
  );
}

// Convert a File object to ArrayBuffer
export function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
