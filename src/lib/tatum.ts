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
  firstActiveMs: number | null;
  lastActiveMs: number | null;
  transactionCount: number;
  hasMore: boolean;
  reconstructionStatus: "COMPLETE" | "PARTIAL" | "EMPTY" | "ERROR";
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
    const [recentResult, firstResult] = await Promise.allSettled([
      rpcCall("suix_queryTransactionBlocks", [
        {
          filter: { FromAddress: address },
          options: { showInput: true },
        },
        null, // cursor
        100, // Query up to 100 recent transactions to construct the profile
        true, // descendingOrder — newest first
      ]),
      rpcCall("suix_queryTransactionBlocks", [
        {
          filter: { FromAddress: address },
          options: { showInput: true },
        },
        null, // cursor
        1, // Query 1 transaction
        false, // ascendingOrder — oldest first
      ])
    ]);

    let txBlocks: any[] = [];
    let hasNextPage = false;
    
    if (recentResult.status === "fulfilled" && recentResult.value) {
      const recentData = recentResult.value as { data: Array<{ timestampMs?: string }>, hasNextPage?: boolean };
      txBlocks = recentData.data || [];
      hasNextPage = !!recentData.hasNextPage;
    }

    let firstActiveMs: number | null = null;
    if (firstResult.status === "fulfilled" && firstResult.value) {
      const firstData = firstResult.value as { data: Array<{ timestampMs?: string }> };
      if (firstData.data && firstData.data.length > 0 && firstData.data[0].timestampMs) {
        firstActiveMs = parseInt(firstData.data[0].timestampMs, 10);
      }
    }

    if (!txBlocks || txBlocks.length === 0) {
      return {
        firstActiveMs: null,
        lastActiveMs: null,
        transactionCount: 0,
        hasMore: false,
        reconstructionStatus: "EMPTY",
        networksChecked: [process.env.NEXT_PUBLIC_SUI_NETWORK === "mainnet" ? "Sui Mainnet" : "Sui Testnet"],
        lifecycleOverview: "No transaction footprint found on-chain.",
      };
    }

    const lastActiveMs = txBlocks[0].timestampMs ? parseInt(txBlocks[0].timestampMs, 10) : null;
    const count = txBlocks.length;

    let overview = `Active wallet with ${count}${hasNextPage ? '+' : ''} verified on-chain interactions.`;
    if (lastActiveMs) {
      overview += ` Last activity detected on ${new Date(lastActiveMs).toLocaleDateString()}.`;
    }

    return {
      firstActiveMs,
      lastActiveMs,
      transactionCount: count,
      hasMore: hasNextPage,
      reconstructionStatus: hasNextPage ? "PARTIAL" : "COMPLETE",
      networksChecked: [process.env.NEXT_PUBLIC_SUI_NETWORK === "mainnet" ? "Sui Mainnet" : "Sui Testnet"],
      lifecycleOverview: overview,
    };
  } catch (err) {
    console.error("Tatum footprint reconstruction failed:", err);
    return {
      firstActiveMs: null,
      lastActiveMs: null,
      transactionCount: 0,
      hasMore: false,
      reconstructionStatus: "ERROR",
      networksChecked: [process.env.NEXT_PUBLIC_SUI_NETWORK === "mainnet" ? "Sui Mainnet" : "Sui Testnet"],
      lifecycleOverview: "Footprint reconstruction service offline.",
    };
  }
}

/**
 * Checks if a wallet has been inactive for the specified window using Tatum RPC.
 * Used by the Oracle backend to sign inactivity attestations.
 *
 * @param address The Sui address to check
 * @param windowMs The required inactivity duration in milliseconds
 * @returns true if the wallet has been inactive longer than windowMs, false otherwise.
 */
export async function isWalletInactive(
  address: string,
  windowMs: number,
): Promise<boolean> {
  try {
    const response = await rpcCall("suix_queryTransactionBlocks", [
      {
        filter: { FromAddress: address },
        options: { showInput: true },
      },
      null, // cursor
      1, // Query just the 1 most recent transaction
      true, // descendingOrder — newest first
    ]) as any;

    if (!response || !response.data || response.data.length === 0) {
      // If there are no transactions at all, it's definitely inactive
      return true;
    }

    const lastTx = response.data[0];
    if (!lastTx.timestampMs) {
      throw new Error("Missing timestampMs on transaction block.");
    }

    const lastActiveMs = parseInt(lastTx.timestampMs, 10);
    const now = Date.now();

    return (now - lastActiveMs) > windowMs;
  } catch (err) {
    console.error("Failed to check wallet inactivity:", err);
    throw new Error("Unable to verify wallet inactivity through Tatum.");
  }
}
