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

Then follow these steps, printing progress after each:

### 1. Install AdsPower

Print: `[████░░░░░░░░░░░░░░░░] 20% Installing browser tool...`

```bash
ls /Applications/AdsPower.app 2>/dev/null
```

If not installed, download and install:
```bash
curl -L "https://www.adspower.com/download" -o /tmp/adspower_page.html
```
Then find the macOS ARM64 or Intel download link and download the DMG.
Mount it, copy to /Applications, unmount.

Print: `[████████░░░░░░░░░░░░] 40% Browser tool installed`

### 2. Open AdsPower

```bash
open /Applications/AdsPower.app
```

Print: `[████████████░░░░░░░░] 60% Browser tool opened`

Tell user:
```
AdsPower is opening. Please:
1. Create account or login
2. Click "New Profile" → name it → OK
3. Right-click profile → "Check ID"
4. Paste the ID here:
```

Wait for user to provide profile ID.

### 3. Create env file

Print: `[████████████████░░░░] 80% Saving configuration...`

Create ~/bord/.env.local:
```
ADSPOWER_API=http://127.0.0.1:50325
ADSPOWER_PROFILE_ID=<user's ID>
```

### 4. Login to X

Tell user: "Click 'Open' on your AdsPower profile, login to x.com, then say 'done'"

### 5. Start dashboard

Print: `[████████████████████] 100% Starting dashboard...`

```bash
cd ~/bord && npm run dev &
sleep 3
open http://localhost:3000/x-reply-guy
```

Print:
```
════════════════════════════════════════════════════════════════
 ✓ X REPLY GUY READY
════════════════════════════════════════════════════════════════

 Dashboard: http://localhost:3000/x-reply-guy

════════════════════════════════════════════════════════════════
```
