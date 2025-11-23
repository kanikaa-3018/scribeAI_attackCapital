"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { SparkleIcon, WarningIcon, CheckIcon, HourglassIcon, TagIcon } from '../../components/Icons';

type SessionItem = { id: string; title?: string; summary?: string; transcript?: string; startedAt?: string; ownerEmail?: string; keywords?: string[] };

function clientExtractKeywords(text: string | undefined, maxKeywords = 6) {
  if (!text) return [];
  const stop = new Set(['the','and','is','in','it','of','to','a','for','that','on','with','as','are','this','be','or','an','by','from','at','was','were','which','have','has','but','not']);
  const cleaned = String(text).toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const parts = cleaned.split(/\s+/).filter(Boolean).filter(w => w.length > 2 && !stop.has(w));
  const freq: Record<string, number> = {};
  for (const p of parts) freq[p] = (freq[p] || 0) + 1;
  const keys = Object.keys(freq).sort((a,b) => freq[b] - freq[a]);
  return keys.slice(0, maxKeywords);
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

export default function SummariesPage() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [viewing, setViewing] = useState<SessionItem | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/sessions?page=1&pageSize=1000');
        const data = await res.json();
        if (!mounted) return;
        const items = Array.isArray(data.sessions) ? data.sessions : [];
        setSessions(items as SessionItem[]);
      } catch (e: any) {
        setError(e && e.message ? e.message : String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const totals = useMemo(() => {
    const totalSummaries = sessions.filter(s => s && s.summary && String(s.summary).trim()).length;
    const withKeywords = sessions.filter(s => Array.isArray((s as any).keywords) && (s as any).keywords.length > 0).length;
    const pending = sessions.filter(s => (!s.summary || !String(s.summary).trim()) && (s.transcript && String(s.transcript).trim())).length;
    const errors = sessions.filter(s => (s as any).status === 'ERROR').length;
    return { totalSummaries, withKeywords, pending, errors };
  }, [sessions]);

  const summaries = useMemo(() => sessions.filter(s => s && s.summary && String(s.summary).trim()), [sessions]);
  const pageCount = Math.max(1, Math.ceil(summaries.length / pageSize));
  const pageItems = summaries.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div style={{ 
      padding: '40px 20px', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e9f7ef 0%, #f0fff5 50%, #fff 100%)' 
    }} className="animate-fadeIn">
      <div className="max-w-7xl mx-auto">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          marginBottom: 32,
          padding: '24px',
          background: 'white',
          borderRadius: 16,
          border: '6px solid var(--nb-border)',
          boxShadow: '8px 8px 0 rgba(11,61,43,0.9)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ color: 'var(--nb-accent)' }}><SparkleIcon size={56} /></div>
            <div className="transcript-title heading-live" style={{ margin: 0, fontSize: '2rem' }}>SUMMARIES</div>
          </div>
        </div>

        {loading ? (
          <div className="neubrutal-card" style={{ padding: 40, textAlign: 'center' }}>
            <div className="loading-spinner" style={{ width: 40, height: 40, border: '4px solid rgba(79,176,122,0.2)', borderTop: '4px solid var(--nb-accent)', borderRadius: '50%', margin: '0 auto 16px' }} />
            <div className="text-sm muted">Loading summaries…</div>
          </div>
        ) : null}
        
        {error ? (
          <div className="neubrutal-card" style={{ padding: 24, background: 'rgba(255,0,0,0.05)', border: '6px solid rgba(200,50,50,0.6)' }}>
            <div className="text-sm" style={{ color: '#c92a2a' }}><WarningIcon size={16} color="#c92a2a" /> Error: {error}</div>
          </div>
        ) : null}

      <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { label: 'Total Summaries', value: totals.totalSummaries, gradient: 'linear-gradient(180deg,#f0fff5,#e9f7ef)', icon: <CheckIcon size={28} /> },
          { label: 'Pending', value: totals.pending, gradient: 'linear-gradient(180deg,#fff8e6,#fff7ec)', icon: <HourglassIcon size={28} /> },
          { label: 'With Keywords', value: totals.withKeywords, gradient: 'linear-gradient(180deg,#eef7ff,#f3fbff)', icon: <TagIcon size={28} /> },
          { label: 'Errors', value: totals.errors, gradient: 'linear-gradient(180deg,#fff5f5,#fff0f0)', icon: <WarningIcon size={28} color="#d04444" /> },
        ].map((stat, idx) => (
          <div 
            key={stat.label} 
            className="neubrutal-card feature-card" 
            style={{ 
              padding: 20, 
              minWidth: 180, 
              textAlign: 'center',
              background: stat.gradient,
              flex: '1 1 auto'
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>{stat.icon}</div>
            <div style={{ fontSize: 12, color: 'rgba(11,61,43,0.7)', fontWeight: 800, marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontSize: 32, fontWeight: 900 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 18, marginTop: 18 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Recent Summaries</h3>
            <div className="muted">Showing {summaries.length} summaries</div>
          </div>

          {summaries.length === 0 ? (
            <div className="muted" style={{ marginTop: 12 }}>No summaries yet — record and wait for processing.</div>
          ) : (
            <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
              {pageItems.map((s) => (
                <div key={s.id} className="neubrutal-card" style={{ padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 900 }}>{sanitizeTitle(s.title) || (String(s.summary).split('\n')[0].slice(0, 80))}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{s.ownerEmail || 'unknown'} · {s.startedAt ? new Date(s.startedAt).toLocaleString() : ''}</div>
                      <div style={{ marginTop: 8, color: 'rgba(11,61,43,0.8)' }}>{String(s.summary).slice(0, 280)}{String(s.summary).length > 280 ? '…' : ''}</div>
                      <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {( (s.keywords && s.keywords.length) ? s.keywords : clientExtractKeywords(s.summary) ).map((k: string) => <span key={k} className="status-pill" style={{ background: 'rgba(11,61,43,0.04)', border: '2px solid rgba(11,61,43,0.06)', fontWeight:700 }}>{k}</span>)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <button className="neubrutal-btn btn-ghost" onClick={() => setViewing(s)}>View Summary</button>
                      <Link href={`/sessions/${s.id}`} className="neubrutal-btn">View Transcript</Link>
                    </div>
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8 }}>
                <button className="neubrutal-btn btn-ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Prev</button>
                <div className="muted">Page {page} / {pageCount}</div>
                <button className="neubrutal-btn btn-ghost" onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page >= pageCount}>Next</button>
              </div>
            </div>
          )}
        </div>

        <aside className="neubrutal-card" style={{ padding: 18 }}>
          <h4 style={{ marginTop: 0 }}>Insights</h4>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>{totals.totalSummaries}</div>
            <div className="muted">Total summaries</div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 700 }}>Top keywords</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {/* show top 12 keywords across summaries */}
              {(() => {
                const counts: Record<string, number> = {};
                for (const s of sessions) {
                  const ks = (s as any).keywords || [];
                  for (const k of ks) counts[k] = (counts[k] || 0) + 1;
                }
                const keys = Object.keys(counts).sort((a,b) => counts[b] - counts[a]).slice(0,12);
                return keys.length === 0 ? <div className="muted">(no keywords yet)</div> : keys.map(k => <span key={k} className="status-pill" style={{ background: 'rgba(79,176,122,0.08)', border: '2px solid rgba(79,176,122,0.12)', fontWeight:800 }}>{k}</span>);
              })()}
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 700 }}>Tips</div>
            <ul style={{ marginTop: 8 }}>
              <li>Keywords are extracted server-side for quick filtering.</li>
              <li>Click "View Summary" to read the full summary and copy it.</li>
            </ul>
          </div>
        </aside>
      </div>

      {viewing ? (
        <div className="nb-modal-backdrop" onClick={() => setViewing(null)}>
          <div className="nb-modal neubrutal-card" onClick={(e)=> e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 900 }}>{viewing.title || 'Summary'}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="neubrutal-btn" onClick={() => setViewing(null)}>Close</button>
              </div>
            </div>
            <pre style={{ whiteSpace: 'pre-wrap', marginTop: 12 }}>{String(viewing.summary || '(no summary)')}</pre>
          </div>
        </div>
      ) : null}
    </div>
    </div>
  );
}
