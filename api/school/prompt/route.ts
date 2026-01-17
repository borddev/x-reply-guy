import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET() {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ prompt: 'Supabase not configured' });
    }

    // Get reviewed replies
    const { data: replies } = await supabase
      .from('x_replies')
      .select('reply_text, tweet_text, impressions, school_rating, school_comment, strategy')
      .not('school_rating', 'is', null)
      .order('posted_at', { ascending: false })
      .limit(50);

    if (!replies || replies.length === 0) {
      return NextResponse.json({ prompt: 'No reviewed replies yet. Review some replies first!' });
    }

    // Build training prompt
    const goodReplies = replies.filter(r => r.school_rating === 'good');
    const badReplies = replies.filter(r => r.school_rating === 'bad');

    let prompt = `# Reply Training Data

Based on manual review, here are examples of good and bad replies:

## GOOD REPLIES (${goodReplies.length} examples)

${goodReplies.map(r => `- Reply: "${r.reply_text}"
  Views: ${r.impressions || 0}
  Strategy: ${r.strategy || 'unknown'}
  ${r.school_comment ? `Note: ${r.school_comment}` : ''}`).join('\n\n')}

## BAD REPLIES (${badReplies.length} examples)

${badReplies.map(r => `- Reply: "${r.reply_text}"
  Views: ${r.impressions || 0}
  Strategy: ${r.strategy || 'unknown'}
  ${r.school_comment ? `Note: ${r.school_comment}` : ''}`).join('\n\n')}

## PATTERNS TO FOLLOW

Based on good replies:
- ${goodReplies.length > 0 ? 'Copy the tone and style of high-performing replies' : 'More data needed'}

## PATTERNS TO AVOID

Based on bad replies:
- ${badReplies.length > 0 ? 'Avoid the patterns seen in low-performing replies' : 'More data needed'}
`;

    return NextResponse.json({ prompt });
  } catch (e) {
    return NextResponse.json({ prompt: 'Error generating prompt' });
  }
}
