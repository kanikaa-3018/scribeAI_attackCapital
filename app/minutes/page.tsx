'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

interface ActionItem {
  task: string;
  assignee?: string;
  dueDate?: string;
}

interface Minutes {
  title: string;
  date: string;
  attendees: string[];
  agenda: string[];
  keyPoints: string[];
  decisions: string[];
  actionItems: ActionItem[];
  nextSteps: string[];
}

interface SessionWithMinutes {
  id: string;
  title?: string;
  transcript?: string;
  summary?: string;
  startedAt?: string;
  minutes?: Minutes;
  isGenerating?: boolean;
  error?: string;
}

export default function MinutesPage() {
  const [sessions, setSessions] = useState<SessionWithMinutes[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  const pageSize = 10;

  useEffect(() => {
    fetchSessions();
  }, [page]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('scribeai_token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const response = await fetch(`/api/sessions?page=${page}&pageSize=${pageSize}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch sessions');

      const data = await response.json();
      // Filter sessions that have transcript or summary
      const sessionsWithContent = data.sessions.filter(
        (s: SessionWithMinutes) => s.transcript || s.summary
      );
      setSessions(sessionsWithContent);
      setTotal(data.total);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMinutes = async (session: SessionWithMinutes) => {
    if (!session.transcript && !session.summary) return;

    setSessions(prev =>
      prev.map(s =>
        s.id === session.id ? { ...s, isGenerating: true, error: undefined } : s
      )
    );

    try {
      const response = await fetch('/api/minutes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: session.transcript,
          summary: session.summary,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate minutes');

      const data = await response.json();

      setSessions(prev =>
        prev.map(s =>
          s.id === session.id
            ? { ...s, minutes: data.minutes, isGenerating: false }
            : s
        )
      );

      // Auto-expand the generated minutes
      setExpandedId(session.id);
    } catch (error) {
      console.error('Error generating minutes:', error);
      setSessions(prev =>
        prev.map(s =>
          s.id === session.id
            ? { ...s, error: 'Failed to generate minutes', isGenerating: false }
            : s
        )
      );
    }
  };

  const downloadMinutes = (session: SessionWithMinutes) => {
    if (!session.minutes) return;

    const content = formatMinutesAsText(session.minutes);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-minutes-${session.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatMinutesAsText = (minutes: Minutes): string => {
    let text = `MEETING MINUTES\n===================\n\n`;
    text += `Title: ${minutes.title}\n`;
    text += `Date: ${minutes.date}\n\n`;

    text += `ATTENDEES:\n`;
    minutes.attendees.forEach(a => (text += `  • ${a}\n`));
    text += `\n`;

    text += `AGENDA:\n`;
    minutes.agenda.forEach(item => (text += `  • ${item}\n`));
    text += `\n`;

    text += `KEY POINTS:\n`;
    minutes.keyPoints.forEach(point => (text += `  • ${point}\n`));
    text += `\n`;

    if (minutes.decisions.length > 0) {
      text += `DECISIONS:\n`;
      minutes.decisions.forEach(decision => (text += `  • ${decision}\n`));
      text += `\n`;
    }

    if (minutes.actionItems.length > 0) {
      text += `ACTION ITEMS:\n`;
      minutes.actionItems.forEach((item, i) => {
        text += `  ${i + 1}. ${item.task}\n`;
        if (item.assignee) text += `     Assignee: ${item.assignee}\n`;
        if (item.dueDate) text += `     Due: ${item.dueDate}\n`;
      });
      text += `\n`;
    }

    if (minutes.nextSteps.length > 0) {
      text += `NEXT STEPS:\n`;
      minutes.nextSteps.forEach(step => (text += `  • ${step}\n`));
    }

    return text;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--nb-bg)' }}>
      <Navbar />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--nb-accent)" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, color: 'var(--nb-ink)' }}>
              Meeting Minutes
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: 16, color: 'rgba(11,47,33,0.6)' }}>
            AI-generated minutes from your recorded sessions
          </p>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div
              style={{
                width: 48,
                height: 48,
                border: '4px solid rgba(79,176,122,0.2)',
                borderTop: '4px solid var(--nb-accent)',
                borderRadius: '50%',
                margin: '0 auto 16px',
                animation: 'spin 1s linear infinite',
              }}
            />
            <div style={{ fontSize: 14, color: 'rgba(11,47,33,0.6)' }}>Loading sessions...</div>
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div className="neubrutal-card" style={{ padding: 60, textAlign: 'center' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(11,47,33,0.3)" strokeWidth="2" style={{ margin: '0 auto 16px' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--nb-ink)', marginBottom: 8 }}>
              No recorded sessions yet
            </div>
            <div style={{ fontSize: 14, color: 'rgba(11,47,33,0.6)' }}>
              Record a session to generate meeting minutes
            </div>
          </div>
        )}

        {/* Sessions Grid */}
        <div style={{ display: 'grid', gap: 24 }}>
          {sessions.map(session => (
            <div
              key={session.id}
              className="neubrutal-card"
              style={{
                padding: 0,
                background: 'white',
                overflow: 'hidden',
              }}
            >
              {/* Session Header */}
              <div
                style={{
                  padding: '24px 28px',
                  background: 'linear-gradient(135deg, rgba(79,176,122,0.08) 0%, rgba(79,176,122,0.02) 100%)',
                  borderBottom: '3px solid rgba(79,176,122,0.2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: 20, fontWeight: 900, color: 'var(--nb-ink)' }}>
                      {session.title || session.minutes?.title || 'Untitled Session'}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 14, color: 'rgba(11,47,33,0.6)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {formatDate(session.startedAt)}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!session.minutes && !session.isGenerating && (
                      <button
                        className="neubrutal-btn btn-primary"
                        onClick={() => generateMinutes(session)}
                        style={{ fontSize: 14, padding: '10px 20px' }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
                          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                        Generate Minutes
                      </button>
                    )}

                    {session.isGenerating && (
                      <button className="neubrutal-btn btn-secondary" disabled style={{ fontSize: 14, padding: '10px 20px' }}>
                        <div
                          style={{
                            width: 14,
                            height: 14,
                            border: '2px solid rgba(79,176,122,0.3)',
                            borderTop: '2px solid var(--nb-accent)',
                            borderRadius: '50%',
                            marginRight: 8,
                            display: 'inline-block',
                            animation: 'spin 1s linear infinite',
                          }}
                        />
                        Generating...
                      </button>
                    )}

                    {session.minutes && (
                      <>
                        <button
                          className="neubrutal-btn btn-secondary"
                          onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
                          style={{ fontSize: 14, padding: '10px 20px' }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
                            <polyline points={expandedId === session.id ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
                          </svg>
                          {expandedId === session.id ? 'Hide' : 'View'}
                        </button>
                        <button
                          className="neubrutal-btn btn-ghost"
                          onClick={() => downloadMinutes(session)}
                          style={{ fontSize: 14, padding: '10px 20px' }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          Download
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {session.error && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 12,
                      background: 'rgba(255,0,0,0.05)',
                      border: '2px solid rgba(255,0,0,0.2)',
                      borderRadius: 8,
                      color: '#c92a2a',
                      fontSize: 14,
                    }}
                  >
                    {session.error}
                  </div>
                )}
              </div>

              {/* Expanded Minutes Content */}
              {expandedId === session.id && session.minutes && (
                <div style={{ padding: '28px' }}>
                  <MinutesContent minutes={session.minutes} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination */}
        {!loading && sessions.length > 0 && (
          <div
            style={{
              marginTop: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            <button
              className="neubrutal-btn btn-ghost"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{ padding: '12px 20px', fontSize: 14 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 6 }}>
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Previous
            </button>

            <div
              style={{
                padding: '12px 20px',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--nb-ink)',
              }}
            >
              Page {page}{total ? ` of ${Math.ceil(total / pageSize)}` : ''}
            </div>

            <button
              className="neubrutal-btn btn-ghost"
              onClick={() => setPage(p => p + 1)}
              disabled={total !== null && page * pageSize >= total}
              style={{ padding: '12px 20px', fontSize: 14 }}
            >
              Next
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 6 }}>
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

// Component to display minutes content
const MinutesContent: React.FC<{ minutes: Minutes }> = ({ minutes }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Attendees */}
      {minutes.attendees.length > 0 && (
        <Section
          title="Attendees"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        >
          <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexWrap: 'wrap', gap: 8, listStyle: 'none' }}>
            {minutes.attendees.map((attendee, i) => (
              <li
                key={i}
                style={{
                  padding: '6px 12px',
                  background: 'rgba(79,176,122,0.1)',
                  border: '2px solid rgba(79,176,122,0.3)',
                  borderRadius: 20,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {attendee}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Agenda */}
      {minutes.agenda.length > 0 && (
        <Section
          title="Agenda"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          }
        >
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {minutes.agenda.map((item, i) => (
              <li key={i} style={{ marginBottom: 8, fontSize: 15, lineHeight: 1.6 }}>
                {item}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Key Points */}
      {minutes.keyPoints.length > 0 && (
        <Section
          title="Key Discussion Points"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
          }
        >
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {minutes.keyPoints.map((point, i) => (
              <li key={i} style={{ marginBottom: 8, fontSize: 15, lineHeight: 1.6 }}>
                {point}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Decisions */}
      {minutes.decisions.length > 0 && (
        <Section
          title="Decisions Made"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
        >
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {minutes.decisions.map((decision, i) => (
              <li
                key={i}
                style={{
                  marginBottom: 8,
                  fontSize: 15,
                  lineHeight: 1.6,
                  fontWeight: 600,
                  color: 'var(--nb-accent)',
                }}
              >
                {decision}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Action Items */}
      {minutes.actionItems.length > 0 && (
        <Section
          title="Action Items"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {minutes.actionItems.map((item, i) => (
              <div
                key={i}
                style={{
                  padding: 16,
                  background: 'rgba(79,176,122,0.05)',
                  border: '2px solid rgba(79,176,122,0.2)',
                  borderRadius: 12,
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: 'var(--nb-ink)' }}>
                  {i + 1}. {item.task}
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 14 }}>
                  {item.assignee && (
                    <span style={{ color: 'rgba(11,47,33,0.7)' }}>
                      <strong>Assignee:</strong> {item.assignee}
                    </span>
                  )}
                  {item.dueDate && (
                    <span style={{ color: 'rgba(11,47,33,0.7)' }}>
                      <strong>Due:</strong> {item.dueDate}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Next Steps */}
      {minutes.nextSteps.length > 0 && (
        <Section
          title="Next Steps"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          }
        >
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {minutes.nextSteps.map((step, i) => (
              <li key={i} style={{ marginBottom: 8, fontSize: 15, lineHeight: 1.6 }}>
                {step}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
};

// Section component
const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({
  title,
  icon,
  children,
}) => (
  <div>
    <h4
      style={{
        margin: '0 0 12px 0',
        fontSize: 16,
        fontWeight: 900,
        color: 'var(--nb-ink)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span style={{ color: 'var(--nb-accent)' }}>{icon}</span>
      {title}
    </h4>
    {children}
  </div>
);
