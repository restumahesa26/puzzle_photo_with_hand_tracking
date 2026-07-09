'use client';

// =============================================================================
// PuzzleApp — Main orchestrator component (state machine)
// Phases: webcam → playing → solved → webcam
// =============================================================================

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GamePhase } from '@/types';
import { useWebcam } from '@/hooks/useWebcam';
import { useHandTracking } from '@/hooks/useHandTracking';
import { usePuzzle } from '@/hooks/usePuzzle';
import { sliceImage, shufflePieces, captureFullImage } from '@/lib/puzzleUtils';
import WebcamView from './WebcamView';
import PuzzleBoard from './PuzzleBoard';
import HandCursor from './HandCursor';
import CelebrationModal from './CelebrationModal';
import GlassPanel from './GlassPanel';

const BOARD_SIZE = 480; // pixels

export default function PuzzleApp() {
  const [phase, setPhase] = useState<GamePhase>('webcam');
  const [gridSize, setGridSize] = useState(3);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [fullImageUrl, setFullImageUrl] = useState<string>('');
  const [elapsedTime, setElapsedTime] = useState(0);

  // Refs
  const boardRectRef = useRef<DOMRect | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hooks
  const { videoRef, isReady: isWebcamReady, error: webcamError, stream } = useWebcam(isCameraActive);
  const {
    handState,
    isLoading: isHandTrackingLoading,
  } = useHandTracking(videoRef, isWebcamReady);
  const {
    pieces,
    setPieces,
    selectedPieceId,
    dragPosition,
    moveCount,
    solved,
    processHandInput,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    reset: resetPuzzle,
  } = usePuzzle();

  // =========================================================================
  // Timer management
  // =========================================================================
  const startTimer = useCallback(() => {
    setElapsedTime(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // =========================================================================
  // Phase transitions
  // =========================================================================

  /** Capture photo and start the puzzle */
  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    // Capture full image for ghost overlay and celebration
    const fullImg = captureFullImage(video);
    setFullImageUrl(fullImg);

    // Slice image into puzzle pieces
    const rawPieces = sliceImage(video, gridSize);
    const shuffled = shufflePieces(rawPieces);
    setPieces(shuffled);

    // Switch to playing phase
    setPhase('playing');
    startTimer();
  }, [videoRef, setPieces, startTimer, gridSize]);

  /** Handle solved state */
  useEffect(() => {
    if (solved && phase === 'playing') {
      stopTimer();
      // Small delay for the last piece animation to complete
      setTimeout(() => {
        setPhase('solved');
      }, 600);
    }
  }, [solved, phase, stopTimer]);

  /** Reset to webcam phase by reloading the page */
  const handlePlayAgain = useCallback(() => {
    window.location.reload();
  }, []);

  // =========================================================================
  // Stream attachment for Phase Changes
  // =========================================================================
  // React unmounts the video element when switching phases (WebcamView -> Mini PIP).
  // We must re-attach the MediaStream to the new video element.
  useEffect(() => {
    if (videoRef.current && stream) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [phase, stream, videoRef]);

  // =========================================================================
  // Hand input processing (runs every frame when hand is detected)
  // =========================================================================
  useEffect(() => {
    if (phase !== 'playing' || !handState || !boardRectRef.current) return;

    const pieceSize = BOARD_SIZE / gridSize;
    processHandInput(handState, boardRectRef.current, pieceSize, gridSize);
  }, [handState, phase, processHandInput, gridSize]);

  // Board rect callback
  const handleBoardRef = useCallback((rect: DOMRect | null) => {
    boardRectRef.current = rect;
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-950 via-gray-950 to-zinc-950">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-48 -right-48 w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-600/5 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      {/* Mini webcam during puzzle play (picture-in-picture) */}
      {phase === 'playing' && (
        <div className="fixed bottom-4 right-4 z-30">
          <GlassPanel className="p-1 w-40 aspect-video overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover rounded-xl"
              style={{ transform: 'scaleX(-1)' }}
              autoPlay
              playsInline
              muted
            />
            <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/50 backdrop-blur-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/70 text-[8px] font-medium">LIVE</span>
            </div>
          </GlassPanel>
        </div>
      )}

      {/* Hand cursor (always visible when hand is tracked) */}
      <HandCursor handState={handState} />

      {/* Main content area */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent tracking-tight">
            Puzzle Photo
          </h1>
          <p className="text-white/40 text-sm mt-1 tracking-wide">
            Hand Tracking Edition
          </p>
        </div>

        {/* Phase: Webcam (capture) */}
        {phase === 'webcam' && !isCameraActive && (
          <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-500 mt-8">
            <GlassPanel className="p-8 flex flex-col items-center gap-6 max-w-md w-full">
              <h2 className="text-xl font-medium text-white/90">Ukuran Puzzle</h2>
              <div className="flex gap-4">
                {[3, 4, 5].map((size) => (
                  <button
                    key={size}
                    onClick={() => setGridSize(size)}
                    className={`w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold transition-all duration-300 ${
                      gridSize === size 
                        ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30 scale-110' 
                        : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
                    }`}
                  >
                    {size}x{size}
                  </button>
                ))}
              </div>
            </GlassPanel>

            <button
              onClick={() => setIsCameraActive(true)}
              className="px-8 py-4 rounded-full font-bold tracking-wide uppercase
                         bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25
                         hover:shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all"
            >
              Nyalakan Kamera
            </button>
          </div>
        )}

        {phase === 'webcam' && isCameraActive && (
          <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
            <button
              onClick={() => setIsCameraActive(false)}
              className="text-white/60 hover:text-white/90 text-sm font-medium transition-colors mb-2 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Sembunyikan Kamera & Ganti Ukuran
            </button>
            <WebcamView
              videoRef={videoRef}
              isReady={isWebcamReady}
              error={webcamError}
              isHandTrackingLoading={isHandTrackingLoading}
              onCapture={handleCapture}
              handState={handState}
            />
          </div>
        )}

        {/* Phase: Playing (puzzle board) */}
        {phase === 'playing' && (
          <PuzzleBoard
            pieces={pieces}
            selectedPieceId={selectedPieceId}
            dragPosition={dragPosition}
            moveCount={moveCount}
            elapsedTime={elapsedTime}
            fullImageUrl={fullImageUrl}
            gridSize={gridSize}
            boardSize={BOARD_SIZE}
            onBoardRef={handleBoardRef}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          />
        )}

        {/* Phase: Solved (celebration) */}
        {phase === 'solved' && (
          <CelebrationModal
            moveCount={moveCount}
            elapsedTime={elapsedTime}
            fullImageUrl={fullImageUrl}
            onPlayAgain={handlePlayAgain}
          />
        )}
      </main>
    </div>
  );
}
