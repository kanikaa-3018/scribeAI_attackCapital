"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function SessionDetail({ params }: { params: { id: string } }) {
  const { id } = params;
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // Fetch all sessions and find the one matching this ID
        const res = await fetch('/api/sessions?pageSize=1000');
        const data = await res.json();
        const sessions = Array.isArray(data.sessions) ? data.sessions : [];
        const match = sessions.find((s: any) => 
          s.id === id || s.clientSessionId === id || 
          String(s.id).includes(id) || String(s.clientSessionId || '').includes(id)
        );
        
        if (!match) {
          setError('Session not found');
        } else {
          setSession(match);
        }
      } catch (e: any) {
        setError(e && e.message ? e.message : 'Failed to load session');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen" style={{ background: 'linear-gradient(135deg, #e9f7ef 0%, #f0fff5 50%, #fff 100%)', padding: '40px 20px' }}>
        <div className="max-w-5xl mx-auto">
          <div className="neubrutal-card" style={{ padding: 60, textAlign: 'center', background: 'white' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--nb-ink)' }}>Loading session...</div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !session) {
    return (
      <main className="min-h-screen" style={{ background: 'linear-gradient(135deg, #e9f7ef 0%, #f0fff5 50%, #fff 100%)', padding: '40px 20px' }}>
        <div className="max-w-5xl mx-auto">
          <div className="neubrutal-card" style={{ padding: 60, textAlign: 'center', background: 'white' }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>❌</div>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 16, color: 'var(--nb-ink)' }}>Session Not Found</h1>
            <p style={{ fontSize: '1rem', color: 'rgba(11,47,33,0.6)', marginBottom: 32 }}>{error || 'The session you are looking for does not exist.'}</p>
            <Link href="/sessions" className="neubrutal-btn btn-primary" style={{ padding: '12px 28px', fontWeight: 900, display: 'inline-block' }}>
              Back to Sessions
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(135deg, #e9f7ef 0%, #f0fff5 50%, #fff 100%)', padding: '40px 20px' }}>
      <div className="max-w-5xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <Link href="/sessions" className="neubrutal-btn btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span>←</span> <span>Back to Sessions</span>
          </Link>
        </div>

        {/* Session Header Card */}
        <div className="neubrutal-card" style={{ padding: 32, background: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 300 }}>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: 12, color: 'var(--nb-ink)', lineHeight: 1.2 }}>
                {session.title || `Session ${session.id}`}
              </h1>
              <div style={{ fontSize: 14, color: 'rgba(11,47,33,0.6)', fontWeight: 600, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <span>{session.ownerEmail ? `${session.ownerEmail}` : 'Unknown owner'}</span>
                <span style={{ color: 'rgba(11,47,33,0.3)' }}>•</span>
                <span>{session.startedAt ? new Date(session.startedAt).toLocaleString() : 'No date'}</span>
              </div>
            </div>
          </div>

          {session.keywords && session.keywords.length > 0 && (
            <div style={{ marginTop: 24, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {session.keywords.map((k: string) => (
                <span key={k} className="chip" style={{ padding: '6px 14px', fontSize: 13, fontWeight: 700 }}>{k}</span>
              ))}
            </div>
          )}
        </div>

        {/* Audio Recording Card */}
        {session.audioUrl && (
          <div className="neubrutal-card" style={{ padding: 32, background: 'white' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 20, color: 'var(--nb-ink)' }}>Audio Recording</h3>
            <audio controls preload="metadata" style={{ width: '100%' }} src={session.audioUrl || `/api/sessions/${session.id || session.clientSessionId}/audio`} />
          </div>
        )}

        {/* Summary Card */}
        {session.summary && (
          <div className="neubrutal-card" style={{ padding: 32, background: 'white' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 20, color: 'var(--nb-ink)' }}>Summary</h3>
            <div style={{ 
              background: 'rgba(79,176,122,0.03)', 
              padding: 24, 
              borderRadius: 12,
              border: '3px solid rgba(79,176,122,0.1)'
            }}>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '1rem', lineHeight: '1.7', margin: 0, color: 'var(--nb-ink)' }}>
                {session.summary}
              </pre>
            </div>
          </div>
        )}

        {/* Transcript Card */}
        <div className="neubrutal-card" style={{ padding: 32, background: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, color: 'var(--nb-ink)' }}>Transcript</h3>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(session.transcript || '');
                  alert('Transcript copied to clipboard');
                }}
                className="neubrutal-btn btn-ghost"
                style={{ padding: '10px 20px', fontWeight: 800 }}
              >
                📋 Copy
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([session.transcript || ''], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `transcript-${session.id}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="neubrutal-btn"
                style={{ padding: '10px 20px', fontWeight: 800, background: 'linear-gradient(135deg, var(--nb-accent) 0%, #37a169 100%)', color: 'white' }}
              >
                📥 Export
              </button>
            </div>
          </div>
          <div style={{ 
            background: 'rgba(79,176,122,0.02)', 
            padding: 24, 
            borderRadius: 12,
            border: '3px solid rgba(79,176,122,0.1)',
            maxHeight: '600px',
            overflowY: 'auto'
          }}>
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              fontFamily: 'inherit', 
              fontSize: '1rem',
              lineHeight: '1.7',
              margin: 0,
              color: 'var(--nb-ink)'
            }}>
              {session.transcript || 'No transcript available for this session.'}
            </pre>
          </div>
        </div>
      </div>
    </main>
  );
}
