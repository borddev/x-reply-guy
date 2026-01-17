'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function F4FPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/x-reply-guy/api/follow4follow').then(r => r.json()).then(setData);
  }, []);

  if (!data) return <div style={{ background: '#000', minHeight: '100vh', padding: 40, color: '#666' }}>Loading...</div>;

  const stats = data.stats || {};
  const sources = (data.sources || []).filter((s: any) => s.name !== '_config');

  return (
    <div style={{ background: '#000', color: '#fff', minHeight: '100vh', padding: '30px 40px', fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>F4F</h1>
        <Link href="/x-reply-guy" style={{ color: '#666', fontSize: 12, textDecoration: 'underline' }}>back</Link>
      </div>

      {/* Stats table */}
      <table style={{ width: '100%', maxWidth: 400, borderCollapse: 'collapse', fontSize: 13, marginBottom: 40 }}>
        <tbody>
          <tr style={{ borderBottom: '1px solid #222' }}>
            <td style={{ padding: '8px 0', color: '#666' }}>Following</td>
            <td style={{ padding: '8px 0', textAlign: 'right' }}>{stats.totalFollowing || 0}</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #222' }}>
            <td style={{ padding: '8px 0', color: '#666' }}>Follow backs</td>
            <td style={{ padding: '8px 0', textAlign: 'right' }}>{stats.totalFollowBacks || 0}</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #222' }}>
            <td style={{ padding: '8px 0', color: '#666' }}>Rate</td>
            <td style={{ padding: '8px 0', textAlign: 'right' }}>{stats.followBackRate || 0}%</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #222' }}>
            <td style={{ padding: '8px 0', color: '#666' }}>Pending</td>
            <td style={{ padding: '8px 0', textAlign: 'right' }}>{stats.pendingFollowBacks || 0}</td>
          </tr>
        </tbody>
      </table>

      {/* Sources table */}
      <div style={{ marginBottom: 12, fontSize: 12, color: '#666' }}>Sources</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <th style={{ padding: '8px 0', color: '#666', textAlign: 'left', fontWeight: 400 }}>Source</th>
            <th style={{ padding: '8px 0', color: '#666', textAlign: 'right', fontWeight: 400 }}>Followers</th>
            <th style={{ padding: '8px 0', color: '#666', textAlign: 'right', fontWeight: 400 }}>Sent</th>
            <th style={{ padding: '8px 0', color: '#666', textAlign: 'right', fontWeight: 400 }}>Back</th>
            <th style={{ padding: '8px 0', color: '#666', textAlign: 'right', fontWeight: 400 }}>Rate</th>
            <th style={{ padding: '8px 0', color: '#666', textAlign: 'right', fontWeight: 400 }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {sources.map((s: any) => {
            const rate = s.followsSent > 0 ? Math.round(s.successRate * 100) : null;
            return (
              <tr key={s.name} style={{ borderBottom: '1px solid #181818' }}>
                <td style={{ padding: '8px 0', color: s.active === false ? '#444' : '#ccc' }}>
                  @{s.name}
                  {s.priority && <span style={{ marginLeft: 6, color: '#555', fontSize: 10 }}>#{s.priority}</span>}
                </td>
                <td style={{ padding: '8px 0', textAlign: 'right', color: '#666' }}>
                  {s.profile?.followers ? (s.profile.followers >= 1000 ? Math.round(s.profile.followers / 1000) + 'K' : s.profile.followers) : '-'}
                </td>
                <td style={{ padding: '8px 0', textAlign: 'right' }}>{s.followsSent || 0}</td>
                <td style={{ padding: '8px 0', textAlign: 'right' }}>{s.followBacks || 0}</td>
                <td style={{ padding: '8px 0', textAlign: 'right' }}>{rate !== null ? rate + '%' : '-'}</td>
                <td style={{ padding: '8px 0', textAlign: 'right', color: '#666' }}>
                  {s.active === false ? 'off' : 'on'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Recent follow backs */}
      {data.recentFollowBacks && data.recentFollowBacks.length > 0 && (
        <>
          <div style={{ marginTop: 40, marginBottom: 12, fontSize: 12, color: '#666' }}>Recent follow backs</div>
          <table style={{ width: '100%', maxWidth: 500, borderCollapse: 'collapse', fontSize: 12 }}>
            <tbody>
              {data.recentFollowBacks.slice(0, 10).map((f: any, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid #181818' }}>
                  <td style={{ padding: '6px 0' }}>@{f.username}</td>
                  <td style={{ padding: '6px 0', color: '#666' }}>from @{f.source}</td>
                  <td style={{ padding: '6px 0', textAlign: 'right', color: '#666' }}>
                    {f.daysToFollowback !== null ? f.daysToFollowback + 'd' : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Note about tracking */}
      <div style={{ marginTop: 40, padding: 16, background: '#111', fontSize: 11, color: '#666', lineHeight: 1.5 }}>
        <strong style={{ color: '#888' }}>Note:</strong> Users in the DB were imported from sync.
        New follows will save the source automatically.
        Sync every 6 hours checks for follow backs.
      </div>
    </div>
  );
}
