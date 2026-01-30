/**
 * X Reply Guy - Follow for Follow Bot
 *
 * Two operations:
 * 1. CLEANUP: Unfollow people who don't follow back
 * 2. FOLLOW: Follow verified followers of target profiles
 *
 * Uses "Superpowers for X PRO" extension buttons
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const supabase = require('../lib/supabase');
const { ADSPOWER_API, PROFILE_ID } = require('../lib/adspower');

const STATE_FILE = path.join(__dirname, '..', 'state', 'follow4follow-state.json');
const LOG_FILE = path.join(__dirname, '..', 'logs', 'follow4follow-log.json');
const SOURCES_FILE = path.join(__dirname, '..', 'config', 'follow4follow-sources.json');

// Ensure dirs exist
fs.mkdirSync(path.join(__dirname, '..', 'state'), { recursive: true });
fs.mkdirSync(path.join(__dirname, '..', 'logs'), { recursive: true });

// Load active sources from file, sorted by priority
function getActiveSourceProfiles() {
  try {
    const sources = JSON.parse(fs.readFileSync(SOURCES_FILE, 'utf-8'));
    return Object.entries(sources)
      .filter(([name, data]) => !name.startsWith('_') && data.active !== false)
      .sort((a, b) => (a[1].priority || 99) - (b[1].priority || 99))
      .map(([name]) => name);
  } catch {
    return ['jxnlco', 'arlogilbert', 'danmartell', 'AndrewAskins'];
  }
}

// Config
const CONFIG = {
  maxFollowsPerHour: 100,
  maxFollowingRatio: 1.0,
  hourlyWaitMs: 60 * 60 * 1000,
  get sourceProfiles() { return getActiveSourceProfiles(); }
};

// Circuit breaker
const CIRCUIT_BREAKER = {
  failureThreshold: 5,
  baseCooldownMs: 60 * 60 * 1000,
  maxCooldownMs: 60 * 60 * 1000,
  cooldownMultiplier: 1
};

function log(msg) {
  const ts = new Date().toLocaleTimeString('en-GB', { hour12: false });
  console.log(`[${ts}] ${msg}`);
}

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  } catch {
    return {
      followsThisHour: 0,
      hourStart: Date.now(),
      lastSource: 0,
      consecutiveFailures: 0,
      cooldownUntil: 0,
      totalFollowed: 0,
      totalUnfollowed: 0
    };
  }
}

function saveState(state) {
  state.lastUpdated = new Date().toISOString();
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

async function getFollowerCounts(page) {
  try {
    const xUsername = process.env.X_USERNAME;
    if (!xUsername) return { followers: 0, following: 0 };
    await page.goto(`https://x.com/${xUsername}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    return await page.evaluate(() => {
      const links = document.querySelectorAll('a[href*="/following"], a[href*="/verified_followers"]');
      let followers = 0, following = 0;
      links.forEach(link => {
        const text = link.innerText.replace(/,/g, '');
        const num = parseInt(text) || 0;
        if (link.href.includes('/following')) following = num;
        if (link.href.includes('/followers') || link.href.includes('/verified_followers')) followers = num;
      });
      return { followers, following };
    });
  } catch {
    return { followers: 0, following: 0 };
  }
}

async function followFromSource(page, sourceName, state) {
  log(`Following from @${sourceName}'s followers...`);

  await page.goto(`https://x.com/${sourceName}/verified_followers`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  let followed = 0;
  const maxPerSource = 20;

  for (let scroll = 0; scroll < 10 && followed < maxPerSource; scroll++) {
    const buttons = await page.$$('button:has-text("Follow")');

    for (const btn of buttons) {
      if (followed >= maxPerSource) break;
      if (state.followsThisHour >= CONFIG.maxFollowsPerHour) {
        log('Hourly limit reached');
        return followed;
      }

      try {
        const text = await btn.innerText();
        if (text.trim() !== 'Follow') continue;

        // Get username
        const cell = await btn.evaluateHandle(el => el.closest('[data-testid="cellInnerDiv"]'));
        const username = await cell.evaluate(el => {
          const link = el.querySelector('a[href^="/"]');
          return link?.href?.split('/').pop() || '';
        });

        if (!username) continue;

        // Check if already followed
        const { data: existing } = await supabase
          .from('x_f4f_follows')
          .select('id')
          .eq('username', username)
          .limit(1);

        if (existing?.length > 0) continue;

        await btn.click();
        await page.waitForTimeout(1500 + Math.random() * 2000);

        // Save to DB
        await supabase.from('x_f4f_follows').insert({
          username,
          source: sourceName,
          followed_at: new Date().toISOString()
        });

        followed++;
        state.followsThisHour++;
        state.totalFollowed = (state.totalFollowed || 0) + 1;
        log(`  Followed @${username} (${followed}/${maxPerSource})`);
      } catch (e) {
        // Skip this button
      }
    }

    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(2000);
  }

  log(`Followed ${followed} from @${sourceName}`);
  return followed;
}

async function unfollowNonFollowers(page, state) {
  log('Starting cleanup: unfollowing non-followers...');

  const { data: oldFollows } = await supabase
    .from('x_f4f_follows')
    .select('username, followed_at')
    .eq('followed_back', false)
    .lt('followed_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
    .order('followed_at', { ascending: true })
    .limit(50);

  if (!oldFollows?.length) {
    log('No non-followers to unfollow');
    return 0;
  }

  let unfollowed = 0;

  for (const follow of oldFollows) {
    try {
      await page.goto(`https://x.com/${follow.username}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Check if they follow us
      const followsUs = await page.evaluate(() => {
        return !!document.querySelector('[data-testid="userFollowIndicator"]');
      });

      if (followsUs) {
        await supabase.from('x_f4f_follows')
          .update({ followed_back: true, followed_back_at: new Date().toISOString() })
          .eq('username', follow.username);
        log(`  @${follow.username} follows back!`);
        continue;
      }

      // Unfollow
      const unfollowBtn = await page.$('button:has-text("Following")');
      if (unfollowBtn) {
        await unfollowBtn.click();
        await page.waitForTimeout(1000);
        const confirmBtn = await page.$('button:has-text("Unfollow")');
        if (confirmBtn) {
          await confirmBtn.click();
          unfollowed++;
          state.totalUnfollowed = (state.totalUnfollowed || 0) + 1;
          log(`  Unfollowed @${follow.username}`);
        }
      }

      await page.waitForTimeout(2000 + Math.random() * 2000);
    } catch (e) {
      log(`  Error with @${follow.username}: ${e.message.slice(0, 50)}`);
    }
  }

  log(`Unfollowed ${unfollowed} non-followers`);
  return unfollowed;
}

async function runOnce(mode) {
  const state = loadState();

  // Reset hourly counter
  if (Date.now() - state.hourStart > CONFIG.hourlyWaitMs) {
    state.followsThisHour = 0;
    state.hourStart = Date.now();
  }

  // Circuit breaker
  if (state.cooldownUntil && Date.now() < state.cooldownUntil) {
    const mins = Math.round((state.cooldownUntil - Date.now()) / 60000);
    log(`Circuit breaker: waiting ${mins} more minutes`);
    return;
  }

  const { browser, page } = await connectBrowser();

  try {
    const counts = await getFollowerCounts(page);
    log(`Followers: ${counts.followers} | Following: ${counts.following}`);

    if (mode === 'cleanup' || mode === 'both') {
      await unfollowNonFollowers(page, state);
    }

    if (mode === 'follow' || mode === 'both') {
      const sources = CONFIG.sourceProfiles;
      const sourceIdx = state.lastSource % sources.length;
      const source = sources[sourceIdx];
      state.lastSource = sourceIdx + 1;

      const result = await followFromSource(page, source, state);

      if (result === 0) {
        state.consecutiveFailures++;
        if (state.consecutiveFailures >= CIRCUIT_BREAKER.failureThreshold) {
          state.cooldownUntil = Date.now() + CIRCUIT_BREAKER.baseCooldownMs;
          log(`Circuit breaker activated: ${CIRCUIT_BREAKER.baseCooldownMs / 60000} min cooldown`);
        }
      } else {
        state.consecutiveFailures = 0;
      }
    }
  } finally {
    saveState(state);
  }
}

async function runContinuous(mode) {
  log(`=== F4F BOT STARTING (mode: ${mode}) ===`);

  while (true) {
    try {
      await runOnce(mode);
    } catch (e) {
      log('ERROR: ' + e.message);
    }

    const waitMs = 5 * 60 * 1000 + Math.random() * 5 * 60 * 1000;
    log(`Waiting ${Math.round(waitMs / 60000)} minutes...\n`);
    await new Promise(r => setTimeout(r, waitMs));
  }
}

// CLI
const args = process.argv.slice(2);
const mode = args[0] || 'both'; // both, follow, cleanup, continuous

if (mode === 'continuous') {
  runContinuous('both');
} else if (['follow', 'cleanup', 'both'].includes(mode)) {
  if (args.includes('--continuous') || args.includes('continuous')) {
    runContinuous(mode);
  } else {
    runOnce(mode).catch(console.error);
  }
} else {
  console.log('Usage: node follow4follow-bot.js [both|follow|cleanup|continuous]');
}

process.on('SIGINT', () => { log('Shutting down...'); process.exit(0); });
process.on('SIGTERM', () => { log('Shutting down...'); process.exit(0); });
