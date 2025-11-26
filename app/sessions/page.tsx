"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MicrophoneIcon } from '../components/Icons';
import SearchBar from '../components/SearchBar';

function sanitizeTitle(title?: string | null) {
  if (!title) return '';
  const lines = String(title).split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return '';
  let t = lines[0];
  t = t.replace(/^[\-\*•\s]+/, '');
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

function highlightText(text: string, query: string) {
  if (!query.trim()) return text;
  
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

export default function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ email?: string; name?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Get logged-in user from localStorage
    try {
      const userData = localStorage.getItem('scribeai_user');
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }
    } catch (e) {
      console.warn('Failed to get user data', e);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/sessions');
        const json = await res.json().catch(() => null);
        // API may return { sessions: [...] } or { session: ... } depending on implementation
        let items = [] as any[];
        if (json) {
          if (Array.isArray(json.sessions)) items = json.sessions;
          else if (Array.isArray(json)) items = json;
          else if (Array.isArray(json.data)) items = json.data;
          else if (Array.isArray(json.results)) items = json.results;
        }
        setSessions(items);
        setFilteredSessions(items);
      } catch (e) {
        console.warn('Failed loading sessions', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Filter sessions based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSessions(sessions);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = sessions.filter(s => {
      // Search in title
      if (sanitizeTitle(s.title).toLowerCase().includes(query)) return true;
      
      // Search in transcript
      if (s.transcript && String(s.transcript).toLowerCase().includes(query)) return true;
      
      // Search in summary
      if (s.summary && String(s.summary).toLowerCase().includes(query)) return true;
      
      // Search in keywords
      if (s.keywords && s.keywords.some((k: string) => k.toLowerCase().includes(query))) return true;
      
      return false;
    });

    setFilteredSessions(filtered);
  }, [searchQuery, sessions]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(135deg, #e9f7ef 0%, #f0fff5 50%, #fff 100%)', padding: '40px 20px' }}>
      <div className="max-w-7xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, color: 'var(--nb-ink)', fontFamily: 'Poppins, sans-serif' }}>Recordings</h1>
          <div style={{ padding: '8px 20px', background: 'rgba(79,176,122,0.1)', borderRadius: 20, border: '3px solid rgba(79,176,122,0.2)', fontWeight: 800, color: 'var(--nb-accent)' }}>
            {loading ? 'Loading…' : `${filteredSessions.length} ${filteredSessions.length === 1 ? 'recording' : 'recordings'}`}
          </div>
        </div>

        {/* Search Bar */}
        {!loading && sessions.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
            <SearchBar onSearch={handleSearch} placeholder="Search by title, transcript, or keywords..." />
          </div>
        )}

        {loading ? (
          <div className="neubrutal-card" style={{ padding: 40, textAlign: 'center', background: 'white' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--nb-ink)' }}>Loading recordings…</div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="neubrutal-card" style={{ padding: 60, textAlign: 'center', background: 'white' }}>
            <div style={{ marginBottom: 20, color: 'var(--nb-accent)' }}><MicrophoneIcon size={72} /></div>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: 12, color: 'var(--nb-ink)' }}>No recordings yet</div>
            <div style={{ fontSize: '1rem', color: 'rgba(11,47,33,0.6)', marginBottom: 24 }}>Create your first recording from the dashboard</div>
            <Link href="/dashboard" className="neubrutal-btn btn-primary" style={{ padding: '12px 28px', fontWeight: 900 }}>
              Go to Dashboard
            </Link>
          </div>
        ) : filteredSessions.length === 0 && searchQuery ? (
          <div className="neubrutal-card" style={{ padding: 60, textAlign: 'center', background: 'white' }}>
            <div style={{ marginBottom: 16, color: 'rgba(11,47,33,0.3)', display: 'flex', justifyContent: 'center' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: 12, color: 'var(--nb-ink)' }}>No results found</div>
            <div style={{ fontSize: '1rem', color: 'rgba(11,47,33,0.6)', marginBottom: 24 }}>
              No recordings match "{searchQuery}"
            </div>
            <button 
              onClick={() => setSearchQuery('')}
              className="neubrutal-btn" 
              style={{ padding: '12px 28px', fontWeight: 900 }}
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 20 }}>
            {filteredSessions.map((s: any) => (
              <div key={s.id || s.clientSessionId || Math.random()} className="neubrutal-card" style={{ padding: 28, background: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 300 }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 12, color: 'var(--nb-ink)', lineHeight: 1.3 }}>
                      {searchQuery ? highlightText(sanitizeTitle(s.title) || s.title || s.id || s.clientSessionId || 'Untitled', searchQuery) : (sanitizeTitle(s.title) || s.title || s.id || s.clientSessionId || 'Untitled')}
                    </h3>
                    <div style={{ fontSize: 13, color: 'rgba(11,47,33,0.6)', marginBottom: 16, fontWeight: 600 }}>
                      {s.ownerEmail || currentUser?.email || currentUser?.name || 'Unknown owner'}
                    </div>
                    
                    {(s.keywords || []).length > 0 && (
                      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {(s.keywords || []).slice(0, 8).map((k: string) => (
                          <span key={k} className="chip" style={{ padding: '5px 12px', fontSize: 12, fontWeight: 700 }}>
                            {searchQuery ? highlightText(k, searchQuery) : k}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {s.summary && (
                      <div style={{ fontSize: 14, color: 'rgba(11,47,33,0.7)', lineHeight: 1.6 }}>
                        {searchQuery ? highlightText(String(s.summary).slice(0, 220) + (String(s.summary).length > 220 ? '…' : ''), searchQuery) : (String(s.summary).slice(0, 220) + (String(s.summary).length > 220 ? '…' : ''))}
                      </div>
                    )}
                  </div>

                  <div style={{ minWidth: 340, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {(s.id || s.clientSessionId) ? (
                      <audio 
                        controls 
                        preload="metadata" 
                        style={{ width: '100%' }} 
                        src={`/api/sessions/${s.id}/audio`}
                      >
                        Your browser does not support audio playback.
                      </audio>
                    ) : (
                      <div style={{ padding: 16, background: 'rgba(0,0,0,0.02)', borderRadius: 8, textAlign: 'center', fontSize: 13, color: 'rgba(11,47,33,0.5)' }}>
                        No audio available
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                      <Link href={`/sessions/${s.id || s.clientSessionId}`} className="neubrutal-btn" style={{ padding: '10px 20px', fontWeight: 900 }}>
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
