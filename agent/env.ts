import { z } from 'zod'; // We'll add zod for reliable config (lightweight, good for agentic reliability)

// If zod not wanted, we can remove later. For now using for Composer 2.5-style robust parsing.

const EnvSchema = z.object({
  // Guardian identity
  GUARDIAN_PRIVATE_KEY: z.string().min(1, 'Guardian Sui keypair required (for txns and snapshots)'),
  GUARDIAN_ORACLE_PRIVATE_KEY: z.string().min(1, 'Ed25519 key for oracle attestations (the one capsules will store as oracle_pubkey)'),

  // Persist contract
  NEXT_PUBLIC_PERSIST_PACKAGE_ID: z.string().min(1),

  // Walrus (reuse existing or override)
  WALRUS_PUBLISHER: z.string().url().optional(),
  WALRUS_AGGREGATOR: z.string().url().optional(),

  // MemWal (Walrus Memory)
  MEMWAL_KEY: z.string().min(1, 'MemWal delegate/private key'),
  MEMWAL_ACCOUNT_ID: z.string().min(1, 'MemWal account/namespace id'),
  MEMWAL_SERVER_URL: z.string().url().optional().default('https://relayer.memwal.ai'),

  // Successor for self-protection capsule
  SUCCESSOR_ADDRESS: z.string().min(1, 'Successor agent or operator address for self-snapshot'),

  // Optional: list of addresses the Guardian monitors (for demo, can be seed or loaded)
  MONITORED_ADDRESSES: z.string().optional(), // comma separated

  // Inactivity window for self snapshot (ms). For demo can be short.
  SELF_INACTIVITY_WINDOW_MS: z.coerce.number().default(72 * 60 * 60 * 1000),

  // How often to snapshot self state (ms)
  SNAPSHOT_INTERVAL_MS: z.coerce.number().default(5 * 60 * 1000), // 5 min for demo

  // Port for tiny attest server (so claim flow / UI can request sigs from the live Guardian)
  ATTEST_PORT: z.coerce.number().default(8787),
});

export type AgentEnv = z.infer<typeof EnvSchema>;

export function loadEnv(): AgentEnv {
  const parsed = EnvSchema.safeParse({
    GUARDIAN_PRIVATE_KEY: process.env.GUARDIAN_PRIVATE_KEY,
    GUARDIAN_ORACLE_PRIVATE_KEY: process.env.GUARDIAN_ORACLE_PRIVATE_KEY,
    NEXT_PUBLIC_PERSIST_PACKAGE_ID: process.env.NEXT_PUBLIC_PERSIST_PACKAGE_ID,
    WALRUS_PUBLISHER: process.env.WALRUS_PUBLISHER,
    WALRUS_AGGREGATOR: process.env.WALRUS_AGGREGATOR,
    MEMWAL_KEY: process.env.MEMWAL_KEY,
    MEMWAL_ACCOUNT_ID: process.env.MEMWAL_ACCOUNT_ID,
    MEMWAL_SERVER_URL: process.env.MEMWAL_SERVER_URL,
    SUCCESSOR_ADDRESS: process.env.SUCCESSOR_ADDRESS,
    MONITORED_ADDRESSES: process.env.MONITORED_ADDRESSES,
    SELF_INACTIVITY_WINDOW_MS: process.env.SELF_INACTIVITY_WINDOW_MS,
    SNAPSHOT_INTERVAL_MS: process.env.SNAPSHOT_INTERVAL_MS,
    ATTEST_PORT: process.env.ATTEST_PORT,
  });

  if (!parsed.success) {
    console.error('Invalid Guardian Agent environment:');
    console.error(parsed.error.format());
    process.exit(1);
  }

  return parsed.data;
}
