'use client';

import React, { useState, useEffect } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, placeholder = 'Search transcripts...' }) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      onSearch(query);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query, onSearch]);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: '600px'
    }}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '12px 18px 12px 50px',
          fontSize: '14px',
          fontWeight: '500',
          border: '2px solid rgba(79,176,122,0.3)',
          borderRadius: '20px',
          background: 'rgba(255,255,255,0.7)',
          color: 'var(--nb-ink)',
          outline: 'none',
          transition: 'all 0.2s',
          fontFamily: 'inherit',
          backdropFilter: 'blur(8px)'
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--nb-accent)';
          e.currentTarget.style.background = 'rgba(255,255,255,0.9)';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,176,122,0.1)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'rgba(79,176,122,0.3)';
          e.currentTarget.style.background = 'rgba(255,255,255,0.7)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />
      <div style={{
        position: 'absolute',
        left: '16px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: 'rgba(11,47,33,0.4)',
        pointerEvents: 'none'rchbar
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
      </div>
      {query && (
        <button
          onClick={() => setQuery('')}
          style={{
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(0,0,0,0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            color: 'rgba(11,47,33,0.6)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.1)';
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};

export default SearchBar;
