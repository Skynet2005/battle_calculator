'use client';

import type { ReactNode, CSSProperties } from 'react';

interface TooltipProps {
  text: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const positionStyles: Record<string, CSSProperties> = {
  top: {
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginBottom: 8,
  },
  bottom: {
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginTop: 8,
  },
  left: {
    right: '100%',
    top: '50%',
    transform: 'translateY(-50%)',
    marginRight: 8,
  },
  right: {
    left: '100%',
    top: '50%',
    transform: 'translateY(-50%)',
    marginLeft: 8,
  },
};

const arrowStyles: Record<string, CSSProperties> = {
  top: {
    bottom: -4,
    left: '50%',
    transform: 'translateX(-50%) rotate(45deg)',
  },
  bottom: {
    top: -4,
    left: '50%',
    transform: 'translateX(-50%) rotate(45deg)',
  },
  left: {
    right: -4,
    top: '50%',
    transform: 'translateY(-50%) rotate(45deg)',
  },
  right: {
    left: -4,
    top: '50%',
    transform: 'translateY(-50%) rotate(45deg)',
  },
};

export default function Tooltip({ text, children, position = 'top' }: TooltipProps) {
  return (
    <span className="tooltip-wrapper" style={{ position: 'relative', display: 'inline-flex' }}>
      {children}
      <span
        className="tooltip-bubble"
        role="tooltip"
        style={{
          position: 'absolute',
          ...positionStyles[position],
          visibility: 'hidden',
          opacity: 0,
          transition: 'opacity 0.15s ease, visibility 0.15s ease',
          pointerEvents: 'none',
          zIndex: 50,
          whiteSpace: 'nowrap',
          padding: '6px 10px',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 500,
          lineHeight: 1.4,
          color: '#fff',
          backgroundColor: '#1e293b',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        }}
      >
        {text}
        <span
          style={{
            position: 'absolute',
            width: 8,
            height: 8,
            backgroundColor: '#1e293b',
            ...arrowStyles[position],
          }}
        />
      </span>

      <style>{`
        .tooltip-wrapper:hover .tooltip-bubble {
          visibility: visible !important;
          opacity: 1 !important;
        }
      `}</style>
    </span>
  );
}
