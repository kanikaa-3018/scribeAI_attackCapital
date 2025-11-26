"use client";

import React, { useEffect, useState, useRef } from "react";
import { DocumentIcon, MicrophoneIcon, SparkleIcon, TrashIcon, WarningIcon } from './Icons';
import { io } from "socket.io-client";
import Modal from './Modal';
import SearchBar from './SearchBar';

type SessionItem = {
  id: string;
  title?: string;
  transcript?: string;
  summary?: string;
  startedAt?: string;
  status?: string;
  ownerEmail?: string;
};

function highlightText(text: string, query: string) {
  if (!query.trim() || !text) return text;
  
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} style={{ 
            background: '#fff59d', 
            padding: '2px 4px', 
            borderRadius: '3px',
            fontWeight: 700 
          }}>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export default function SessionHistory() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [allSessions, setAllSessions] = useState<SessionItem[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<any>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(4);
  const [total, setTotal] = useState<number | null>(null);
  const [viewing, setViewing] = useState<{ session: SessionItem | null; tab: 'transcript' | 'summary' } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Delete this session? This cannot be undone.')) return;
    
    setDeleting(sessionId);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        setTotal(t => (typeof t === 'number' ? t - 1 : t));
      } else {
        alert('Failed to delete session');
      }
    } catch (e) {
      alert('Error deleting session');
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    // only set up socket once on mount
    const socket = io(typeof window !== 'undefined' ? (window.location.hostname === 'localhost' ? 'http://localhost:4000' : `${window.location.protocol}//${window.location.hostname}:4000`) : 'http://localhost:4000');
    socketRef.current = socket;
    socket.on('connect', () => {
      // connected
    });
    socket.on('sessionSaved', (payload: any) => {
      const s = payload && payload.session ? payload.session : null;
      if (!s) return;
      setSessions((prev) => {
        // if we're on the first page, prepend new sessions so user sees them immediately
        if (page === 1) {
          const exists = prev.find((x) => String(x.id) === String(s.id));
          if (exists) return prev;
          // keep page size limit
          const next = [s, ...prev];
          return next.slice(0, pageSize);
        }
        return prev;
      });
      setTotal((t) => (typeof t === 'number' ? t + 1 : t));
    });

    return () => {
      try { socket.disconnect(); } catch (e) {}
    };
  }, []);


  // Fetch sessions whenever `page` changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/sessions?page=${page}&pageSize=${pageSize}`);
        const data = await res.json();
        if (!mounted) return;
        if (!res.ok) {
          setError(data && data.error ? String(data.error) : 'Failed to load sessions');
          setSessions([]);
        } else {
          const items = Array.isArray(data.sessions) ? data.sessions : [];
          setTotal(typeof data.total === 'number' ? data.total : null);
          setSessions(items);
        }
      } catch (e: any) {
        setError(e && e.message ? e.message : String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [page, pageSize]);

  // Filter sessions based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSessions(sessions);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    // Search across all sessions, not just current page
    const searchAllSessions = async () => {
      try {
        // Fetch all sessions if not already loaded
        if (allSessions.length === 0) {
          const res = await fetch(`/api/sessions?page=1&pageSize=1000`);
          const data = await res.json();
          const items = data && data.sessions ? data.sessions : [];
          setAllSessions(items);
          
          // Now filter
          const query = searchQuery.toLowerCase();
          const filtered = items.filter((s: SessionItem) => {
            if (s.title && s.title.toLowerCase().includes(query)) return true;
            if (s.transcript && s.transcript.toLowerCase().includes(query)) return true;
            if (s.summary && s.summary.toLowerCase().includes(query)) return true;
            return false;
          });
          setFilteredSessions(filtered);
        } else {
          // Filter from cached all sessions
          const query = searchQuery.toLowerCase();
          const filtered = allSessions.filter((s: SessionItem) => {
            if (s.title && s.title.toLowerCase().includes(query)) return true;
            if (s.transcript && s.transcript.toLowerCase().includes(query)) return true;
            if (s.summary && s.summary.toLowerCase().includes(query)) return true;
            return false;
          });
          setFilteredSessions(filtered);
        }
      } catch (e) {
        console.error('Search error:', e);
        // Fallback to searching current page only
        const query = searchQuery.toLowerCase();
        const filtered = sessions.filter(s => {
          if (s.title && s.title.toLowerCase().includes(query)) return true;
          if (s.transcript && s.transcript.toLowerCase().includes(query)) return true;
          if (s.summary && s.summary.toLowerCase().includes(query)) return true;
          return false;
        });
        setFilteredSessions(filtered);
      }
    };

    searchAllSessions();
  }, [searchQuery, sessions, allSessions]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        marginBottom: 24,
        padding: '16px 20px',
        background: 'linear-gradient(135deg, rgba(79,176,122,0.08) 0%, rgba(79,176,122,0.02) 100%)',
        borderRadius: 12,
        border: '3px solid rgba(79,176,122,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <div style={{ color: 'var(--nb-accent)' }}><DocumentIcon size={24} /></div>
            <div className="transcript-title heading-live" style={{ fontSize: '1.2rem', margin: 0 }}>SESSION HISTORY</div>
          </div>
          
          {/* Search Bar - right beside title */}
          {!loading && sessions.length > 0 && (
            <div style={{ flex: 1, maxWidth: '280px' }}>
              <SearchBar onSearch={handleSearch} placeholder="Search..." />
            </div>
          )}
        </div>
      </div>

      {loading && sessions.length === 0 ? (
        <div className="text-sm muted" style={{ textAlign: 'center', padding: 20 }}>
          <div className="loading-spinner" style={{ width: 24, height: 24, border: '3px solid rgba(79,176,122,0.2)', borderTop: '3px solid var(--nb-accent)', borderRadius: '50%', margin: '0 auto 8px' }} />
          Loading sessions…
        </div>
      ) : null}
      
      {error ? (
        <div className="text-sm" style={{ color: '#c92a2a', padding: 12, background: 'rgba(255,0,0,0.05)', borderRadius: 8, border: '2px solid rgba(255,0,0,0.2)' }}>
          <span style={{ verticalAlign: 'middle', marginRight: 6 }}><WarningIcon size={18} color="#c92a2a" /></span> Error: {error}
        </div>
      ) : null}
      
      {!loading && !error && sessions.length === 0 ? (
        <div className="neubrutal-card" style={{ padding: 24, textAlign: 'center', background: 'rgba(79,176,122,0.03)' }}>
          <div style={{ marginBottom: 12, color: 'var(--nb-accent)' }}><MicrophoneIcon size={48} /></div>
          <div className="text-sm muted">No sessions yet</div>
          <div style={{ fontSize: 12, color: 'rgba(11,47,33,0.6)', marginTop: 6 }}>
            Record something and it will appear here
          </div>
        </div>
      ) : null}

      {!loading && filteredSessions.length === 0 && searchQuery ? (
        <div className="neubrutal-card" style={{ padding: 24, textAlign: 'center', background: 'rgba(79,176,122,0.03)' }}>
          <div style={{ marginBottom: 8, color: 'rgba(11,47,33,0.4)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
          <div className="text-sm muted" style={{ fontWeight: 600 }}>No matches found</div>
          <div style={{ fontSize: 12, color: 'rgba(11,47,33,0.6)', marginTop: 6 }}>
            Try a different search term
          </div>
        </div>
      ) : null}

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        {filteredSessions.map((s, idx) => (
          <li 
            key={s.id} 
            className="history-item neubrutal-card" 
            style={{ 
              padding: 16,
              background: idx % 2 === 0 ? 'white' : 'linear-gradient(135deg, #fff 0%, #f9fff9 100%)',
              cursor: 'pointer',
              display: 'flex',
              gap: 16,
              alignItems: 'flex-start'
            }}
          >
            {/* Avatar */}
            <div 
              className={`session-avatar ${s.status === 'PROCESSING' ? 'processing' : ''} ${s.status === 'COMPLETED' ? 'completed' : ''}`} 
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: s.status === 'COMPLETED' ? 'linear-gradient(135deg, #4fb07a 0%, #37a169 100%)' : 'linear-gradient(135deg, #e9f7ef 0%, #dff3e8 100%)',
                border: '4px solid var(--nb-border)',
                flexShrink: 0
              }}
              title={s.status || 'session'}
            >
              {s.status === 'COMPLETED' ? (
                <svg style={{ width: 24, height: 24 }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg style={{ width: 24, height: 24, color: 'var(--nb-accent)' }} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a3 3 0 0 0-3 3v5a3 3 0 1 0 6 0V5a3 3 0 0 0-3-3z"/>
                  <path d="M19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V21a1 1 0 0 0 2 0v-3.08A7 7 0 0 0 19 11z"/>
                </svg>
              )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--nb-ink)' }}>
                  {searchQuery ? highlightText(sanitizeTitle(s.title) || getSessionTitle(s), searchQuery) : (sanitizeTitle(s.title) || getSessionTitle(s))}
                </div>
                <span 
                  className="chip" 
                  style={{ 
                    fontSize: 10, 
                    padding: '4px 8px',
                    background: s.status === 'COMPLETED' ? 'rgba(79,176,122,0.15)' : 'rgba(200,200,200,0.2)',
                    border: `2px solid ${s.status === 'COMPLETED' ? 'rgba(79,176,122,0.4)' : 'rgba(150,150,150,0.3)'}`,
                    color: s.status === 'COMPLETED' ? 'var(--nb-accent)' : 'rgba(50,50,50,0.8)',
                    fontWeight: 900
                  }}
                >
                  {s.status === 'COMPLETED' ? '✓ DONE' : (s.status || 'PENDING')}
                </span>
              </div>
              
              <div style={{ fontSize: 11, color: 'rgba(11,47,33,0.5)', marginBottom: 8 }}>
                {s.startedAt ? new Date(s.startedAt).toLocaleString() : '—'}
              </div>
              
              <div style={{ fontSize: 13, color: 'rgba(11,47,33,0.7)', lineHeight: 1.4 }}>
                {searchQuery ? highlightText(getExcerpt(s), searchQuery) : getExcerpt(s)}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
                {s.transcript ? (
                  <button 
                    className="neubrutal-btn btn-ghost" 
                    onClick={() => setViewing({ session: s, tab: 'transcript' })}
                    style={{ fontSize: 12, padding: '6px 12px', fontWeight: 700 }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><DocumentIcon size={14} />Transcript</span>
                  </button>
                ) : null}
                {s.summary ? (
                  <button 
                    className="neubrutal-btn btn-ghost" 
                    onClick={() => setViewing({ session: s, tab: 'summary' })}
                    style={{ fontSize: 12, padding: '6px 12px', fontWeight: 700 }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><SparkleIcon size={14} />Summary</span>
                  </button>
                ) : null}
                <button 
                  className="neubrutal-btn" 
                  onClick={() => handleDelete(s.id)}
                  disabled={deleting === s.id}
                  style={{ 
                    fontSize: 12, 
                    padding: '6px 12px', 
                    fontWeight: 700,
                    marginLeft: 'auto',
                    background: 'rgba(239,68,68,0.1)',
                    borderColor: 'rgba(220,38,38,0.3)',
                    color: 'rgb(185,28,28)'
                  }}
                  title="Delete session"
                >
                  {deleting === s.id ? '...' : <TrashIcon size={16} />}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Pagination - hide when searching */}
      {!isSearching && (
        <div style={{ 
          marginTop: 16, 
          display: 'flex', 
          gap: 12, 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '12px 0',
          borderTop: '3px solid rgba(79,176,122,0.1)'
        }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button 
              className="neubrutal-btn btn-ghost" 
              onClick={() => setPage((p) => Math.max(1, p - 1))} 
              disabled={page <= 1} 
              aria-label="Previous page"
              style={{ padding: 8, minWidth: 40 }}
            > 
              <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--nb-ink)' }}>
              Page {page}{total ? ` of ${Math.ceil(total / pageSize)}` : ''}
            </div>
            <button 
              className="neubrutal-btn btn-ghost" 
              onClick={() => setPage((p) => p + 1)} 
              disabled={total !== null && page * pageSize >= total} 
              aria-label="Next page"
              style={{ padding: 8, minWidth: 40 }}
            >
              <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 6l6 6-6 6"/>
              </svg>
            </button>
          </div>
          {loading ? (
            <div style={{ fontSize: 11, color: 'rgba(11,47,33,0.5)' }}>Loading…</div>
          ) : null}
        </div>
      )}
      
      {/* Show result count when searching */}
      {isSearching && (
        <div style={{ 
          marginTop: 16,
          padding: '12px 0',
          borderTop: '3px solid rgba(79,176,122,0.1)',
          textAlign: 'center',
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--nb-ink)'
        }}>
          {filteredSessions.length} result{filteredSessions.length !== 1 ? 's' : ''} found
        </div>
      )}

      {viewing && viewing.session ? (
        <Modal 
          isOpen={true} 
          onClose={() => setViewing(null)}
          title={viewing.tab === 'transcript' ? 'Transcript' : 'Summary'}
        >
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {viewing.session.transcript ? (
              <button 
                className={`neubrutal-btn ${viewing.tab === 'transcript' ? 'btn-primary' : 'btn-ghost'}`} 
                onClick={() => setViewing({ session: viewing.session, tab: 'transcript' })}
                style={{ padding: '8px 16px' }}
              >
                Transcript
              </button>
            ) : null}
            {viewing.session.summary ? (
              <button 
                className={`neubrutal-btn ${viewing.tab === 'summary' ? 'btn-primary' : 'btn-ghost'}`} 
                onClick={() => setViewing({ session: viewing.session, tab: 'summary' })}
                style={{ padding: '8px 16px' }}
              >
                Summary
              </button>
            ) : null}
          </div>
          <div style={{ 
            background: 'rgba(79,176,122,0.03)', 
            padding: 20, 
            borderRadius: 10, 
            border: '3px solid rgba(79,176,122,0.1)',
            maxHeight: '60vh',
            overflowY: 'auto'
          }}>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'Rubik, sans-serif', lineHeight: 1.7, margin: 0, color: 'var(--nb-ink)' }}>
              {viewing.tab === 'transcript' ? String(viewing.session.transcript || '(no transcript)') : String(viewing.session.summary || '(no summary)')}
            </pre>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
 
function getSessionTitle(s: SessionItem) {
  if (s.title && String(s.title).trim()) return String(s.title);
  if (s.summary && String(s.summary).trim()) return String(s.summary).split('\n')[0].slice(0, 60) + (String(s.summary).length > 60 ? '…' : '');
  if (s.transcript && String(s.transcript).trim()) return String(s.transcript).split('\n')[0].slice(0, 60) + (String(s.transcript).length > 60 ? '…' : '');
  return 'Untitled session';
}

function sanitizeTitle(title?: string | null) {
  if (!title) return '';
  // Use first non-empty line and strip common bullet markers
  const lines = String(title).split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return '';
  let t = lines[0];
  // remove leading bullets like -, *, • and any leading punctuation
  t = t.replace(/^[\-\*•\s]+/, '');
  // collapse whitespace
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

function getExcerpt(s: SessionItem) {
  if (s.summary && String(s.summary).trim()) return String(s.summary).slice(0, 220) + (String(s.summary).length > 220 ? '…' : '');
  if (s.transcript && String(s.transcript).trim()) return String(s.transcript).slice(0, 220) + (String(s.transcript).length > 220 ? '…' : '');
  return '';
}
