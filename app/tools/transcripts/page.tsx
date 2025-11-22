"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type SessionItem = { id: string; title?: string; transcript?: string; startedAt?: string; ownerEmail?: string; keywords?: string[] };

export default function TranscriptsPage() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/sessions?page=1&pageSize=1000');
        const data = await res.json();
        if (!mounted) return;
        const items = Array.isArray(data.sessions) ? data.sessions : [];
        const withTranscripts = items.filter((s: any) => s && s.transcript && String(s.transcript).trim());
        setSessions(withTranscripts as SessionItem[]);
      } catch (e: any) {
        setError(e && e.message ? e.message : String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    const qq = String(q || '').toLowerCase().trim();
    if (!qq) return sessions;
    return sessions.filter(s => (s.title && s.title.toLowerCase().includes(qq)) || (s.transcript && s.transcript.toLowerCase().includes(qq)) || (Array.isArray((s as any).keywords) && (s as any).keywords.join(' ').toLowerCase().includes(qq)));
  }, [sessions, q]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const stats = useMemo(() => {
    const lengths = sessions.map(s => s.transcript ? String(s.transcript).length : 0).filter(n => n > 0);
    const avg = lengths.length ? Math.round(lengths.reduce((a,b)=>a+b,0)/lengths.length) : 0;
    const longest = lengths.length ? Math.max(...lengths) : 0;
    const shortest = lengths.length ? Math.min(...lengths) : 0;
    return { avg, longest, shortest };
  }, [sessions]);

  return (
    <div style={{ 
      padding: '40px 20px', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e9f7ef 0%, #f0fff5 50%, #fff 100%)' 
    }} className="animate-fadeIn">
      <div className="max-w-7xl mx-auto">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 32,
          padding: '20px 24px',
          background: 'white',
          borderRadius: 16,
          border: '6px solid var(--nb-border)',
          boxShadow: '8px 8px 0 rgba(11,61,43,0.9)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 40 }}>📝</span>
            <div>
              <div className="transcript-title heading-live" style={{ margin: 0 }}>TRANSCRIPTS</div>
              <div style={{ fontSize: 14, color: 'rgba(11,47,33,0.6)', marginTop: 4 }}>
                {sessions.length} transcripts available
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input 
              value={q} 
              onChange={(e)=>{ setQ(e.target.value); setPage(1); }} 
              placeholder="Search transcripts or keywords" 
              style={{ 
                padding: '10px 16px', 
                borderRadius: 12, 
                border: '4px solid rgba(79,176,122,0.3)',
                background: 'white',
                fontWeight: 600,
                minWidth: 280
              }} 
            />
          </div>
        </div>

        {loading ? (
          <div className="neubrutal-card" style={{ padding: 40, textAlign: 'center' }}>
            <div className="loading-spinner" style={{ width: 40, height: 40, border: '4px solid rgba(79,176,122,0.2)', borderTop: '4px solid var(--nb-accent)', borderRadius: '50%', margin: '0 auto 16px' }} />
            <div className="text-sm muted">Loading transcripts…</div>
          </div>
        ) : null}
        
        {error ? (
          <div className="neubrutal-card" style={{ padding: 24, background: 'rgba(255,0,0,0.05)', border: '6px solid rgba(200,50,50,0.6)' }}>
            <div className="text-sm" style={{ color: '#c92a2a' }}>⚠️ Error: {error}</div>
          </div>
        ) : null}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, marginTop: 24 }}>
          <div className="animate-slideRight">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.3rem' }}>Transcripts ({sessions.length})</h3>
              <div className="muted" style={{ fontWeight: 700 }}>Showing {filtered.length} matches</div>
            </div>

          <div style={{ marginTop: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 10, borderBottom: '2px solid rgba(11,61,43,0.06)' }}>Title</th>
                  <th style={{ textAlign: 'right', padding: 10, borderBottom: '2px solid rgba(11,61,43,0.06)' }}>Length</th>
                  <th style={{ textAlign: 'left', padding: 10, borderBottom: '2px solid rgba(11,61,43,0.06)' }}>Keywords</th>
                  <th style={{ textAlign: 'right', padding: 10, borderBottom: '2px solid rgba(11,61,43,0.06)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map(s => (
                  <tr key={s.id} style={{ background: '#fff' }}>
                    <td style={{ padding: 10, verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 800 }}>{sanitizeTitle(s.title) || (s.transcript ? String(s.transcript).slice(0,60) : 'Untitled')}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{s.ownerEmail || 'unknown'} · {s.startedAt ? new Date(s.startedAt).toLocaleString() : ''}</div>
                    </td>
                    <td style={{ padding: 10, textAlign: 'right', verticalAlign: 'top' }}>{s.transcript ? String(s.transcript).length : 0}</td>
                    <td style={{ padding: 10, verticalAlign: 'top' }}>
                      {((s.keywords && s.keywords.length) ? s.keywords : []).slice(0,5).map(k => <span key={k} className="status-pill" style={{ marginRight: 6 }}>{k}</span>)}
                    </td>
                    <td style={{ padding: 10, verticalAlign: 'top', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                        <Link href={`/sessions/${s.id}`} className="neubrutal-btn btn-ghost">Open</Link>
                        <a className="neubrutal-btn" href={(s as any).downloadUrl || '#'} target="_blank" rel="noreferrer" download>Download</a>
                        <button
                          title="Delete"
                          aria-label="Delete"
                          className="neubrutal-btn"
                          style={{
                            background: '#7a0b0b',
                            color: '#fff',
                            padding: '6px 8px',
                            fontSize: 14,
                            borderRadius: 8,
                            border: '1px solid rgba(0,0,0,0.35)',
                            boxShadow: '0 2px 0 rgba(0,0,0,0.6)',
                            height: 34,
                            minWidth: 40,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onClick={async () => {
                            try {
                              const ok = confirm('🗑️ Delete this transcript and recording? This is permanent.');
                              if (!ok) return;
                              const res = await fetch(`/api/sessions/${encodeURIComponent(s.id)}`, { method: 'DELETE' });
                              if (!res.ok) {
                                const body = await res.json().catch(() => null);
                                alert('Delete failed: ' + (body && body.error ? body.error : res.status));
                                return;
                              }
                              // remove from UI
                              setSessions(prev => prev.filter(p => p.id !== s.id));
                            } catch (e) {
                              console.error('Delete failed', e);
                              alert('Delete failed');
                            }
                          }}
                        >
                          <span style={{ filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.6))', color: '#fff' }}>🗑️</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
              <button className="neubrutal-btn btn-ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Prev</button>
              <div className="muted">Page {page} / {pageCount}</div>
              <button className="neubrutal-btn btn-ghost" onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page >= pageCount}>Next</button>
            </div>
          </div>
        </div>

        <aside className="neubrutal-card" style={{ padding: 18 }}>
          <h4 style={{ marginTop: 0 }}>Transcript Insights</h4>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 900 }}>{stats.avg}</div>
            <div className="muted">Average transcript length (chars)</div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 700 }}>Range</div>
            <div className="muted">Shortest: {stats.shortest} · Longest: {stats.longest}</div>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 700 }}>Common keywords</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(() => {
                const counts: Record<string, number> = {};
                for (const s of sessions) {
                  const ks = (s as any).keywords || [];
                  for (const k of ks) counts[k] = (counts[k] || 0) + 1;
                }
                const keys = Object.keys(counts).sort((a,b) => counts[b] - counts[a]).slice(0,12);
                return keys.length === 0 ? <div className="muted">(no keywords yet)</div> : keys.map(k => <button key={k} className="status-pill" onClick={() => { setQ(k); setPage(1); }}>{k}</button>);
              })()}
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
  );
}

function sanitizeTitle(title?: string | null) {
  if (!title) return '';
  const lines = String(title).split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return '';
  let t = lines[0];
  t = t.replace(/^[\-\*•\s]+/, '');
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}
