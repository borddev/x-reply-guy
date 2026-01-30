-- X Reply Guy - Main Schema
-- Run this in Supabase SQL Editor

-- Replies tracking table
CREATE TABLE IF NOT EXISTS x_replies (
  id SERIAL PRIMARY KEY,
  post_id TEXT,
  tweet_url TEXT,
  reply_url TEXT,
  tweet_text TEXT,
  reply_text TEXT,
  strategy TEXT,
  original_views INTEGER DEFAULT 0,
  original_posted_at TIMESTAMPTZ,
  response_time_mins INTEGER,
  impressions INTEGER DEFAULT 0,
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'bot',

  -- School (learning) columns
  used_in_school BOOLEAN DEFAULT FALSE,
  school_rating TEXT,
  school_comment TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_x_replies_posted_at ON x_replies(posted_at);
CREATE INDEX IF NOT EXISTS idx_x_replies_strategy ON x_replies(strategy);
CREATE INDEX IF NOT EXISTS idx_x_replies_impressions ON x_replies(impressions);
CREATE INDEX IF NOT EXISTS idx_x_replies_school ON x_replies(used_in_school, school_rating);

-- Enable RLS
ALTER TABLE x_replies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role x_replies" ON x_replies;
CREATE POLICY "Service role x_replies" ON x_replies FOR ALL USING (true);

-- School sessions table
CREATE TABLE IF NOT EXISTS reply_school_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  replies_reviewed INTEGER DEFAULT 0,
  good_count INTEGER DEFAULT 0,
  bad_count INTEGER DEFAULT 0,
  prompt_generated TEXT,
  prompt_applied BOOLEAN DEFAULT FALSE,
  notes TEXT
);

-- School suggestions table
CREATE TABLE IF NOT EXISTS reply_school_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  suggestion TEXT NOT NULL,
  accepted BOOLEAN,
  session_id UUID REFERENCES reply_school_sessions(id)
);
