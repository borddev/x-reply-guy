# X Reply Guy

Twitter/X analytics dashboard.

## Setup Steps

When asked to setup x-reply-guy, follow ALL steps automatically without stopping:

### 1. Start Dashboard & Open Setup UI

Start the BORD dashboard and open setup screen:
```bash
cd ~/bord && npm run dev > /dev/null 2>&1 &
sleep 3
open http://localhost:3000/setup
```

Reset and initialize setup:
```bash
curl -s -X DELETE http://localhost:3000/api/setup > /dev/null
curl -s -X POST http://localhost:3000/api/setup -H "Content-Type: application/json" -d '{"step":1,"message":"Installing X Reply Guy...","progress":5,"complete":false,"logs":["→ Starting X Reply Guy setup..."],"app":{"name":"X Reply Guy","description":"Twitter/X analytics & automation","icon":"x","features":["Track reply impressions & engagement","Views per minute analytics","Stealth browser automation","Persistent login sessions"]}}'
```

### 2. Install App Pages

Log and copy files:
```bash
curl -s -X POST http://localhost:3000/api/setup -H "Content-Type: application/json" -d '{"log":"→ Creating app directory..."}'
mkdir -p ~/bord/app/x-reply-guy/api
curl -s -X POST http://localhost:3000/api/setup -H "Content-Type: application/json" -d '{"log":"→ Copying app pages...","progress":15}'
cp -r ~/bord/apps/x-reply-guy/app/* ~/bord/app/x-reply-guy/
curl -s -X POST http://localhost:3000/api/setup -H "Content-Type: application/json" -d '{"log":"→ Copying API routes...","progress":20}'
cp -r ~/bord/apps/x-reply-guy/api/* ~/bord/app/x-reply-guy/api/
curl -s -X POST http://localhost:3000/api/setup -H "Content-Type: application/json" -d '{"log":"✓ App files installed","step":2,"message":"Installing browser...","progress":30}'
```

### 3. Install Browser

Install Playwright with logging:
```bash
curl -s -X POST http://localhost:3000/api/setup -H "Content-Type: application/json" -d '{"log":"→ Installing Playwright Chromium...","message":"Downloading browser..."}'
cd ~/bord && npx playwright install chromium 2>&1 | head -5
curl -s -X POST http://localhost:3000/api/setup -H "Content-Type: application/json" -d '{"log":"✓ Browser installed","step":2,"message":"Browser ready!","progress":50}'
```

### 4. Launch Browser for Login

Launch browser and start auto-detection:
```bash
curl -s -X POST http://localhost:3000/api/setup -H "Content-Type: application/json" -d '{"log":"→ Launching BORD Browser...","step":3,"message":"Opening browser...","progress":55}'
npx tsx ~/bord/lib/browser.ts launch x-reply-guy > /dev/null 2>&1 &
sleep 3
curl -s -X POST http://localhost:3000/api/setup -H "Content-Type: application/json" -d '{"log":"✓ Browser launched","log":"→ Navigate to x.com and login","message":"Login to X in the browser...","progress":60,"waitingForLogin":true}'
```

### 5. Auto-Detect Login & Complete

Start the login detection script (runs in background, auto-completes when logged in):
```bash
curl -s -X POST http://localhost:3000/api/setup -H "Content-Type: application/json" -d '{"log":"→ Waiting for X login...","message":"Login to X - setup will continue automatically","progress":70}'
npx tsx ~/bord/lib/check-x-login.ts x-reply-guy &
```

Tell user (this is the ONLY message they see in terminal):
```
════════════════════════════════════════════════════════════════

  A browser window opened - login to X/Twitter

  Setup will complete automatically when you're logged in.

  Watch the progress at: http://localhost:3000/setup

════════════════════════════════════════════════════════════════
```

DO NOT wait for user response. The check-x-login.ts script will auto-detect login and complete the setup. The user just needs to login in the browser.

## Running the Bot

When user asks to "start the bot" or "run x-reply-guy":

```bash
cd ~/bord && npx tsx apps/x-reply-guy/automations/reply-bot.ts
```

## Browser Commands

- Launch browser: `npx tsx ~/bord/lib/browser.ts launch x-reply-guy`
- List profiles: `npx tsx ~/bord/lib/browser.ts list`
- Delete profile: `npx tsx ~/bord/lib/browser.ts delete x-reply-guy`

## Database

SQLite at `~/bord/data/x-reply-guy/replies.db` - created automatically.

## No AdsPower Needed!

BORD Browser is built-in and FREE:
- Stealth mode (anti-detection)
- Persistent sessions (stay logged in)
- Open source
