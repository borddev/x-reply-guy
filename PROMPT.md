# X Reply Guy - Installation Prompt

Copy everything below the line and paste into Claude Code CLI.

---

You are installing **X Reply Guy**, an AI-powered Twitter/X reply bot.

## Step 1: Show Welcome

Print this exactly:

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
│    Installing: X Reply Guy                                   │
│    AI-powered Twitter/X reply bot                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Step 2: Prerequisites Check

Before installing, verify each prerequisite. Ask the user about each one and help them if something is missing.

### 2.1 Node.js
Run `node -v` to check if Node.js is installed.
- If installed (v18+): ✓ Node.js ready
- If not installed: Tell user to install from https://nodejs.org

### 2.2 AdsPower
Ask: "Do you have AdsPower installed and running?"

Explain: AdsPower is a browser automation tool needed to interact with X/Twitter.
- Download: https://www.adspower.com/download
- After installing, open AdsPower and keep it running
- The local API runs on http://127.0.0.1:50325

If they say yes, test it:
```bash
curl -s http://127.0.0.1:50325/status
```
If it responds, AdsPower is ready.

### 2.3 Supabase
Ask: "Do you have a Supabase account and project?"

Explain: Supabase is a free database to store your replies and analytics.
- Create account: https://supabase.com/dashboard
- Create a new project (free tier is fine)
- You'll need: Project URL and Service Role Key (from Settings > API)

Ask user for:
1. SUPABASE_URL (looks like: https://xxxxx.supabase.co)
2. SUPABASE_SERVICE_ROLE_KEY (starts with: eyJ...)

Save these for later.

### 2.4 Anthropic API Key
Ask: "Do you have an Anthropic API key for Claude?"

Explain: This powers the AI that writes your replies.
- Get one: https://console.anthropic.com/settings/keys
- Create a new key and copy it

Ask user for:
- ANTHROPIC_API_KEY (starts with: sk-ant-...)

Save for later.

### 2.5 X Premium Account
Ask: "Do you have X Premium? (needed for analytics)"

Explain: X Premium gives access to the analytics dashboard where you can see reply performance. The bot can work without it, but you won't be able to track impressions.

This is optional - continue either way.

## Step 3: Show Prerequisites Summary

Print a checklist of what's ready:

```
PREREQUISITES
═════════════
✓ Node.js v[version]
✓ AdsPower running
✓ Supabase configured
✓ Anthropic API key
○ X Premium (optional)

All required prerequisites met. Starting installation...
```

If anything is missing, stop and help the user fix it before continuing.

## Step 4: Install BORD

Check if ~/bord already exists:
```bash
ls ~/bord 2>/dev/null
```

If it exists, ask: "BORD is already installed at ~/bord. Use existing installation? (yes/no)"
- If yes: Skip cloning, continue
- If no: Ask if they want to delete and reinstall

If it doesn't exist, clone:
```bash
git clone https://github.com/borddev/bord ~/bord
```

Print: `[████████░░░░░░░░░░░░] 40% - BORD installed`

## Step 5: Install X Reply Guy

```bash
git clone https://github.com/borddev/x-reply-guy ~/bord/apps/x-reply-guy
```

Print: `[████████████░░░░░░░░] 60% - X Reply Guy installed`

## Step 6: Install Dependencies

```bash
cd ~/bord && npm install
```

Print: `[████████████████░░░░] 80% - Dependencies installed`

## Step 7: Configure Environment

Create ~/bord/.env.local with the keys collected earlier:

```bash
cat > ~/bord/.env.local << 'EOF'
# Supabase
SUPABASE_URL=<the URL from step 2.3>
SUPABASE_SERVICE_ROLE_KEY=<the key from step 2.3>

# Anthropic
ANTHROPIC_API_KEY=<the key from step 2.4>

# AdsPower
ADSPOWER_API=http://127.0.0.1:50325
EOF
```

Replace the placeholders with the actual values the user provided.

## Step 8: Setup Database

Run this SQL on Supabase. You can either:
1. Tell the user to run it in Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
2. Or use the Supabase CLI if available

```sql
-- X Reply Guy tables
CREATE TABLE IF NOT EXISTS x_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id TEXT UNIQUE,
  reply_text TEXT,
  reply_url TEXT,
  tweet_url TEXT,
  tweet_text TEXT,
  strategy TEXT,
  source TEXT DEFAULT 'bot',
  impressions INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  engagements INTEGER DEFAULT 0,
  bookmarks INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  reposts INTEGER DEFAULT 0,
  profile_visits INTEGER DEFAULT 0,
  original_views INTEGER,
  original_posted_at TIMESTAMPTZ,
  response_time_mins INTEGER,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  school_rating TEXT,
  school_comment TEXT
);

CREATE INDEX IF NOT EXISTS idx_replies_posted ON x_replies(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_replies_impressions ON x_replies(impressions DESC);
```

Ask the user to confirm when done.

Print: `[████████████████████] 100% - Setup complete!`

## Step 9: Complete

Print this:

```
════════════════════════════════════════════════════════════════
 ✓ INSTALLATION COMPLETE
════════════════════════════════════════════════════════════════

 X Reply Guy is installed at: ~/bord/apps/x-reply-guy

 NEXT STEPS:
 ───────────
 1. A new terminal window will open
 2. Claude Code will start in ~/bord
 3. Say "start the dev server" to begin

 MANUAL SETUP NEEDED:
 ────────────────────
 • Open AdsPower
 • Create a browser profile for your X account
 • Log into X in that browser profile
 • Note the profile ID (shown in AdsPower)

════════════════════════════════════════════════════════════════

Opening new terminal...
```

## Step 10: Open New Terminal

Run this to open a new terminal window in ~/bord with Claude Code:

```bash
osascript -e 'tell application "Terminal" to do script "cd ~/bord && echo \"Welcome to BORD! Type: claude\" && echo \"\""'
```

Tell the user: "A new Terminal window opened. Run `claude` there to continue."

---

## Troubleshooting

If something fails:

**AdsPower not responding:**
- Make sure AdsPower app is open
- Check if API is enabled in AdsPower settings

**Supabase connection failed:**
- Verify the URL is correct (should end with .supabase.co)
- Make sure you're using the Service Role Key, not the anon key

**Anthropic API error:**
- Check the key is valid at https://console.anthropic.com
- Make sure you have credits/billing set up

## Links

- [BORD Documentation](https://bord.dev/docs)
- [X Reply Guy Repo](https://github.com/borddev/x-reply-guy)
- [Report Issues](https://github.com/borddev/x-reply-guy/issues)
