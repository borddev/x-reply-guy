import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET() {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        error: 'Supabase not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local',
        replies: []
      });
    }

    const { data, error } = await supabase
      .from('x_replies')
      .select('*')
      .order('posted_at', { ascending: false })
      .limit(500);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get last sync time (most recent created_at)
    const lastSync = data && data.length > 0
      ? data.reduce((max, r) => {
          const created = new Date(r.created_at).getTime();
          return created > max ? created : max;
        }, 0)
      : null;

    return NextResponse.json({
      replies: data || [],
      lastSync: lastSync ? new Date(lastSync).toISOString() : null
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
