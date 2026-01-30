-- Follow4Follow tracking tables for X Reply Guy
-- Run this in Supabase SQL Editor

-- Individual follows with full user data
CREATE TABLE IF NOT EXISTS x_f4f_follows (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  source VARCHAR(50) NOT NULL,

  -- User stats at time of follow
  user_followers INTEGER DEFAULT 0,
  user_following INTEGER DEFAULT 0,
  user_ratio DECIMAL(10,2) DEFAULT 0,

  -- Outcome tracking
  followed_at TIMESTAMPTZ DEFAULT NOW(),
  followed_back BOOLEAN DEFAULT FALSE,
  followed_back_at TIMESTAMPTZ,
  days_to_followback INTEGER,

  UNIQUE(username)
);

-- Source performance tracking
CREATE TABLE IF NOT EXISTS x_f4f_sources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,

  follows_sent INTEGER DEFAULT 0,
  follow_backs INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0,

  avg_followback_ratio DECIMAL(10,2),
  avg_followback_followers INTEGER,

  discovered_from VARCHAR(50),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  last_used TIMESTAMPTZ,
  active BOOLEAN DEFAULT TRUE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_f4f_follows_source ON x_f4f_follows(source);
CREATE INDEX IF NOT EXISTS idx_f4f_follows_followedback ON x_f4f_follows(followed_back);
CREATE INDEX IF NOT EXISTS idx_f4f_follows_username ON x_f4f_follows(username);

-- Enable RLS
ALTER TABLE x_f4f_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE x_f4f_sources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role f4f_follows" ON x_f4f_follows;
DROP POLICY IF EXISTS "Service role f4f_sources" ON x_f4f_sources;
CREATE POLICY "Service role f4f_follows" ON x_f4f_follows FOR ALL USING (true);
CREATE POLICY "Service role f4f_sources" ON x_f4f_sources FOR ALL USING (true);

-- View: Source leaderboard
CREATE OR REPLACE VIEW x_f4f_source_analysis AS
SELECT
  s.name,
  s.follows_sent,
  s.follow_backs,
  ROUND(s.success_rate * 100, 1) as success_rate_pct,
  s.avg_followback_ratio,
  s.avg_followback_followers,
  (SELECT COUNT(*) FROM x_f4f_follows f WHERE f.source = s.name AND f.followed_back = true) as confirmed_backs,
  (SELECT ROUND(AVG(days_to_followback), 1) FROM x_f4f_follows f WHERE f.source = s.name AND f.followed_back = true) as avg_days_to_back
FROM x_f4f_sources s
WHERE s.active = true
ORDER BY s.success_rate DESC;
