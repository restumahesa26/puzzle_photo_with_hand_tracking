'use client';

// =============================================================================
// GlassPanel — Reusable glassmorphism container component
// =============================================================================

import React from 'react';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  /** 'dark' uses darker background, 'light' uses lighter */
  variant?: 'dark' | 'light';
}

export default function GlassPanel({
  children,
  className = '',
  variant = 'dark',
}: GlassPanelProps) {
  const baseClasses =
    'rounded-2xl border backdrop-blur-xl shadow-2xl';

  const variantClasses =
    variant === 'dark'
      ? 'bg-black/40 border-white/10 shadow-black/20'
      : 'bg-white/10 border-white/20 shadow-white/5';

  return (
    <div className={`${baseClasses} ${variantClasses} ${className}`}>
      {children}
    </div>
  );
}
