"use client";

import React, { useState } from 'react';
import Modal from './Modal';

interface SentimentData {
  timestamp: number;
  sentiment: string;
  score: number;
  text: string;
}

interface SentimentPanelProps {
  sentimentHistory: SentimentData[];
  currentSentiment: { sentiment: string; score: number } | null;
}

export default function SentimentPanel({ sentimentHistory, currentSentiment }: SentimentPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  if (sentimentHistory.length === 0) return null;

  const getMoodEmoji = (sentiment: string) => {
    if (sentiment === 'positive') return '😊';
    if (sentiment === 'negative') return '😞';
    return '😐';
  };

  const getMoodColor = (sentiment: string) => {
    if (sentiment === 'positive') return { bg: '#22c55e', light: 'rgba(34,197,94,0.1)' };
    if (sentiment === 'negative') return { bg: '#ef4444', light: 'rgba(239,68,68,0.1)' };
    return { bg: '#9ca3af', light: 'rgba(156,163,175,0.1)' };
  };

  const overallMood = sentimentHistory.length > 0 
    ? sentimentHistory[sentimentHistory.length - 1].sentiment 
    : 'neutral';

  return (
    <>
      {/* Compact Mood Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="neubrutal-btn"
        style={{
          padding: '12px 20px',
          background: 'white',
          border: '4px solid var(--nb-border)',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 20
        }}
      >
        <span style={{ fontSize: 20 }}>{getMoodEmoji(overallMood)}</span>
        <span>Conversation Mood</span>
        <span style={{
          marginLeft: 'auto',
          padding: '4px 10px',
          background: getMoodColor(overallMood).light,
          borderRadius: 6,
          fontSize: '0.85rem',
          textTransform: 'capitalize'
        }}>
          {overallMood}
        </span>
      </button>

      {/* Mood Details Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Conversation Mood Analysis"
        maxWidth={700}
      >
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12, color: 'rgba(11,47,33,0.7)' }}>
            Mood Timeline ({sentimentHistory.length} moments)
          </div>
          
          {/* Emoji Timeline */}
          <div style={{ 
            display: 'flex', 
            gap: 8,
            flexWrap: 'wrap',
            padding: 16,
            background: 'rgba(147,51,234,0.05)',
            borderRadius: 8,
            marginBottom: 20
          }}>
            {sentimentHistory.map((item, idx) => {
              const colors = getMoodColor(item.sentiment);
              return (
                <div 
                  key={idx}
                  style={{
                    padding: '8px 12px',
                    background: colors.light,
                    borderRadius: 6,
                    border: `2px solid ${colors.bg}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.85rem'
                  }}
                  title={new Date(item.timestamp).toLocaleTimeString()}
                >
                  <span style={{ fontSize: 16 }}>{getMoodEmoji(item.sentiment)}</span>
                  <span style={{ fontWeight: 700, textTransform: 'capitalize', color: colors.bg }}>
                    {item.sentiment}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed History */}
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {sentimentHistory.slice().reverse().map((item, idx) => {
            const colors = getMoodColor(item.sentiment);
            return (
              <div 
                key={idx} 
                style={{ 
                  marginBottom: 10, 
                  padding: 12,
                  background: colors.light,
                  border: `2px solid ${colors.bg}`,
                  borderRadius: 8
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 18 }}>{getMoodEmoji(item.sentiment)}</span>
                  <span style={{ 
                    fontWeight: 800, 
                    fontSize: '0.9rem',
                    color: colors.bg,
                    textTransform: 'capitalize'
                  }}>
                    {item.sentiment}
                  </span>
                  <span style={{ fontSize: 11, color: 'rgba(11,47,33,0.5)', marginLeft: 'auto' }}>
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(11,47,33,0.7)', fontStyle: 'italic' }}>
                  "{item.text}"
                </div>
              </div>
            );
          })}
        </div>
      </Modal>
    </>
  );
}
