const https = require('https');

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL;

/**
 * Send email via Mailgun.
 * Returns true on success, false if not configured or failed.
 */
async function sendEmail(subject, body, opts = {}) {
  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN || !NOTIFICATION_EMAIL) {
    console.log('Email not configured (set MAILGUN_API_KEY, MAILGUN_DOMAIN, NOTIFICATION_EMAIL)');
    return false;
  }

  const { html = false } = opts;

  return new Promise((resolve) => {
    const auth = Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64');
    const formData = new URLSearchParams({
      from: `Reply Guy <bot@${MAILGUN_DOMAIN}>`,
      to: NOTIFICATION_EMAIL,
      subject,
      [html ? 'html' : 'text']: body
    });

    const req = https.request({
      hostname: 'api.mailgun.net',
      port: 443,
      path: `/v3/${MAILGUN_DOMAIN}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }, res => {
      res.on('data', () => {});
      res.on('end', () => resolve(res.statusCode < 300));
    });

    req.on('error', () => resolve(false));
    req.write(formData.toString());
    req.end();
  });
}

module.exports = { sendEmail, MAILGUN_API_KEY, MAILGUN_DOMAIN, NOTIFICATION_EMAIL };
