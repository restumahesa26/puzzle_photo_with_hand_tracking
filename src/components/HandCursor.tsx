'use client';

// =============================================================================
// HandCursor — Visual indicator following the user's index finger position
// =============================================================================

import React from 'react';
import { HandState } from '@/types';
import { mapToScreen } from '@/lib/handUtils';

interface HandCursorProps {
  handState: HandState | null;
}

export default function HandCursor({ handState }: HandCursorProps) {
  if (!handState) return null;

  // Map normalized coordinates to screen pixels
  const pos = mapToScreen(
    handState.indexTip.x,
    handState.indexTip.y,
    window.innerWidth,
    window.innerHeight
  );

  return (
    <div
      className="fixed pointer-events-none z-50 transition-transform duration-75 flex items-center justify-center"
      style={{
        left: pos.x,
        top: pos.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Outer glow ring */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-200 ${
          handState.isPinching
            ? 'w-12 h-12 bg-emerald-400/30 shadow-[0_0_20px_rgba(52,211,153,0.5)]'
            : 'w-8 h-8 bg-violet-400/20 shadow-[0_0_15px_rgba(167,139,250,0.3)]'
        }`}
      />

      {/* Inner dot */}
      <div
        className={`relative flex items-center justify-center rounded-full transition-all duration-150 ${
          handState.isPinching
            ? 'w-6 h-6 bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)] scale-110'
            : 'w-4 h-4 bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.6)]'
        }`}
      >
        {/* Center highlight */}
        <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
      </div>

      {/* Pinch indicator text */}
      {handState.isPinching && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 text-[10px] font-medium text-emerald-300 whitespace-nowrap tracking-wider uppercase">
          Grab
        </div>
      )}
    </div>
  );
}
