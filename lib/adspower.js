const { chromium } = require('playwright');

const ADSPOWER_API = process.env.ADSPOWER_API || 'http://127.0.0.1:50325';
const PROFILE_ID = process.env.ADSPOWER_PROFILE_ID;

if (!PROFILE_ID) {
  console.error('Missing ADSPOWER_PROFILE_ID in environment');
  console.error('Copy .env.example to .env and fill in your credentials');
  process.exit(1);
}

/**
 * Connect to AdsPower browser profile.
 * Returns { browser, context, page } or throws on failure.
 */
async function connectBrowser(opts = {}) {
  const { headless = true, startIfNeeded = true } = opts;

  // Check if already active
  const activeRes = await fetch(`${ADSPOWER_API}/api/v1/browser/active?user_id=${PROFILE_ID}`);
  const activeJson = await activeRes.json();

  let wsEndpoint;

  if (activeJson.code === 0 && activeJson.data?.status === 'Active') {
    wsEndpoint = activeJson.data.ws.puppeteer;
  } else if (startIfNeeded) {
    const url = `${ADSPOWER_API}/api/v1/browser/start?user_id=${PROFILE_ID}${headless ? '&headless=1' : ''}`;
    const res = await fetch(url);
    const json = await res.json();
    if (json.code !== 0) {
      throw new Error(`AdsPower start failed: ${json.msg || 'unknown error'}`);
    }
    wsEndpoint = json.data.ws.puppeteer;
  } else {
    throw new Error('Browser not active and startIfNeeded=false');
  }

  if (!wsEndpoint) {
    throw new Error('No WebSocket endpoint from AdsPower');
  }

  const browser = await chromium.connectOverCDP(wsEndpoint);
  const context = browser.contexts()[0];
  if (!context) throw new Error('No browser context found');
  const page = context.pages()[0] || await context.newPage();

  return { browser, context, page };
}

/**
 * Stop the AdsPower browser profile.
 */
async function stopBrowser() {
  await fetch(`${ADSPOWER_API}/api/v1/browser/stop?user_id=${PROFILE_ID}`);
}

module.exports = { connectBrowser, stopBrowser, ADSPOWER_API, PROFILE_ID };
