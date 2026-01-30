/**
 * Tweet Scorer - Predicts which tweets are worth replying to
 *
 * Factors:
 * 1. Current views & velocity (views/hour)
 * 2. Account size (followers)
 * 3. Engagement rate (likes+retweets / views)
 * 4. Content type (video > image > text)
 * 5. Reply count (lower = better chance to be seen)
 * 6. Topic relevance (tech/business/culture = good)
 */

class TweetScorer {
  constructor() {
    this.weights = {
      velocity: 0.25,
      accountSize: 0.20,
      engagement: 0.15,
      mediaBonus: 0.10,
      replyWindow: 0.15,
      freshness: 0.15
    };
  }

  velocityScore(views, hoursOld) {
    if (hoursOld < 0.1) hoursOld = 0.1;
    const velocity = views / hoursOld;
    if (velocity >= 100000) return 100;
    if (velocity >= 50000) return 90;
    if (velocity >= 20000) return 80;
    if (velocity >= 10000) return 70;
    if (velocity >= 5000) return 60;
    if (velocity >= 2000) return 50;
    if (velocity >= 1000) return 40;
    if (velocity >= 500) return 30;
    if (velocity >= 100) return 20;
    return 10;
  }

  accountSizeScore(followers) {
    if (followers >= 10000000) return 100;
    if (followers >= 5000000) return 95;
    if (followers >= 1000000) return 90;
    if (followers >= 500000) return 80;
    if (followers >= 100000) return 70;
    if (followers >= 50000) return 60;
    if (followers >= 10000) return 50;
    if (followers >= 5000) return 40;
    if (followers >= 1000) return 30;
    return 20;
  }

  engagementScore(likes, retweets, views) {
    if (views < 100) return 50;
    const engagementRate = ((likes + retweets) / views) * 100;
    if (engagementRate >= 5) return 100;
    if (engagementRate >= 3) return 90;
    if (engagementRate >= 2) return 80;
    if (engagementRate >= 1) return 70;
    if (engagementRate >= 0.5) return 60;
    if (engagementRate >= 0.2) return 50;
    if (engagementRate >= 0.1) return 40;
    return 30;
  }

  mediaScore(mediaType) {
    switch (mediaType?.toUpperCase()) {
      case 'VIDEO': return 100;
      case 'IMAGE': return 70;
      case 'TEXT': return 40;
      default: return 50;
    }
  }

  replyWindowScore(replies, views) {
    if (views < 1000) return 50;
    const replyRate = replies / (views / 1000);
    if (replyRate <= 0.5) return 100;
    if (replyRate <= 1) return 90;
    if (replyRate <= 2) return 80;
    if (replyRate <= 5) return 70;
    if (replyRate <= 10) return 60;
    if (replyRate <= 20) return 50;
    if (replyRate <= 50) return 40;
    return 30;
  }

  freshnessScore(hoursOld) {
    if (hoursOld <= 0.5) return 100;
    if (hoursOld <= 1) return 95;
    if (hoursOld <= 2) return 90;
    if (hoursOld <= 4) return 80;
    if (hoursOld <= 8) return 70;
    if (hoursOld <= 12) return 60;
    if (hoursOld <= 24) return 50;
    if (hoursOld <= 48) return 30;
    return 10;
  }

  score(tweet) {
    const { views = 0, likes = 0, retweets = 0, replies = 0, followers = 0, mediaType = 'TEXT', hoursOld = 1 } = tweet;
    const scores = {
      velocity: this.velocityScore(views, hoursOld),
      accountSize: this.accountSizeScore(followers),
      engagement: this.engagementScore(likes, retweets, views),
      mediaBonus: this.mediaScore(mediaType),
      replyWindow: this.replyWindowScore(replies, views),
      freshness: this.freshnessScore(hoursOld)
    };

    let total = 0;
    for (const [key, weight] of Object.entries(this.weights)) {
      total += scores[key] * weight;
    }

    if (views >= 1000000) total = Math.min(100, total * 1.1);
    if (views >= 5000000) total = Math.min(100, total * 1.15);

    return {
      total: Math.round(total),
      breakdown: scores,
      recommendation: this.getRecommendation(total),
      predictedReach: this.predictReach(total, views)
    };
  }

  getRecommendation(score) {
    if (score >= 85) return 'REPLY NOW - High viral potential';
    if (score >= 70) return 'GOOD - Worth replying';
    if (score >= 55) return 'DECENT - Reply if good take';
    if (score >= 40) return 'MEH - Only if perfect reply';
    return 'SKIP - Low potential';
  }

  predictReach(score, views) {
    let baseRate = 0.001;
    if (score >= 85) baseRate = 0.01;
    else if (score >= 70) baseRate = 0.005;
    else if (score >= 55) baseRate = 0.002;
    const predicted = Math.round(views * baseRate);
    return { low: Math.round(predicted * 0.5), expected: predicted, high: Math.round(predicted * 2) };
  }

  rankTweets(tweets) {
    return tweets
      .map(tweet => ({ ...tweet, score: this.score(tweet) }))
      .sort((a, b) => b.score.total - a.score.total);
  }
}

module.exports = TweetScorer;

if (require.main === module) {
  const scorer = new TweetScorer();
  const test = [
    { username: 'example1', views: 5000000, likes: 100000, retweets: 20000, replies: 50000, followers: 200000000, mediaType: 'TEXT', hoursOld: 2 },
    { username: 'example2', views: 276000, likes: 6800, retweets: 669, replies: 198, followers: 684000, mediaType: 'VIDEO', hoursOld: 19 },
    { username: 'example3', views: 50000, likes: 500, retweets: 50, replies: 20, followers: 10000, mediaType: 'TEXT', hoursOld: 1 }
  ];

  console.log('=== TWEET SCORING ANALYSIS ===\n');
  scorer.rankTweets(test).forEach((t, i) => {
    console.log(`#${i + 1} @${t.username} - Score: ${t.score.total}/100`);
    console.log(`   ${t.score.recommendation}`);
    console.log(`   Predicted reach: ${t.score.predictedReach.low}-${t.score.predictedReach.high} views\n`);
  });
}
