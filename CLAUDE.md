# X Reply Guy

Automated X/Twitter reply bot with AI-powered engagement. Uses Claude AI to analyze tweets and generate viral replies via @grok photo/question requests.

## Architecture

```
x-reply-guy/
├── bots/                    # Main bot scripts (run continuously)
│   ├── continuous-reply-bot.js   # Primary bot - finds & replies to viral tweets
│   ├── follow4follow-bot.js      # F4F growth bot
│   ├── viral-alert-bot.js        # Monitors for viral tweets
│   └── smart-reply-bot.js        # Rate-limited smart replies
├── scripts/                 # Utility scripts (run on demand)
│   ├── start.sh / stop.sh / status.sh / watchdog.sh
│   ├── analyze-daily.js     # Daily AI analysis
│   ├── analyze-performance.js
│   ├── sync-analytics.js    # Sync views from X analytics
│   ├── quick-stats.js       # Quick performance overview
│   └── daily-recap-email.js # Email recap
├── lib/                     # Shared modules
│   ├── supabase.js          # DB client (from .env)
│   ├── adspower.js          # Browser automation
│   ├── ai.js                # Claude AI client
│   ├── email.js             # Mailgun client
│   └── tweet-scorer.js      # Tweet scoring algorithm
├── config/                  # Configuration
│   ├── agent-prompt.md      # AI agent instructions
│   ├── personas/            # Character templates
│   └── *-example.json       # Config templates
├── db/                      # Database schemas
│   ├── schema.sql           # Main tables
│   └── follow4follow-schema.sql
└── .env                     # Credentials (not in git)
```

## Running Bots

```bash
# Start main reply bot
npm start                     # or: ./scripts/start.sh (background)

# Start F4F bot
npm run start:f4f

# Start viral alert monitor
npm run start:viral

# Check status
./scripts/status.sh

# Stop
./scripts/stop.sh
```

## Key Concepts

- **VPM (Views Per Minute)**: Primary metric for tweet selection. High VPM = catching viral wave early.
- **Strategies**: 90% @grok photo, 10% @grok question (data-driven from 500+ replies).
- **Agent Prompt**: `config/agent-prompt.md` controls AI decision-making. Editable without code changes.
- **State files**: Bot state in `state/` directory (gitignored). Safe to delete to reset.

## Dependencies

- **AdsPower**: Browser automation with anti-detection profiles
- **Supabase**: Reply tracking, analytics, F4F tracking
- **Claude AI**: Tweet analysis and reply generation
- **Playwright**: Browser control (connects to AdsPower via CDP)

## Environment

All credentials in `.env` (see `.env.example`). Required:
- `ANTHROPIC_API_KEY` - Claude AI
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` - Database
- `ADSPOWER_PROFILE_ID` - Browser profile
- `X_USERNAME` - Your X handle
