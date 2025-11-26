import React from "react";
import SessionHistory from "../components/SessionHistory";
import RecordingPanel from "../components/RecordingPanel";

export default function DashboardPage() {
  return (
    <main className="p-6 min-h-screen" style={{ background: 'linear-gradient(135deg, #e9f7ef 0%, #f0fff5 50%, #fff 100%)' }}>
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="bangers-regular font-extrabold tracking-tight dash-header" style={{ color: 'var(--nb-ink)', marginBottom: 12, letterSpacing: '3px', fontSize: '4rem', textTransform: 'uppercase' }}>
            ScribeAI Dashboard
          </h1>
          <p className="muted" style={{ marginTop: 8, color: 'rgba(11,47,33,0.75)', fontWeight: 700, fontSize: '1.4rem', fontFamily: 'Poppins, sans-serif', lineHeight: 1.4 }}>
           Real-Time Transcription • AI Summaries • 100% Free Forever
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          <section className="lg:col-span-2 neubrutal-card p-6 relative overflow-hidden" style={{ background: 'white' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 150, height: 150, background: 'radial-gradient(circle, rgba(79,176,122,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
            <RecordingPanel />
          </section>

          <aside className="neubrutal-card p-4" style={{ background: 'linear-gradient(135deg, #fff 0%, #f0fff5 100%)' }}>
            <SessionHistory />
          </aside>
        </div>
      </div>
    </main>
  );
}
