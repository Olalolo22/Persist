import { NextResponse } from "next/server";
import { SuiJsonRpcClient as SuiClient } from "@mysten/sui/jsonRpc";
import { isWalletInactive } from "@/lib/tatum";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromHex, toHex } from "@mysten/sui/utils";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";

export async function POST(req: Request) {
  try {
    const { capsuleId } = await req.json();

    if (!capsuleId) {
      return NextResponse.json({ error: "Missing capsuleId" }, { status: 400 });
    }

    const rpcUrl = process.env.NEXT_PUBLIC_TATUM_RPC_URL || "https://sui-testnet.gateway.tatum.io/";
    const suiClient = new SuiClient({ url: rpcUrl } as any);

    // 1. Fetch the capsule object to read creator and inactivity window securely
    const capsuleObj = await suiClient.getObject({
      id: capsuleId,
      options: { showContent: true },
    });

    if (capsuleObj.data?.content?.dataType !== "moveObject") {
      return NextResponse.json({ error: "Invalid capsule object" }, { status: 400 });
    }

    const fields = capsuleObj.data.content.fields as any;
    const creator = fields.creator;
    const inactivityWindowMs = parseInt(fields.inactivity_window_ms, 10);

    if (!creator || isNaN(inactivityWindowMs)) {
      return NextResponse.json({ error: "Capsule does not support inactivity oracle" }, { status: 400 });
    }

    // 2. Query Tatum to determine if the wallet has been inactive
    const isInactive = await isWalletInactive(creator, inactivityWindowMs);

    if (!isInactive) {
      return NextResponse.json({ error: "Wallet is still active. Inactivity window not reached." }, { status: 403 });
    }

    // 3. Oracle Attestation: Sign the capsule ID
    const privateKeyStr = process.env.PERSIST_ORACLE_PRIVATE_KEY;
    if (!privateKeyStr) {
      throw new Error("Oracle private key not configured on backend");
    }

    let keypair: Ed25519Keypair;
    if (privateKeyStr.startsWith("suiprivkey")) {
      const decoded = decodeSuiPrivateKey(privateKeyStr);
      keypair = Ed25519Keypair.fromSecretKey(decoded.secretKey);
    } else {
      keypair = Ed25519Keypair.fromSecretKey(fromHex(privateKeyStr));
    }

    const capsuleIdBytes = fromHex(capsuleId.replace("0x", ""));
    const signature = await keypair.sign(capsuleIdBytes);

    return NextResponse.json({
      signature: toHex(signature),
      pubKey: keypair.getPublicKey().toSuiAddress(),
    });
  } catch (err: any) {
    console.error("Attestation API error:", err);
    return NextResponse.json({ error: "Internal server error during attestation" }, { status: 500 });
  }
}
