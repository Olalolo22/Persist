import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import type { AgentEnv } from './env';

/**
 * Simple inactivity monitor.
 * Re-uses the spirit of src/lib/tatum.ts isWalletInactive but adapted for agent use.
 *
 * For demo we support both Tatum gateway or direct Sui RPC.
 */
export class Monitor {
  private suiClient: SuiJsonRpcClient;
  private env: AgentEnv;

  constructor(env: AgentEnv) {
    const rpcUrl = env.NEXT_PUBLIC_TATUM_RPC_URL || 'https://sui-testnet.gateway.tatum.io/';
    this.suiClient = new SuiJsonRpcClient({ url: rpcUrl } as any);
    this.env = env;
  }

  /**
   * Returns true if the wallet has been inactive longer than windowMs.
   */
  async isInactive(address: string, windowMs: number): Promise<boolean> {
    try {
      const now = Date.now();
      // Use suix_queryTransactionBlocks via the client (works through Tatum or direct)
      const recent = await this.suiClient.queryTransactionBlocks({
        filter: { FromAddress: address },
        options: { showEffects: false },
        limit: 1,
        order: 'descending',
      } as any);

      if (!recent.data || recent.data.length === 0) {
        // No transactions ever — treat as inactive if window > 0
        return windowMs > 0;
      }

      const lastTx = recent.data[0];
      // timestamp is in the effects or we can use checkpoint time; for simplicity use current if unavailable
      const lastMs = (lastTx as any).timestampMs ? parseInt((lastTx as any).timestampMs) : now - 1000;

      return (now - lastMs) > windowMs;
    } catch (err) {
      console.warn(`[monitor] error checking ${address}:`, err);
      return false; // fail safe — don't falsely attest
    }
  }

  async getMonitoredAddresses(): Promise<string[]> {
    if (this.env.MONITORED_ADDRESSES) {
      return this.env.MONITORED_ADDRESSES.split(',').map(a => a.trim()).filter(Boolean);
    }
    // For pure demo, the agent can also "monitor" its own address or seed some.
    return [];
  }
}
