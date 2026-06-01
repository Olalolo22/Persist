/**
 * Tatum Integration for Persist
 *
 * Uses Tatum's Sui RPC Gateway to:
 * 1. Send all Sui transactions (RPC proxy)
 * 2. Check wallet activity for the dead man's switch dashboard warning
 *
 * Note: Tatum Data API doesn't support Sui transaction history directly,
 * so we use suix_queryTransactionBlocks via their RPC gateway instead.
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

/**
 * Gets the timestamp (in ms) of the most recent transaction sent FROM the given address.
 * Returns null if no transactions found.
 *
 * Used by the dashboard to show: "Last wallet activity: X days ago"
 * and warn the user when they're approaching their DMS timeout.
 */
export async function getLastActivityTimestamp(
  address: string,
): Promise<number | null> {
  const result = await rpcCall("suix_queryTransactionBlocks", [
    {
      filter: { FromAddress: address },
      options: { showInput: false, showEffects: false },
    },
    null, // cursor
    1, // limit — we only need the most recent one
    true, // descendingOrder — newest first
  ]);

  const txBlocks = (result as { data: Array<{ timestampMs?: string }> }).data;

  if (!txBlocks || txBlocks.length === 0) {
    return null;
  }

  const timestamp = txBlocks[0].timestampMs;
  return timestamp ? parseInt(timestamp, 10) : null;
}

/**
 * Checks if a wallet has been inactive for longer than the given timeout.
 * Returns { inactive: boolean, lastActiveMs: number | null, silentForMs: number | null }
 *
 * Used by the dashboard warning layer:
 * - "Your wallet has been inactive for 45 days. Your DMS timeout is 90 days."
 * - "Remember to check in!"
 */
export async function checkWalletInactivity(
  address: string,
  dmsTimeoutMs: number,
): Promise<{
  inactive: boolean;
  lastActiveMs: number | null;
  silentForMs: number | null;
}> {
  const lastActiveMs = await getLastActivityTimestamp(address);

  if (lastActiveMs === null) {
    return { inactive: true, lastActiveMs: null, silentForMs: null };
  }

  const silentForMs = Date.now() - lastActiveMs;

  return {
    inactive: silentForMs >= dmsTimeoutMs,
    lastActiveMs,
    silentForMs,
  };
}
