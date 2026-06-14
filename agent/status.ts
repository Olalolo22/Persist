import fs from 'fs/promises';
import path from 'path';

/**
 * Simple status exporter for the live /agent UI during local dev/demo.
 * The Next.js /agent page can poll this file (or we can make the agent expose HTTP status too).
 */
const STATUS_FILE = path.join(process.cwd(), 'agent-status.json');

export async function writeStatus(status: Record<string, any>) {
  try {
    await fs.writeFile(STATUS_FILE, JSON.stringify({
      ...status,
      updatedAt: new Date().toISOString(),
    }, null, 2));
  } catch (e) {
    console.warn('[status] could not write status file:', e);
  }
}

export async function readStatus() {
  try {
    const raw = await fs.readFile(STATUS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
