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

### 3. Create Browser Profile (Automatic)

Print: `[████████████░░░░░░░░] 60% Creating browser profile...`

Send notification:
```bash
npx tsx ~/bord/lib/notify.ts "Creating browser profile..." --app bord
```

Create profile using AdsPower API:
```bash
curl -s "http://127.0.0.1:50325/api/v1/user/create" \
  -H "Content-Type: application/json" \
  -d '{"name":"X Reply Guy","group_id":"0","remark":"Created by BORD"}'
```

This returns JSON with the profile ID. Extract the `user_id` from the response.

If API fails, check if AdsPower is running and try again.

Print: `Profile created! ID: <user_id>`

### 4. Save Configuration

Print: `[████████████████░░░░] 80% Saving configuration...`

Create ~/bord/.env.local with the profile ID from step 3:
```
ADSPOWER_API=http://127.0.0.1:50325
ADSPOWER_PROFILE_ID=<user_id from step 3>
```

Send notification:
```bash
npx tsx ~/bord/lib/notify.ts "Configuration saved!" --app bord
```

### 5. Login to Twitter/X

Print: `[████████████████░░░░] 85% Opening browser...`

Open the browser profile automatically:
```bash
curl -s "http://127.0.0.1:50325/api/v1/browser/start?user_id=<user_id>"
```

This launches the browser. Wait 3 seconds for it to open.

Send notification:
```bash
npx tsx ~/bord/lib/notify.ts "Browser opened! Login to X" --app bord
```

Then open Twitter:
```bash
# The browser is now controlled by AdsPower
# Tell user to login
```

Tell user:
```
══════════════════════════════════════════════════════════════
 LOGIN TO TWITTER/X
══════════════════════════════════════════════════════════════

 A browser just opened automatically!

 1. Go to x.com
 2. Login to your Twitter/X account
 3. Keep the browser open

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
