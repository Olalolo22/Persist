import { NextResponse } from "next/server";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromHex, toHex } from "@mysten/sui/utils";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";

export async function GET() {
  try {
    const privateKeyStr = process.env.PERSIST_ORACLE_PRIVATE_KEY;
    if (!privateKeyStr) {
      return NextResponse.json({ error: "Oracle key not configured" }, { status: 500 });
    }

    let keypair: Ed25519Keypair;
    if (privateKeyStr.startsWith("suiprivkey")) {
      const decoded = decodeSuiPrivateKey(privateKeyStr);
      keypair = Ed25519Keypair.fromSecretKey(decoded.secretKey);
    } else {
      keypair = Ed25519Keypair.fromSecretKey(fromHex(privateKeyStr));
    }

    return NextResponse.json({
      pubKeyHex: toHex(keypair.getPublicKey().toRawBytes()),
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to get oracle public key" }, { status: 500 });
  }
}
