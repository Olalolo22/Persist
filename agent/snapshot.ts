import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { uploadToWalrus } from '../src/lib/walrus';
import { encryptForCapsule, createSealClient } from '../src/lib/seal';
import { createGuardianKeypair, getOraclePubkeyBytes } from './wallet';
import { GuardianMemory } from './memory';
import type { AgentEnv } from './env';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client'; // modern client for keypair signing

/**
 * Self-snapshot: the Guardian periodically seals its current operational state
 * (memory delegate + recent log summary) into a Persist capsule with an Absence Safeguard.
 *
 * The nominee is the SUCCESSOR_ADDRESS.
 * On "death" the successor claims it and gets the delegate key to continue the exact MemWal space.
 */
export class SelfSnapshot {
  private keypair: Ed25519Keypair;
  private env: AgentEnv;
  private memory: GuardianMemory;
  private suiClient: SuiJsonRpcClient;

  constructor(env: AgentEnv, memory: GuardianMemory) {
    this.keypair = createGuardianKeypair(env.GUARDIAN_PRIVATE_KEY);
    this.env = env;
    this.memory = memory;

    const rpc = env.NEXT_PUBLIC_TATUM_RPC_URL || 'https://sui-testnet.gateway.tatum.io/';
    this.suiClient = new SuiJsonRpcClient({ url: rpc } as any);
  }

  async snapshot() {
    console.log('[snapshot] Starting self-protection snapshot...');

    const delegate = this.memory.getDelegateInfo();
    const recent = await this.memory.recallRecent(5);

    const statePayload = {
      type: 'guardian-state',
      version: 1,
      delegate,                    // ← the magic the successor needs for MemWal
      recentEvents: recent,
      lastSnapshot: Date.now(),
      monitoredCount: (await this.memory.getEntryCount()) || 0,
    };

    const packageId = this.env.NEXT_PUBLIC_PERSIST_PACKAGE_ID;
    const successor = this.env.SUCCESSOR_ADDRESS;
    const oraclePub = getOraclePubkeyBytes(this.keypair);

    // Use modern SuiClient for easy keypair signing (compatible with the project's @mysten/sui ^2)
    const suiClient = new SuiClient({
      url: getFullnodeUrl((process.env.NEXT_PUBLIC_SUI_NETWORK as any) || 'testnet'),
    });

    // 1. Create the capsule (empty blob id first)
    const createTx = new Transaction();
    createTx.moveCall({
      target: `${packageId}::capsule::create_capsule`,
      arguments: [
        createTx.pure.vector('u8', []),
        createTx.pure.address(successor),
        createTx.pure.u64(Date.now() + this.env.SELF_INACTIVITY_WINDOW_MS + 120_000),
        createTx.pure.vector('u8', oraclePub),
        createTx.pure.u64(this.env.SELF_INACTIVITY_WINDOW_MS),
        createTx.object('0x6'),
      ],
    });

    const createResult = await suiClient.signAndExecuteTransaction({
      signer: this.keypair,
      transaction: createTx,
      options: { showObjectChanges: true },
    });

    const created = createResult.objectChanges?.find(
      (c: any) => c.type === 'created' && c.objectType?.includes('PersistCapsule')
    ) as any;

    if (!created?.objectId) {
      throw new Error('Failed to extract capsule objectId from creation tx');
    }

    const capsuleId = created.objectId;
    console.log(`[snapshot] Created self-protection capsule: ${capsuleId}`);

    // 2. Encrypt the state with Seal (bound to this capsuleId)
    const sealClient = createSealClient(this.suiClient as any);
    const plaintext = new TextEncoder().encode(JSON.stringify(statePayload));
    const encryptedBytes = await encryptForCapsule(sealClient, capsuleId, plaintext);

    // 3. Build public metadata wrapper (same format as human capsules) + upload
    // This allows the vault to classify without decrypting and show memory stats.
    const publicPayloadObj = {
      kind: "agent-memory",
      name: "Guardian Agent State",
      description: "Operational memory and Walrus Memory delegate key for successor",
      entryCount: statePayload.monitoredCount || 0,
      lastSync: statePayload.lastSnapshot,
      encryptedPayload: Buffer.from(encryptedBytes).toString("base64"),
    };
    const payloadBuffer = Buffer.from(JSON.stringify(publicPayloadObj));
    const blobId = await uploadToWalrus(payloadBuffer);
    console.log(`[snapshot] Public agent metadata + encrypted state uploaded to Walrus blob: ${blobId}`);

    // 4. Update the capsule with the real blob id
    const updateTx = new Transaction();
    updateTx.moveCall({
      target: `${packageId}::capsule::update_blob_id`,
      arguments: [
        updateTx.object(capsuleId),
        updateTx.pure.vector('u8', Array.from(Buffer.from(blobId))),
      ],
    });

    await suiClient.signAndExecuteTransaction({
      signer: this.keypair,
      transaction: updateTx,
    });

    console.log(`[snapshot] Capsule finalized with blob ID`);

    // 5. Record in our own memory
    await this.memory.remember({
      type: 'snapshot',
      details: {
        capsuleId,
        successor,
        walrusBlobId: blobId,
        delegateInfo: delegate,
      },
    });

    // Optional: also remember the capsuleId itself so successor can find it easily
    console.log(`[snapshot] Self-protection capsule ready. Successor should claim ${capsuleId}`);

    return capsuleId;
  }
}
