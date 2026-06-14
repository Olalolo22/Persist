import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import { fromHex } from '@mysten/sui/utils';

/**
 * Guardian wallet setup.
 * One keypair is used for:
 * - Creating self-protection capsules (Sui transactions)
 * - Signing oracle attestations (Ed25519, compatible with the Move contract)
 *
 * In a more advanced setup you could split them, but per "simple process" spec we use one.
 */
export function createGuardianKeypair(privateKeyStr: string): Ed25519Keypair {
  if (privateKeyStr.startsWith('suiprivkey')) {
    const decoded = decodeSuiPrivateKey(privateKeyStr);
    return Ed25519Keypair.fromSecretKey(decoded.secretKey);
  }
  // raw hex
  return Ed25519Keypair.fromSecretKey(fromHex(privateKeyStr));
}

export function getAddress(keypair: Ed25519Keypair): string {
  return keypair.getPublicKey().toSuiAddress();
}

/**
 * For oracle signatures we often need the raw bytes or Sui pubkey hex.
 */
export function getOraclePubkeyBytes(keypair: Ed25519Keypair): number[] {
  return Array.from(keypair.getPublicKey().toRawBytes());
}
