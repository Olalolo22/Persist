# Manual Capsule Recovery (No Frontend)

**Important for Sui Overflow Walrus track (should-do):** A technically literate person must be able to recover any capsule using only raw Sui + Walrus, without persist.app.

This document + the existing `src/lib/*` code gives you everything needed.

## Prerequisites
- Sui object ID of the PersistCapsule (from the claim link or on-chain events)
- Access to a Sui RPC (Tatum or public testnet endpoint)
- Walrus aggregator (public or private)
- For decryption: the nominee's wallet (to sign the session key personal message)
- Node.js + the project's dependencies (or copy the relevant lib/ files)

## Step-by-step Recovery

### 1. Fetch the on-chain capsule object
```ts
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

const capsule = await suiClient.getObject({
  id: '0xYOUR_CAPSULE_OBJECT_ID',
  options: { showContent: true },
});

const fields = capsule.data!.content!.fields as any;
const walrusBlobId = Buffer.from(fields.walrus_blob_id).toString('utf8');
const releaseTimeMs = Number(fields.release_time_ms);
const nominee = fields.nominee;
const creator = fields.creator;
const status = fields.status; // 0 = LOCKED, 1 = CLAIMED
const inactivityWindowMs = Number(fields.inactivity_window_ms || 0);
const oraclePubkey = fields.oracle_pubkey; // bytes
```

### 2. Check if claimable (time fallback or oracle)
- If `Date.now() >= releaseTimeMs` → time fallback is valid.
- For Absence Safeguard: you need a valid oracle signature (from the Guardian or the old centralized key if you still have it).

If neither, the capsule is still locked.

### 3. Fetch the Walrus blob (public metadata + encrypted payload)
Use the public aggregator directly:

```ts
const aggregator = 'https://aggregator.walrus-testnet.walrus.space/v1/blobs';
const res = await fetch(`${aggregator}/${walrusBlobId}`);
const buffer = await res.arrayBuffer();
const text = new TextDecoder().decode(buffer);
const publicPayload = JSON.parse(text);

const encryptedPayloadB64 = publicPayload.encryptedPayload; // base64 of the Seal-encrypted inner data
const name = publicPayload.name;
const description = publicPayload.description;
const kind = publicPayload.kind; // "agent-memory" for Guardian capsules
```

For agent capsules you now also get `entryCount`, `lastSync`, etc. in the public metadata.

### 4. Decrypt using Sui Seal (the hard part — requires the nominee wallet)

You need to replicate the claim flow:

```ts
import { SealClient, SessionKey } from '@mysten/seal';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'; // or whatever your nominee keypair is

// 1. Create session key (the nominee wallet signs a personal message)
const sessionKey = await createSessionKeyForWallet(nomineeKeypair); // see src/lib/seal.ts

// 2. Build the seal_approve transaction
const tx = buildSealApproveTx(
  cleanPackageId,
  capsuleObjectId,
  oracleSignature || [], // empty array for pure time-lock
  suiClient
);

// 3. Dry-run or execute with the session key to get the decryption material
const sealClient = createSealClient(suiClient);
const decryptedBytes = await decryptCapsule(
  sealClient,
  Buffer.from(encryptedPayloadB64, 'base64'),
  sessionKey,
  txBytes // from the built tx
);

// 4. Parse
const inner = JSON.parse(new TextDecoder().decode(decryptedBytes));
console.log('Recovered:', inner); // { text, file } for humans or the guardian-state delegate for agents
```

Full helper functions are in `src/lib/seal.ts` (`createSessionKeyForWallet`, `buildSealApproveTx`, `decryptCapsule`).

For a pure Guardian self-capsule you will get the `delegate` object containing the MemWal keys.

### 5. For Guardian agent memory (Walrus Memory)
Once you have the `delegate` from the decrypted payload:

```ts
import { MemWal } from '@mysten-incubation/memwal';

const memwal = MemWal.create({
  key: delegate.key,
  accountId: delegate.accountId,
  serverUrl: delegate.serverUrl,
});

const memories = await memwal.recall('', 50, delegate.namespace);
console.log('Inherited memory entries:', memories);
```

### Recovery without any of our code
- Use `sui client object <id>` (CLI) or explorer to read the Move object fields.
- Use the public Walrus aggregator HTTP API to fetch the blob by ID.
- For Seal decryption you will need to implement the session key + `seal_approve` dry-run yourself (the Move function + Seal SDK).

This proves the data is not locked to our frontend.

## Test it
The easiest test is to seal a capsule on testnet, note the object ID + blob ID, then run a small Node script using the steps above (with the nominee keypair that can satisfy the conditions).

See `src/lib/seal.ts` and `src/lib/walrus.ts` for the exact reusable functions.

This + the public Walrus blob + on-chain Sui object = full trustless recovery.
