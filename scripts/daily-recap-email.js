/**
 * X Reply Guy - Daily Recap Email
 * Shows today's stats + 7-day performance + best performers
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const supabase = require('../lib/supabase');
const { sendEmail } = require('../lib/email');

function formatViews(views) {
  if (!views) return '0';
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return views.toString();
}

async function main() {
  console.log('Fetching daily stats...\n');

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data: allReplies, error } = await supabase
    .from('x_replies')
    .select('*')
    .gte('posted_at', weekAgo.toISOString())
    .order('posted_at', { ascending: false });

  if (error) { console.error('Supabase error:', error.message); return; }
  if (!allReplies?.length) { console.log('No replies found'); return; }

  const todayReplies = allReplies.filter(r => new Date(r.posted_at) >= todayStart);
  const todayViews = todayReplies.reduce((s, r) => s + (r.impressions || 0), 0);
  const weekViews = allReplies.reduce((s, r) => s + (r.impressions || 0), 0);
  const avgPerReply = todayReplies.length ? Math.round(todayViews / todayReplies.length) : 0;

  const topPerformers = allReplies
    .filter(r => r.impressions > 0)
    .sort((a, b) => (b.impressions || 0) - (a.impressions || 0))
    .slice(0, 5);

  const stratStats = {};
  allReplies.forEach(r => {
    const strat = r.strategy || 'unknown';
    if (!stratStats[strat]) stratStats[strat] = { count: 0, views: 0 };
    stratStats[strat].count++;
    stratStats[strat].views += r.impressions || 0;
  });

  let bestStrat = null, bestAvg = 0;
  Object.entries(stratStats).forEach(([s, stats]) => {
    const avg = stats.count ? stats.views / stats.count : 0;
    if (avg > bestAvg) { bestStrat = s; bestAvg = avg; }
  });

  const topRows = topPerformers.map(r => {
    const text = (r.reply_text || '').slice(0, 60) + (r.reply_text?.length > 60 ? '...' : '');
    return `<tr>
      <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:right;font-weight:600;">${formatViews(r.impressions)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #eee;font-size:12px;">${text}</td>
    </tr>`;
  }).join('');

  const stratRows = Object.entries(stratStats)
    .sort((a, b) => (b[1].views / b[1].count) - (a[1].views / a[1].count))
    .map(([strat, stats]) => {
      const avg = stats.count ? Math.round(stats.views / stats.count) : 0;
      return `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;">${strat}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;">${stats.count}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;">${formatViews(stats.views)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;font-weight:600;">${formatViews(avg)}</td>
      </tr>`;
    }).join('');

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,sans-serif;padding:20px;max-width:700px;margin:0 auto;">
  <h2 style="margin:0 0 20px;">Daily Recap - ${now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</h2>
  <table style="width:100%;margin-bottom:30px;">
    <tr>
      <td style="padding:15px;background:#f5f5f5;border-radius:8px;text-align:center;">
        <div style="font-size:32px;font-weight:700;">${formatViews(todayViews)}</div>
        <div style="font-size:12px;color:#666;">views today</div>
      </td>
      <td style="width:15px;"></td>
      <td style="padding:15px;background:#f5f5f5;border-radius:8px;text-align:center;">
        <div style="font-size:32px;font-weight:700;">${todayReplies.length}</div>
        <div style="font-size:12px;color:#666;">replies today</div>
      </td>
      <td style="width:15px;"></td>
      <td style="padding:15px;background:#f5f5f5;border-radius:8px;text-align:center;">
        <div style="font-size:32px;font-weight:700;">${formatViews(avgPerReply)}</div>
        <div style="font-size:12px;color:#666;">avg/reply</div>
      </td>
    </tr>
  </table>
  <h3 style="font-size:14px;">Top Performers (7 days)</h3>
  <table style="width:100%;border-collapse:collapse;margin-bottom:30px;">
    <tr><th style="padding:8px 10px;text-align:right;border-bottom:2px solid #000;font-size:11px;width:80px;">Views</th>
    <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #000;font-size:11px;">Reply</th></tr>
    ${topRows}
  </table>
  <h3 style="font-size:14px;">Strategy Performance (7 days)</h3>
  <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
    <tr><th style="padding:6px 10px;text-align:left;border-bottom:2px solid #000;font-size:11px;">Strategy</th>
    <th style="padding:6px 10px;text-align:right;border-bottom:2px solid #000;font-size:11px;">Replies</th>
    <th style="padding:6px 10px;text-align:right;border-bottom:2px solid #000;font-size:11px;">Total</th>
    <th style="padding:6px 10px;text-align:right;border-bottom:2px solid #000;font-size:11px;">Avg</th></tr>
    ${stratRows}
  </table>
  <p style="padding:15px;background:#f0f0f0;border-radius:8px;font-size:13px;">
    <b>Insight:</b> ${bestStrat ? `"${bestStrat}" has best avg (${formatViews(Math.round(bestAvg))} views/reply)` : 'Need more data'}
    <br><br><b>7-day total:</b> ${allReplies.length} replies, ${formatViews(weekViews)} views
  </p>
</body></html>`;

  const subject = `${formatViews(todayViews)} views today | ${todayReplies.length} replies`;

  try {
    await sendEmail(subject, html, { html: true });
    console.log('Email sent!');
    console.log(`Subject: ${subject}`);
  } catch (e) {
    console.error('Email failed:', e.message);
  }

  console.log(`\nToday: ${todayReplies.length} replies, ${formatViews(todayViews)} views`);
  console.log(`Week: ${allReplies.length} replies, ${formatViews(weekViews)} views`);
}

main().catch(console.error);
