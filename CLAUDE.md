# X Reply Guy - Claude Code Instructions

You are running X Reply Guy, an AI-powered Twitter/X reply bot.

## What is X Reply Guy?

An autonomous bot that:
1. Monitors viral tweets on X/Twitter
2. Generates witty, engaging replies using Claude AI (that's you!)
3. Posts replies to gain impressions and followers
4. Tracks performance with analytics dashboard

## Prerequisites

- BORD platform installed at ~/bord
- AdsPower with X account logged in
- X Premium account (for analytics)

## Database

Uses SQLite stored at: `~/bord/data/x-reply-guy/replies.db`

No external database setup required - it's created automatically.

## Environment Variables

Add these to `~/bord/.env.local`:

```env
# AdsPower
ADSPOWER_API=http://127.0.0.1:50325
ADSPOWER_PROFILE_ID=jxxxxxx

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
├── lib/
│   └── db.ts             # SQLite database
├── public/
│   └── icon.png          # X logo for notifications
├── config.json            # App metadata
└── CLAUDE.md             # This file
```

## Running the Bot

Say "start the reply bot" and I will:
1. Check AdsPower is running
2. Open the browser profile
3. Navigate to X and start replying

## Dashboard

Say "start the dev server" to view analytics at localhost:3000/x-reply-guy

## Notifications

The bot sends macOS notifications for:
- Reply posted successfully
- Error occurred
- Session stats

Uses the X logo from `public/icon.png`.

---

**This is open source. Never commit credentials.**
