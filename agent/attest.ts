import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { toHex } from '@mysten/sui/utils';
import * as http from 'http';
import type { AgentEnv } from './env';
import { createGuardianKeypair } from './wallet';

/**
 * Attestation signer + tiny HTTP server.
 *
 * The Guardian (not the Next.js app) is now the source of truth for oracle signatures.
 * Claim flows (and the demo UI) can POST { capsuleId } to this server to get a signature
 * if the Guardian has confirmed inactivity.
 *
 * This replaces /api/attest for the Overflow demo.
 */
export class AttestService {
  private keypair: Ed25519Keypair;
  private port: number;
  private monitorFn?: (capsuleId: string, creator: string, windowMs: number) => Promise<boolean>;

  constructor(env: AgentEnv) {
    this.keypair = createGuardianKeypair(env.GUARDIAN_ORACLE_PRIVATE_KEY);
    this.port = env.ATTEST_PORT;
  }

  /**
   * Inject the actual inactivity check (from Monitor).
   * This keeps concerns separated.
   */
  setMonitor(fn: (capsuleId: string, creator: string, windowMs: number) => Promise<boolean>) {
    this.monitorFn = fn;
  }

  async signCapsuleId(capsuleId: string): Promise<string> {
    const bytes = Buffer.from(capsuleId.replace(/^0x/, ''), 'hex');
    const signature = await this.keypair.sign(bytes);
    return toHex(signature);
  }

  getPubkeyHex(): string {
    return toHex(this.keypair.getPublicKey().toRawBytes());
  }

  /**
   * Starts a minimal HTTP server (no extra deps) that the frontend/claim can call.
   * Endpoints:
   *   POST /attest  { capsuleId, creator?, inactivityWindowMs? }
   *   GET  /pubkey
   */
  startServer() {
    const server = http.createServer(async (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.method === 'GET' && req.url === '/pubkey') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ pubKeyHex: this.getPubkeyHex() }));
        return;
      }

      if (req.method === 'POST' && req.url === '/attest') {
        let body = '';
        req.on('data', chunk => (body += chunk));
        req.on('end', async () => {
          try {
            const { capsuleId, creator, inactivityWindowMs } = JSON.parse(body || '{}');

            if (!capsuleId) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: 'capsuleId required' }));
              return;
            }

            let shouldAttest = true;

            if (this.monitorFn && creator && inactivityWindowMs) {
              shouldAttest = await this.monitorFn(capsuleId, creator, Number(inactivityWindowMs));
            }

            if (!shouldAttest) {
              res.writeHead(403);
              res.end(JSON.stringify({ error: 'Wallet still active or conditions not met' }));
              return;
            }

            const signature = await this.signCapsuleId(capsuleId);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              signature,
              pubKey: this.getPubkeyHex(),
            }));
          } catch (e: any) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: e.message }));
          }
        });
        return;
      }

      res.writeHead(404);
      res.end('Not found');
    });

    server.listen(this.port, () => {
      console.log(`[attest] Guardian attestation server listening on http://localhost:${this.port}`);
      console.log(`[attest]   GET  /pubkey`);
      console.log(`[attest]   POST /attest  { capsuleId, creator?, inactivityWindowMs? }`);
    });

    return server;
  }
}
