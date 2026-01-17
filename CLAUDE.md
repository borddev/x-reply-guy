# X Reply Guy

Twitter/X engagement analytics dashboard with content tools.

## Setup Command

When user says "setup x-reply-guy", guide them through browser setup:

1. **Check if AdsPower is installed**
   ```bash
   ls /Applications/AdsPower.app 2>/dev/null
   ```
   If not installed, tell user to download from https://www.adspower.com/download

2. **Open AdsPower**
   ```bash
   open /Applications/AdsPower.app
   ```

3. **Guide user to create account** (if new)
   - Click "Register" in AdsPower
   - Enter email and password
   - Verify email

4. **Create browser profile**
   - Click "New Profile" button
   - Name it anything (e.g. "Main")
   - Click OK

5. **Get profile ID**
   - Right-click the profile
   - Select "Check ID"
   - Copy the ID (looks like: jxxxxxx)

6. **Save to .env.local**
   Create ~/bord/.env.local with:
   ```
   ADSPOWER_API=http://127.0.0.1:50325
   ADSPOWER_PROFILE_ID=<the ID from step 5>
   ```

7. **Login to X**
   - Click "Open" on the profile in AdsPower
   - Go to x.com and login
   - Keep browser open

8. **Done!**
   Print: "Setup complete! Say 'start the dev server' to view dashboard."

## Running

- **Dashboard**: `npm run dev` then open localhost:3000/x-reply-guy
- **View analytics**: Main page shows engagement metrics
- **School**: Rate content to improve suggestions

## Database

SQLite at `~/bord/data/x-reply-guy/replies.db` - created automatically.

## Files

```
x-reply-guy/
├── app/           # Dashboard pages
├── api/           # API routes
├── lib/db.ts      # SQLite database
├── public/        # Icons
└── CLAUDE.md      # This file
```
