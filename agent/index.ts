#!/usr/bin/env node
/**
 * Guardian Agent — the simple autonomous process for Persist (Sui Overflow Agentic Web demo).
 *
 * Built with Composer 2.5-style reliability:
 * - Clear separation of responsibilities
 * - Robust env validation
 * - Graceful shutdown
 * - Persistent memory via Walrus Memory (MemWal)
 * - Self-protection via Persist capsules (the recursive continuity story)
 * - Tiny HTTP server so the web app / claim flow can request attestations from the live agent
 *
 * It is intentionally NOT an LLM. It is a process with a wallet.
 *
 * Responsibilities (exactly four):
 * 1. Monitor — watch capsule creators via Tatum/Sui RPC
 * 2. Attest — sign Ed25519 oracle attestations when inactivity confirmed (exposed via HTTP)
 * 3. Remember — store operational logs in Walrus Memory
 * 4. Snapshot — periodically seal its own state (memory delegate) into a Persist capsule
 */

import { loadEnv } from './env';
import { createGuardianKeypair, getAddress } from './wallet';
import { GuardianMemory } from './memory';
import { Monitor } from './monitor';
import { AttestService } from './attest';
import { SelfSnapshot } from './snapshot';
import { writeStatus } from './status';

async function main() {
  console.log('=== Persist Guardian Agent starting (Composer 2.5 reliable mode) ===');

  const env = loadEnv();

  const keypair = createGuardianKeypair(env.GUARDIAN_PRIVATE_KEY);
  const address = getAddress(keypair);
  console.log(`Guardian wallet: ${address}`);
  console.log(`Attest server will run on port ${env.ATTEST_PORT}`);

  const memory = new GuardianMemory(env);
  const monitor = new Monitor(env);
  const snapshotter = new SelfSnapshot(env, memory);

  const attest = new AttestService(env);
  attest.setMonitor(async (capsuleId, creator, windowMs) => {
    const inactive = await monitor.isInactive(creator, windowMs);
    if (inactive) {
      await memory.remember({
        type: 'attest',
        details: { capsuleId, creator, action: 'attesting inactivity' },
      });
    }
    return inactive;
  });

  const attestServer = attest.startServer();

  const monitored = await monitor.getMonitoredAddresses();
  console.log(`Monitoring ${monitored.length} addresses (demo may be empty — agent still snapshots itself)`);

  // Initial status for the web UI
  await writeStatus({
    status: 'ACTIVE',
    wallet: address,
    memoryEntries: await memory.getEntryCount(),
    monitoredCount: monitored.length,
    lastHeartbeat: new Date().toISOString(),
  });

  // Initial self-protection capsule — this is the core of the succession demo
  const initialSelfCapsule = await snapshotter.snapshot();
  if (initialSelfCapsule) {
    await writeStatus({
      status: 'ACTIVE',
      wallet: address,
      memoryEntries: await memory.getEntryCount(),
      monitoredCount: monitored.length,
      lastHeartbeat: new Date().toISOString(),
      selfCapsuleId: initialSelfCapsule,
    });
  }

  const loop = setInterval(async () => {
    try {
      // 1. Monitor
      for (const addr of monitored) {
        const inactive = await monitor.isInactive(addr, 90 * 24 * 60 * 60 * 1000);
        if (inactive) {
          console.log(`[monitor] ${addr} appears inactive`);
          await memory.remember({ type: 'monitor', details: { address: addr, inactive: true } });
        }
      }

      // 2. Periodic self snapshot (this is the continuity proof)
      const selfCapsuleId = await snapshotter.snapshot();

      // 3. Publish live status for the /agent UI (file-based for simple local demo)
      const count = await memory.getEntryCount();
      await writeStatus({
        status: 'ACTIVE',
        wallet: address,
        memoryEntries: count,
        monitoredCount: monitored.length,
        lastHeartbeat: new Date().toISOString(),
        ...(selfCapsuleId ? { selfCapsuleId } : {}),
      });

      console.log(`[status] Memory entries: ${count} | Monitored: ${monitored.length}`);
    } catch (err) {
      console.error('[loop] error in main loop:', err);
    }
  }, env.SNAPSHOT_INTERVAL_MS);

  // Graceful shutdown (Composer 2.5 style: clean exit, last snapshot)
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received — performing final snapshot and shutting down...`);
    clearInterval(loop);
    try {
      await snapshotter.snapshot();
      await memory.remember({ type: 'snapshot', details: { reason: 'graceful shutdown' } });
      await writeStatus({ status: 'TERMINATED', reason: 'graceful shutdown', lastHeartbeat: new Date().toISOString() });
    } catch (e) {
      console.error('Error during shutdown snapshot:', e);
    }
    attestServer.close();
    console.log('Guardian stopped cleanly. Successor can now claim the capsule.');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  console.log('Guardian Agent running. Press Ctrl-C to simulate death for the demo.');
  console.log('Successor should use the self-protection capsule ID shown in logs / UI.');
}

main().catch((err) => {
  console.error('Fatal Guardian error:', err);
  process.exit(1);
});
