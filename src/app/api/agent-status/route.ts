import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

/**
 * Dev-only endpoint for the /agent page to show real Guardian status
 * when you are running `npm run agent` in another terminal.
 *
 * In production this would be replaced by a proper status API from the Guardian itself.
 */
export async function GET() {
  try {
    const statusPath = path.join(process.cwd(), 'agent-status.json');
    const raw = await fs.readFile(statusPath, 'utf8');
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ status: 'NO_AGENT', note: 'Run `npm run agent` in another terminal to see live status.' }, { status: 200 });
  }
}
