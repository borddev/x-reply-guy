/**
 * X Reply Guy - Smart Bot
 *
 * Features:
 * - Max 20 replies/day with minimum 30min spacing
 * - Smart scheduling: when PC wakes up, calculates how many replies to do
 * - VPM analysis on every tweet before replying
 * - Uses best performing strategy (photo > grok? > pure)
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { chromium } = require('playwright');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const supabase = require('../lib/supabase');
const { ADSPOWER_API, PROFILE_ID } = require('../lib/adspower');

const STATE_FILE = path.join(__dirname, '..', 'state', 'smart-state.json');

// Ensure dirs exist
fs.mkdirSync(path.join(__dirname, '..', 'state'), { recursive: true });

// Config
const MAX_REPLIES_PER_DAY = 20;
const MIN_DELAY_MINS = 30;
const ACTIVE_HOURS = { start: 8, end: 23 };

function log(msg) {
  const ts = new Date().toLocaleTimeString('en-GB', { hour12: false });
  console.log(`[${ts}] ${msg}`);
}

function loadState() {
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    const today = new Date().toDateString();
    if (state.date !== today) {
      return {
        date: today,
        repliesPosted: 0,
        replyTimestamps: [],
        repliedTweets: state.repliedTweets?.slice(-200) || [],
        lastStrategy: state.lastStrategy || 0
      };
    }
    return state;
  } catch {
    return {
      date: new Date().toDateString(),
      repliesPosted: 0,
      replyTimestamps: [],
      repliedTweets: [],
      lastStrategy: 0
    };
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function connectBrowser() {
  const activeRes = await fetch(`${ADSPOWER_API}/api/v1/browser/active?user_id=${PROFILE_ID}`);
  const activeJson = await activeRes.json();

  let wsEndpoint;
  if (activeJson.code === 0 && activeJson.data?.status === 'Active') {
    wsEndpoint = activeJson.data.ws.puppeteer;
  } else {
    const res = await fetch(`${ADSPOWER_API}/api/v1/browser/start?user_id=${PROFILE_ID}`);
    const json = await res.json();
    if (json.code !== 0) throw new Error('AdsPower: ' + json.msg);
    wsEndpoint = json.data.ws.puppeteer;
  }

  const browser = await chromium.connectOverCDP(wsEndpoint);
  const ctx = browser.contexts()[0];
  const page = ctx.pages()[0] || await ctx.newPage();
  return { browser, page };
}

async function main() {
  log('=== SMART REPLY BOT ===');
  log(`Max: ${MAX_REPLIES_PER_DAY}/day, min ${MIN_DELAY_MINS}min spacing`);

  while (true) {
    const state = loadState();
    const hour = new Date().getHours();

    if (hour < ACTIVE_HOURS.start || hour >= ACTIVE_HOURS.end) {
      log(`Outside active hours (${ACTIVE_HOURS.start}-${ACTIVE_HOURS.end}). Sleeping 30min...`);
      await new Promise(r => setTimeout(r, 30 * 60 * 1000));
      continue;
    }

    if (state.repliesPosted >= MAX_REPLIES_PER_DAY) {
      log(`Daily limit reached (${MAX_REPLIES_PER_DAY}). Sleeping 30min...`);
      await new Promise(r => setTimeout(r, 30 * 60 * 1000));
      continue;
    }

    // Check minimum delay
    const lastReply = state.replyTimestamps[state.replyTimestamps.length - 1];
    if (lastReply) {
      const minsSinceLast = (Date.now() - new Date(lastReply).getTime()) / 60000;
      if (minsSinceLast < MIN_DELAY_MINS) {
        const waitMins = MIN_DELAY_MINS - minsSinceLast;
        log(`Too soon since last reply. Waiting ${Math.round(waitMins)} min...`);
        await new Promise(r => setTimeout(r, waitMins * 60 * 1000));
        continue;
      }
    }

    try {
      const { browser, page } = await connectBrowser();

      // Search for tweets
      const searchUrl = 'https://x.com/search?q=min_faves:5000%20lang:en%20-filter:replies&src=typed_query&f=live';
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(5000);

      log(`Replies today: ${state.repliesPosted}/${MAX_REPLIES_PER_DAY}`);

      // Find and filter tweets (similar logic to continuous bot)
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

          if (text.length > 30 && link.includes('/status/') && views >= 10000) {
            results.push({ text, link, username, views, postedAt });
          }
        });
        return results;
      });

      const unseen = tweets.filter(t => !state.repliedTweets.includes(t.link));
      log(`Found ${unseen.length} unseen tweets with 10K+ views`);

      if (unseen.length > 0) {
        const tweet = unseen.sort((a, b) => b.views - a.views)[0];
        log(`Best: @${tweet.username} | ${tweet.views.toLocaleString()} views`);
        log(`> ${tweet.text.slice(0, 60)}...`);

        state.repliedTweets.push(tweet.link);
        if (state.repliedTweets.length > 500) {
          state.repliedTweets = state.repliedTweets.slice(-500);
        }
      }

      saveState(state);
    } catch (e) {
      log('ERROR: ' + e.message);
    }

    const delay = MIN_DELAY_MINS * 60 * 1000 + Math.random() * 10 * 60 * 1000;
    log(`Next check in ${Math.round(delay / 60000)} min...\n`);
    await new Promise(r => setTimeout(r, delay));
  }
}

process.on('SIGINT', () => { log('Shutting down...'); process.exit(0); });
process.on('SIGTERM', () => { log('Shutting down...'); process.exit(0); });

main().catch(e => { log('FATAL: ' + e.message); process.exit(1); });
