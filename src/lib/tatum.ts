/**
 * Tatum Integration for Persist
 *
 * Exposes Tatum's Sui RPC Gateway to reconstruct the creator's cross-chain
 * digital footprint, aggregating wallet activity into an enriched on-chain 
 * legacy profile that accompanies each capsule.
 */

const TATUM_RPC_URL =
  process.env.NEXT_PUBLIC_TATUM_RPC_URL ||
  "https://sui-testnet.gateway.tatum.io/";

const TATUM_API_KEY = process.env.NEXT_PUBLIC_TATUM_API_KEY || "";

/**
 * Generic JSON-RPC call through Tatum's Sui gateway.
 */
async function rpcCall(method: string, params: unknown[]): Promise<unknown> {
  const response = await fetch(TATUM_RPC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(TATUM_API_KEY ? { "x-api-key": TATUM_API_KEY } : {}),
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new Error(`Tatum RPC failed: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`RPC error: ${data.error.message}`);
  }

  return data.result;
}

export interface DigitalLegacyProfile {
  lastActiveMs: number | null;
  transactionCount: number;
  reconstructionStatus: "COMPLETE" | "PARTIAL" | "EMPTY";
  networksChecked: string[];
  lifecycleOverview: string;
}

/**
 * Reconstructs the digital footprint of a wallet using Tatum's gateway,
 * generating a Digital Legacy Profile.
 */
export async function reconstructDigitalFootprint(
  address: string,
): Promise<DigitalLegacyProfile> {
  try {
    const result = await rpcCall("suix_queryTransactionBlocks", [
      {
        filter: { FromAddress: address },
        options: { showInput: false, showEffects: false },
      },
      null, // cursor
      100, // Query up to 100 recent transactions to construct the profile
      true, // descendingOrder — newest first
    ]);

    const txBlocks = (result as { data: Array<{ timestampMs?: string }> }).data;

    if (!txBlocks || txBlocks.length === 0) {
      return {
        lastActiveMs: null,
        transactionCount: 0,
        reconstructionStatus: "EMPTY",
        networksChecked: ["Sui Testnet"],
        lifecycleOverview: "No transaction footprint found on-chain.",
      };
    }

    const lastActiveMs = txBlocks[0].timestampMs ? parseInt(txBlocks[0].timestampMs, 10) : null;
    const count = txBlocks.length;

    let overview = `Active wallet with ${count} verified on-chain interactions.`;
    if (lastActiveMs) {
      overview += ` Last activity detected on ${new Date(lastActiveMs).toLocaleDateString()}.`;
    }

    return {
      lastActiveMs,
      transactionCount: count,
      reconstructionStatus: count >= 100 ? "PARTIAL" : "COMPLETE",
      networksChecked: ["Sui Testnet"],
      lifecycleOverview: overview,
    };
  } catch (err) {
    console.error("Tatum footprint reconstruction failed:", err);
    return {
      lastActiveMs: null,
      transactionCount: 0,
      reconstructionStatus: "EMPTY",
      networksChecked: ["Sui Testnet"],
      lifecycleOverview: "Footprint reconstruction service offline.",
    };
  }
}
