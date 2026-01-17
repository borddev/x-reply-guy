import { NextRequest, NextResponse } from 'next/server';
import { getReplies, getUnreviewedReplies, updateReplyRating } from '../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter');
    const limit = parseInt(searchParams.get('limit') || '100');

    const replies = filter === 'unreviewed'
      ? getUnreviewedReplies(limit)
      : getReplies(limit);

    return NextResponse.json({ replies });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { id, rating, comment } = await request.json();

    if (!id || !rating) {
      return NextResponse.json({ error: 'Missing id or rating' }, { status: 400 });
    }

    updateReplyRating(id, rating, comment);

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
