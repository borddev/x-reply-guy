'use client';

import { useState, useEffect, useMemo } from 'react';
import { agentConfig } from './agent-config';

interface Reply {
  id: string;
  reply_text: string;
  tweet_url: string;
  tweet_text: string;
  strategy: string;
  source: string;
  impressions: number;
  likes: number;
  engagements: number;
  posted_at: string;
  original_views: number;
  original_posted_at: string;
  response_time_mins: number;
}

interface Script {
  id: string;
  name: string;
  description: string;
  script: string;
  path: string;
}

type SortField = 'impressions' | 'vpm' | 'strategy' | 'posted' | 'likes' | 'engagements' | 'original_views' | 'response_time';
type SortDir = 'asc' | 'desc';

export default function XReplyGuyPage() {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('posted');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Script | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [hoveredReply, setHoveredReply] = useState<Reply | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [showUpdateDropdown, setShowUpdateDropdown] = useState(false);
  const [downloadFiles, setDownloadFiles] = useState<Array<{ name: string; modified: string }>>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  // Date helpers
  function getToday() {
    return new Date().toISOString().split('T')[0];
  }
  function getYesterday() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }
  function getDaysAgo(days: number) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  }

  useEffect(() => {
    loadReplies();
  }, []);

  async function loadReplies() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/x-reply-guy/api/replies');
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setReplies(data.replies || []);
        setLastSync(data.lastSync || null);
      }
    } catch (e) {
      setError('Failed to load');
    }

    setLoading(false);
  }

  async function syncData() {
    setSyncing(true);
    setShowUpdateDropdown(false);
    try {
      const res = await fetch('/x-reply-guy/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: 'auto-sync-views.js' })
      });
      const data = await res.json();
      if (data.success) {
        await loadReplies();
        setImportResult('Sync complete!');
      } else {
        setError(data.error || 'Sync failed');
      }
    } catch (e) {
      setError('Sync failed');
    }
    setSyncing(false);
  }

  async function loadDownloadFiles() {
    try {
      const res = await fetch('/x-reply-guy/api/downloads');
      const data = await res.json();
      setDownloadFiles(data.files || []);
    } catch {
      setDownloadFiles([]);
    }
  }

  async function importFile(filename: string) {
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch('/x-reply-guy/api/import-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });
      const data = await res.json();
      if (data.success) {
        setImportResult(`Imported ${data.imported} replies`);
        await loadReplies();
        setTimeout(() => {
          setShowUpdateDropdown(false);
          setImportResult(null);
        }, 1500);
      } else {
        setError(data.error || 'Import failed');
      }
    } catch {
      setError('Import failed');
    }
    setImporting(false);
  }

  function toggleUpdateDropdown() {
    if (!showUpdateDropdown) {
      loadDownloadFiles();
    }
    setShowUpdateDropdown(!showUpdateDropdown);
    setImportResult(null);
  }

  function formatLastSync(dateStr: string | null): string {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function calcVPM(r: Reply): number {
    if (!r.impressions || !r.posted_at) return 0;
    const postedAt = new Date(r.posted_at);
    const now = new Date();
    const minsAgo = Math.max(1, Math.round((now.getTime() - postedAt.getTime()) / 60000));
    const cappedMins = Math.min(minsAgo, 600);
    return r.impressions / cappedMins;
  }

  function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function formatResponseTime(mins: number | null): string {
    if (!mins) return '-';
    if (mins < 60) return `${mins}m`;
    if (mins < 1440) return `${Math.round(mins / 60)}h`;
    return `${Math.round(mins / 1440)}d`;
  }

  function formatViews(views: number | null): string {
    if (!views) return '-';
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  }

  const sortedReplies = useMemo(() => {
    let filtered = replies;

    if (filter !== 'all') {
      filtered = filtered.filter(r => r.strategy === filter);
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(r => r.posted_at && new Date(r.posted_at) >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(r => r.posted_at && new Date(r.posted_at) <= toDate);
    }

    const withVPM = filtered.map(r => ({
      ...r,
      vpm: calcVPM(r)
    }));

    return withVPM.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'impressions') cmp = (a.impressions || 0) - (b.impressions || 0);
      else if (sortField === 'vpm') cmp = a.vpm - b.vpm;
      else if (sortField === 'likes') cmp = (a.likes || 0) - (b.likes || 0);
      else if (sortField === 'engagements') cmp = (a.engagements || 0) - (b.engagements || 0);
      else if (sortField === 'strategy') cmp = (a.strategy || '').localeCompare(b.strategy || '');
      else if (sortField === 'posted') cmp = new Date(a.posted_at).getTime() - new Date(b.posted_at).getTime();
      else if (sortField === 'original_views') cmp = (a.original_views || 0) - (b.original_views || 0);
      else if (sortField === 'response_time') cmp = (a.response_time_mins || 9999) - (b.response_time_mins || 9999);
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [replies, filter, dateFrom, dateTo, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }

  const totalImpressions = sortedReplies.reduce((s, r) => s + (r.impressions || 0), 0);
  const avgVPM = sortedReplies.length
    ? (sortedReplies.reduce((s, r) => s + r.vpm, 0) / sortedReplies.length).toFixed(2)
    : '0';

  const strategies = ['all', '@grok Question', '@grok Photo', 'No Grok'];

  const SortIcon = ({ field }: { field: SortField }) => (
    <span style={{ marginLeft: 4, opacity: sortField === field ? 1 : 0.3, fontSize: 10 }}>
      {sortField === field ? (sortDir === 'desc' ? '\u25BC' : '\u25B2') : '\u25BC'}
    </span>
  );

  const headerStyle: React.CSSProperties = {
    padding: '8px 6px',
    color: '#888',
    cursor: 'pointer',
    userSelect: 'none',
    fontSize: 11,
    fontWeight: 500
  };

  return (
    <div style={{ background: '#000', color: '#fff', minHeight: '100vh', padding: '30px 40px 100px', fontFamily: 'system-ui', position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #1d9bf0 0%, #0d8bd9 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 500, color: '#fff' }}>Reply Guy</h1>
          </a>
          <a
            href="https://github.com/Cronin/x-reply-guy"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: '#666',
              fontSize: 11,
              textDecoration: 'none',
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid #333',
              background: '#111'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            Repo
          </a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#555', fontSize: 11 }}>
            Updated {formatLastSync(lastSync)}
          </span>
          <a
            href="/x-reply-guy/f4f"
            style={{
              color: '#fff',
              fontSize: 11,
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: 20,
              background: '#222',
              border: '1px solid #333',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            F4F
          </a>
          <a
            href="/x-reply-guy/school"
            style={{
              color: '#fff',
              fontSize: 11,
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: 20,
              background: '#222',
              border: '1px solid #333',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
            </svg>
            School
          </a>
          <div style={{ position: 'relative' }}>
            <button
              onClick={toggleUpdateDropdown}
              disabled={syncing || importing}
              style={{
                background: '#1d9bf0',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 500,
                cursor: syncing || importing ? 'wait' : 'pointer',
                opacity: syncing || importing ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {syncing ? 'Syncing...' : importing ? 'Importing...' : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
                    <path d="M21 3v5h-5"/>
                  </svg>
                  Update
                </>
              )}
            </button>

            {/* Dropdown */}
            {showUpdateDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 8,
                background: '#111',
                border: '1px solid #333',
                borderRadius: 12,
                padding: 12,
                minWidth: 280,
                zIndex: 100,
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
              }}>
                {importResult ? (
                  <div style={{ color: '#22c55e', fontSize: 13, padding: '8px 0', textAlign: 'center' }}>
                    {importResult}
                  </div>
                ) : (
                  <>
                    {/* Manual - Open X Analytics */}
                    <a
                      href="https://x.com/i/account_analytics/content?type=replies&sort=impressions&dir=desc"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        color: '#fff',
                        textDecoration: 'none',
                        borderRadius: 8,
                        marginBottom: 8,
                        background: '#222'
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>Open X Analytics</div>
                        <div style={{ fontSize: 10, color: '#666' }}>Download CSV manually</div>
                      </div>
                    </a>

                    {/* Divider */}
                    <div style={{ borderTop: '1px solid #333', margin: '8px 0' }} />

                    {/* Files from Downloads */}
                    <div style={{ fontSize: 10, color: '#666', marginBottom: 8, paddingLeft: 4 }}>
                      Recent files in Downloads:
                    </div>
                    {downloadFiles.length === 0 ? (
                      <div style={{ color: '#555', fontSize: 12, padding: '8px 4px' }}>
                        No CSV files found
                      </div>
                    ) : (
                      downloadFiles.map(f => (
                        <button
                          key={f.name}
                          onClick={() => importFile(f.name)}
                          disabled={importing}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            width: '100%',
                            padding: '8px 12px',
                            background: 'transparent',
                            border: '1px solid #333',
                            borderRadius: 6,
                            color: '#fff',
                            cursor: 'pointer',
                            marginBottom: 6,
                            textAlign: 'left'
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                          </svg>
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {f.name.replace('account_analytics_content_', '')}
                            </div>
                            <div style={{ fontSize: 9, color: '#555' }}>
                              {new Date(f.modified).toLocaleDateString()}
                            </div>
                          </div>
                        </button>
                      ))
                    )}

                    {/* Divider */}
                    <div style={{ borderTop: '1px solid #333', margin: '8px 0' }} />

                    {/* Auto Sync */}
                    <button
                      onClick={syncData}
                      disabled={syncing}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        width: '100%',
                        padding: '10px 12px',
                        background: 'transparent',
                        border: '1px solid #333',
                        borderRadius: 8,
                        color: '#888',
                        cursor: 'pointer'
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
                        <path d="M21 3v5h-5"/>
                      </svg>
                      <div>
                        <div style={{ fontSize: 13 }}>Auto Sync</div>
                        <div style={{ fontSize: 10, color: '#555' }}>Requires AdsPower</div>
                      </div>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 40, marginBottom: 30 }}>
        <div>
          <div style={{ color: '#888', fontSize: 11 }}>IMPRESSIONS</div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>{totalImpressions.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ color: '#888', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, position: 'relative' }}>
            AVG V/MIN
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  border: '1px solid #555',
                  fontSize: 9,
                  color: '#666',
                  cursor: 'help'
                }}
                onMouseEnter={(e) => {
                  const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                  if (tooltip) tooltip.style.display = 'block';
                }}
                onMouseLeave={(e) => {
                  const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                  if (tooltip) tooltip.style.display = 'none';
                }}
              >
                ?
              </span>
              <div style={{
                display: 'none',
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginTop: 8,
                background: '#222',
                color: '#ccc',
                padding: '8px 12px',
                borderRadius: 6,
                fontSize: 11,
                lineHeight: 1.4,
                width: 220,
                zIndex: 100,
                border: '1px solid #333'
              }}>
                Views per Minute - Impressions divided by minutes since posted (capped at 10h). Higher = faster viral spread. Compares replies of different ages fairly.
              </div>
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>{avgVPM}</div>
        </div>
        <div>
          <div style={{ color: '#888', fontSize: 11 }}>REPLIES</div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>{sortedReplies.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            background: '#111',
            color: '#fff',
            border: '1px solid #333',
            padding: '8px 12px',
            borderRadius: 4,
            fontSize: 12,
            cursor: 'pointer',
            minWidth: 150
          }}
        >
          {strategies.map(s => (
            <option key={s} value={s}>{s === 'all' ? 'All Strategies' : s}</option>
          ))}
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[
            { label: 'All', days: 0 },
            { label: 'Today', days: 1 },
            { label: 'Yesterday', days: -1 },
            { label: '7d', days: 7 },
            { label: '1m', days: 30 },
            { label: '3m', days: 90 },
          ].map(({ label, days }) => {
            const isActive = days === 0
              ? !dateFrom && !dateTo
              : days === -1
                ? dateFrom === getYesterday() && dateTo === getYesterday()
                : days === 1
                  ? dateFrom === getToday() && !dateTo
                  : dateFrom === getDaysAgo(days) && !dateTo;
            return (
              <button
                key={label}
                onClick={() => {
                  if (days === 0) {
                    setDateFrom('');
                    setDateTo('');
                  } else if (days === -1) {
                    setDateFrom(getYesterday());
                    setDateTo(getYesterday());
                  } else if (days === 1) {
                    setDateFrom(getToday());
                    setDateTo('');
                  } else {
                    setDateFrom(getDaysAgo(days));
                    setDateTo('');
                  }
                }}
                style={{
                  background: isActive ? '#1d9bf0' : 'transparent',
                  color: isActive ? '#fff' : '#888',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                {label}
              </button>
            );
          })}
          <div style={{ position: 'relative', marginLeft: 4 }}>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              style={{
                background: (dateFrom || dateTo) && ![0, 1, 7, 30, 90].some(d =>
                  d === 0 ? !dateFrom && !dateTo :
                  d === 1 ? dateFrom === getToday() && !dateTo :
                  dateFrom === getDaysAgo(d) && !dateTo
                ) && !(dateFrom === getYesterday() && dateTo === getYesterday())
                  ? '#1d9bf0' : 'transparent',
                color: '#888',
                border: 'none',
                padding: '6px 10px',
                borderRadius: 20,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Custom date range"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </button>
            {showDatePicker && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 8,
                background: '#111',
                border: '1px solid #333',
                borderRadius: 8,
                padding: 12,
                zIndex: 100,
                minWidth: 200
              }}>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ color: '#666', fontSize: 10, display: 'block', marginBottom: 4 }}>From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    style={{
                      background: '#000',
                      color: '#fff',
                      border: '1px solid #333',
                      padding: '6px 10px',
                      borderRadius: 4,
                      fontSize: 12,
                      width: '100%'
                    }}
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ color: '#666', fontSize: 10, display: 'block', marginBottom: 4 }}>To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    style={{
                      background: '#000',
                      color: '#fff',
                      border: '1px solid #333',
                      padding: '6px 10px',
                      borderRadius: 4,
                      fontSize: 12,
                      width: '100%'
                    }}
                  />
                </div>
                <button
                  onClick={() => setShowDatePicker(false)}
                  style={{
                    background: '#1d9bf0',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: 4,
                    fontSize: 11,
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ color: '#f00', marginBottom: 20 }}>{error}</div>
      )}

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333' }}>
              <th style={{ ...headerStyle, textAlign: 'right' }} onClick={() => toggleSort('impressions')}>
                Impr<SortIcon field="impressions" />
              </th>
              <th style={{ ...headerStyle, textAlign: 'right' }} onClick={() => toggleSort('vpm')}>
                V/min<SortIcon field="vpm" />
              </th>
              <th style={{ ...headerStyle, textAlign: 'right' }} onClick={() => toggleSort('original_views')} title="Views of original post when replied">
                Orig<SortIcon field="original_views" />
              </th>
              <th style={{ ...headerStyle, textAlign: 'right' }} onClick={() => toggleSort('response_time')} title="How fast we replied">
                Resp<SortIcon field="response_time" />
              </th>
              <th style={{ ...headerStyle, textAlign: 'right' }} onClick={() => toggleSort('likes')}>
                Likes<SortIcon field="likes" />
              </th>
              <th style={{ ...headerStyle, textAlign: 'left' }} onClick={() => toggleSort('strategy')}>
                Strategy<SortIcon field="strategy" />
              </th>
              <th style={{ ...headerStyle, textAlign: 'left' }} onClick={() => toggleSort('posted')}>
                Posted<SortIcon field="posted" />
              </th>
              <th style={{ ...headerStyle, textAlign: 'left' }}>Reply</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: 20, color: '#888' }}>Loading...</td></tr>
            ) : sortedReplies.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 20, color: '#888' }}>No replies yet</td></tr>
            ) : (
              sortedReplies.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ textAlign: 'right', padding: 10 }}>{(r.impressions || 0).toLocaleString()}</td>
                  <td style={{ textAlign: 'right', padding: 10, color: '#888' }}>{r.vpm.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: 10, color: r.original_views ? '#888' : '#444' }}>
                    {formatViews(r.original_views)}
                  </td>
                  <td style={{ textAlign: 'right', padding: 10, color: r.response_time_mins ? '#888' : '#444' }}>
                    {formatResponseTime(r.response_time_mins)}
                  </td>
                  <td style={{ textAlign: 'right', padding: 10, color: '#666' }}>{r.likes || 0}</td>
                  <td style={{ padding: 10, fontSize: 10, color: '#888' }}>
                    {r.strategy || 'manual'}
                  </td>
                  <td style={{ padding: 10, color: '#666', fontSize: 11, whiteSpace: 'nowrap' }}>
                    {r.posted_at ? formatTimeAgo(new Date(r.posted_at)) : '-'}
                  </td>
                  <td style={{ padding: 10, position: 'relative' }}>
                    <span
                      style={{
                        color: hoveredReply?.id === r.id ? '#1d9bf0' : '#fff',
                        cursor: 'pointer',
                        transition: 'color 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoverPosition({ x: rect.left, y: rect.bottom + 8 });
                        setHoveredReply(r);
                      }}
                      onMouseLeave={() => setHoveredReply(null)}
                      onClick={() => r.tweet_url && window.open(r.tweet_url, '_blank')}
                    >
                      {r.reply_text}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Tweet Preview Popup */}
      {hoveredReply && (
        <div
          style={{
            position: 'fixed',
            left: Math.min(hoverPosition.x, window.innerWidth - 420),
            top: hoverPosition.y,
            width: 400,
            background: '#000',
            border: '1px solid #333',
            borderRadius: 16,
            padding: 16,
            zIndex: 1000,
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
            pointerEvents: 'none'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: '#333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="#888">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Your Reply</div>
              <div style={{ color: '#666', fontSize: 12 }}>@YourUsername</div>
            </div>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="#fff" style={{ marginLeft: 'auto' }}>
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </div>

          {/* Reply Text */}
          <div style={{ fontSize: 15, lineHeight: 1.5, marginBottom: 12 }}>
            {hoveredReply.reply_text}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 20, color: '#666', fontSize: 13, paddingTop: 12, borderTop: '1px solid #222' }}>
            <span>{hoveredReply.impressions?.toLocaleString() || 0} views</span>
            <span>{hoveredReply.likes || 0} likes</span>
            {hoveredReply.posted_at && (
              <span>{formatTimeAgo(new Date(hoveredReply.posted_at))}</span>
            )}
          </div>

          {/* Original tweet context */}
          {hoveredReply.tweet_text && (
            <div style={{
              marginTop: 12,
              padding: 12,
              background: '#111',
              borderRadius: 12,
              border: '1px solid #222'
            }}>
              <div style={{ color: '#666', fontSize: 11, marginBottom: 6 }}>Replying to:</div>
              <div style={{ fontSize: 13, color: '#888', lineHeight: 1.4 }}>
                {hoveredReply.tweet_text.slice(0, 150)}{hoveredReply.tweet_text.length > 150 ? '...' : ''}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tools Section */}
      <div style={{ marginTop: 40, padding: 20, background: '#111', borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 14, color: '#888' }}>Tools</h3>
          <button
            onClick={loadReplies}
            disabled={loading}
            style={{
              background: '#222',
              color: '#888',
              border: 'none',
              padding: '6px 12px',
              borderRadius: 4,
              fontSize: 11,
              cursor: 'pointer'
            }}
          >
            Refresh
          </button>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {agentConfig.scripts.map((s: Script) => (
            <button
              key={s.id}
              onClick={() => setSelectedTool(selectedTool?.id === s.id ? null : s)}
              style={{
                background: selectedTool?.id === s.id ? '#1d9bf0' : '#222',
                color: '#fff',
                border: 'none',
                padding: '10px 16px',
                borderRadius: 6,
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* Tool Info Card */}
        {selectedTool && (
          <div style={{
            marginTop: 16,
            padding: 16,
            background: '#0a0a0a',
            borderRadius: 8,
            border: '1px solid #222'
          }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>{selectedTool.name}</div>
            <p style={{ margin: '0 0 12px 0', color: '#888', fontSize: 12, lineHeight: 1.5 }}>
              {selectedTool.description}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#555', fontSize: 10 }}>File:</span>
              <span style={{ color: '#1d9bf0', fontSize: 11 }}>
                {selectedTool.path}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Agent Card - Sticky Bottom Right */}
      <div
        onClick={() => setShowAgentModal(true)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: '#111',
          border: '1px solid #333',
          borderRadius: 12,
          padding: '12px 16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          zIndex: 100
        }}
      >
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          background: '#222',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="#fff">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500 }}>{agentConfig.name}</div>
          <div style={{ fontSize: 10, color: '#666', maxWidth: 180 }}>{agentConfig.description}</div>
        </div>
      </div>

      {/* Agent Modal */}
      {showAgentModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowAgentModal(false)}
        >
          <div
            style={{
              background: '#111',
              borderRadius: 12,
              padding: 24,
              maxWidth: 600,
              maxHeight: '80vh',
              overflow: 'auto',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAgentModal(false)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'none',
                border: 'none',
                color: '#666',
                fontSize: 20,
                cursor: 'pointer'
              }}
            >
              x
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                background: '#222',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="#fff">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 18 }}>{agentConfig.name}</h2>
                <p style={{ margin: '4px 0 0 0', color: '#888', fontSize: 12 }}>{agentConfig.description}</p>
              </div>
            </div>

            {/* File Path */}
            <div style={{ marginBottom: 20, padding: 12, background: '#0a0a0a', borderRadius: 6 }}>
              <div style={{ color: '#555', fontSize: 10, marginBottom: 4 }}>Agent File</div>
              <span style={{ color: '#1d9bf0', fontSize: 12 }}>
                {agentConfig.filePath}
              </span>
            </div>

            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 13, color: '#888' }}>System Prompt</h3>
              <pre style={{
                background: '#000',
                padding: 16,
                borderRadius: 8,
                fontSize: 11,
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                color: '#ccc',
                maxHeight: 300,
                overflow: 'auto'
              }}>
                {agentConfig.prompt}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
