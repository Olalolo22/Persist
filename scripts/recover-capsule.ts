#!/usr/bin/env tsx
/**
 * Example manual recovery script.
 * Usage:
 *   tsx scripts/recover-capsule.ts <capsule-object-id> [nominee-private-key]
 *
 * For full agent memory recovery you need the nominee key that matches the capsule.
 */

import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { fromHex } from '@mysten/sui/utils';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fetchPublicMetadata } from '../src/lib/walrus';
import { createSealClient, buildSealApproveTx, decryptCapsule, createSessionKeyForWallet } from '../src/lib/seal';

async function main() {
  const capsuleId = process.argv[2];
  const privKey = process.argv[3]; // optional, for full decrypt

  if (!capsuleId) {
    console.error('Usage: tsx scripts/recover-capsule.ts <0xCapsuleId> [suiprivkey...]');
    process.exit(1);
  }

  const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

  console.log('Fetching capsule on Sui...');
  const obj = await suiClient.getObject({ id: capsuleId, options: { showContent: true } });
  const fields = (obj.data?.content as any)?.fields;
  if (!fields) throw new Error('Capsule not found');

  const walrusBlobId = Buffer.from(fields.walrus_blob_id).toString('utf8');
  console.log('Walrus blob:', walrusBlobId);

  console.log('Fetching public metadata from Walrus...');
  const publicMeta = await fetchPublicMetadata(walrusBlobId);
  console.log('Public meta:', publicMeta);

  if (!privKey) {
    console.log('\nNo private key provided — only public data + on-chain fields recovered.');
    console.log('To fully decrypt, pass the nominee private key as second argument.');
    return;
  }

  // Full decrypt path
  const keypair = Ed25519Keypair.fromSecretKey(fromHex(privKey.startsWith('suiprivkey') ? /* decode if needed */ privKey : privKey)); // adjust as needed

  const sealClient = createSealClient(suiClient as any);

  const session = await createSessionKeyForWallet(keypair as any); // the helper expects the right type

  const tx = buildSealApproveTx(
    process.env.NEXT_PUBLIC_PERSIST_PACKAGE_ID || 'YOUR_PACKAGE',
    capsuleId,
    [], // or provide oracle sig if using absence
    suiClient as any
  );

  const encryptedB64 = publicMeta?.encryptedPayload;
  if (!encryptedB64) throw new Error('No encrypted payload in public metadata');

  const encrypted = Buffer.from(encryptedB64, 'base64');

  console.log('Decrypting via Seal...');
  const decrypted = await decryptCapsule(sealClient, encrypted, session.sessionKey, tx as any);

  const text = new TextDecoder().decode(decrypted);
  console.log('\n=== DECRYPTED CONTENT ===');
  console.log(text);
}

main().catch(console.error);
