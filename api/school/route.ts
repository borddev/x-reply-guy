import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: NextRequest) {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        error: 'Supabase not configured',
        replies: []
      });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter');
    const limit = parseInt(searchParams.get('limit') || '100');

    let query = supabase
      .from('x_replies')
      .select('*')
      .order('posted_at', { ascending: false })
      .limit(limit);

    // Filter for unreviewed if requested
    if (filter === 'unreviewed') {
      query = query.is('school_rating', null);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ replies: data || [] });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { id, rating, comment } = await request.json();

    if (!id || !rating) {
      return NextResponse.json({ error: 'Missing id or rating' }, { status: 400 });
    }

    const { error } = await supabase
      .from('x_replies')
      .update({
        school_rating: rating,
        school_comment: comment || null
      })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
