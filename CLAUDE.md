# X Reply Guy

Twitter/X analytics dashboard.

## Setup Steps

When asked to setup x-reply-guy, follow ALL steps automatically:

### 1. Show Welcome

Print:
```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│    ██████╗  ██████╗ ██████╗ ██████╗                          │
│    ██╔══██╗██╔═══██╗██╔══██╗██╔══██╗                         │
│    ██████╔╝██║   ██║██████╔╝██║  ██║                         │
│    ██╔══██╗██║   ██║██╔══██╗██║  ██║                         │
│    ██████╔╝╚██████╔╝██║  ██║██████╔╝                         │
│    ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═════╝                          │
│                                                              │
│    Setting up: X Reply Guy                                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 2. Install Browser

Print: `[████████░░░░░░░░░░░░] 40% Installing BORD Browser...`

Install Playwright browsers:
```bash
cd ~/bord && npx playwright install chromium
```

Send notification:
```bash
npx tsx ~/bord/lib/notify.ts "Browser installed!" --app bord
```

Print: `[████████████░░░░░░░░] 60% Browser ready`

### 3. Launch Browser & Login

Print:
```
[████████████░░░░░░░░] 60% Launching browser...

BORD Browser uses stealth Playwright - it's FREE and open source.
Your session is saved in ~/bord/data/browser-profiles/x-reply-guy/
```

Launch the browser:
```bash
npx tsx ~/bord/lib/browser.ts launch x-reply-guy &
```

Wait 5 seconds for browser to open.

Send notification:
```bash
npx tsx ~/bord/lib/notify.ts "Browser opened! Login to X" --app bord
```

Tell user:
```
══════════════════════════════════════════════════════════════
 LOGIN TO TWITTER/X
══════════════════════════════════════════════════════════════

 A browser window just opened!

 1. Go to x.com (it may already be there)
 2. Login to your Twitter/X account
 3. DON'T close the browser - just come back here

 Say "done" when you're logged in
══════════════════════════════════════════════════════════════
```

Wait for user to say "done".

### 4. Verify Login

Print: `[████████████████░░░░] 80% Verifying login...`

The browser should now be logged into X. The session is automatically saved.

Send notification:
```bash
npx tsx ~/bord/lib/notify.ts "Login verified!" --app bord
```

### 5. Start Dashboard

Print: `[████████████████████] 100% Starting dashboard...`

```bash
cd ~/bord && npm run dev &
sleep 3
open http://localhost:3000/x-reply-guy
```

Send notification:
```bash
npx tsx ~/bord/lib/notify.ts "X Reply Guy is ready!" --app x-reply-guy --subtitle "Dashboard opened"
```

Print:
```
════════════════════════════════════════════════════════════════
 ✓ X REPLY GUY READY
════════════════════════════════════════════════════════════════

 Dashboard: http://localhost:3000/x-reply-guy

 Browser profile saved at:
 ~/bord/data/browser-profiles/x-reply-guy/

 Your login session is persistent - you won't need to login again!

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
