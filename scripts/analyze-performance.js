/**
 * Quick performance analysis - top/worst performers and strategy breakdown
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const supabase = require('../lib/supabase');

async function analyze() {
  const { data: top } = await supabase
    .from('x_replies')
    .select('reply_text, impressions, strategy')
    .gt('impressions', 500)
    .order('impressions', { ascending: false })
    .limit(10);

  console.log('=== TOP PERFORMERS (>500 views) ===\n');
  if (top) {
    top.forEach(r => {
      console.log(`${r.impressions} views | ${r.strategy}`);
      console.log(`  ${r.reply_text}`);
      console.log('');
    });
  }

  const { data: worst } = await supabase
    .from('x_replies')
    .select('reply_text, impressions, strategy')
    .gt('impressions', 0)
    .lt('impressions', 50)
    .order('impressions', { ascending: true })
    .limit(10);

  console.log('=== WORST PERFORMERS (<50 views) ===\n');
  if (worst) {
    worst.forEach(r => {
      console.log(`${r.impressions} views | ${r.strategy}`);
      console.log(`  ${r.reply_text}`);
      console.log('');
    });
  }

  const { data: all } = await supabase
    .from('x_replies')
    .select('strategy, impressions')
    .gt('impressions', 0);

  const byStrategy = {};
  if (all) {
    all.forEach(r => {
      const s = r.strategy || 'unknown';
      if (!byStrategy[s]) byStrategy[s] = { total: 0, count: 0 };
      byStrategy[s].total += r.impressions;
      byStrategy[s].count++;
    });
  }

  console.log('=== STRATEGY PERFORMANCE ===\n');
  Object.entries(byStrategy).forEach(([s, data]) => {
    const avg = Math.round(data.total / data.count);
    console.log(`${s}: ${avg} avg views (${data.count} replies)`);
  });
}

analyze();
