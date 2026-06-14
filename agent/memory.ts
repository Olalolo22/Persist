import { MemWal } from '@mysten-incubation/memwal';
import type { AgentEnv } from './env';

/**
 * Thin wrapper around Walrus Memory (MemWal) for the Guardian's operational state.
 *
 * We store structured logs:
 *   - monitoring events
 *   - attestation actions
 *   - capsule registry updates
 *
 * No LLM embeddings required for basic operational use — we can store JSON as "text".
 * The relayer still handles encryption + Walrus under the hood.
 *
 * The "delegate" the successor receives from the Persist capsule is the combination of:
 *   MEMWAL_KEY + MEMWAL_ACCOUNT_ID + (optional serverUrl)
 *
 * This allows the successor to instantiate the exact same memory space.
 */
export class GuardianMemory {
  private memwal: MemWal;
  private namespace: string = 'persist-guardian'; // stable namespace for this agent identity

  constructor(env: AgentEnv) {
    this.memwal = MemWal.create({
      key: env.MEMWAL_KEY,
      accountId: env.MEMWAL_ACCOUNT_ID,
      serverUrl: env.MEMWAL_SERVER_URL,
      // namespace can be passed per-call or configured
    });
  }

  async remember(event: {
    type: 'monitor' | 'attest' | 'snapshot' | 'registry';
    details: Record<string, any>;
    timestamp?: number;
  }): Promise<void> {
    const text = JSON.stringify({
      ...event,
      timestamp: event.timestamp || Date.now(),
      namespace: this.namespace,
    });

    await this.memwal.remember(text, this.namespace);
    console.log(`[memory] remembered ${event.type} event`);
  }

  async recallRecent(limit = 20): Promise<Array<{ text: string; timestamp: number }>> {
    const results = await this.memwal.recall('', limit, this.namespace); // empty query = recent?

    // MemWal recall typically returns semantic matches. For operational log we may want chronological.
    // For demo we return what we get and let UI sort.
    return results.map((r: any) => ({
      text: r.text || JSON.stringify(r),
      timestamp: r.timestamp || Date.now(),
    }));
  }

  async getEntryCount(): Promise<number> {
    // Best effort — some MemWal versions expose stats.
    // Fallback to recalling a large number and counting.
    try {
      const res = await this.memwal.recall('', 100, this.namespace);
      return res.length;
    } catch {
      return 0;
    }
  }

  /**
   * Returns the delegate information that a successor needs to inherit this memory space.
   * This (or a sealed version of it) goes inside the Persist self-protection capsule.
   */
  getDelegateInfo() {
    return {
      key: process.env.MEMWAL_KEY, // the successor will need this value
      accountId: process.env.MEMWAL_ACCOUNT_ID,
      serverUrl: process.env.MEMWAL_SERVER_URL,
      namespace: this.namespace,
    };
  }
}
