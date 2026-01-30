# X Reply Guy

Automated X/Twitter reply bot that uses Claude AI to generate viral replies. Finds high-VPM (views per minute) tweets and replies with @grok photo/question requests for maximum engagement.

**Results from 500+ replies:** @grok photo strategy averages 505 views/reply, with top performers hitting 18K+ views.

## Install

Copy and paste into [Claude Code](https://claude.ai/claude-code):

```
Clone https://github.com/borddev/bord to ~/bord then clone https://github.com/borddev/x-reply-guy to ~/bord/apps/x-reply-guy then run npm install in ~/bord then read ~/bord/apps/x-reply-guy/CLAUDE.md and run the setup steps
```

This installs x-reply-guy as an app inside [BORD](https://github.com/borddev/bord), which provides the dashboard UI for analytics, reply school, and bot management.

## How It Works

1. Bot searches X for trending tweets (min 5K+ likes, English)
2. Claude AI analyzes each tweet: skip politics, skip small accounts, find comedy angle
3. Generates @grok photo request or witty reply
4. Posts reply via browser automation
5. Tracks performance in Supabase, syncs analytics from X Premium

## Prerequisites

- **[Claude Code](https://claude.ai/claude-code)** - For automated setup
- **Node.js 18+**
- **[AdsPower](https://www.adspower.com/)** - Anti-detect browser with a profile logged into X
- **[Supabase](https://supabase.com/)** account - Free tier works
- **[Anthropic API key](https://console.anthropic.com/)** - For Claude AI

## Manual Setup (without Claude Code)

```bash
# 1. Clone BORD dashboard
git clone https://github.com/borddev/bord.git ~/bord
cd ~/bord && npm install

# 2. Clone x-reply-guy as a BORD app
git clone https://github.com/borddev/x-reply-guy.git ~/bord/apps/x-reply-guy

# 3. Configure environment
cp ~/bord/apps/x-reply-guy/.env.example ~/bord/apps/x-reply-guy/.env
# Edit .env with your credentials

# 4. Setup database
# Go to your Supabase SQL Editor and run:
#   db/schema.sql
#   db/follow4follow-schema.sql (optional, for F4F bot)

# 5. Configure sources (optional)
cd ~/bord/apps/x-reply-guy
cp config/sources-example.json config/viral-sources.json
cp config/follow4follow-sources-example.json config/follow4follow-sources.json
cp config/notification-priority-example.json config/notification-priority.json

# 6. Start the bot
npm start
```

## Bots

| Bot | Command | What it does |
|-----|---------|-------------|
| **Continuous Reply** | `npm start` | Main bot. Finds viral tweets, generates AI replies, posts every 5-7 min |
| **Follow4Follow** | `npm run start:f4f` | Follows target account followers, unfollows non-followers after 3 days |
| **Viral Alert** | `npm run start:viral` | Monitors for VPM 500+ tweets, alerts for immediate reply |
| **Smart Reply** | `npm run start:smart` | Rate-limited to 20/day with 30min spacing |

## Scripts

| Script | Command | What it does |
|--------|---------|-------------|
| Quick Stats | `npm run stats` | Overview of reply and F4F performance |
| Daily Analysis | `npm run analyze` | Claude AI analyzes last 24h, suggests improvements |
| Performance | `npm run performance` | Top/worst performers and strategy breakdown |
| Sync Analytics | `npm run sync` | Syncs view counts from X Premium Analytics page |
| Daily Recap | `npm run recap` | Sends email with daily stats (requires Mailgun) |

## Shell Scripts

```bash
./scripts/start.sh    # Start bot in background
./scripts/stop.sh     # Stop bot
./scripts/status.sh   # Check if running + recent stats
./scripts/watchdog.sh # Auto-restart if crashed (add to cron)
```

### Cron Setup (optional)

```bash
# Add to crontab: crontab -e
*/5 * * * * /path/to/x-reply-guy/scripts/watchdog.sh
0 22 * * * cd /path/to/x-reply-guy && node scripts/daily-recap-email.js
```

## Configuration

### Agent Prompt (`config/agent-prompt.md`)

The AI brain. Controls which tweets to reply to, what strategies to use, and tone of voice. Edit this to change bot behavior without touching code.

### Viral Sources (`config/viral-sources.json`)

Accounts known for viral content. The viral-alert-bot monitors these.

### F4F Sources (`config/follow4follow-sources.json`)

Accounts whose followers to target for follow-for-follow growth.

### Personas (`config/personas/`)

Character templates for multi-account setups. Each persona defines a unique voice and content style.

## Strategy Performance (from real data)

| Strategy | Avg Views | % of Replies | Notes |
|----------|-----------|-------------|-------|
| @grok photo | 505 | 80% | Best performer by far |
| @grok question | 266 | 15% | Good for absurd reframing |
| No grok witty | 189 | 5% | Only for slam dunk one-liners |

## Database

Uses Supabase with two main table groups:

- **`x_replies`** - Every reply posted, with view tracking
- **`x_f4f_follows`** / **`x_f4f_sources`** - Follow-for-follow tracking

Run `db/schema.sql` and `db/follow4follow-schema.sql` in Supabase SQL Editor.

## BORD Dashboard

x-reply-guy is designed to run as an app inside [BORD](https://github.com/borddev/bord). BORD provides:

- Visual dashboard for reply analytics and performance
- Reply School - review and rate your replies to improve the AI
- Bot management UI (start/stop/pause)
- Follow-for-follow stats and source management

## License

MIT
