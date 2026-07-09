'use client';

// =============================================================================
// WebcamView — Live webcam feed with capture button
// =============================================================================

import React, { useState, useEffect } from 'react';
import GlassPanel from './GlassPanel';
import { HandState } from '@/types';

interface WebcamViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isReady: boolean;
  error: string | null;
  isHandTrackingLoading: boolean;
  onCapture: () => void;
  handState?: HandState | null;
}

const WebcamView = React.memo(function WebcamView({
  videoRef,
  isReady,
  error,
  isHandTrackingLoading,
  onCapture,
  handState,
}: WebcamViewProps) {
  const [countdown, setCountdown] = useState<number | null>(null);

  // Trigger countdown when a fist is detected
  useEffect(() => {
    if (handState?.isFist && countdown === null && isReady) {
      setCountdown(3);
    }
  }, [handState?.isFist, countdown, isReady]);



  // Handle countdown timer
  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown === 0) {
      onCapture();
      setCountdown(null);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((c) => (c !== null && c > 0 ? c - 1 : null));
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [countdown, onCapture]);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Webcam container */}
      <GlassPanel className="relative overflow-hidden p-1.5 w-full max-w-[640px] aspect-square">
        {/* Loading overlay */}
        {!isReady && !error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/60 rounded-xl">
            <div className="w-10 h-10 border-3 border-violet-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-white/80 text-sm font-medium tracking-wide">
              Initializing Camera...
            </p>
          </div>
        )}

        {/* Countdown overlay */}
        {countdown !== null && countdown > 0 && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-xl transition-all">
            <span className="text-9xl font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.8)] animate-ping">
              {countdown}
            </span>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/70 rounded-xl px-8">
            <div className="text-4xl">📷</div>
            <p className="text-red-400 text-center text-sm font-medium">
              {error}
            </p>
            <p className="text-white/50 text-xs text-center">
              Please allow camera access and reload the page
            </p>
          </div>
        )}

        {/* Video element (mirrored for natural interaction) */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover rounded-xl"
          style={{ transform: 'scaleX(-1)' }}
          autoPlay
          playsInline
          muted
        />

        {/* Status badge */}
        {isReady && (
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/80 text-xs font-medium tracking-wide">
              LIVE
            </span>
          </div>
        )}

        {/* Hand tracking loading badge */}
        {isHandTrackingLoading && (
          <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
            <div className="w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-white/60 text-xs font-medium">
              Loading AI...
            </span>
          </div>
        )}
      </GlassPanel>

      {/* Capture button */}
      <button
        onClick={onCapture}
        disabled={!isReady}
        className="group relative px-8 py-3.5 rounded-full font-semibold text-sm tracking-wider uppercase
                   bg-gradient-to-r from-violet-600 to-fuchsia-600
                   text-white shadow-lg shadow-violet-500/25
                   hover:shadow-xl hover:shadow-violet-500/40
                   hover:from-violet-500 hover:to-fuchsia-500
                   active:scale-95
                   disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-lg
                   transition-all duration-300 ease-out"
      >
        {/* Pulse ring animation */}
        <span className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300" />
        <span className="relative flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Capture Photo
        </span>
      </button>

      {/* Instructions */}
      <GlassPanel variant="light" className="px-6 py-3 max-w-md">
        <p className="text-white/60 text-xs text-center leading-relaxed">
          Position your face in the frame. Click{' '}
          <span className="text-violet-300 font-medium">Capture Photo</span> or 
          <span className="text-emerald-300 font-medium"> kepalkan tangan (fist) </span>
          selama 3 detik untuk mengambil gambar.
        </p>
      </GlassPanel>
    </div>
  );
});

export default WebcamView;
