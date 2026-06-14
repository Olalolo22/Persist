// src/hooks/usePersist.ts
// Central hook for all Sui + Seal + Walrus operations.
//
// CHANGE FROM PREVIOUS VERSION:
// Removed the manual AES-256-GCM layer. @mysten/seal's encrypt() already
// performs a hybrid KEM/DEM scheme — it symmetrically encrypts the actual
// content (DEM) and wraps that key via threshold IBE tied to the on-chain
// policy (KEM). The returned `encryptedObject` is a complete, self-contained
// encrypted package. Hand it plaintext bytes, get ciphertext. decrypt()
// hands back plaintext directly. No double-encryption needed.
//
// NOTE on the `key` field returned by encrypt():
// This is a symmetric backup for disaster recovery if ALL Seal key servers
// become unavailable. DO NOT STORE THIS. If Persist holds onto it, that's
// the exact "Persist holds a private key" trust gap Ted flagged — just
// reintroduced through the back door. Mainnet Seal has multiple independent
// key server providers, which is the actual mitigation for that scenario.
//
// ENVIRONMENT VARIABLES (add to .env.local):
//   NEXT_PUBLIC_PERSIST_PACKAGE_ID   — your deployed Move package ID
//   NEXT_PUBLIC_SEAL_KEY_SERVER_1    — Seal key server object ID (testnet)
//   NEXT_PUBLIC_SEAL_KEY_SERVER_2    — second key server object ID (testnet)
//
// Verify current testnet key server object IDs at https://seal-docs.wal.app
// before deploying — these rotate and the values below are placeholders.

import { useCallback, useMemo } from 'react'
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { SealClient, SessionKey } from '@mysten/seal'
import { fromHex } from '@mysten/sui/utils'

// ============================================================
// CONSTANTS
// ============================================================

const PACKAGE_ID = process.env.NEXT_PUBLIC_PERSIST_PACKAGE_ID ?? ''

// Testnet key servers — VERIFY at seal-docs.wal.app before submission
const SEAL_KEY_SERVERS = [
  {
    objectId: process.env.NEXT_PUBLIC_SEAL_KEY_SERVER_1
      ?? '0x3c338f1ff17f3bd276e6c7e67710ab17c50af2c1e4f92faffe9abfcc32a0e2af',
    weight: 1,
  },
  {
    objectId: process.env.NEXT_PUBLIC_SEAL_KEY_SERVER_2
      ?? '0x9f5e9e96a90d5c4e2dd5d14d91f8f2aa98d01e5f8a9f7d4c3b2a1e0f9e8d7c6',
    weight: 1,
  },
]

const SEAL_THRESHOLD = 2  // both key servers must cooperate to decrypt

// ============================================================
// TYPES
// ============================================================

export interface SealParams {
  contentBytes: Uint8Array        // raw plaintext — Seal encrypts this directly
  nominee:      string            // Sui address or .sui name
  condition:    'timelock' | 'absence'
  unlockEpoch?: number
  absenceDays?: number
}

export interface SealResult {
  objectId:  string
  blobId:    string
  txDigest:  string
}

export interface CapsuleData {
  objectId:     string
  blobId:       string
  sealerAddr:   string
  nominee:      string
  condition:    'timelock' | 'absence'
  conditionMet: boolean
  unlockEpoch?: number
  absenceDays?: number
  createdAt:    number
}

// ============================================================
// HOOK
// ============================================================

export function usePersist() {
  const account   = useCurrentAccount()
  const suiClient = useSuiClient()
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction()

  const sealClient = useMemo(() => {
    if (!suiClient) return null
    return new SealClient({
      suiClient,
      serverConfigs:    SEAL_KEY_SERVERS,
      verifyKeyServers: false,  // set true for mainnet
    })
  }, [suiClient])

  // ----------------------------------------------------------------
  // UPLOAD VIA RELAY
  // Browser wallets can't provide a raw Ed25519 keypair, which is what
  // WalrusClient.writeBlob() needs to sign the storage tx directly.
  // The testnet publisher relay accepts a plain HTTP PUT and handles
  // the storage transaction for us.
  // ----------------------------------------------------------------

  const uploadViaRelay = useCallback(async (data: Uint8Array): Promise<string> => {
    const RELAY_URL = 'https://publisher.walrus-testnet.walrus.space/v1/blobs'

    const response = await fetch(RELAY_URL, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/octet-stream' },
      body:    data as any,
    })

    if (!response.ok) {
      throw new Error(`Walrus upload failed: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    const blobId =
      result?.newlyCreated?.blobObject?.blobId ??
      result?.alreadyCertified?.blobId

    if (!blobId) {
      throw new Error('Walrus relay did not return a blobId')
    }

    return blobId as string
  }, [])

  // ----------------------------------------------------------------
  // READ BLOB — via testnet aggregator, no signing needed
  // ----------------------------------------------------------------

  const readBlob = useCallback(async (blobId: string): Promise<Uint8Array> => {
    const AGGREGATOR = `https://aggregator.walrus-testnet.walrus.space/v1/blobs/${blobId}`

    const response = await fetch(AGGREGATOR)
    if (!response.ok) {
      throw new Error(`Walrus read failed: ${response.status}`)
    }

    return new Uint8Array(await response.arrayBuffer())
  }, [])

  // ----------------------------------------------------------------
  // SEAL CAPSULE — full flow (simplified)
  //
  // 1. Build + execute PTB: call persist::create_capsule()
  //    Returns the new capsule object ID
  // 2. sealClient.encrypt() — Seal handles the full hybrid encryption
  //    using the capsule object ID as the identity for access control
  // 3. Upload the resulting encryptedObject bytes to Walrus directly
  //    (no manual packing — it's already a complete encrypted package)
  // 4. Build + execute PTB: call persist::set_blob_id(capsuleId, blobId)
  //
  // The Move contract's seal_approve function checks:
  //   - caller == nominee, AND
  //   - condition is met (epoch reached OR absence confirmed)
  // ----------------------------------------------------------------

  const sealCapsule = useCallback(async (params: SealParams): Promise<SealResult> => {
    if (!account)    throw new Error('Wallet not connected')
    if (!sealClient) throw new Error('Seal client not initialized')
    if (!PACKAGE_ID) throw new Error('NEXT_PUBLIC_PERSIST_PACKAGE_ID not set')

    // Step 1: Create capsule on Sui — get objectId
    const createTx = new Transaction()
    createTx.moveCall({
      target:    `${PACKAGE_ID}::persist::create_capsule`,
      arguments: [
        createTx.pure.address(params.nominee) as any,
        createTx.pure.string(params.condition) as any,
        (params.condition === 'timelock'
          ? createTx.pure.u64(params.unlockEpoch ?? 0)
          : createTx.pure.u64(params.absenceDays ?? 90)) as any,
      ],
    })

    const createResult = await signAndExecute({ transaction: createTx })

    const capsuleObjectId = extractCreatedObjectId(createResult)
    if (!capsuleObjectId) throw new Error('Failed to extract capsule object ID from tx')

    // Step 2: Seal-encrypt the content directly.
    // The capsule object ID is the identity — seal_approve(capsuleId)
    // is what key servers will check against on decrypt.
    const capsuleIdBytes = fromHex(capsuleObjectId.replace('0x', ''))
    const { encryptedObject } = await sealClient.encrypt({
      threshold: SEAL_THRESHOLD,
      packageId: fromHex(PACKAGE_ID.replace('0x', '')),
      id:        capsuleIdBytes,
      data:      params.contentBytes,
    })
    // `key` (disaster-recovery backup) is intentionally discarded — see
    // file header for why Persist must never hold this.

    // Step 3: Upload the encrypted object directly — it's already
    // a complete package, nothing to unpack on the other side.
    const blobId = await uploadViaRelay(encryptedObject)

    // Step 4: Set blob ID on the capsule
    const updateTx = new Transaction()
    updateTx.moveCall({
      target:    `${PACKAGE_ID}::persist::set_blob_id`,
      arguments: [
        updateTx.object(capsuleObjectId),
        updateTx.pure.string(blobId) as any,
      ],
    })

    const updateResult = await signAndExecute({ transaction: updateTx })

    return {
      objectId: capsuleObjectId,
      blobId,
      txDigest: updateResult.digest,
    }
  }, [account, sealClient, signAndExecute, uploadViaRelay])

  // ----------------------------------------------------------------
  // CLAIM CAPSULE — full decrypt flow (simplified)
  //
  // 1. Fetch capsule object from Sui — get blobId
  // 2. Read the encrypted object bytes from Walrus (no unpacking)
  // 3. Create SessionKey (proves wallet owns the nominee address)
  // 4. Build seal_approve PTB
  // 5. sealClient.decrypt() → plaintext, directly
  // ----------------------------------------------------------------

  const claimCapsule = useCallback(async (capsuleObjectId: string): Promise<Uint8Array> => {
    if (!account)    throw new Error('Wallet not connected')
    if (!sealClient) throw new Error('Seal client not initialized')
    if (!suiClient)  throw new Error('Sui client not initialized')

    // Step 1: Fetch capsule from Sui
    const capsuleObj = await suiClient.getObject({
      id:      capsuleObjectId,
      options: { showContent: true },
    })

    const fields = (capsuleObj.data?.content as any)?.fields
    if (!fields) throw new Error('Capsule not found or invalid')

    const blobId = fields.blob_id as string
    if (!blobId) throw new Error('Capsule has no blob ID — may not be fully sealed yet')

    // Step 2: Read the encrypted object from Walrus — complete package,
    // ready to hand straight to sealClient.decrypt()
    const encryptedObject = await readBlob(blobId)

    // Step 3: Create SessionKey — proves wallet owns the decryption address
    const sessionKey = await SessionKey.create({
      address:   account.address,
      packageId: PACKAGE_ID,
      ttlMin:    10,
      signer: {
        sign: async (bytes: Uint8Array) => {
          const tx = Transaction.fromKind(bytes)
          const result = await signAndExecute({ transaction: tx })
          return result.rawTransaction
            ? new Uint8Array(Buffer.from(result.rawTransaction, 'base64'))
            : new Uint8Array()
        },
      } as any,
      suiClient,
    })

    // Step 4: Build seal_approve transaction
    // Verifies on-chain: tx.sender == capsule.nominee AND condition met
    const approveTx = new Transaction()
    approveTx.moveCall({
      target:    `${PACKAGE_ID}::persist::seal_approve`,
      arguments: [approveTx.object(capsuleObjectId)],
    })
    const txBytes = await approveTx.build({
      client:              suiClient,
      onlyTransactionKind: true,
    })

    // Step 5: Decrypt — Seal fetches key shares, returns plaintext directly
    const plaintext = await sealClient.decrypt({
      data:    encryptedObject,
      sessionKey,
      txBytes,
    })

    return plaintext
  }, [account, sealClient, suiClient, signAndExecute, readBlob])

  // ----------------------------------------------------------------
  // GET OWNED CAPSULES
  // ----------------------------------------------------------------

  const getOwnedCapsules = useCallback(async (ownerAddress?: string): Promise<CapsuleData[]> => {
    if (!suiClient) throw new Error('Sui client not initialized')
    const owner = ownerAddress ?? account?.address
    if (!owner)     throw new Error('No address provided')

    const response = await suiClient.getOwnedObjects({
      owner,
      filter: {
        StructType: `${PACKAGE_ID}::persist::PersistCapsule`,
      },
      options: { showContent: true },
    })

    return response.data
      .filter(item => item.data?.content)
      .map(item => {
        const fields = (item.data!.content as any).fields
        return {
          objectId:     item.data!.objectId,
          blobId:       fields.blob_id ?? '',
          sealerAddr:   fields.creator ?? '',
          nominee:      fields.nominee ?? '',
          condition:    fields.condition_type === 'timelock' ? 'timelock' : 'absence',
          conditionMet: Boolean(fields.condition_met),
          unlockEpoch:  fields.unlock_epoch ? Number(fields.unlock_epoch) : undefined,
          absenceDays:  fields.absence_days  ? Number(fields.absence_days)  : undefined,
          createdAt:    Number(fields.created_at ?? 0),
        } satisfies CapsuleData
      })
  }, [account, suiClient])

  // ----------------------------------------------------------------
  // GET CLAIMABLE CAPSULES
  // Depends on Move contract emitting:
  //   event::emit(CapsuleCreated { id: capsule_id, nominee, creator })
  // ----------------------------------------------------------------

  const getClaimableCapsules = useCallback(async (): Promise<CapsuleData[]> => {
    if (!suiClient) throw new Error('Sui client not initialized')
    if (!account)   throw new Error('Wallet not connected')

    const events = await suiClient.queryEvents({
      query: {
        MoveEventType: `${PACKAGE_ID}::persist::CapsuleCreated`,
      },
      limit: 50,
    })

    const nomineeEvents = events.data.filter(e => {
      const fields = (e.parsedJson as any)
      return fields?.nominee === account.address
    })

    const capsules = await Promise.all(
      nomineeEvents.map(async e => {
        const capsuleId = (e.parsedJson as any).id as string
        const obj = await suiClient.getObject({
          id:      capsuleId,
          options: { showContent: true },
        })
        const fields = (obj.data?.content as any)?.fields
        if (!fields) return null
        return {
          objectId:     capsuleId,
          blobId:       fields.blob_id ?? '',
          sealerAddr:   fields.creator ?? '',
          nominee:      fields.nominee ?? '',
          condition:    fields.condition_type === 'timelock' ? 'timelock' : 'absence',
          conditionMet: Boolean(fields.condition_met),
          unlockEpoch:  fields.unlock_epoch ? Number(fields.unlock_epoch) : undefined,
          absenceDays:  fields.absence_days  ? Number(fields.absence_days)  : undefined,
          createdAt:    Number(fields.created_at ?? 0),
        } satisfies CapsuleData
      })
    )

    return capsules.filter((c): c is CapsuleData => c !== null)
  }, [account, suiClient])

  return {
    account,
    isConnected: Boolean(account),
    sealCapsule,
    claimCapsule,
    getOwnedCapsules,
    getClaimableCapsules,
  }
}

// ============================================================
// HELPERS
// ============================================================

function extractCreatedObjectId(txResult: any): string | null {
  const created = txResult?.effects?.created
  if (Array.isArray(created) && created.length > 0) {
    return created[0]?.reference?.objectId ?? null
  }
  const changes = txResult?.objectChanges
  if (Array.isArray(changes)) {
    const created = changes.find((c: any) => c.type === 'created')
    return created?.objectId ?? null
  }
  return null
}
