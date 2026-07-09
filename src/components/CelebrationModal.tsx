'use client';

// =============================================================================
// CelebrationModal — Win screen with confetti animation
// =============================================================================

import React, { useEffect, useState } from 'react';
import GlassPanel from './GlassPanel';

interface CelebrationModalProps {
  moveCount: number;
  elapsedTime: number;
  fullImageUrl: string;
  onPlayAgain: () => void;
}

/** Generate random confetti particles */
function generateConfetti(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 2 + Math.random() * 3,
    size: 6 + Math.random() * 8,
    color: [
      '#a78bfa', '#c084fc', '#f472b6', '#fb923c',
      '#34d399', '#38bdf8', '#facc15', '#f87171',
    ][Math.floor(Math.random() * 8)],
    rotation: Math.random() * 360,
  }));
}

export default function CelebrationModal({
  moveCount,
  elapsedTime,
  fullImageUrl,
  onPlayAgain,
}: CelebrationModalProps) {
  const [confetti, setConfetti] = useState<ReturnType<typeof generateConfetti>>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setConfetti(generateConfetti(60));
    // Trigger entrance animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`fixed inset-0 z-40 flex items-center justify-center transition-all duration-700 ${
        visible ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent'
      }`}
    >
      {/* Confetti */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
        {confetti.map((particle) => (
          <div
            key={particle.id}
            className="absolute animate-confetti-fall"
            style={{
              left: `${particle.left}%`,
              top: '-20px',
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              transform: `rotate(${particle.rotation}deg)`,
            }}
          />
        ))}
      </div>

      {/* Modal */}
      <GlassPanel
        className={`relative z-50 flex flex-col items-center gap-6 p-8 max-w-sm mx-4 transition-all duration-700 ${
          visible
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-90 translate-y-8'
        }`}
      >
        {/* Trophy icon */}
        <div className="text-6xl animate-bounce-slow">🏆</div>

        {/* Title */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Puzzle Solved!
          </h2>
          <p className="text-white/50 text-sm mt-1">
            Congratulations, you did it!
          </p>
        </div>

        {/* Completed image */}
        <div className="w-40 h-40 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg">
          <img
            src={fullImageUrl}
            alt="Completed puzzle"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Stats */}
        <div className="flex gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-violet-400 tabular-nums">
              {moveCount}
            </div>
            <div className="text-white/40 text-xs font-medium uppercase tracking-wider mt-0.5">
              Moves
            </div>
          </div>
          <div className="w-px bg-white/10" />
          <div className="text-center">
            <div className="text-2xl font-bold text-fuchsia-400 tabular-nums">
              {formatTime(elapsedTime)}
            </div>
            <div className="text-white/40 text-xs font-medium uppercase tracking-wider mt-0.5">
              Time
            </div>
          </div>
        </div>

        {/* Play Again button */}
        <button
          onClick={onPlayAgain}
          className="w-full px-6 py-3 rounded-full font-semibold text-sm tracking-wider uppercase
                     bg-gradient-to-r from-violet-600 to-fuchsia-600
                     text-white shadow-lg shadow-violet-500/25
                     hover:shadow-xl hover:shadow-violet-500/40
                     hover:from-violet-500 hover:to-fuchsia-500
                     active:scale-95
                     transition-all duration-300 ease-out"
        >
          Play Again
        </button>
      </GlassPanel>
    </div>
  );
}
