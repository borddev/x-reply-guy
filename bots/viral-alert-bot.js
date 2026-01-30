/**
 * X Reply Guy - Viral Alert Bot
 * Monitors for high-VPM tweets and replies IMMEDIATELY
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const supabase = require('../lib/supabase');
const { ADSPOWER_API, PROFILE_ID } = require('../lib/adspower');

const STATE_FILE = path.join(__dirname, '..', 'state', 'viral-state.json');

// Ensure dirs exist
fs.mkdirSync(path.join(__dirname, '..', 'state'), { recursive: true });

// VIRAL THRESHOLDS
const VIRAL_VPM = 1000;
const HOT_VPM = 500;
const MIN_VIEWS = 10000;
const MAX_AGE_MINS = 60;
const CHECK_INTERVAL = 5; // minutes

function log(msg) {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
}

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  } catch {
    return { repliedTweets: [], viralReplies: [] };
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function generateViralReply(tweet) {
  const cleanText = tweet.text.replace(/"/g, '\\"').replace(/`/g, '').replace(/\$/g, '').replace(/\n/g, ' ').slice(0, 400);
  const cleanUser = tweet.username.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20);

  return `VIRAL TWEET ALERT - Reply IMMEDIATELY!

This tweet is going VIRAL right now:
- Views: ${tweet.views.toLocaleString()}
- Age: ${tweet.ageMinutes} minutes
- VPM: ${tweet.vpm} (VIRAL!)
- Author: @${cleanUser}

Tweet: "${cleanText}"

Generate the PERFECT @grok photo request. This is a HIGH VALUE opportunity.`;
}

async function checkForViral(page, state) {
  // Search for trending tweets
  const searchUrl = 'https://x.com/search?q=min_faves:10000%20lang:en%20-filter:replies&src=typed_query&f=live';
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);

  const tweets = await page.evaluate(() => {
    const results = [];
    document.querySelectorAll('article').forEach(article => {
      const textEl = article.querySelector('[data-testid="tweetText"]');
      const text = textEl?.innerText || '';
      const timeEl = article.querySelector('time');
      const link = timeEl?.closest('a')?.href || '';
      const userEl = article.querySelector('[data-testid="User-Name"]');
      const username = userEl?.innerText?.split('\n')[0] || '';
      const postedAt = timeEl?.getAttribute('datetime') || '';

      let views = 0;
      const analyticsLink = article.querySelector('a[href*="/analytics"]');
      if (analyticsLink) {
        const viewText = analyticsLink.innerText.trim();
        const match = viewText.match(/([\d,.]+)([KMB]?)/i);
        if (match) {
          let num = parseFloat(match[1].replace(/,/g, ''));
          const suffix = (match[2] || '').toUpperCase();
          if (suffix === 'K') num *= 1000;
          else if (suffix === 'M') num *= 1000000;
          views = Math.round(num);
        }
      }

      if (text.length > 20 && link.includes('/status/')) {
        results.push({ text, link, username, views, postedAt });
      }
    });
    return results;
  });

  const now = Date.now();
  const viralTweets = tweets
    .map(t => {
      let ageMinutes = 60;
      if (t.postedAt) {
        const parsed = new Date(t.postedAt).getTime();
        if (!isNaN(parsed)) ageMinutes = Math.max(1, Math.round((now - parsed) / 60000));
      }
      const vpm = Math.round(t.views / ageMinutes);
      return { ...t, ageMinutes, vpm };
    })
    .filter(t => {
      if (state.repliedTweets.includes(t.link)) return false;
      if (t.views < MIN_VIEWS) return false;
      if (t.ageMinutes > MAX_AGE_MINS) return false;
      if (t.vpm < HOT_VPM) return false;
      return true;
    })
    .sort((a, b) => b.vpm - a.vpm);

  return viralTweets;
}

async function main() {
  log('=== VIRAL ALERT BOT STARTING ===');
  log(`Checking every ${CHECK_INTERVAL} min for tweets with VPM > ${HOT_VPM}`);

  while (true) {
    const state = loadState();

    try {
      const activeRes = await fetch(`${ADSPOWER_API}/api/v1/browser/active?user_id=${PROFILE_ID}`);
      const activeJson = await activeRes.json();

      let wsEndpoint;
      if (activeJson.code === 0 && activeJson.data?.status === 'Active') {
        wsEndpoint = activeJson.data.ws.puppeteer;
      } else {
        const res = await fetch(`${ADSPOWER_API}/api/v1/browser/start?user_id=${PROFILE_ID}&headless=1`);
        const json = await res.json();
        if (json.code !== 0) throw new Error('AdsPower: ' + json.msg);
        wsEndpoint = json.data.ws.puppeteer;
      }

      const browser = await chromium.connectOverCDP(wsEndpoint);
      const ctx = browser.contexts()[0];
      const page = await ctx.newPage();

      const viralTweets = await checkForViral(page, state);

      if (viralTweets.length > 0) {
        const tweet = viralTweets[0];
        log(`VIRAL FOUND! @${tweet.username} | ${tweet.views.toLocaleString()} views | VPM: ${tweet.vpm}`);
        log(`> ${tweet.text.slice(0, 80)}...`);

        state.repliedTweets.push(tweet.link);
        if (state.repliedTweets.length > 200) {
          state.repliedTweets = state.repliedTweets.slice(-200);
        }

        state.viralReplies.push({
          link: tweet.link,
          views: tweet.views,
          vpm: tweet.vpm,
          timestamp: new Date().toISOString()
        });
      } else {
        log('No viral tweets found this check');
      }

      saveState(state);

      try { await page.close(); } catch {}
    } catch (e) {
      log('ERROR: ' + e.message);
    }

    await new Promise(r => setTimeout(r, CHECK_INTERVAL * 60 * 1000));
  }
}

process.on('SIGINT', () => { log('Shutting down...'); process.exit(0); });
process.on('SIGTERM', () => { log('Shutting down...'); process.exit(0); });

main().catch(e => { log('FATAL: ' + e.message); process.exit(1); });
