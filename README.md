# X Reply Guy

AI-powered Twitter/X reply bot.

## Install

1. Run `claude --dangerously-skip-permissions`
2. Copy the prompt below and paste:

```
You are installing X Reply Guy, an AI-powered Twitter/X reply bot.

STEP 1: SHOW WELCOME
Print this exactly:

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

STEP 2: PREREQUISITES CHECK
Before installing, verify each prerequisite. Ask the user about each one.

2.1 Node.js
Run: node -v
- If v18+: Continue
- If not installed: Tell user to install from https://nodejs.org

2.2 AdsPower
Ask: "Do you have AdsPower installed and running?"
- Download: https://www.adspower.com/download
- Test with: curl -s http://127.0.0.1:50325/status

2.3 Supabase
Ask: "Do you have a Supabase project?"
- Create: https://supabase.com/dashboard
- Get: Project URL and Service Role Key (Settings > API)
Ask for SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Save for later.

2.4 Anthropic API Key
Ask: "Do you have an Anthropic API key?"
- Get one: https://console.anthropic.com/settings/keys
Ask for ANTHROPIC_API_KEY. Save for later.

2.5 X Premium (optional)
Ask: "Do you have X Premium?" - needed for analytics but optional.

STEP 3: SHOW CHECKLIST
Print:
PREREQUISITES
═════════════
✓ Node.js
✓ AdsPower
✓ Supabase
✓ Anthropic API key
○ X Premium (optional)

Starting installation...

STEP 4: INSTALL BORD
Check if ~/bord exists: ls ~/bord 2>/dev/null
- If exists: Ask "Use existing ~/bord? (yes/no)"
- If not: Run: git clone https://github.com/borddev/bord ~/bord
Print: [████████░░░░░░░░░░░░] 40% - BORD installed

STEP 5: INSTALL X REPLY GUY
Run: git clone https://github.com/borddev/x-reply-guy ~/bord/apps/x-reply-guy
Print: [████████████░░░░░░░░] 60% - X Reply Guy installed

STEP 6: INSTALL DEPENDENCIES
Run: cd ~/bord && npm install
Print: [████████████████░░░░] 80% - Dependencies installed

STEP 7: CONFIGURE ENVIRONMENT
Create ~/bord/.env.local with the keys from Step 2:

# Supabase
SUPABASE_URL=<url from step 2.3>
SUPABASE_SERVICE_ROLE_KEY=<key from step 2.3>

# Anthropic
ANTHROPIC_API_KEY=<key from step 2.4>

# AdsPower
ADSPOWER_API=http://127.0.0.1:50325

STEP 8: SETUP DATABASE
Tell user to go to Supabase SQL Editor and run:

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

Ask user to confirm when done.
Print: [████████████████████] 100% - Setup complete!

STEP 9: COMPLETE
Print:
════════════════════════════════════════════════════════════════
 ✓ INSTALLATION COMPLETE
════════════════════════════════════════════════════════════════

 Location: ~/bord/apps/x-reply-guy

 NEXT STEPS:
 1. A new terminal will open at ~/bord
 2. Run: claude --dangerously-skip-permissions
 3. Say "start the dev server"

 MANUAL SETUP:
 • Open AdsPower
 • Create browser profile for X account
 • Log into X in that profile
 • Note the profile ID

════════════════════════════════════════════════════════════════

STEP 10: OPEN NEW TERMINAL
Run: osascript -e 'tell application "Terminal" to do script "cd ~/bord && echo Welcome to BORD! && echo && echo Run: claude --dangerously-skip-permissions"'
Tell user: "New terminal opened. Run claude --dangerously-skip-permissions there."
```

## Links

- [BORD](https://github.com/borddev/bord)
- [Issues](https://github.com/borddev/x-reply-guy/issues)
