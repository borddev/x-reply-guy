/**
 * X Reply Guy - Continuous Bot
 * Posts replies with variable delay to avoid spam detection
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const supabase = require('../lib/supabase');
const anthropic = require('../lib/ai');
const { connectBrowser, stopBrowser, ADSPOWER_API, PROFILE_ID } = require('../lib/adspower');
const { sendEmail } = require('../lib/email');

const X_USERNAME = process.env.X_USERNAME || 'YourHandle';

const STATE_FILE = path.join(__dirname, '..', 'state', 'continuous-state.json');
const LOG_FILE = path.join(__dirname, '..', 'logs', 'continuous.log');
const VIRAL_SOURCES_FILE = path.join(__dirname, '..', 'config', 'viral-sources.json');
const PRIORITY_FILE = path.join(__dirname, '..', 'config', 'notification-priority.json');
const AGENT_FILE = path.join(__dirname, '..', 'config', 'agent-prompt.md');

// Ensure dirs exist
fs.mkdirSync(path.join(__dirname, '..', 'state'), { recursive: true });
fs.mkdirSync(path.join(__dirname, '..', 'logs'), { recursive: true });

// Track AdsPower offline state
let adsPowerOfflineCount = 0;
let lastOfflineAlertSent = 0;

// Track consecutive connection failures
let connectionFailCount = 0;
const MAX_CONNECTION_FAILS = 5;

// Load agent instructions
function loadAgentPrompt() {
  try {
    const content = fs.readFileSync(AGENT_FILE, 'utf-8');
    log(`Agent loaded: ${AGENT_FILE} (${content.length} chars)`);
    return content;
  } catch (e) {
    log(`WARNING: Agent file not found at ${AGENT_FILE}, using fallback prompt`);
    return null;
  }
}

// Load viral accounts
function loadViralAccounts() {
  try {
    const data = JSON.parse(fs.readFileSync(VIRAL_SOURCES_FILE, 'utf-8'));
    return data.accounts || [];
  } catch {
    return ['NoContextHumans', 'TheFigen_', 'historyinmemes', 'spectatorindex'];
  }
}

// Load priority notification accounts
function loadPriorityAccounts() {
  try {
    const data = JSON.parse(fs.readFileSync(PRIORITY_FILE, 'utf-8'));
    return {
      accounts: (data.accounts || []).map(a => a.username.toLowerCase()),
      autoAddThreshold: data.autoAddThreshold || 10000,
      maxAgeMinutes: data._config?.maxAgeMinutes || 10
    };
  } catch {
    return { accounts: [], autoAddThreshold: 10000, maxAgeMinutes: 10 };
  }
}

// Add account to priority list
function addToPriority(username, reason, autoAdded = true) {
  try {
    const data = JSON.parse(fs.readFileSync(PRIORITY_FILE, 'utf-8'));
    const lowerUsername = username.toLowerCase();

    const exists = data.accounts.some(a => a.username.toLowerCase() === lowerUsername);
    if (exists) return false;

    data.accounts.push({
      username,
      reason,
      addedAt: new Date().toISOString(),
      autoAdded
    });

    if (autoAdded) {
      data.autoAddedAccounts = data.autoAddedAccounts || [];
      data.autoAddedAccounts.push({ username, reason, addedAt: new Date().toISOString() });
    }

    fs.writeFileSync(PRIORITY_FILE, JSON.stringify(data, null, 2));
    log(`Added @${username} to priority notifications: ${reason}`);
    return true;
  } catch (e) {
    log(`Failed to add @${username} to priority: ${e.message}`);
    return false;
  }
}

// Check notifications for priority account posts
async function checkNotifications(page, state) {
  const priority = loadPriorityAccounts();
  if (priority.accounts.length === 0) return null;

  try {
    await page.goto('https://x.com/notifications', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const priorityAccounts = priority.accounts;
    const maxAge = priority.maxAgeMinutes;

    const notifications = await page.evaluate(({ priorityAccounts, maxAge }) => {
      const results = [];
      const now = Date.now();
      const notifElements = document.querySelectorAll('[data-testid="cellInnerDiv"], article');

      notifElements.forEach(notif => {
        const text = notif.innerText || '';
        const links = notif.querySelectorAll('a[href*="/status/"]');

        for (const account of priorityAccounts) {
          if (text.toLowerCase().includes(`@${account}`) || text.toLowerCase().includes(account)) {
            for (const link of links) {
              const href = link.href;
              if (href && href.includes('/status/')) {
                const timeEl = notif.querySelector('time');
                let ageMinutes = 999;
                if (timeEl) {
                  const datetime = timeEl.getAttribute('datetime');
                  if (datetime) {
                    ageMinutes = Math.round((now - new Date(datetime).getTime()) / 60000);
                  }
                }
                results.push({ account, link: href, ageMinutes, text: text.slice(0, 200) });
                break;
              }
            }
          }
        }
      });

      return results
        .filter(n => n.ageMinutes <= maxAge)
        .sort((a, b) => a.ageMinutes - b.ageMinutes);
    }, { priorityAccounts, maxAge });

    if (notifications.length > 0) {
      const notif = notifications[0];
      log(`PRIORITY: @${notif.account} posted ${notif.ageMinutes}m ago!`);
      return notif;
    }

    return null;
  } catch (e) {
    log(`Notification check failed: ${e.message.slice(0, 50)}`);
    return null;
  }
}

// Timing config
const MIN_DELAY = 5;
const MAX_DELAY = 7;

function log(msg) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${msg}`);
}

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  } catch {
    return {
      lastStrategy: 0,
      repliesPosted: 0,
      repliesLast24h: [],
      repliedTweets: [],
      startedAt: new Date().toISOString()
    };
  }
}

function saveState(state) {
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  state.repliesLast24h = (state.repliesLast24h || []).filter(ts => new Date(ts).getTime() > dayAgo);
  state.lastChecked = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function getNextStrategy(state) {
  // 90% photo, 10% question (data-driven from 429 replies)
  const pattern = [4, 4, 4, 4, 4, 4, 4, 4, 4, 1];
  const idx = state.lastStrategy % pattern.length;
  const next = pattern[idx];
  state.lastStrategy = (state.lastStrategy || 0) + 1;
  return next;
}

const STRATEGIES = {
  1: { name: 'grok_question', label: '@grok Question' },
  2: { name: 'top_reply_boss', label: 'Top Reply Boss' },
  3: { name: 'no_grok', label: 'No Grok' },
  4: { name: 'grok_photo', label: '@grok Photo' }
};

async function analyzeAndReply(strategy, tweet) {
  const cleanText = tweet.text.replace(/"/g, '\\"').replace(/`/g, '').replace(/\$/g, '').replace(/\n/g, ' ').slice(0, 400);
  const cleanUser = tweet.username.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20);

  const ageMinutes = tweet.ageMinutes || 60;
  const vpm = tweet.views > 0 ? Math.round(tweet.views / Math.max(1, ageMinutes)) : 0;
  const freshness = Math.max(0, 100 - (ageMinutes / 2));

  const strategyName = STRATEGIES[strategy]?.label || 'Photo';

  const prompt = `ANALYZE this tweet and decide if worth replying:

TWEET DATA:
- Author: @${cleanUser}
- Views: ${tweet.views.toLocaleString()}
- Age: ${ageMinutes} minutes
- VPM (views/min): ${vpm}
- Freshness score: ${Math.round(freshness)}

TWEET TEXT:
"${cleanText}"

DECISION RULES (in order of importance):

0. US POLITICS = INSTANT SKIP (MOST IMPORTANT!!!):
   - ANY mention of Trump, Biden, Democrats, Republicans = SKIP
   - ANY US government, Congress, Senate, White House = SKIP
   - ANY US political figures = SKIP
   - We do NOT comment on American politics EVER

1. ACCOUNT SIZE CHECK:
   - If author looks like a small motivational/hustle account = SKIP
   - If tweet text contains generic advice = SKIP
   - If author seems like engagement bait = SKIP

2. METRICS CHECK:
   - Views > 100K = DEFINITELY REPLY
   - Views 50K-100K = REPLY if good comedy angle
   - Views 10K-50K = REPLY only if KILLER joke
   - Age doesn't matter much - viral tweets keep getting views

3. CONTENT CHECK:
   - Tech/startup news = REPLY
   - Sports/entertainment = REPLY
   - Funny observations = REPLY
   - Motivational platitudes = SKIP
   - Violence/attacks/shootings = SKIP

STRATEGY: ${strategyName}
${strategy === 4 ? 'Format: @grok generate a photo of [Famous person/archetype] + [absurd action] + [ironic twist]' : ''}
${strategy === 1 ? 'Format: @grok [start with is/did/do] + [absurd reframing of topic]' : ''}
${strategy === 3 ? 'Format: witty reply, no @grok, max 12 words' : ''}

RESPOND WITH EXACTLY:
DECISION: [REPLY or SKIP]
REASON: [brief reason]
REPLY: [your reply text if DECISION=REPLY, otherwise "none"]`;

  const agentInstructions = loadAgentPrompt();
  const basePrompt = agentInstructions || `You are an expert Twitter/X reply guy. Your goal is to generate viral, engaging replies.`;

  const safetyRules = `

CRITICAL SAFETY RULES - NEVER VIOLATE:
- NEVER generate content involving minors/children/babies in ANY context
- NEVER generate nudity or sexual content
- NEVER generate violence against specific real people
- If the tweet is about children/minors, SKIP or make the @grok photo about ADULTS only
- When in doubt, use animals, objects, or clearly adult public figures instead`;

  const systemPrompt = basePrompt + safetyRules;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }]
    });

    const result = response.content[0].text;
    log(`  [DEBUG] Raw: ${result.replace(/\n/g, ' | ').slice(0, 150)}`);

    let decision = 'SKIP';
    let reason = '';
    let reply = null;

    const decisionMatch = result.match(/DECISION:\s*(REPLY|SKIP)/i);
    if (decisionMatch) decision = decisionMatch[1].toUpperCase();

    const reasonMatch = result.match(/REASON:\s*(.+?)(?=\n|REPLY:|$)/is);
    if (reasonMatch) reason = reasonMatch[1].trim();

    const replyMatch = result.match(/REPLY:\s*(.+?)$/is);
    if (replyMatch) {
      const replyText = replyMatch[1].trim();
      if (replyText && replyText.toLowerCase() !== 'none') {
        reply = replyText.replace(/^["']|["']$/g, '').replace(/[.!]$/g, '');
      }
    }

    log(`  VPM: ${vpm} | Age: ${ageMinutes}m | Decision: ${decision}`);
    if (reason) log(`  Reason: ${reason}`);

    if (decision !== 'REPLY' || !reply) return null;

    if (strategy === 1 || strategy === 4) {
      if (!reply.toLowerCase().startsWith('@grok')) {
        reply = '@grok ' + reply;
      }
    }

    if (reply.length < 10 || reply.length > 180) return null;
    if (reply.includes('```')) return null;

    return reply;
  } catch (e) {
    log('Claude API error: ' + e.message.slice(0, 80));
    return null;
  }
}

async function saveReplyToDB(data) {
  try {
    let responseTimeMins = null;
    if (data.originalPostedAt) {
      const originalTime = new Date(data.originalPostedAt).getTime();
      responseTimeMins = Math.round((Date.now() - originalTime) / 60000);
    }

    let postId = null;
    if (data.replyUrl) {
      const match = data.replyUrl.match(/status\/(\d+)/);
      if (match) postId = match[1];
    }

    const { error } = await supabase.from('x_replies').insert({
      post_id: postId,
      tweet_url: data.tweetUrl,
      reply_url: data.replyUrl || null,
      tweet_text: data.tweetText,
      reply_text: data.reply,
      strategy: data.strategy,
      original_views: data.originalViews || 0,
      original_posted_at: data.originalPostedAt || null,
      response_time_mins: responseTimeMins,
      posted_at: new Date().toISOString(),
      source: 'continuous_bot'
    });

    if (error) log('DB ERROR: ' + error.message);
  } catch (e) {
    log('DB FAILED: ' + e.message);
  }
}

function getRandomDelay() {
  const mins = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
  return Math.round(mins * 60 * 1000);
}

// Engagement bait patterns
const engagementBaitPatterns = [
  /reply.{0,20}(and|&).{0,20}(follow|f4f)/i,
  /follow.{0,20}(and|&).{0,20}reply/i,
  /account under \d+k/i,
  /under \d+k.{0,20}follow/i,
  /f4f|follow4follow|followback/i,
  /reply.{0,10}get.{0,10}follow/i,
  /drop.{0,10}(your|a).{0,10}(link|@)/i,
  /retweet.{0,10}follow/i,
  /follow.{0,10}everyone/i,
  /engagement.{0,10}(thread|trap|bait)/i,
  /ratio.{0,5}(this|him|her|them)/i
];

function isEngagementBait(text) {
  const lower = text.toLowerCase();
  return engagementBaitPatterns.some(pattern => pattern.test(lower));
}

function passesVpmThreshold(views, ageMinutes, slowMinViews) {
  const vpm = views / Math.max(1, ageMinutes);
  if (vpm >= 1000 && views >= 3000) return true;
  if (vpm >= 500 && views >= 5000) return true;
  if (vpm >= 200 && views >= 15000) return true;
  if (vpm >= 100 && views >= 30000) return true;
  if (views >= slowMinViews) return true;
  return false;
}

async function postOneReply(page, state) {
  const strategy = getNextStrategy(state);
  const strategyInfo = STRATEGIES[strategy];

  state.consecutiveFailures = state.consecutiveFailures || 0;

  let slowMinViews = 50000;
  if (state.consecutiveFailures >= 5) slowMinViews = 40000;
  if (state.consecutiveFailures >= 10) slowMinViews = 30000;
  if (state.consecutiveFailures >= 15) slowMinViews = 20000;

  log(`Strategy: ${strategyInfo.label}${state.consecutiveFailures > 0 ? ` (fails: ${state.consecutiveFailures})` : ''}`);

  const tweets = await page.evaluate(() => {
    const results = [];
    document.querySelectorAll('article').forEach(article => {
      const textEl = article.querySelector('[data-testid="tweetText"]');
      const text = textEl?.innerText || '';
      const timeEl = article.querySelector('time');
      const link = timeEl?.closest('a')?.href || '';
      const userEl = article.querySelector('[data-testid="User-Name"]');
      const username = userEl?.innerText?.split('\n')[0] || '';
      const tweetPostedAt = timeEl?.getAttribute('datetime') || '';

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

      if (text.length > 30 && link.includes('/status/')) {
        results.push({ text, link, username, views, tweetPostedAt });
      }
    });
    return results;
  });

  const now = Date.now();

  const unseenTweets = tweets
    .map(t => {
      let ageMinutes = 30;
      if (t.tweetPostedAt) {
        const parsed = new Date(t.tweetPostedAt).getTime();
        if (!isNaN(parsed)) {
          ageMinutes = Math.round((now - parsed) / 60000);
          if (ageMinutes < 1) ageMinutes = 1;
          if (ageMinutes > 1440) ageMinutes = 1440;
        }
      }
      const vpm = t.views / Math.max(1, ageMinutes);
      return { ...t, ageMinutes, vpm };
    })
    .filter(t => {
      if (state.repliedTweets.includes(t.link)) return false;
      if (!passesVpmThreshold(t.views, t.ageMinutes, slowMinViews)) return false;
      if (t.ageMinutes !== undefined && t.ageMinutes >= 720) return false;
      if (isEngagementBait(t.text)) {
        log(`  SKIP (engagement bait): ${t.text.slice(0, 50)}...`);
        return false;
      }
      return true;
    });

  const mapped = tweets.map(t => {
    let age = 30;
    if (t.tweetPostedAt) {
      const p = new Date(t.tweetPostedAt).getTime();
      if (!isNaN(p)) { age = Math.round((now - p) / 60000); if (age < 1) age = 1; }
    }
    const vpm = Math.round(t.views / Math.max(1, age));
    const replied = state.repliedTweets.includes(t.link);
    const passes = passesVpmThreshold(t.views, age, slowMinViews);
    return { v: t.views, age, vpm, replied, passes };
  });
  const debug = mapped.slice(0, 5).map(t => `${Math.round(t.v/1000)}K/${t.vpm}vpm${t.replied ? '*' : ''}${t.passes ? '+' : ''}`).join(' ');
  log(`${tweets.length} tweets [${debug}] -> ${unseenTweets.length} pass VPM filter`);

  if (unseenTweets.length === 0) {
    state.consecutiveFailures++;
    log(`No suitable tweets found (fail #${state.consecutiveFailures}), scrolling...`);
    await page.evaluate(() => window.scrollBy(0, 1200));
    await page.waitForTimeout(2000);
    return false;
  }

  const tweet = unseenTweets.sort((a, b) => {
    if (b.vpm > a.vpm * 2) return 1;
    if (a.vpm > b.vpm * 2) return -1;
    return b.views - a.views;
  })[0];

  state.repliedTweets.push(tweet.link);
  if (state.repliedTweets.length > 500) {
    state.repliedTweets = state.repliedTweets.slice(-500);
  }

  log(`@${tweet.username.slice(0, 20)} | VPM: ${Math.round(tweet.vpm)} | ${tweet.views.toLocaleString()} views | ${tweet.ageMinutes}m old`);
  log(`> ${tweet.text.slice(0, 60)}...`);

  const reply = await analyzeAndReply(strategy, tweet);
  if (!reply) {
    state.consecutiveFailures++;
    log(`SKIP (agent decision) - fail #${state.consecutiveFailures}`);
    return false;
  }

  log(`Reply: ${reply}`);

  try {
    await page.goto(tweet.link, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);

    const box = await page.waitForSelector('[data-testid="tweetTextarea_0"]', { timeout: 5000 });
    await box.click();
    await page.keyboard.type(reply, { delay: 30 });
    await page.waitForTimeout(1000);

    await page.click('button[data-testid="tweetButtonInline"]');
    await page.waitForTimeout(3000);

    // Extract reply URL
    let replyUrl = null;
    try {
      await page.waitForTimeout(3000);

      replyUrl = await page.evaluate((replyText) => {
        const replyStart = replyText.slice(0, 30).toLowerCase().replace(/[^\w\s]/g, '');
        const articles = document.querySelectorAll('article');
        for (const article of articles) {
          const textEl = article.querySelector('[data-testid="tweetText"]');
          const text = (textEl?.innerText?.trim() || '').toLowerCase().replace(/[^\w\s]/g, '');
          if (text && text.includes(replyStart)) {
            const timeEl = article.querySelector('time');
            const link = timeEl?.closest('a')?.href;
            if (link && link.includes('/status/')) return link;
          }
        }
        return null;
      }, reply);

      // Fallback: look for our account's tweet
      if (!replyUrl) {
        const xUser = X_USERNAME;
        replyUrl = await page.evaluate((handle) => {
          const articles = document.querySelectorAll('article');
          for (const article of articles) {
            const userLink = article.querySelector(`a[href*="/${handle}"]`);
            if (userLink) {
              const timeEl = article.querySelector('time');
              const link = timeEl?.closest('a')?.href;
              if (link && link.includes('/status/')) return link;
            }
          }
          return null;
        }, xUser);
      }
    } catch {}

    log('POSTED!' + (replyUrl ? ` ${replyUrl}` : ''));

    state.consecutiveFailures = 0;

    await saveReplyToDB({
      tweetUrl: tweet.link,
      replyUrl,
      tweetText: tweet.text.slice(0, 500),
      reply,
      strategy: strategyInfo.name,
      originalViews: tweet.views,
      originalPostedAt: tweet.tweetPostedAt
    });

    state.repliesPosted = (state.repliesPosted || 0) + 1;
    state.repliesLast24h.push(new Date().toISOString());

    return true;
  } catch (e) {
    log('Failed: ' + e.message.slice(0, 50));
    return false;
  }
}

async function main() {
  log('=== CONTINUOUS REPLY BOT STARTING ===');
  log(`Delay: ${MIN_DELAY}-${MAX_DELAY} min between replies`);

  while (true) {
    const state = loadState();

    if (state.paused) {
      log('Bot is PAUSED. Waiting 30s...');
      await new Promise(r => setTimeout(r, 30000));
      continue;
    }

    const repliesLast24h = state.repliesLast24h?.length || 0;
    log(`--- Replies last 24h: ${repliesLast24h} ---`);

    let adsOk = false;
    let wsEndpoint;
    try {
      const activeRes = await fetch(`${ADSPOWER_API}/api/v1/browser/active?user_id=${PROFILE_ID}`);
      const activeJson = await activeRes.json();

      if (activeJson.code === 0 && activeJson.data?.status === 'Active') {
        wsEndpoint = activeJson.data.ws.puppeteer;
        adsOk = true;
      } else {
        const res = await fetch(`${ADSPOWER_API}/api/v1/browser/start?user_id=${PROFILE_ID}&headless=1`);
        const json = await res.json();
        adsOk = json.code === 0;
        if (adsOk) wsEndpoint = json.data.ws.puppeteer;

        const needsKill = (adsOk && !wsEndpoint) || (json.code === -1 && json.msg?.includes('Failed to start'));
        if (needsKill) {
          log('Browser conflict detected. Killing SunBrowser processes...');
          const { exec } = require('child_process');
          await new Promise(resolve => {
            exec('pkill -9 -f SunBrowser; pkill -9 -f "AdsPower.*browser"', () => resolve());
          });
          await new Promise(r => setTimeout(r, 5000));

          const retryRes = await fetch(`${ADSPOWER_API}/api/v1/browser/start?user_id=${PROFILE_ID}&headless=1`);
          const retryJson = await retryRes.json();
          adsOk = retryJson.code === 0 && retryJson.data?.ws?.puppeteer;
          if (adsOk) {
            wsEndpoint = retryJson.data.ws.puppeteer;
            log('Browser restarted successfully via API');
          } else {
            log(`Failed to restart browser: ${retryJson.msg || 'unknown error'}`);
            adsOk = false;
          }
        }
      }

      if (!adsOk) {
        adsPowerOfflineCount++;
        const offlineMins = adsPowerOfflineCount * 5;
        log(`AdsPower offline (${offlineMins} min total), waiting 5 min...`);

        if (adsPowerOfflineCount >= 6 && Date.now() - lastOfflineAlertSent > 60 * 60 * 1000) {
          log('Sending AdsPower offline alert...');
          await sendEmail(
            'Reply Bot STOPPED - AdsPower Offline',
            `The Reply Guy bot has been stopped for ${offlineMins} minutes.\n\nAdsPower is not responding or the profile won't start.\n\nAction required: Open AdsPower and start the profile.`
          );
          lastOfflineAlertSent = Date.now();
        }

        await new Promise(r => setTimeout(r, 5 * 60 * 1000));
        continue;
      }

      adsPowerOfflineCount = 0;

      let browser, ctx, page;
      try {
        browser = await chromium.connectOverCDP(wsEndpoint);
        ctx = browser.contexts()[0];
        if (!ctx) {
          log('No browser context found, retrying...');
          await new Promise(r => setTimeout(r, 30000));
          continue;
        }
        page = ctx.pages()[0] || await ctx.newPage();

        const allPages = ctx.pages();
        if (allPages.length > 1) {
          log(`Cleaning up ${allPages.length - 1} extra tabs...`);
          for (let i = 1; i < allPages.length; i++) {
            try { await allPages[i].close(); } catch {}
          }
        }
      } catch (connErr) {
        connectionFailCount++;
        log(`Browser connection failed (${connectionFailCount}/${MAX_CONNECTION_FAILS}): ${connErr.message.slice(0, 60)}`);

        if (connectionFailCount >= MAX_CONNECTION_FAILS) {
          log(`Connection failed ${connectionFailCount}x, forcing browser restart...`);
          try {
            await fetch(`${ADSPOWER_API}/api/v1/browser/stop?user_id=${PROFILE_ID}`);
            await new Promise(r => setTimeout(r, 3000));
            const restartRes = await fetch(`${ADSPOWER_API}/api/v1/browser/start?user_id=${PROFILE_ID}`);
            const restartJson = await restartRes.json();
            if (restartJson.code === 0) {
              log(`Browser force-restarted successfully`);
              connectionFailCount = 0;
            } else {
              log(`Browser restart failed: ${restartJson.msg}`);
            }
          } catch (restartErr) {
            log(`Browser restart error: ${restartErr.message}`);
          }
        }

        await new Promise(r => setTimeout(r, 30000));
        continue;
      }

      connectionFailCount = 0;

      let browserDisconnected = false;
      browser.on('disconnected', () => { browserDisconnected = true; log('Browser disconnected'); });

      page.on('dialog', dialog => { dialog.dismiss().catch(() => {}); });

      if (browserDisconnected) {
        log('Browser disconnected before we could use it, retrying...');
        continue;
      }

      // Check priority notifications
      const priorityNotif = await checkNotifications(page, state);

      if (priorityNotif) {
        log(`RUSHING to @${priorityNotif.account}'s post!`);
        await page.goto(priorityNotif.link, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);

        const tweetInfo = await page.evaluate(() => {
          const textEl = document.querySelector('[data-testid="tweetText"]');
          const text = textEl?.innerText || '';
          const userEl = document.querySelector('[data-testid="User-Name"]');
          const username = userEl?.innerText?.split('\n')[0] || '';
          let views = 0;
          const analyticsLink = document.querySelector('a[href*="/analytics"]');
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
          return { text, username, views };
        });

        const reply = await analyzeAndReply(4, {
          text: tweetInfo.text,
          username: tweetInfo.username,
          views: tweetInfo.views || 50000,
          ageMinutes: priorityNotif.ageMinutes,
          link: priorityNotif.link
        });

        if (reply) {
          log(`Priority Reply: ${reply}`);
          try {
            const box = await page.waitForSelector('[data-testid="tweetTextarea_0"]', { timeout: 5000 });
            await box.click();
            await page.keyboard.type(reply, { delay: 30 });
            await page.waitForTimeout(1000);
            await page.click('button[data-testid="tweetButtonInline"]');
            await page.waitForTimeout(3000);

            log('PRIORITY POSTED!');
            state.repliesPosted = (state.repliesPosted || 0) + 1;
            state.repliesLast24h.push(new Date().toISOString());
            state.consecutiveFailures = 0;

            await saveReplyToDB({
              tweetUrl: priorityNotif.link,
              tweetText: tweetInfo.text.slice(0, 500),
              reply,
              strategy: 'grok_photo',
              originalViews: tweetInfo.views,
              priorityAccount: priorityNotif.account
            });

            state.repliedTweets = state.repliedTweets || [];
            state.repliedTweets.push(priorityNotif.link);
            if (state.repliedTweets.length > 500) {
              state.repliedTweets = state.repliedTweets.slice(-500);
            }

            saveState(state);

            const delay = getRandomDelay();
            const mins = Math.round(delay / 60000 * 10) / 10;
            log(`Next reply in ${mins} min...`);
            log('');
            const endTime = Date.now() + delay;
            while (Date.now() < endTime) {
              await new Promise(r => setTimeout(r, 10000));
            }
            continue;
          } catch (e) {
            log('Priority reply failed: ' + e.message.slice(0, 50));
          }
        }
      }

      // Normal mode: search for viral tweets
      const searchQueries = [
        'min_faves:5000 lang:en -filter:replies -filter:links',
        'min_faves:10000 lang:en -filter:replies',
        'min_retweets:1000 lang:en -filter:replies',
        'min_faves:8000 lang:en -filter:replies',
        'min_faves:3000 lang:en -filter:replies -filter:media'
      ];

      state.lastSearchIndex = (state.lastSearchIndex || 0) % searchQueries.length;
      const searchQuery = searchQueries[state.lastSearchIndex];
      state.lastSearchIndex++;

      const searchUrl = `https://x.com/search?q=${encodeURIComponent(searchQuery)}&src=typed_query&f=live`;

      log(`Searching: ${searchQuery.slice(0, 40)}...`);
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(5000);

      await page.evaluate(() => window.scrollBy(0, 600));
      await page.waitForTimeout(2000);

      const success = await postOneReply(page, state);
      saveState(state);

      const delay = getRandomDelay();
      const mins = Math.round(delay / 60000 * 10) / 10;
      log(`Next reply in ${mins} min...`);
      log('');

      const endTime = Date.now() + delay;
      while (Date.now() < endTime) {
        await new Promise(r => setTimeout(r, 10000));
      }

    } catch (e) {
      log('ERROR: ' + e.message);
      await new Promise(r => setTimeout(r, 2 * 60 * 1000));
    }
  }
}

process.on('SIGINT', () => { log('Shutting down...'); process.exit(0); });
process.on('SIGTERM', () => { log('Shutting down...'); process.exit(0); });
process.on('uncaughtException', (err) => { log(`UNCAUGHT EXCEPTION: ${err.message}`); });
process.on('unhandledRejection', (reason) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  log(`UNHANDLED REJECTION: ${msg}`);
});

main().catch(e => {
  log('FATAL: ' + e.message);
  log('Attempting restart in 1 minute...');
  setTimeout(() => {
    main().catch(err => { log('RESTART FAILED: ' + err.message); process.exit(1); });
  }, 60000);
});
