# X Reply Guy - Claude Code Instructions

You are setting up X Reply Guy, an AI-powered Twitter/X reply bot.

## What is X Reply Guy?

An autonomous bot that:
1. Monitors viral tweets on X/Twitter
2. Generates witty, engaging replies using Claude AI
3. Posts replies to gain impressions and followers
4. Tracks performance with analytics dashboard

## Prerequisites

- BORD platform installed (see PROMPT.md)
- Supabase account (free tier works)
- Anthropic API key
- AdsPower browser automation app
- X Premium account (for analytics)

## Database Setup (Supabase)

Create these tables in your Supabase project:

```sql
-- Replies table
CREATE TABLE x_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id TEXT UNIQUE,
  reply_text TEXT,
  reply_url TEXT,
  tweet_url TEXT,
  tweet_text TEXT,
  strategy TEXT,
  source TEXT DEFAULT 'bot',
  impressions INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  engagements INTEGER DEFAULT 0,
  bookmarks INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  reposts INTEGER DEFAULT 0,
  profile_visits INTEGER DEFAULT 0,
  original_views INTEGER,
  original_posted_at TIMESTAMPTZ,
  response_time_mins INTEGER,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  school_rating TEXT,
  school_comment TEXT
);

-- Index for faster queries
CREATE INDEX idx_replies_posted ON x_replies(posted_at DESC);
CREATE INDEX idx_replies_impressions ON x_replies(impressions DESC);
```

## Environment Variables

Add these to BORD's `.env.local`:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Claude AI
ANTHROPIC_API_KEY=sk-ant-...

# AdsPower
ADSPOWER_API=http://127.0.0.1:50325
ADSPOWER_PROFILE_ID=abc123

# Optional
X_USERNAME=your_handle
```

## Reply Strategies

The bot uses these strategies (configured by A/B testing):

| Strategy | Description | Weight |
|----------|-------------|--------|
| @grok Photo | Ask Grok to generate a funny image | 80% |
| @grok Question | Ask Grok an absurd question | 15% |
| No Grok | Pure witty reply | 5% |

## Bot Rules

- Max 12-15 words per reply
- All lowercase (except @grok)
- No emojis, no hashtags
- Dark humor, cynical realist tone
- Reply to posts with 10K+ views
- Wait 25-45 seconds between replies

## File Structure

```
x-reply-guy/
├── app/                    # Dashboard pages
│   ├── page.tsx           # Main analytics
│   ├── school/page.tsx    # Training school
│   └── f4f/page.tsx       # Follow 4 Follow
├── api/                   # API routes
├── automations/           # Bot scripts
│   ├── continuous-reply-bot.js
│   └── follow4follow-bot.js
├── config.json            # App metadata
├── PROMPT.md             # Install prompt
└── CLAUDE.md             # This file
```

## Running the Bot

```bash
# Start the reply bot
node automations/continuous-reply-bot.js

# Start the F4F bot
node automations/follow4follow-bot.js
```

## Dashboard Features

- **Main Page** `/x-reply-guy` - View all replies, impressions, VPM metrics
- **School** `/x-reply-guy/school` - Rate replies to train the AI
- **F4F** `/x-reply-guy/f4f` - Track follow-for-follow stats

## Metrics

- **Impressions** - Total views on replies
- **VPM** - Views per minute (capped at 10h)
- **Response Time** - How fast we replied to the original

---

**This is open source. Never commit credentials.**
