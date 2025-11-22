"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from 'next/navigation';

export default function LoginPage() {
  const [mode, setMode] = useState<'login'|'signup'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const search = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    try {
      const m = search?.get('mode');
      if (m === 'signup') setMode('signup');
    } catch (e) {
      // ignore
    }
  }, [search]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    (async () => {
      try {
        const apiBase = typeof window !== 'undefined' ? (window.location.hostname === 'localhost' ? 'http://localhost:4000' : `${window.location.protocol}//${window.location.hostname}:4000`) : 'http://localhost:4000';
        const endpoint = mode === 'signup' ? `${apiBase}/auth/signup` : `${apiBase}/auth/login`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        if (!res.ok) {
          setMessage(data && data.error ? String(data.error) : 'Auth failed');
          return;
        }
        const token = data && data.token ? String(data.token) : null;
        if (token) {
          localStorage.setItem('scribeai_token', token);
          // fetch /auth/me for user info from API server
          const meRes = await fetch(`${apiBase}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
          if (meRes.ok) {
            const me = await meRes.json();
            const userObj = me && me.user ? me.user : { name: '', email };
            localStorage.setItem('scribeai_user', JSON.stringify(userObj));
            setMessage(mode === 'login' ? 'Logged in' : 'Account created');
            // redirect to dashboard after successful auth
            try { router.push('/dashboard'); } catch (e) { /* ignore */ }
          } else {
            setMessage('Logged in (no user profile)');
            try { router.push('/dashboard'); } catch (e) { /* ignore */ }
          }
        } else {
          setMessage('No token received');
        }
      } catch (err: any) {
        setMessage(err && err.message ? err.message : 'Network error');
      }
    })();
  }

  return (
    <div className="min-h-screen">
      <div className="nb-auth-wrap">
        <div className="neubrutal-card nb-auth-card">
          <div className="auth-card-inner">
            <div>
              <div className="auth-title">ScribeAI Account</div>
              <div className="auth-sub">Sign in or create an account to save and manage your recordings.</div>
            </div>

            <div className="auth-toggle">
              <button type="button" className={`neubrutal-btn ${mode === 'login' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMode('login')}>Login</button>
              <button type="button" className={`neubrutal-btn ${mode === 'signup' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMode('signup')}>Sign up</button>
            </div>

            <form onSubmit={submit} className="nb-form">
              {mode === 'signup' && (
                <div className="form-row">
                  <label className="form-note">Full name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className="nb-input" placeholder="Your full name" />
                </div>
              )}

              <div className="form-row">
                <label className="form-note">Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} className="nb-input" placeholder="you@example.com" />
              </div>

              <div className="form-row">
                <label className="form-note">Password</label>
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="nb-input" placeholder="Choose a secure password" />
              </div>

              <div className="form-actions">
                <button type="submit" className="neubrutal-btn btn-primary">{mode === 'login' ? 'Login' : 'Create account'}</button>
                <button type="button" className="neubrutal-btn btn-ghost" onClick={() => { setEmail(''); setName(''); setPassword(''); setMessage(''); }}>Reset</button>
                <div style={{ marginLeft: 8 }} className="form-note">This uses the demo auth server. For production, integrate Better Auth.</div>
              </div>

              {message ? <div className="text-sm" style={{ color: 'var(--nb-accent)', fontWeight:700 }}>{message}</div> : null}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
