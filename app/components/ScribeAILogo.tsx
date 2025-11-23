import React from 'react';

export default function ScribeAILogo({ size = 40 }: { size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      xmlns="http://www.w3.org/2000/svg"
      className="inline-block"
    >
      {/* Background circle */}
      <circle cx="50" cy="50" r="48" fill="#FFE500" stroke="#000" strokeWidth="4"/>
      
      {/* Microphone body */}
      <rect x="40" y="25" width="20" height="30" rx="10" fill="#000"/>
      
      {/* Microphone grill lines */}
      <line x1="42" y1="30" x2="58" y2="30" stroke="#FFE500" strokeWidth="1.5"/>
      <line x1="42" y1="35" x2="58" y2="35" stroke="#FFE500" strokeWidth="1.5"/>
      <line x1="42" y1="40" x2="58" y2="40" stroke="#FFE500" strokeWidth="1.5"/>
      <line x1="42" y1="45" x2="58" y2="45" stroke="#FFE500" strokeWidth="1.5"/>
      <line x1="42" y1="50" x2="58" y2="50" stroke="#FFE500" strokeWidth="1.5"/>
      
      {/* Microphone bottom */}
      <path d="M 35 55 Q 35 65 50 65 Q 65 65 65 55" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round"/>
      
      {/* Microphone stand */}
      <line x1="50" y1="65" x2="50" y2="75" stroke="#000" strokeWidth="3" strokeLinecap="round"/>
      
      {/* Microphone base */}
      <line x1="40" y1="75" x2="60" y2="75" stroke="#000" strokeWidth="4" strokeLinecap="round"/>
      
      {/* Sound waves (right) */}
      <path d="M 68 45 Q 73 45 73 50 Q 73 55 68 55" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M 75 40 Q 82 40 82 50 Q 82 60 75 60" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round"/>
      
      {/* Sound waves (left) */}
      <path d="M 32 45 Q 27 45 27 50 Q 27 55 32 55" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M 25 40 Q 18 40 18 50 Q 18 60 25 60" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round"/>
      
      {/* AI Sparkle (top right) */}
      <circle cx="72" cy="22" r="2.5" fill="#000"/>
      <line x1="72" y1="16" x2="72" y2="28" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
      <line x1="66" y1="22" x2="78" y2="22" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
      
      {/* AI Sparkle (bottom right) */}
      <circle cx="80" cy="70" r="2" fill="#000"/>
      <line x1="80" y1="65" x2="80" y2="75" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="75" y1="70" x2="85" y2="70" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
