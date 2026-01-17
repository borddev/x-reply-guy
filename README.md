# X Reply Guy

AI-powered Twitter/X reply bot that generates witty responses to viral tweets.

## Features

- Autonomous reply generation using Claude AI
- Multiple strategies (@grok Photo, @grok Question, No Grok)
- Analytics dashboard with impressions, VPM, likes
- Training school to improve reply quality
- Follow-for-Follow tracking
- CSV import from X Analytics

## Quick Install

Copy the contents of [PROMPT.md](./PROMPT.md) and paste into Claude Code.

## Manual Install

1. Install [BORD](https://github.com/user/bord) first
2. Clone this repo:
   ```bash
   git clone https://github.com/user/x-reply-guy ./bord/apps/x-reply-guy
   ```
3. Copy app files:
   ```bash
   cp -r ./bord/apps/x-reply-guy/app/* ./bord/app/x-reply-guy/
   ```
4. Add API keys at http://localhost:3000/secrets

## Screenshots

### Dashboard
View all your replies with impressions, VPM, and engagement metrics.

### School
Rate replies as Good/Bad to train the AI for better performance.

### F4F Tracker
Monitor your follow-for-follow campaigns and conversion rates.

## Configuration

See [CLAUDE.md](./CLAUDE.md) for detailed setup instructions including:
- Database schema
- Environment variables
- Bot strategies
- Running the automation scripts

## Requirements

- BORD platform
- Supabase account
- Anthropic API key
- AdsPower (for browser automation)
- X Premium (for analytics)

## License

MIT

---

Part of the [BORD](https://bord.dev) ecosystem.
