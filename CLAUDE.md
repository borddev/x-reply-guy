# X Reply Guy

Twitter/X analytics dashboard.

## Setup Steps

When asked to setup x-reply-guy, FIRST print this welcome banner:

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

### 1. Install Browser Tool

Print:
```
[████░░░░░░░░░░░░░░░░] 20% Setting up browser automation...

X Reply Guy needs a browser tool to interact with Twitter/X.
We use AdsPower - it's FREE and lets you safely automate browsers.
Used by 10M+ people worldwide.
```

Check if AdsPower is installed:
```bash
ls /Applications/AdsPower*.app 2>/dev/null
```

If not installed:
- Search web for latest AdsPower macOS download link
- Download the DMG for the correct architecture (ARM64 or Intel)
- Mount, copy to /Applications, unmount

Send notification:
```bash
npx tsx ~/bord/lib/notify.ts "AdsPower installed!" --app bord
```

Print: `[████████░░░░░░░░░░░░] 40% Browser tool ready`

### 2. Setup AdsPower Account

Print:
```
[████████░░░░░░░░░░░░] 40% Opening AdsPower...
```

Open AdsPower app:
```bash
open "/Applications/AdsPower Global.app" 2>/dev/null || open /Applications/AdsPower.app
```

Send notification:
```bash
npx tsx ~/bord/lib/notify.ts "Login to AdsPower with Google" --app bord
```

Tell user:
```
══════════════════════════════════════════════════════════════
 LOGIN TO ADSPOWER (FREE)
══════════════════════════════════════════════════════════════

 AdsPower app is now open.

 Click "Login with Google" - it's the fastest way!
 (Or click Register if you prefer email)

 Say "done" when you're logged in
══════════════════════════════════════════════════════════════
```

Wait for user to say "done".

### 3. Create Browser Profile

Print: `[████████████░░░░░░░░] 60% Creating browser profile...`

Send notification:
```bash
npx tsx ~/bord/lib/notify.ts "Now create a browser profile" --app bord
```

Tell user:
```
══════════════════════════════════════════════════════════════
 CREATE BROWSER PROFILE
══════════════════════════════════════════════════════════════

 In AdsPower:

 1. Click the blue "+ New Profile" button (top right)
 2. Name it anything (e.g. "Twitter")
 3. Click "OK" or "Create"

 Then:
 4. Right-click your new profile
 5. Select "Check ID"
 6. Copy the ID (looks like: jxxxxxx)

 Paste the profile ID here:
══════════════════════════════════════════════════════════════
```

Wait for user to provide profile ID.

### 4. Save Configuration

Print: `[████████████████░░░░] 80% Saving configuration...`

Create ~/bord/.env.local:
```
ADSPOWER_API=http://127.0.0.1:50325
ADSPOWER_PROFILE_ID=<user's ID>
```

Send notification:
```bash
npx tsx ~/bord/lib/notify.ts "Configuration saved!" --app bord
```

### 5. Login to Twitter/X

Tell user:
```
══════════════════════════════════════════════════════════════
 LOGIN TO TWITTER/X
══════════════════════════════════════════════════════════════

 1. In AdsPower, click "Open" on your profile
 2. A browser will open - go to x.com
 3. Login to your Twitter/X account
 4. Keep the browser open

 Say "done" when logged in
══════════════════════════════════════════════════════════════
```

### 6. Start Dashboard

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

 Your browser profile is connected and ready.
 Keep AdsPower running in the background.

════════════════════════════════════════════════════════════════
```
