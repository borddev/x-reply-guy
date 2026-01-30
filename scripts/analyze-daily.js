/**
 * X Reply Guy - Daily Analysis
 * Analyzes last 24h performance and generates insights using Claude CLI
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const supabase = require('../lib/supabase');

const INSIGHTS_FILE = path.join(__dirname, '..', 'state', 'insights.json');
const AGENT_FILE = path.join(__dirname, '..', 'config', 'agent-prompt.md');

// Ensure dirs exist
fs.mkdirSync(path.join(__dirname, '..', 'state'), { recursive: true });

async function loadRepliesLast24h() {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('x_replies')
    .select('*')
    .gte('posted_at', dayAgo)
    .order('impressions', { ascending: false });

  if (error) { console.error('Error:', error); return []; }
  return data || [];
}

function formatReplyForAnalysis(reply) {
  const mins = Math.max(1, (Date.now() - new Date(reply.posted_at).getTime()) / 60000);
  const vpm = (reply.impressions || 0) / mins;
  return {
    views: reply.impressions || 0,
    vpm: parseFloat(vpm.toFixed(2)),
    strategy: reply.strategy || 'unknown',
    reply_text: reply.reply_text || '',
    tweet_text: (reply.tweet_text || '').slice(0, 200),
    original_views: reply.original_views || 0,
    response_time_mins: reply.response_time_mins || 0
  };
}

async function analyzeWithClaude(replies) {
  const sorted = [...replies].sort((a, b) => (b.impressions || 0) - (a.impressions || 0));
  const top5 = sorted.slice(0, 5).map(formatReplyForAnalysis);
  const bottom5 = sorted.slice(-5).map(formatReplyForAnalysis);

  const totalViews = replies.reduce((sum, r) => sum + (r.impressions || 0), 0);
  const avgViews = replies.length > 0 ? Math.round(totalViews / replies.length) : 0;

  const byStrategy = {};
  replies.forEach(r => {
    const s = r.strategy || 'unknown';
    if (!byStrategy[s]) byStrategy[s] = { views: 0, count: 0 };
    byStrategy[s].views += r.impressions || 0;
    byStrategy[s].count++;
  });

  const strategyStats = Object.entries(byStrategy).map(([name, data]) => ({
    strategy: name,
    avg_views: Math.round(data.views / data.count),
    count: data.count
  }));

  const prompt = `Analyze X/Twitter reply performance:

## LAST 24H: ${replies.length} replies, ${totalViews.toLocaleString()} total views, ${avgViews} avg

## STRATEGY PERFORMANCE
${JSON.stringify(strategyStats, null, 2)}

## TOP 5
${JSON.stringify(top5, null, 2)}

## BOTTOM 5
${JSON.stringify(bottom5, null, 2)}

Respond with JSON only:
{
  "summary": "...",
  "top_insight": "...",
  "winner_patterns": ["..."],
  "loser_patterns": ["..."],
  "strategy_recommendation": "...",
  "prompt_suggestions": ["..."],
  "confidence": 0.8
}`;

  try {
    const tempFile = path.join(__dirname, '..', '.analysis-prompt.tmp');
    fs.writeFileSync(tempFile, prompt);
    const result = execSync(`cat "${tempFile}" | claude --print`, {
      encoding: 'utf-8',
      timeout: 120000,
      maxBuffer: 10 * 1024 * 1024
    });
    fs.unlinkSync(tempFile);

    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return null;
  } catch (e) {
    console.error('Claude analysis error:', e.message);
    return null;
  }
}

async function main() {
  console.log('=== X Reply Guy Daily Analysis ===\n');

  const replies = await loadRepliesLast24h();
  console.log(`Found ${replies.length} replies`);

  if (replies.length < 3) {
    console.log('Not enough data (need 3+)');
    return;
  }

  console.log('Analyzing with Claude...');
  const analysis = await analyzeWithClaude(replies);

  if (!analysis) { console.log('Analysis failed'); return; }

  console.log('\n=== RESULTS ===');
  console.log('Summary:', analysis.summary);
  console.log('Top Insight:', analysis.top_insight);
  console.log('Winners:', analysis.winner_patterns?.join(', '));
  console.log('Losers:', analysis.loser_patterns?.join(', '));
  console.log('Strategy:', analysis.strategy_recommendation);
  console.log('\nSuggestions:');
  analysis.prompt_suggestions?.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));

  // Save
  let insights;
  try { insights = JSON.parse(fs.readFileSync(INSIGHTS_FILE, 'utf-8')); } catch { insights = { history: [] }; }
  insights.history.unshift({ date: new Date().toISOString(), analysis, status: 'pending' });
  insights.history = insights.history.slice(0, 30);
  fs.writeFileSync(INSIGHTS_FILE, JSON.stringify(insights, null, 2));
}

if (require.main === module) main().catch(console.error);
module.exports = { loadRepliesLast24h, analyzeWithClaude };
