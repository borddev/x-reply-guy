# X Reply Guy

Twitter/X analytics dashboard.

## Setup Steps

When asked to setup x-reply-guy, follow ALL steps automatically:

### 1. Start Dashboard & Open Setup UI

Start the BORD dashboard immediately so user sees visual progress:
```bash
cd ~/bord && npm run dev > /dev/null 2>&1 &
sleep 3
open http://localhost:3000/setup
```

Initialize setup status:
```bash
curl -s -X POST http://localhost:3000/api/setup -H "Content-Type: application/json" -d '{"step":1,"message":"Installing X Reply Guy...","progress":10,"complete":false}'
```

### 2. Install App Pages

Update progress:
```bash
curl -s -X POST http://localhost:3000/api/setup -H "Content-Type: application/json" -d '{"step":1,"message":"Copying app files...","progress":20,"complete":false}'
```

Copy app pages and API routes to BORD dashboard:
```bash
mkdir -p ~/bord/app/x-reply-guy/api && cp -r ~/bord/apps/x-reply-guy/app/* ~/bord/app/x-reply-guy/ && cp -r ~/bord/apps/x-reply-guy/api/* ~/bord/app/x-reply-guy/api/
```

Update progress:
```bash
curl -s -X POST http://localhost:3000/api/setup -H "Content-Type: application/json" -d '{"step":2,"message":"App files installed!","progress":30,"complete":false}'
```

### 3. Install Browser

Update progress:
```bash
curl -s -X POST http://localhost:3000/api/setup -H "Content-Type: application/json" -d '{"step":2,"message":"Installing BORD Browser...","progress":40,"complete":false}'
```

Install Playwright browsers:
```bash
cd ~/bord && npx playwright install chromium
```

Update progress:
```bash
curl -s -X POST http://localhost:3000/api/setup -H "Content-Type: application/json" -d '{"step":3,"message":"Browser installed!","progress":60,"complete":false}'
```

### 4. Launch Browser for Login

Update progress:
```bash
curl -s -X POST http://localhost:3000/api/setup -H "Content-Type: application/json" -d '{"step":3,"message":"Launching browser - please login to X...","progress":70,"complete":false}'
```

Launch the browser:
```bash
npx tsx ~/bord/lib/browser.ts launch x-reply-guy &
```

Wait 3 seconds for browser to open.

Tell user:
```
══════════════════════════════════════════════════════════════
 LOGIN TO TWITTER/X
══════════════════════════════════════════════════════════════

 A browser window just opened!

 1. Login to your Twitter/X account
 2. DON'T close the browser - just come back here

 Say "done" when you're logged in
══════════════════════════════════════════════════════════════
```

Wait for user to say "done".

### 5. Complete Setup

Update progress:
```bash
curl -s -X POST http://localhost:3000/api/setup -H "Content-Type: application/json" -d '{"step":4,"message":"Login saved! Redirecting to X Reply Guy...","progress":100,"complete":true,"redirect":"/x-reply-guy"}'
```

Print:
```
════════════════════════════════════════════════════════════════
 X REPLY GUY READY
════════════════════════════════════════════════════════════════

 Dashboard: http://localhost:3000/x-reply-guy

 Your browser session is saved - you won't need to login again!

════════════════════════════════════════════════════════════════
```

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
