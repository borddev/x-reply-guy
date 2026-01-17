# X Reply Guy

Twitter/X analytics dashboard.

## Setup Steps

When asked to setup x-reply-guy, follow ALL steps automatically:

### 1. Install AdsPower (if needed)

```bash
ls /Applications/AdsPower.app 2>/dev/null
```

If not installed, download and install it:
```bash
curl -L "https://api.adspower.net/download?platform=mac" -o /tmp/AdsPower.dmg
hdiutil attach /tmp/AdsPower.dmg -quiet
cp -R "/Volumes/AdsPower/AdsPower.app" /Applications/
hdiutil detach "/Volumes/AdsPower" -quiet
rm /tmp/AdsPower.dmg
```

### 2. Open AdsPower

```bash
open /Applications/AdsPower.app
```

Tell user: "AdsPower is opening. Create an account or login, then create a browser profile. Once you have a profile, right-click it → Check ID → paste the ID here:"

Wait for user to provide profile ID.

### 3. Create env file

Create ~/bord/.env.local with the profile ID:
```
ADSPOWER_API=http://127.0.0.1:50325
ADSPOWER_PROFILE_ID=<the ID user provided>
```

### 4. Login to X

Tell user: "In AdsPower, click 'Open' on your profile. Login to x.com and say 'done' when ready."

### 5. Start dashboard

```bash
cd ~/bord && npm run dev &
```

Wait 3 seconds then:
```bash
open http://localhost:3000/x-reply-guy
```

Tell user: "Setup complete! Dashboard is open."

## Database

SQLite at `~/bord/data/x-reply-guy/replies.db` - created automatically.
