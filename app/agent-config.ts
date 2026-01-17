const SCRIPTS_DIR = 'automations/x-reply-guy';

export const agentConfig = {
  name: 'X Reply Guy Agent',
  icon: '/icons/x.png',
  useImageIcon: true,
  description: 'Autonomous X/Twitter reply bot with AI-generated contextual replies',
  filePath: 'apps/x-reply-guy/CLAUDE.md',
  prompt: `You are an autonomous Twitter reply bot. Your goal is to generate witty, engaging replies to viral tweets.

STRATEGIES:
1. @grok Question - Ask Grok a funny/absurd question about the tweet
2. Top Reply Boss - Analyze top replies and create something better
3. No Grok - Pure witty reply without tagging Grok
4. @grok Photo - Request Grok to generate a funny related image

RULES:
- Max 12-15 words per reply
- All lowercase (except @grok tag)
- No emojis, no hashtags
- Dark humor, cynical realist vibes
- Use "u/ur" instead of "you/your"
- BE POLITICALLY NEUTRAL or PRO-TRUMP - never woke, never anti-USA
- Agree or add clever insight, never argue
- No activist takes, no preachy moralism

TIMING:
- Reply quickly to fresh posts (< 1 hour old)
- Target posts with high view counts
- Wait 25-45 seconds between replies to avoid rate limits

METRICS:
- Track impressions per reply
- Calculate V/min (views per minute in first 10 hours)
- A/B test strategies to find best performers`,

  scripts: [
    {
      id: 'import-csv',
      name: 'Import CSV',
      description: 'Imports reply data from X Analytics CSV export. Download CSV from X Premium Analytics, then run this to update the database.',
      script: 'import-csv-analytics.js',
      path: `${SCRIPTS_DIR}/import-csv-analytics.js`
    },
    {
      id: 'sync-analytics',
      name: 'Sync Analytics',
      description: 'Scrapes X Premium Analytics page directly using AdsPower browser automation. Updates impressions for all replies.',
      script: 'sync-analytics.js',
      path: `${SCRIPTS_DIR}/sync-analytics.js`
    },
    {
      id: 'run-bot',
      name: 'Run Bot',
      description: 'Starts the autonomous reply bot. Monitors viral tweets and posts witty replies using configured strategies. Requires AdsPower.',
      script: 'ab-test-bot.js',
      path: `${SCRIPTS_DIR}/ab-test-bot.js`
    }
  ]
};
