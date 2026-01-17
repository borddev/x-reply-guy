'use client';

import { useState, useEffect, useRef } from 'react';

interface Reply {
  id: string;
  tweet_text: string;
  reply_text: string;
  tweet_url: string;
  reply_url?: string;
  impressions: number;
  posted_at: string;
  strategy: string;
  source: string;
  school_rating?: string;
  school_comment?: string;
}

// Elon quotes for Good reactions
const ELON_GOOD_QUOTES = [
  "This reply goes hard. Ship it.",
  "The algorithm will love this one.",
  "Based reply detected.",
  "Now THAT's how you farm engagement.",
  "Perfection. To the moon!",
  "This is the way.",
  "You're learning. Impressive.",
  "Galaxy brain reply right here.",
  "The vibe is immaculate.",
  "Reply guy energy: 100%",
  "Grok would be proud.",
  "That's some main character energy.",
  "The engagement is strong with this one.",
  "Certified banger.",
  "10x reply energy.",
];

// Elon quotes for Bad reactions
const ELON_BAD_QUOTES = [
  "This ain't it, chief.",
  "We need to delete this before Grok sees it.",
  "The ratio potential is concerning.",
  "Have you tried being funnier?",
  "Not gonna lie, that's mid.",
  "My engineers could do better.",
  "The cringe is strong with this one.",
  "Let's pretend this never happened.",
  "Back to the drawing board.",
  "Twitter Blue refund incoming.",
];

// Elon quotes for Skip reactions
const ELON_SKIP_QUOTES = [
  "Meh. Moving on.",
  "I've seen worse. I've seen better.",
  "Not worth my time either.",
  "The jury is still out.",
  "Neither moon nor mars.",
  "Acceptable mediocrity.",
  "*yawns*",
  "Let's just forget this one.",
  "Mid. Just mid.",
  "The algorithm is indifferent.",
];

// Trump quotes for streak bonus
const TRUMP_QUOTES = [
  "TERRIFIC! Absolutely terrific work!",
  "This is TREMENDOUS! Nobody does it better!",
  "HUGE replies! The biggest! Believe me!",
  "You're doing a FANTASTIC job! Fantastic!",
  "The best reply guy. Everyone says so. EVERYONE!",
  "WINNER! That's what you are! A WINNER!",
  "Making Twitter Great Again! GREAT!",
  "These replies are BEAUTIFUL! Just beautiful!",
  "INCREDIBLE! I've never seen anything like it!",
  "You're a GENIUS! A stable genius!",
];

// Typing effect hook
function useTypingEffect(text: string, speed: number = 30) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (!text) return;
    setDisplayedText('');
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return displayedText;
}

// Mascot component
type MascotMood = 'happy' | 'sad' | 'impressed' | 'angry' | 'excited' | 'bored' | 'trump';

function Mascot({ mood, quote, visible }: { mood: MascotMood; quote: string; visible: boolean }) {
  const typedQuote = useTypingEffect(visible ? quote : '', 25);

  if (!visible) return null;

  const isTrump = mood === 'trump';

  // Different animations based on mood
  const getAnimation = () => {
    if (isTrump) return 'trumpEntrance 0.5s ease';
    switch (mood) {
      case 'happy':
      case 'impressed':
        return 'elonBounce 0.5s ease';
      case 'excited':
        return 'elonJump 0.6s ease';
      case 'angry':
        return 'elonShake 0.5s ease';
      case 'sad':
        return 'elonShake 0.4s ease';
      case 'bored':
        return 'elonFade 0.3s ease';
      default:
        return 'elonBounce 0.5s ease';
    }
  };

  // Mood emoji
  const getMoodEmoji = () => {
    if (isTrump) return '🇺🇸';
    switch (mood) {
      case 'happy': return '😎';
      case 'impressed': return '🤯';
      case 'excited': return '🚀';
      case 'angry': return '😤';
      case 'sad': return '😢';
      case 'bored': return '😐';
      default: return '🤖';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 80,
      right: 24,
      display: 'flex',
      alignItems: 'flex-end',
      gap: 12,
      animation: 'mascotSlideIn 0.3s ease-out',
      zIndex: 100
    }}>
      {/* Speech bubble */}
      <div style={{
        background: isTrump ? '#1a1a2a' : '#1a1a1a',
        border: `1px solid ${isTrump ? '#c41e3a' : '#333'}`,
        borderRadius: 12,
        padding: '12px 16px',
        maxWidth: 240,
        position: 'relative',
        marginBottom: 40
      }}>
        <div style={{
          fontSize: 13,
          color: '#fff',
          lineHeight: 1.4,
          fontFamily: 'monospace',
          minHeight: 20
        }}>
          {typedQuote}
          <span style={{
            opacity: typedQuote.length < quote.length ? 1 : 0,
            animation: 'blink 0.5s infinite'
          }}>|</span>
        </div>
        {/* Speech bubble tail */}
        <div style={{
          position: 'absolute',
          bottom: -8,
          right: 30,
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: `8px solid ${isTrump ? '#1a1a2a' : '#1a1a1a'}`
        }} />
      </div>

      {/* Character */}
      <div style={{
        width: isTrump ? 80 : 70,
        height: isTrump ? 80 : 70,
        borderRadius: 12,
        background: isTrump ? '#1a1a2a' : '#222',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 40,
        animation: getAnimation(),
        boxShadow: isTrump ? '0 0 20px rgba(196,30,58,0.3)' : 'none'
      }}>
        {getMoodEmoji()}
      </div>

      <style>{`
        @keyframes mascotSlideIn {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes elonBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes elonJump {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        @keyframes elonShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
        @keyframes elonFade {
          from { opacity: 0.5; }
          to { opacity: 1; }
        }
        @keyframes trumpEntrance {
          0% { transform: scale(0.5) rotate(-10deg); opacity: 0; }
          50% { transform: scale(1.1) rotate(5deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function formatViews(views: number): string {
  if (!views) return '0';
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return views.toString();
}

// Extract tweet ID from URL
function getTweetId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/status\/(\d+)/);
  return match ? match[1] : null;
}

// Compact tweet embed for context
function OriginalTweetEmbed({ url }: { url: string }) {
  const [height, setHeight] = useState(200);
  const tweetId = getTweetId(url);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== 'https://platform.twitter.com') return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data['twttr.embed'] && data['twttr.embed'].method === 'twttr.private.resize') {
          const newHeight = data['twttr.embed'].params?.[0]?.height;
          if (newHeight && newHeight > 100) {
            setHeight(Math.min(newHeight + 10, 300));
          }
        }
      } catch (e) {}
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [tweetId]);

  if (!tweetId) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#555', fontSize: 12 }}>
        View original on X
      </a>
    );
  }

  const embedUrl = `https://platform.twitter.com/embed/Tweet.html?id=${tweetId}&theme=dark&hideCard=true&hideThread=true`;

  return (
    <div style={{ borderRadius: 8, overflow: 'hidden', background: '#0a0a0a', maxHeight: 300 }}>
      <iframe
        src={embedUrl}
        style={{ width: '100%', height, border: 'none', background: 'transparent' }}
        loading="lazy"
      />
    </div>
  );
}

export default function ReplyGuySchool() {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [animating, setAnimating] = useState<'left' | 'right' | null>(null);
  const [reviewed, setReviewed] = useState<Reply[]>([]);
  const [viewingHistory, setViewingHistory] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [mascotVisible, setMascotVisible] = useState(false);
  const [mascotMood, setMascotMood] = useState<MascotMood>('happy');
  const [mascotQuote, setMascotQuote] = useState('');
  const goodStreakRef = useRef(0);
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [feedbackStack, setFeedbackStack] = useState<Array<{ id: string; rating: string; index: number }>>([]);
  const [clearingStack, setClearingStack] = useState(false);

  useEffect(() => { fetchReplies(); }, []);

  useEffect(() => {
    if (replies[currentIndex]) {
      setComment(replies[currentIndex].school_comment || '');
    }
  }, [currentIndex, replies]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (viewingHistory || currentIndex >= replies.length) return;
      if (e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'g' || e.key === 'G') handleAction('good');
      else if (e.key === 'b' || e.key === 'B') handleAction('bad');
      else if (e.key === 's' || e.key === 'S') handleAction('skip');
      else if (e.key === 'ArrowLeft' && reviewed.length > 0) {
        setViewingHistory(true);
        setHistoryIndex(reviewed.length - 1);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIndex, replies, viewingHistory, reviewed, comment]);

  async function fetchReplies() {
    setLoading(true);
    const res = await fetch('/api/x-reply-guy/school?filter=unreviewed&limit=100');
    const data = await res.json();
    setReplies(data.replies || []);
    setLoading(false);
  }

  async function handleAction(rating: 'good' | 'bad' | 'skip') {
    const current = replies[currentIndex];
    if (!current) return;

    setAnimating(rating === 'good' ? 'right' : 'left');

    // Hide previous mascot first
    setMascotVisible(false);

    // Calculate streak
    let mood: MascotMood;
    let quote: string;

    if (rating === 'good') {
      goodStreakRef.current += 1;
      const newStreak = goodStreakRef.current;

      // Streak logic: Every 3rd good, Trump appears
      if (newStreak % 3 === 0) {
        mood = 'trump';
        quote = TRUMP_QUOTES[Math.floor(Math.random() * TRUMP_QUOTES.length)];
      } else {
        const goodMoods: MascotMood[] = ['happy', 'impressed', 'excited'];
        mood = goodMoods[Math.floor(Math.random() * goodMoods.length)];
        quote = ELON_GOOD_QUOTES[Math.floor(Math.random() * ELON_GOOD_QUOTES.length)];
      }
    } else if (rating === 'bad') {
      goodStreakRef.current = 0;
      const badMoods: MascotMood[] = ['sad', 'angry'];
      mood = badMoods[Math.floor(Math.random() * badMoods.length)];
      quote = ELON_BAD_QUOTES[Math.floor(Math.random() * ELON_BAD_QUOTES.length)];
    } else {
      mood = 'bored';
      quote = ELON_SKIP_QUOTES[Math.floor(Math.random() * ELON_SKIP_QUOTES.length)];
    }

    // Small delay before showing new mascot
    setTimeout(() => {
      setMascotMood(mood);
      setMascotQuote(quote);
      setMascotVisible(true);
    }, 150);

    await fetch('/api/x-reply-guy/school', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: current.id, rating, comment })
    });

    setTimeout(() => {
      setReviewed(prev => [...prev, { ...current, school_rating: rating, school_comment: comment }]);
      // Add to feedback stack
      setFeedbackStack(prev => [...prev, {
        id: current.id,
        rating,
        index: prev.length
      }]);
      setCurrentIndex(prev => prev + 1);
      setComment('');
      setAnimating(null);
    }, 300);
  }

  async function copyPrompt() {
    const res = await fetch('/api/x-reply-guy/school/prompt');
    const data = await res.json();
    await navigator.clipboard.writeText(data.prompt);
    setCopied(true);
    // Animate stack clearing
    setClearingStack(true);
    setTimeout(() => {
      setFeedbackStack([]);
      setClearingStack(false);
      setCopied(false);
    }, 600);
  }

  async function previewPrompt() {
    const res = await fetch('/api/x-reply-guy/school/prompt');
    const data = await res.json();
    setPromptText(data.prompt || '');
    setShowPromptPreview(true);
  }

  const current = viewingHistory ? reviewed[historyIndex] : replies[currentIndex];
  const isFinished = !viewingHistory && currentIndex >= replies.length;

  return (
    <div style={{ background: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'system-ui' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #222' }}>
        <a href="/x-reply-guy" style={{ color: '#666', textDecoration: 'none', fontSize: 13 }}>Back</a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
          </svg>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Reply Agent School</span>
          <span style={{ fontSize: 12, color: '#666', marginLeft: 8 }}>
            {viewingHistory ? `${historyIndex + 1}/${reviewed.length}` : `${currentIndex + 1}/${replies.length}`}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={previewPrompt} style={{ background: 'none', color: '#666', border: '1px solid #333', padding: '6px 10px', borderRadius: 4, cursor: 'pointer' }} title="Preview Prompt">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
          <button onClick={copyPrompt} style={{ background: 'none', color: copied ? '#fff' : '#666', border: '1px solid #333', padding: '6px 12px', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>
            {copied ? 'Copied' : 'Copy Prompt'}
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 120px)', padding: '20px', position: 'relative' }}>

        {/* Left Arrow */}
        <button
          onClick={() => {
            if (viewingHistory && historyIndex > 0) setHistoryIndex(prev => prev - 1);
            else if (!viewingHistory && reviewed.length > 0) {
              setViewingHistory(true);
              setHistoryIndex(reviewed.length - 1);
            }
          }}
          style={{ position: 'absolute', left: 20, background: 'none', border: 'none', color: reviewed.length === 0 && !viewingHistory ? '#222' : '#555', fontSize: 28, cursor: 'pointer' }}
        >
          ←
        </button>

        {loading ? (
          <div style={{ color: '#444' }}>Loading...</div>
        ) : isFinished ? (
          <div style={{ textAlign: 'center' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" style={{ marginBottom: 16 }}>
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
            </svg>
            <div style={{ fontSize: 24, marginBottom: 8 }}>Graduated!</div>
            <div style={{ color: '#666', marginBottom: 24 }}>{reviewed.length} replies reviewed</div>
            <button onClick={copyPrompt} style={{ background: '#fff', color: '#000', border: 'none', padding: '12px 24px', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}>
              {copied ? 'Copied' : 'Copy Training Prompt'}
            </button>
          </div>
        ) : current ? (
          <div
            key={current.id}
            style={{
              width: '100%',
              maxWidth: 550,
              transform: animating === 'left' ? 'translateX(-100%) rotate(-5deg)' : animating === 'right' ? 'translateX(100%) rotate(5deg)' : 'none',
              opacity: animating ? 0 : 1,
              transition: 'all 0.25s ease'
            }}
          >
            {/* OUR REPLY */}
            <div style={{
              background: '#111',
              border: '1px solid #333',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12
            }}>
              <div style={{ fontSize: 11, color: '#555', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span>Our Reply</span>
                {current.reply_url && (
                  <a href={current.reply_url} target="_blank" rel="noopener noreferrer" style={{ color: '#555', textDecoration: 'none' }}>
                    View on X
                  </a>
                )}
              </div>
              <div style={{ fontSize: 16, lineHeight: 1.4, color: '#fff' }}>
                {current.reply_text}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: '#666' }}>
                <span>{formatViews(current.impressions || 0)} views</span>
                <span>{current.strategy || (current.source === 'bot' ? 'bot' : 'manual')}</span>
              </div>
            </div>

            {/* ORIGINAL TWEET */}
            {current.tweet_url && current.tweet_url !== current.reply_url && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: '#444', marginBottom: 6 }}>Replying to:</div>
                <OriginalTweetEmbed url={current.tweet_url} />
              </div>
            )}

            {/* Comment */}
            {!viewingHistory && (
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Note..."
                style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: 8, padding: 12, color: '#fff', fontSize: 14, resize: 'none', height: 50, marginBottom: 12, boxSizing: 'border-box' }}
              />
            )}

            {/* Actions */}
            {!viewingHistory ? (
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => handleAction('bad')} style={{ flex: 1, padding: 14, background: 'none', color: '#fff', border: '1px solid #333', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>Bad</button>
                <button onClick={() => handleAction('skip')} style={{ padding: '14px 20px', background: 'none', color: '#555', border: '1px solid #222', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>Skip</button>
                <button onClick={() => handleAction('good')} style={{ flex: 1, padding: 14, background: '#fff', color: '#000', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>Good</button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#666', fontSize: 13, padding: 12, border: '1px solid #333', borderRadius: 8 }}>
                {current.school_rating}{current.school_comment && `: ${current.school_comment}`}
              </div>
            )}
          </div>
        ) : null}

        {/* Right Arrow */}
        <button
          onClick={() => {
            if (viewingHistory) {
              if (historyIndex < reviewed.length - 1) setHistoryIndex(prev => prev + 1);
              else setViewingHistory(false);
            }
          }}
          style={{ position: 'absolute', right: 20, background: 'none', border: 'none', color: !viewingHistory ? '#222' : '#555', fontSize: 28, cursor: 'pointer' }}
        >
          →
        </button>

        {/* Feedback Stack - Right Side */}
        {feedbackStack.length > 0 && (
          <div style={{
            position: 'fixed',
            top: 80,
            right: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            zIndex: 50,
            maxHeight: 'calc(100vh - 180px)',
            overflowY: 'auto',
            paddingRight: 4
          }}>
            {feedbackStack.map((item, i) => {
              const color = item.rating === 'good' ? '#22c55e' : item.rating === 'bad' ? '#ef4444' : '#666';
              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#111',
                    border: `1px solid ${color}`,
                    borderRadius: 6,
                    padding: '6px 12px',
                    animation: clearingStack
                      ? `stackFlyOut 0.5s ease forwards ${i * 0.03}s`
                      : 'stackSlideIn 0.3s ease',
                    opacity: clearingStack ? 1 : 1
                  }}
                >
                  {/* X Logo */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={color}>
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  {/* Rating bar */}
                  <div style={{
                    width: 80,
                    height: 4,
                    background: color,
                    borderRadius: 2
                  }} />
                </div>
              );
            })}
          </div>
        )}

        <style>{`
          @keyframes stackSlideIn {
            from {
              transform: translateX(100px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          @keyframes stackFlyOut {
            0% {
              transform: translateX(0);
              opacity: 1;
            }
            100% {
              transform: translateX(200px) rotate(10deg);
              opacity: 0;
            }
          }
        `}</style>
      </div>

      {/* Mascot */}
      <Mascot mood={mascotMood} quote={mascotQuote} visible={mascotVisible} />

      {/* Footer */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 24px', borderTop: '1px solid #222', background: '#000', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#333' }}>G = good, B = bad, S = skip</span>
        {(reviewed.length > 0 || viewingHistory) && (
          <button
            onClick={() => {
              if (viewingHistory) {
                setViewingHistory(false);
              } else {
                setViewingHistory(true);
                setHistoryIndex(0);
              }
            }}
            style={{
              background: viewingHistory ? '#333' : 'transparent',
              color: viewingHistory ? '#fff' : '#666',
              border: '1px solid #333',
              padding: '6px 12px',
              borderRadius: 4,
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            {viewingHistory ? 'Back to review' : `Reviewed (${reviewed.length})`}
          </button>
        )}
      </div>

      {/* Prompt Preview Modal */}
      {showPromptPreview && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20
          }}
          onClick={() => setShowPromptPreview(false)}
        >
          <div
            style={{
              background: '#111',
              borderRadius: 12,
              padding: 24,
              maxWidth: 800,
              maxHeight: '80vh',
              overflow: 'auto',
              position: 'relative',
              width: '100%'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>Training Prompt Preview</h3>
              <button
                onClick={() => setShowPromptPreview(false)}
                style={{ background: 'none', border: 'none', color: '#666', fontSize: 20, cursor: 'pointer' }}
              >
                x
              </button>
            </div>
            <pre style={{
              background: '#0a0a0a',
              padding: 16,
              borderRadius: 8,
              fontSize: 12,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              color: '#ccc',
              margin: 0,
              fontFamily: 'monospace'
            }}>
              {promptText || 'Loading...'}
            </pre>
            <div style={{ marginTop: 16, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowPromptPreview(false)}
                style={{ background: '#333', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer' }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(promptText);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                style={{ background: '#fff', color: '#000', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
