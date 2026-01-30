/**
 * Quick stats overview - replies and F4F performance
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const supabase = require('../lib/supabase');

async function main() {
  const { data: replies } = await supabase.from('x_replies').select('impressions, strategy, created_at').order('created_at', { ascending: false });
  const { data: follows } = await supabase.from('x_f4f_follows').select('source, followed_back');

  console.log('=== X REPLY GUY PERFORMANCE ===\n');

  const total = replies ? replies.length : 0;
  const totalViews = replies ? replies.reduce((s, r) => s + (r.impressions || 0), 0) : 0;
  console.log('Total replies:', total);
  console.log('Total views:', totalViews.toLocaleString());
  console.log('Avg views/reply:', total > 0 ? Math.round(totalViews / total) : 0);

  const stats = {};
  for (const r of replies || []) {
    const s = r.strategy || 'unknown';
    if (!stats[s]) stats[s] = { count: 0, views: 0 };
    stats[s].count++;
    stats[s].views += r.impressions || 0;
  }

  console.log('\nBy strategy:');
  Object.entries(stats).sort((a, b) => (b[1].views / b[1].count) - (a[1].views / a[1].count)).forEach(([s, d]) => {
    const avg = d.count > 0 ? Math.round(d.views / d.count) : 0;
    console.log(`  ${s.padEnd(18)} ${d.count.toString().padStart(3)} replies  ${d.views.toLocaleString().padStart(8)} views  avg: ${avg}`);
  });

  const week = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recent = (replies || []).filter(r => new Date(r.created_at) > week);
  const recentViews = recent.reduce((s, r) => s + (r.impressions || 0), 0);
  console.log(`\nLast 7 days: ${recent.length} replies, ${recentViews.toLocaleString()} views`);

  console.log('\n=== F4F PERFORMANCE ===\n');
  const followsTotal = follows ? follows.length : 0;
  const followBacks = follows ? follows.filter(f => f.followed_back).length : 0;
  const rate = followsTotal > 0 ? (followBacks / followsTotal * 100).toFixed(1) : 0;

  console.log('Following:', followsTotal);
  console.log('Follow backs:', followBacks);
  console.log('Rate:', rate + '%');

  const bySource = {};
  for (const f of follows || []) {
    const src = f.source || 'unknown';
    if (!bySource[src]) bySource[src] = { sent: 0, backs: 0 };
    bySource[src].sent++;
    if (f.followed_back) bySource[src].backs++;
  }

  console.log('\nBy source:');
  Object.entries(bySource).sort((a, b) => b[1].sent - a[1].sent).forEach(([s, d]) => {
    const r = d.sent > 0 ? Math.round(d.backs / d.sent * 100) : 0;
    console.log(`  ${s.padEnd(15)} ${d.sent.toString().padStart(3)} sent  ${d.backs.toString().padStart(3)} back  (${r}%)`);
  });
}

main();
