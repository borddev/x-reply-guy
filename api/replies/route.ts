import { NextResponse } from 'next/server';
import { getReplies } from '../../lib/db';

export async function GET() {
  try {
    const replies = getReplies(500);

    // Get last sync time (most recent created_at)
    const lastSync = replies.length > 0
      ? replies.reduce((max, r) => {
          const created = new Date(r.created_at).getTime();
          return created > max ? created : max;
        }, 0)
      : null;

    return NextResponse.json({
      replies,
      lastSync: lastSync ? new Date(lastSync).toISOString() : null
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
