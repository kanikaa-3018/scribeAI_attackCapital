"use client";

import React, { useEffect, useState } from 'react';

type ToastItem = { id: string; message: string; type?: 'info' | 'success' | 'error' };

export function emitToast(message: string, type: ToastItem['type'] = 'info') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('scribe-toast', { detail: { message, type } }));
}

export default function ToastContainer({ max = 4 }: { max?: number }) {
  const [list, setList] = useState<ToastItem[]>([]);

  useEffect(() => {
    function onEvent(e: any) {
      const m = e && e.detail && e.detail.message ? String(e.detail.message) : '';
      const t = e && e.detail && e.detail.type ? e.detail.type : 'info';
      if (!m) return;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
      setList((s) => [ { id, message: m, type: t }, ...s ].slice(0, max));
      // auto remove after 3.5s
      setTimeout(() => {
        setList((s) => s.filter(x => x.id !== id));
      }, 3500);
    }
    window.addEventListener('scribe-toast', onEvent as any);
    return () => window.removeEventListener('scribe-toast', onEvent as any);
  }, [max]);

  if (list.length === 0) return null;
  return (
    <div className="toast-container" aria-live="polite" aria-atomic>
      {list.map(t => (
        <div key={t.id} className={`toast ${t.type || 'info'}`}>{t.message}</div>
      ))}
    </div>
  );
}
