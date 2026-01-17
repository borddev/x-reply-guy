# X Reply Guy

Twitter/X engagement analytics dashboard.

## Install

1. Run `claude --dangerously-skip-permissions`
2. Copy the prompt below and paste:

```
You are installing X Reply Guy, a Twitter/X analytics dashboard.

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
│                                                              │
└──────────────────────────────────────────────────────────────┘

STEP 2: CHECK NODE.JS
Run: node -v
- If v18+: Continue
- If not installed: Tell user to install from https://nodejs.org

STEP 3: INSTALL NOTIFICATIONS
Run: brew install terminal-notifier
Tell user: "Click Allow when the notification permission popup appears."

STEP 4: INSTALL BORD
Check if ~/bord exists: ls ~/bord 2>/dev/null
- If exists: Continue
- If not: Run: git clone https://github.com/borddev/bord ~/bord
Print: [████████░░░░░░░░░░░░] 40%

STEP 5: INSTALL X REPLY GUY
Run: git clone https://github.com/borddev/x-reply-guy ~/bord/apps/x-reply-guy
Print: [████████████░░░░░░░░] 60%

STEP 6: INSTALL DEPENDENCIES
Run: cd ~/bord && npm install
Print: [████████████████████] 100%

STEP 7: COMPLETE
Print:
════════════════════════════════════════════════════════════════
 ✓ X REPLY GUY INSTALLED
════════════════════════════════════════════════════════════════

 Location: ~/bord/apps/x-reply-guy

 NEXT STEPS:
 Open a new terminal, then:
   cd ~/bord
   claude --dangerously-skip-permissions

 Say "setup x-reply-guy" to complete configuration.

════════════════════════════════════════════════════════════════

STEP 8: OPEN NEW TERMINAL
Run: osascript -e 'tell application "Terminal" to do script "cd ~/bord && echo Ready! Run: claude --dangerously-skip-permissions"'
```

## Links

- [BORD](https://github.com/borddev/bord)
- [Issues](https://github.com/borddev/x-reply-guy/issues)
