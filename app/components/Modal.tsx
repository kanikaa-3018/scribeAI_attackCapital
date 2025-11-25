"use client";

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: number;
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = 820 }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Disable scrolling and interactions on body when modal is open
      const originalOverflow = document.body.style.overflow;
      const originalPointerEvents = document.body.style.pointerEvents;
      
      document.body.style.overflow = 'hidden';
      document.body.style.pointerEvents = 'none';
      
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.pointerEvents = originalPointerEvents;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Only use portal in browser environment
  if (typeof window === 'undefined') return null;

  const modalContent = (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      onMouseMove={(e) => e.stopPropagation()}
    >
      <div 
        className="neubrutal-card"
        onClick={(e) => e.stopPropagation()}
        onMouseMove={(e) => e.stopPropagation()}
        style={{
          width: maxWidth,
          maxWidth: '90vw',
          minHeight: 200,
          maxHeight: '90vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: 20,
          background: '#ffffff',
          color: 'var(--nb-ink)',
          border: '6px solid var(--nb-border)',
          boxShadow: '14px 14px 0 rgba(11,61,43,0.95)',
          borderRadius: 12,
          cursor: 'default',
          position: 'relative',
          transform: 'none',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontWeight: 900, fontSize: '1.3rem', color: 'var(--nb-ink)' }}>{title}</div>
          <button className="neubrutal-btn" onClick={onClose}>Close</button>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
