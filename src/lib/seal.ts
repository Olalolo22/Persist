import { SealClient, SessionKey } from "@mysten/seal";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { Transaction } from "@mysten/sui/transactions";
import { fromHex } from "@mysten/sui/utils";

const PACKAGE_ID = process.env.NEXT_PUBLIC_PERSIST_PACKAGE_ID!;

// Mainnet key servers (NodeInfra, free, Open mode)
const MAINNET_KEY_SERVERS = [
  {
    objectId: "0x1afb3a57211ceff8f6781757821847e3ddae73f64e78ec8cd9349914ad985475",
    url: "https://open-seal-mainnet.nodeinfra.com",
    weight: 1,
  },
];

/**
 * Creates and configures a SealClient instance.
 */
export function createSealClient(suiClient: SuiJsonRpcClient): SealClient {
  // Cast client to any to satisfy SealCompatibleClient if type mismatch occurs
  return new SealClient({
    suiClient: suiClient as any,
    serverConfigs: MAINNET_KEY_SERVERS,
    verifyKeyServers: true,
  });
}

/**
 * Encrypts data for a specific capsule.
 * 
 * @param sealClient The SealClient instance
 * @param capsuleId The 32-byte object ID of the capsule (hex string)
 * @param data The plaintext data to encrypt
 * @returns The encrypted bytes (Uint8Array)
 */
export async function encryptForCapsule(
  sealClient: SealClient,
  capsuleId: string,
  data: Uint8Array,
): Promise<Uint8Array> {
  const cleanPackageId = PACKAGE_ID.startsWith("0x") ? PACKAGE_ID : `0x${PACKAGE_ID}`;
  const cleanCapsuleId = capsuleId.startsWith("0x") ? capsuleId : `0x${capsuleId}`;

  const { encryptedObject } = await sealClient.encrypt({
    threshold: 1,
    packageId: cleanPackageId,
    id: cleanCapsuleId,
    data,
  });

  return new Uint8Array(encryptedObject);
}

/**
 * Decrypts data using a session key and the seal_approve transaction.
 */
export async function decryptCapsule(
  sealClient: SealClient,
  encryptedData: Uint8Array,
  sessionKey: SessionKey,
  txBytes: Uint8Array,
): Promise<Uint8Array> {
  const result = await sealClient.decrypt({
    data: encryptedData,
    sessionKey,
    txBytes,
  });

  return new Uint8Array(result);
}

/**
 * Builds the seal_approve transaction for decryption authorization.
 * Key servers execute this transaction as a dry-run to authorize key release.
 */
export function buildSealApproveTx(
  capsuleObjectId: string,
  oracleSignatureHex?: string,
): Transaction {
  const tx = new Transaction();
  const cleanPackageId = PACKAGE_ID.startsWith("0x") ? PACKAGE_ID : `0x${PACKAGE_ID}`;
  const cleanCapsuleObjectId = capsuleObjectId.startsWith("0x") ? capsuleObjectId : `0x${capsuleObjectId}`;

  // The first argument 'id' of seal_approve is the capsule object ID itself as a vector<u8>.
  // We extract the bytes from the hexadecimal object ID representation.
  const capsuleIdBytes = fromHex(cleanCapsuleObjectId.replace("0x", ""));

  let oracleSignatureBytes: number[] = [];
  if (oracleSignatureHex) {
    oracleSignatureBytes = Array.from(fromHex(oracleSignatureHex.replace("0x", "")));
  }

  tx.moveCall({
    target: `${cleanPackageId}::capsule::seal_approve`,
    arguments: [
      tx.pure.vector("u8", Array.from(capsuleIdBytes)),
      tx.object(cleanCapsuleObjectId),
      tx.pure.vector("u8", oracleSignatureBytes),
      tx.object("0x6"), // Clock object
    ],
  });

  return tx;
}

/**
 * Helper to initialize a SessionKey for browser wallets.
 * Returns the SessionKey instance and the serialized message that needs to be signed.
 */
export async function createSessionKeyForWallet(
  suiClient: SuiJsonRpcClient,
  address: string,
  ttlMin = 30,
): Promise<{ sessionKey: SessionKey; messageToSign: Uint8Array }> {
  const cleanPackageId = PACKAGE_ID.startsWith("0x") ? PACKAGE_ID : `0x${PACKAGE_ID}`;

  const sessionKey = await SessionKey.create({
    address,
    packageId: cleanPackageId,
    ttlMin,
    suiClient: suiClient as any,
  });

  return {
    sessionKey,
    messageToSign: sessionKey.getPersonalMessage(),
  };
}

export interface CapsuleData {
  objectId: string;
  creator: string;
  nominee: string;
  releaseTimeMs: number;
  inactivityWindowMs?: number;
  status: number; // 0 = LOCKED, 1 = CLAIMED
  walrusBlobId: string;
}

/**
 * Fetches all PersistCapsule objects from the blockchain.
 */
export async function fetchAllCapsules(
  suiClient: SuiJsonRpcClient,
): Promise<CapsuleData[]> {
  const cleanPackageId = PACKAGE_ID.startsWith("0x") ? PACKAGE_ID : `0x${PACKAGE_ID}`;
  const eventType = `${cleanPackageId}::capsule::CapsuleCreated`;

  const capsules: CapsuleData[] = [];
  
  try {
    const eventsResult: any = await suiClient.queryEvents({
      query: { MoveEventType: eventType },
      limit: 100,
      order: "descending",
    });

    if (!eventsResult.data || eventsResult.data.length === 0) {
      return [];
    }

    const eventCapsules = eventsResult.data.map((event: any) => {
      const fields = event.parsedJson;
      return {
        objectId: fields.capsule_id,
        creator: fields.creator,
        nominee: fields.nominee,
        releaseTimeMs: parseInt(fields.release_time_ms, 10),
      };
    });

    const objectIds = Array.from(new Set(eventCapsules.map((c: any) => c.objectId))) as string[];

    const objectsData: any = await suiClient.multiGetObjects({
      ids: objectIds,
      options: { showContent: true },
    });

    const objectMap = new Map<string, { status: number; walrusBlobId: string; inactivityWindowMs?: number }>();
    for (const obj of objectsData) {
      if (obj.data?.content?.dataType === "moveObject") {
        const fields = obj.data.content.fields;
        let walrusBlobId = "";
        if (Array.isArray(fields.walrus_blob_id)) {
          walrusBlobId = Buffer.from(fields.walrus_blob_id).toString("utf-8");
        }
        objectMap.set(obj.data.objectId, {
          status: fields.status,
          walrusBlobId,
          inactivityWindowMs: parseInt(fields.inactivity_window_ms || "0", 10),
        });
      }
    }

    for (const c of eventCapsules) {
      const onChain = objectMap.get(c.objectId);
      if (onChain) {
        capsules.push({
          objectId: c.objectId,
          creator: c.creator,
          nominee: c.nominee,
          releaseTimeMs: c.releaseTimeMs,
          inactivityWindowMs: onChain.inactivityWindowMs,
          status: onChain.status,
          walrusBlobId: onChain.walrusBlobId,
        });
      }
    }
  } catch (err) {
    console.error("Failed to fetch capsules from events:", err);
  }

  return capsules;
}

/**
 * Fetches a single PersistCapsule by its object ID.
 */
export async function fetchCapsuleById(
  suiClient: SuiJsonRpcClient,
  objectId: string,
): Promise<CapsuleData | null> {
  const cleanObjectId = objectId.startsWith("0x") ? objectId : `0x${objectId}`;
  
  try {
    const response: any = await suiClient.getObject({
      id: cleanObjectId,
      options: { showContent: true },
    });

    if (response.data?.content?.dataType === "moveObject") {
      const fields = response.data.content.fields;
      
      let walrusBlobId = "";
      if (Array.isArray(fields.walrus_blob_id)) {
        walrusBlobId = Buffer.from(fields.walrus_blob_id).toString("utf-8");
      }

      return {
        objectId: response.data.objectId,
        creator: fields.creator,
        nominee: fields.nominee,
        releaseTimeMs: parseInt(fields.release_time_ms, 10),
        inactivityWindowMs: parseInt(fields.inactivity_window_ms || "0", 10),
        status: fields.status,
        walrusBlobId,
      };
    }
  } catch (err) {
    console.error("Failed to fetch capsule by ID:", err);
  }

  return null;
}
