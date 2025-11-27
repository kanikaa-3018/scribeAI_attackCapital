"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ScribeAILogo from './ScribeAILogo';

export default function Navbar() {
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = localStorage.getItem('scribeai_user');
      if (raw) setUser(JSON.parse(raw));
    } catch (e) {
      setUser(null);
    }
  }, []);

  const toolsRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!toolsRef.current) return;
      if (!(e.target instanceof Node)) return;
      if (!toolsRef.current.contains(e.target)) {
        setToolsOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setToolsOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  async function logout() {
    try {
      const token = localStorage.getItem('scribeai_token');
      const apiBase = typeof window !== 'undefined' ? (window.location.hostname === 'localhost' ? 'http://localhost:4000' : `${window.location.protocol}//${window.location.hostname}:4000`) : 'http://localhost:4000';
      if (token) await fetch(`${apiBase}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('scribeai_token');
    localStorage.removeItem('scribeai_user');
    setUser(null);
    try { router.push('/'); } catch (e) { /* ignore */ }
  }

  const BRAND_TITLE = "SCRIBE AI";

  return (
    <div className="nb-navbar scribe-navbar" role="banner">
      <div className="nb-brand scribe-brand">
        <div className="scribe-logo" aria-hidden="true">
          <ScribeAILogo size={40} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="brand-name bangers-regular" style={{ letterSpacing: '1px' }}>{BRAND_TITLE}</div>
        </div>
      </div>

      <div className="nav-center">
        <nav className="nav-pills" role="navigation" aria-label="Main">
          <Link className="nav-pill" href="/dashboard">Dashboard</Link>
          <Link className="nav-pill" href="/minutes">Minutes</Link>
          <Link className="nav-pill" href="/insights">Insights</Link>
          <div className="nav-pill tools-pill" ref={toolsRef}>
            <button className="tools-toggle" onClick={() => setToolsOpen(v => !v)} aria-expanded={toolsOpen}>Tools <span className="caret">▾</span></button>
            {toolsOpen && (
              <div className="tools-dropdown" role="menu">
                <Link role="menuitem" href="/sessions" onClick={() => setToolsOpen(false)}>Recordings</Link>
                <Link role="menuitem" href="/tools/transcripts" onClick={() => setToolsOpen(false)}>Transcripts</Link>
                <Link role="menuitem" href="/tools/summaries" onClick={() => setToolsOpen(false)}>Summaries</Link>
              </div>
            )}
          </div>
        </nav>
      </div>

      <div className="nb-nav-actions nav-right">
        {user ? (
          <>
            <button className="neubrutal-btn logout-btn" onClick={logout}>Logout</button>
            <div className="avatar-circle" title={user ? (user.name || user.email) : 'Account'}>
              {user ? (user.name ? user.name[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : 'S')) : <span className="avatar-icon">👤</span>}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <a className="neubrutal-btn btn-ghost" href="/login">Login</a>
            <a className="neubrutal-btn btn-primary" href="/login?mode=signup">Sign up</a>
          </div>
        )}
      </div>
    </div>
  );
}
