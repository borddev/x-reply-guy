# X Reply Guy - Installation Prompt

Copy everything below and paste into Claude Code:

---

```
I want to install X Reply Guy for BORD. Execute these steps and show me the progress.

## Installation Progress

Show this progress bar and update it as you complete each step:

Step 1: [░░░░░░░░░░░░░░░░░░░░]   0% - Starting installation...
Step 2: [████░░░░░░░░░░░░░░░░]  20% - Cloning BORD platform...
Step 3: [████████░░░░░░░░░░░░]  40% - Cloning X Reply Guy...
Step 4: [████████████░░░░░░░░]  60% - Installing dependencies...
Step 5: [████████████████░░░░]  80% - Setting up configuration...
Step 6: [████████████████████] 100% - Starting server...

## Steps to Execute

### Step 1: Show welcome message
Print this ASCII art:

╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ██╗  ██╗    ██████╗ ███████╗██████╗ ██╗  ██╗   ██╗     ║
║   ╚██╗██╔╝    ██╔══██╗██╔════╝██╔══██╗██║  ╚██╗ ██╔╝     ║
║    ╚███╔╝     ██████╔╝█████╗  ██████╔╝██║   ╚████╔╝      ║
║    ██╔██╗     ██╔══██╗██╔══╝  ██╔═══╝ ██║    ╚██╔╝       ║
║   ██╔╝ ██╗    ██║  ██║███████╗██║     ███████╗██║        ║
║   ╚═╝  ╚═╝    ╚═╝  ╚═╝╚══════╝╚═╝     ╚══════╝╚═╝        ║
║                                                           ║
║              AI-Powered Twitter Reply Bot                 ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

### Step 2: Clone BORD (if not exists)
Check if ./bord exists. If not:
git clone https://github.com/borddev/bord ./bord

Update progress: [████░░░░░░░░░░░░░░░░] 20%

### Step 3: Clone X Reply Guy
git clone https://github.com/borddev/x-reply-guy ./bord/apps/x-reply-guy

Update progress: [████████░░░░░░░░░░░░] 40%

### Step 4: Install dependencies
cd ./bord
npm install
Also install app dependencies:
npm install @supabase/supabase-js @anthropic-ai/sdk playwright

Update progress: [████████████░░░░░░░░] 60%

### Step 5: Setup configuration
Copy the app files to the right locations:
- Copy ./bord/apps/x-reply-guy/app/* to ./bord/app/x-reply-guy/

Create ./bord/apps/x-reply-guy/config.json with:
{
  "name": "X Reply Guy",
  "description": "AI-powered Twitter reply bot",
  "href": "/x-reply-guy",
  "color": "#1d9bf0",
  "secrets": [
    { "key": "SUPABASE_URL", "description": "Supabase project URL", "required": true },
    { "key": "SUPABASE_SERVICE_ROLE_KEY", "description": "Supabase service key", "required": true },
    { "key": "ANTHROPIC_API_KEY", "description": "Claude AI API key", "required": true },
    { "key": "ADSPOWER_PROFILE_ID", "description": "AdsPower browser profile", "required": true }
  ]
}

Update progress: [████████████████░░░░] 80%

### Step 6: Start the server
Run in background: npm run dev
Wait for server to be ready.

Update progress: [████████████████████] 100%

### Step 7: Show completion message

╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ✓ Installation Complete!                                ║
║                                                           ║
║   X Reply Guy is now running at:                          ║
║   → http://localhost:3000/x-reply-guy                     ║
║                                                           ║
║   Next steps:                                             ║
║   1. Go to http://localhost:3000/secrets                  ║
║   2. Add your API keys:                                   ║
║      • SUPABASE_URL                                       ║
║      • SUPABASE_SERVICE_ROLE_KEY                          ║
║      • ANTHROPIC_API_KEY                                  ║
║      • ADSPOWER_PROFILE_ID                                ║
║   3. Start replying to viral tweets!                      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

Then open the browser to http://localhost:3000/x-reply-guy
```

---

## What This Does

1. **Installs BORD** - The automation platform
2. **Installs X Reply Guy** - The Twitter reply bot
3. **Configures everything** - Sets up files and dependencies
4. **Starts the server** - Opens the dashboard

## Requirements

- Node.js 18+
- Git
- Claude Code (or any AI assistant that can run commands)

## After Installation

You'll need these API keys (add them at `/secrets`):

| Key | Where to Get |
|-----|--------------|
| SUPABASE_URL | Create project at supabase.com |
| SUPABASE_SERVICE_ROLE_KEY | Supabase dashboard → Settings → API |
| ANTHROPIC_API_KEY | console.anthropic.com |
| ADSPOWER_PROFILE_ID | AdsPower app → Profile ID |

## Need Help?

- [Documentation](https://bord.dev/docs/x-reply-guy)
- [GitHub Issues](https://github.com/borddev/x-reply-guy/issues)
- [Discord](https://discord.gg/bord)
