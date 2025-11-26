'use client';

import React, { useState } from 'react';
import Modal from './Modal';

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

interface MeetingMinutesProps {
  transcript?: string;
  summary?: string;
  sessionId?: string;
}

const MeetingMinutes: React.FC<MeetingMinutesProps> = ({ transcript, summary, sessionId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [minutes, setMinutes] = useState<Minutes | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateMinutes = async () => {
    if (!transcript && !summary) {
      setError('No transcript or summary available');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setIsOpen(true);

    try {
      const response = await fetch('/api/minutes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, summary }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate minutes');
      }

      const data = await response.json();
      setMinutes(data.minutes);
    } catch (err) {
      console.error('Error generating minutes:', err);
      setError('Failed to generate meeting minutes. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadMinutes = () => {
    if (!minutes) return;

    const content = formatMinutesAsText(minutes);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-minutes-${sessionId || 'session'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatMinutesAsText = (minutes: Minutes): string => {
    let text = `MEETING MINUTES\n`;
    text += `===================\n\n`;
    text += `Title: ${minutes.title}\n`;
    text += `Date: ${minutes.date}\n\n`;
    
    text += `ATTENDEES:\n`;
    minutes.attendees.forEach(a => text += `  • ${a}\n`);
    text += `\n`;
    
    text += `AGENDA:\n`;
    minutes.agenda.forEach(item => text += `  • ${item}\n`);
    text += `\n`;
    
    text += `KEY POINTS:\n`;
    minutes.keyPoints.forEach(point => text += `  • ${point}\n`);
    text += `\n`;
    
    if (minutes.decisions.length > 0) {
      text += `DECISIONS:\n`;
      minutes.decisions.forEach(decision => text += `  • ${decision}\n`);
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
      minutes.nextSteps.forEach(step => text += `  • ${step}\n`);
    }
    
    return text;
  };

  return (
    <>
      <button
        className="neubrutal-btn btn-secondary"
        onClick={generateMinutes}
        disabled={isGenerating || (!transcript && !summary)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
        {isGenerating ? 'Generating...' : 'Meeting Minutes'}
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Meeting Minutes"
      >
        {isGenerating && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{
              width: 48,
              height: 48,
              border: '4px solid rgba(79,176,122,0.2)',
              borderTop: '4px solid var(--nb-accent)',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 1s linear infinite'
            }} />
            <div style={{ fontSize: 14, color: 'rgba(11,47,33,0.6)' }}>
              Generating meeting minutes...
            </div>
          </div>
        )}

        {error && (
          <div style={{
            padding: 16,
            background: 'rgba(255,0,0,0.05)',
            border: '2px solid rgba(255,0,0,0.2)',
            borderRadius: 8,
            color: '#c92a2a',
            fontSize: 14,
            marginBottom: 16
          }}>
            {error}
          </div>
        )}

        {minutes && !isGenerating && (
          <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{
              borderBottom: '3px solid rgba(79,176,122,0.2)',
              paddingBottom: 16,
              marginBottom: 20
            }}>
              <h3 style={{
                margin: '0 0 8px 0',
                fontSize: 20,
                fontWeight: 900,
                color: 'var(--nb-ink)'
              }}>
                {minutes.title}
              </h3>
              <div style={{ fontSize: 14, color: 'rgba(11,47,33,0.6)' }}>
                {minutes.date}
              </div>
            </div>

            {/* Attendees */}
            {minutes.attendees.length > 0 && (
              <Section title="Attendees" icon="👥">
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {minutes.attendees.map((attendee, i) => (
                    <li key={i} style={{ marginBottom: 4, fontSize: 14 }}>
                      {attendee}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Agenda */}
            {minutes.agenda.length > 0 && (
              <Section title="Agenda" icon="📋">
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {minutes.agenda.map((item, i) => (
                    <li key={i} style={{ marginBottom: 6, fontSize: 14 }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Key Points */}
            {minutes.keyPoints.length > 0 && (
              <Section title="Key Discussion Points" icon="💡">
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {minutes.keyPoints.map((point, i) => (
                    <li key={i} style={{ marginBottom: 6, fontSize: 14 }}>
                      {point}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Decisions */}
            {minutes.decisions.length > 0 && (
              <Section title="Decisions Made" icon="✓">
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {minutes.decisions.map((decision, i) => (
                    <li key={i} style={{
                      marginBottom: 6,
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--nb-accent)'
                    }}>
                      {decision}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Action Items */}
            {minutes.actionItems.length > 0 && (
              <Section title="Action Items" icon="⚡">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {minutes.actionItems.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        padding: 12,
                        background: 'rgba(79,176,122,0.05)',
                        border: '2px solid rgba(79,176,122,0.2)',
                        borderRadius: 8
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                        {i + 1}. {item.task}
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
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
              <Section title="Next Steps" icon="→">
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {minutes.nextSteps.map((step, i) => (
                    <li key={i} style={{ marginBottom: 6, fontSize: 14 }}>
                      {step}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Download Button */}
            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <button
                className="neubrutal-btn btn-primary"
                onClick={downloadMinutes}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 14
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download Minutes
              </button>
            </div>
          </div>
        )}
      </Modal>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

// Helper component for sections
const Section: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({
  title,
  icon,
  children
}) => (
  <div style={{ marginBottom: 20 }}>
    <h4 style={{
      margin: '0 0 12px 0',
      fontSize: 16,
      fontWeight: 800,
      color: 'var(--nb-ink)',
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }}>
      <span>{icon}</span>
      {title}
    </h4>
    {children}
  </div>
);

export default MeetingMinutes;
