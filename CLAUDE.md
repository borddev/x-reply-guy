# X Reply Guy

Twitter/X analytics dashboard.

## Setup Steps

When asked to setup x-reply-guy, follow these steps:

### 1. Install browser tool

Check if AdsPower is installed:
```bash
ls /Applications/AdsPower.app 2>/dev/null
```

If not installed, tell user:
"Download AdsPower from https://www.adspower.com/download and install it, then say 'continue'"

If installed, continue.

### 2. Open AdsPower

```bash
open /Applications/AdsPower.app
```

Tell user: "AdsPower is opening. If you're new, click Register to create an account. Once logged in, say 'continue'"

### 3. Create browser profile

Tell user:
"In AdsPower:
1. Click 'New Profile' button
2. Name it anything (e.g. 'Main')
3. Click OK
4. Then say 'continue'"

### 4. Get profile ID

Tell user:
"Right-click your profile → Check ID → Copy the ID (looks like: jxxxxxx)
Paste the ID here:"

Save the ID they provide.

### 5. Create env file

Create ~/bord/.env.local with:
```
ADSPOWER_API=http://127.0.0.1:50325
ADSPOWER_PROFILE_ID=<the ID from step 4>
```

### 6. Login to X

Tell user:
"In AdsPower, click 'Open' on your profile to launch the browser.
Go to x.com and log in to your X account.
Keep the browser open.
Say 'continue' when logged in."

### 7. Start dashboard

```bash
cd ~/bord && npm run dev
```

Then open browser:
```bash
open http://localhost:3000/x-reply-guy
```

Tell user: "Setup complete! Dashboard is now open at localhost:3000/x-reply-guy"

## Database

SQLite at `~/bord/data/x-reply-guy/replies.db` - created automatically.
