import Database from 'better-sqlite3';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync, mkdirSync } from 'fs';

// Database stored in ~/bord/data/x-reply-guy/
const DATA_DIR = join(homedir(), 'bord', 'data', 'x-reply-guy');
const DB_PATH = join(DATA_DIR, 'replies.db');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS x_replies (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    post_id TEXT UNIQUE,
    reply_text TEXT,
    reply_url TEXT,
    tweet_url TEXT,
    tweet_text TEXT,
    strategy TEXT,
    source TEXT DEFAULT 'bot',
    impressions INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    engagements INTEGER DEFAULT 0,
    bookmarks INTEGER DEFAULT 0,
    replies INTEGER DEFAULT 0,
    reposts INTEGER DEFAULT 0,
    profile_visits INTEGER DEFAULT 0,
    original_views INTEGER,
    original_posted_at TEXT,
    response_time_mins INTEGER,
    posted_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    school_rating TEXT,
    school_comment TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_replies_posted ON x_replies(posted_at DESC);
  CREATE INDEX IF NOT EXISTS idx_replies_impressions ON x_replies(impressions DESC);

  CREATE TABLE IF NOT EXISTS x_following (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    username TEXT UNIQUE,
    followed_at TEXT DEFAULT (datetime('now')),
    followed_back INTEGER DEFAULT 0,
    followed_back_at TEXT,
    source TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_following_username ON x_following(username);
`);

export interface Reply {
  id: string;
  post_id: string | null;
  reply_text: string | null;
  reply_url: string | null;
  tweet_url: string | null;
  tweet_text: string | null;
  strategy: string | null;
  source: string;
  impressions: number;
  likes: number;
  engagements: number;
  bookmarks: number;
  replies: number;
  reposts: number;
  profile_visits: number;
  original_views: number | null;
  original_posted_at: string | null;
  response_time_mins: number | null;
  posted_at: string | null;
  created_at: string;
  school_rating: string | null;
  school_comment: string | null;
}

export interface Following {
  id: string;
  username: string;
  followed_at: string;
  followed_back: number;
  followed_back_at: string | null;
  source: string | null;
}

// Replies
export function getReplies(limit = 500): Reply[] {
  return db.prepare(`
    SELECT * FROM x_replies
    ORDER BY posted_at DESC
    LIMIT ?
  `).all(limit) as Reply[];
}

export function getUnreviewedReplies(limit = 100): Reply[] {
  return db.prepare(`
    SELECT * FROM x_replies
    WHERE school_rating IS NULL
    ORDER BY posted_at DESC
    LIMIT ?
  `).all(limit) as Reply[];
}

export function insertReply(reply: Partial<Reply>): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO x_replies (
      post_id, reply_text, reply_url, tweet_url, tweet_text,
      strategy, source, impressions, likes, engagements,
      bookmarks, replies, reposts, profile_visits,
      original_views, original_posted_at, response_time_mins,
      posted_at, school_rating, school_comment
    ) VALUES (
      @post_id, @reply_text, @reply_url, @tweet_url, @tweet_text,
      @strategy, @source, @impressions, @likes, @engagements,
      @bookmarks, @replies, @reposts, @profile_visits,
      @original_views, @original_posted_at, @response_time_mins,
      @posted_at, @school_rating, @school_comment
    )
  `);

  stmt.run({
    post_id: reply.post_id || null,
    reply_text: reply.reply_text || null,
    reply_url: reply.reply_url || null,
    tweet_url: reply.tweet_url || null,
    tweet_text: reply.tweet_text || null,
    strategy: reply.strategy || null,
    source: reply.source || 'bot',
    impressions: reply.impressions || 0,
    likes: reply.likes || 0,
    engagements: reply.engagements || 0,
    bookmarks: reply.bookmarks || 0,
    replies: reply.replies || 0,
    reposts: reply.reposts || 0,
    profile_visits: reply.profile_visits || 0,
    original_views: reply.original_views || null,
    original_posted_at: reply.original_posted_at || null,
    response_time_mins: reply.response_time_mins || null,
    posted_at: reply.posted_at || null,
    school_rating: reply.school_rating || null,
    school_comment: reply.school_comment || null,
  });
}

export function updateReplyRating(id: string, rating: string, comment?: string): void {
  db.prepare(`
    UPDATE x_replies
    SET school_rating = ?, school_comment = ?
    WHERE id = ?
  `).run(rating, comment || null, id);
}

export function updateReplyStats(postId: string, stats: Partial<Reply>): void {
  db.prepare(`
    UPDATE x_replies
    SET impressions = ?, likes = ?, engagements = ?,
        bookmarks = ?, replies = ?, reposts = ?, profile_visits = ?
    WHERE post_id = ?
  `).run(
    stats.impressions || 0,
    stats.likes || 0,
    stats.engagements || 0,
    stats.bookmarks || 0,
    stats.replies || 0,
    stats.reposts || 0,
    stats.profile_visits || 0,
    postId
  );
}

// Following
export function getFollowing(limit = 1000): Following[] {
  return db.prepare(`
    SELECT * FROM x_following
    ORDER BY followed_at DESC
    LIMIT ?
  `).all(limit) as Following[];
}

export function addFollowing(username: string, source?: string): void {
  db.prepare(`
    INSERT OR IGNORE INTO x_following (username, source)
    VALUES (?, ?)
  `).run(username, source || null);
}

export function markFollowedBack(username: string): void {
  db.prepare(`
    UPDATE x_following
    SET followed_back = 1, followed_back_at = datetime('now')
    WHERE username = ?
  `).run(username);
}

export function getFollowStats() {
  const total = db.prepare('SELECT COUNT(*) as count FROM x_following').get() as { count: number };
  const followedBack = db.prepare('SELECT COUNT(*) as count FROM x_following WHERE followed_back = 1').get() as { count: number };

  return {
    total: total.count,
    followedBack: followedBack.count,
    rate: total.count > 0 ? (followedBack.count / total.count * 100).toFixed(1) : '0'
  };
}

export default db;
