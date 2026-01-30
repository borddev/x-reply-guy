/**
 * Sync views from X Premium Analytics page
 * Extracts impressions from: https://x.com/i/account_analytics/content?type=replies
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { chromium } = require('playwright');
const supabase = require('../lib/supabase');
const { ADSPOWER_API, PROFILE_ID } = require('../lib/adspower');

const ANALYTICS_URL = 'https://x.com/i/account_analytics/content?type=replies&sort=date&dir=desc&days=90';

function parseAnalyticsRow(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length < 7) return null;

  const dateMatch = lines[1]?.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*\d{1,2},\s*\d{4}/);
  if (!dateMatch) return null;

  const date = dateMatch[0];
  const lastFour = lines.slice(-4);
  const allNumbers = lastFour.every(l => /^\d+(\.\d+)?[KMB]?$/.test(l) || /^\d+$/.test(l));
  if (!allNumbers) return null;

  const textLines = lines.slice(2, -4);
  const tweetText = textLines.join(' ').trim();
  if (!tweetText) return null;

  function parseNum(s) {
    if (!s) return 0;
    s = s.trim();
    if (s.endsWith('K')) return parseFloat(s) * 1000;
    if (s.endsWith('M')) return parseFloat(s) * 1000000;
    if (s.endsWith('B')) return parseFloat(s) * 1000000000;
    return parseInt(s) || 0;
  }

  const nums = lines.slice(-4);
  return {
    text: tweetText,
    date,
    replies: parseNum(nums[0]),
    reposts: parseNum(nums[1]),
    likes: parseNum(nums[2]),
    impressions: parseNum(nums[3])
  };
}

async function safeEvaluate(page, fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try { return await page.evaluate(fn); }
    catch (e) { if (i === retries - 1) throw e; await page.waitForTimeout(1000); }
  }
}

async function main() {
  console.log('=== SYNCING FROM X ANALYTICS ===\n');

  let wsEndpoint;
  try {
    const activeRes = await fetch(`${ADSPOWER_API}/api/v1/browser/active?user_id=${PROFILE_ID}`);
    const activeJson = await activeRes.json();

    if (activeJson.code === 0 && activeJson.data?.status === 'Active') {
      wsEndpoint = activeJson.data.ws.puppeteer;
    } else {
      const res = await fetch(`${ADSPOWER_API}/api/v1/browser/start?user_id=${PROFILE_ID}`);
      const json = await res.json();
      if (json.code !== 0) { console.log('AdsPower error:', json.msg); return; }
      wsEndpoint = json.data.ws.puppeteer;
      await new Promise(r => setTimeout(r, 3000));
    }
  } catch (e) {
    console.log('AdsPower not running:', e.message);
    return;
  }

  let browser, page;
  try {
    browser = await chromium.connectOverCDP(wsEndpoint);
    const ctx = browser.contexts()[0];
    page = await ctx.newPage();

    console.log('Loading analytics page...');
    await page.goto(ANALYTICS_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);

    try { await page.waitForSelector('li', { timeout: 10000 }); } catch {}

    // Scroll to load all
    console.log('Scrolling to load all replies...');
    let lastCount = 0, stableCount = 0;
    for (let i = 0; i < 100; i++) {
      try {
        await page.evaluate(() => window.scrollBy(0, 2000));
        await page.waitForTimeout(500);
        const currentCount = await safeEvaluate(page, () => document.querySelectorAll('li').length);
        if (currentCount === lastCount) { stableCount++; if (stableCount > 10) break; }
        else { stableCount = 0; if (i % 5 === 0) process.stdout.write(`${currentCount}..`); }
        lastCount = currentCount;
      } catch { await page.waitForTimeout(2000); }
    }
    console.log(`\nLoaded ${lastCount} items\n`);

    let rawTexts = [];
    try { rawTexts = await safeEvaluate(page, () => Array.from(document.querySelectorAll('li')).map(li => li.innerText)); }
    catch (e) { console.log('Error extracting:', e.message); return; }

    const analyticsData = [];
    const seen = new Set();
    for (const raw of rawTexts) {
      const parsed = parseAnalyticsRow(raw);
      if (parsed && parsed.text && !seen.has(parsed.text)) {
        seen.add(parsed.text);
        analyticsData.push(parsed);
      }
    }

    console.log(`Parsed ${analyticsData.length} replies\n`);
    if (!analyticsData.length) return;

    analyticsData.slice(0, 5).forEach(d => {
      console.log(`  ${d.impressions.toString().padStart(6)} imp | ${d.text.slice(0, 50)}`);
    });

    const { data: dbReplies } = await supabase
      .from('x_replies')
      .select('id, reply_text, impressions, posted_at');

    console.log(`\n${dbReplies?.length || 0} replies in database\n`);

    let updated = 0, matched = 0;
    for (const analytics of analyticsData) {
      const analyticsTextLower = analytics.text.toLowerCase().trim();
      const match = dbReplies?.find(r => {
        const dbText = (r.reply_text || '').toLowerCase().trim();
        if (dbText === analyticsTextLower) return true;
        if (dbText.includes(analyticsTextLower) || analyticsTextLower.includes(dbText)) return true;
        const minLen = Math.min(dbText.length, analyticsTextLower.length, 40);
        if (minLen > 10 && dbText.slice(0, minLen) === analyticsTextLower.slice(0, minLen)) return true;
        return false;
      });

      if (match) {
        matched++;
        if (match.impressions !== analytics.impressions) {
          const { error } = await supabase.from('x_replies')
            .update({ impressions: analytics.impressions }).eq('id', match.id);
          if (!error) { console.log(`UPDATED: ${analytics.impressions.toString().padStart(6)} views | ${analytics.text.slice(0, 50)}`); updated++; }
        }
      }
    }

    console.log(`\nMatched: ${matched}/${analyticsData.length} | Updated: ${updated}`);
  } catch (e) {
    console.log('Error:', e.message);
  } finally {
    if (page) try { await page.close(); } catch {}
  }
}

main().catch(console.error);
