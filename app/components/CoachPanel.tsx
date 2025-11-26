'use client';

import React, { useState } from 'react';
import Modal from './Modal';

interface CoachFeedback {
  timestamp: number;
  type: 'none' | 'long_speech' | 'rambling' | 'repetition' | 'filler_words';
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
  details: string;
}

interface CoachPanelProps {
  feedbackHistory: CoachFeedback[];
  currentFeedback: CoachFeedback | null;
}

const CoachPanel: React.FC<CoachPanelProps> = ({ feedbackHistory, currentFeedback }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter out 'none' types for display
  const relevantFeedback = feedbackHistory.filter(f => f.type !== 'none');

  if (relevantFeedback.length === 0 && (!currentFeedback || currentFeedback.type === 'none')) {
    return null;
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'long_speech': return '⏱';
      case 'rambling': return '↻';
      case 'repetition': return '⟲';
      case 'filler_words': return '···';
      default: return '✓';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'long_speech': return 'Long Speech';
      case 'rambling': return 'Rambling';
      case 'repetition': return 'Repetition';
      case 'filler_words': return 'Filler Words';
      default: return 'Good';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' };
      case 'medium': return { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' };
      case 'low': return { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' };
      default: return { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' };
    }
  };

  const getOverallStatus = () => {
    if (!currentFeedback || currentFeedback.type === 'none') return 'great';
    if (currentFeedback.severity === 'high') return 'needs-attention';
    if (currentFeedback.severity === 'medium') return 'okay';
    return 'good';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'great': return { bg: '#dcfce7', text: '#166534', border: '#86efac' };
      case 'good': return { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' };
      case 'okay': return { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' };
      case 'needs-attention': return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' };
      default: return { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' };
    }
  };

  const status = getOverallStatus();
  const statusColor = getStatusColor(status);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        style={{
          padding: '12px 16px',
          backgroundColor: statusColor.bg,
          color: statusColor.text,
          border: `2px solid ${statusColor.border}`,
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <span style={{ fontSize: '16px', fontWeight: 'bold' }}>AI Coach</span>
        {currentFeedback && currentFeedback.type !== 'none' && (
          <span style={{
            padding: '3px 10px',
            backgroundColor: 'white',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '700',
            letterSpacing: '0.5px'
          }}>
            {getTypeIcon(currentFeedback.type)} {currentFeedback.severity.toUpperCase()}
          </span>
        )}
      </button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="AI Meeting Coach">
        <div style={{ padding: '24px', maxWidth: '600px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '16px', color: '#111827' }}>
            AI Meeting Coach
          </h2>

          {currentFeedback && currentFeedback.type !== 'none' && (
            <div style={{
              padding: '16px',
              backgroundColor: getSeverityColor(currentFeedback.severity).bg,
              border: `2px solid ${getSeverityColor(currentFeedback.severity).border}`,
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{getTypeIcon(currentFeedback.type)}</span>
                <span style={{ 
                  fontSize: '15px', 
                  fontWeight: '600',
                  color: getSeverityColor(currentFeedback.severity).text
                }}>
                  {getTypeLabel(currentFeedback.type)}
                </span>
                <span style={{
                  marginLeft: 'auto',
                  padding: '3px 10px',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '700',
                  letterSpacing: '0.5px',
                  color: getSeverityColor(currentFeedback.severity).text
                }}>
                  {currentFeedback.severity.toUpperCase()}
                </span>
              </div>
              <p style={{ 
                fontSize: '14px', 
                fontWeight: '600',
                color: getSeverityColor(currentFeedback.severity).text,
                marginBottom: '4px'
              }}>
                → {currentFeedback.suggestion}
              </p>
              <p style={{ 
                fontSize: '13px',
                color: getSeverityColor(currentFeedback.severity).text,
                opacity: 0.8
              }}>
                {currentFeedback.details}
              </p>
            </div>
          )}

          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
            Feedback History
          </h3>

          {relevantFeedback.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
              No issues detected. Keep up the good work!
            </p>
          ) : (
            <div style={{ 
              maxHeight: '300px', 
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {relevantFeedback.map((feedback, index) => {
                const colors = getSeverityColor(feedback.severity);
                const time = new Date(feedback.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={index}
                    style={{
                      padding: '12px',
                      backgroundColor: colors.bg,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '6px',
                      fontSize: '13px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span>{getTypeIcon(feedback.type)}</span>
                      <span style={{ fontWeight: '600', color: colors.text }}>
                        {getTypeLabel(feedback.type)}
                      </span>
                      <span style={{ marginLeft: 'auto', fontSize: '11px', color: colors.text, opacity: 0.7 }}>
                        {time}
                      </span>
                    </div>
                    <p style={{ color: colors.text, marginBottom: '2px', fontSize: '12px' }}>
                      {feedback.suggestion}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default CoachPanel;
