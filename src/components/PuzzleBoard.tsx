'use client';

// =============================================================================
// PuzzleBoard — Renders the 3×3 puzzle grid with drag-and-swap interaction
// =============================================================================

import React, { useRef, useEffect, useCallback } from 'react';
import { PuzzlePiece, HandState } from '@/types';
import GlassPanel from './GlassPanel';

interface PuzzleBoardProps {
  pieces: PuzzlePiece[];
  selectedPieceId: number | null;
  dragPosition: { x: number; y: number } | null;
  moveCount: number;
  elapsedTime: number;
  fullImageUrl: string;
  gridSize: number;
  boardSize: number;
  onBoardRef: (rect: DOMRect | null) => void;
  onDragStart: (boardX: number, boardY: number, pieceSize: number, gridSize: number) => void;
  onDragMove: (boardX: number, boardY: number) => void;
  onDragEnd: (boardX: number, boardY: number, pieceSize: number, gridSize: number) => void;
}

const PuzzleBoard = React.memo(function PuzzleBoard({
  pieces,
  selectedPieceId,
  dragPosition,
  moveCount,
  elapsedTime,
  fullImageUrl,
  gridSize,
  boardSize,
  onBoardRef,
  onDragStart,
  onDragMove,
  onDragEnd,
}: PuzzleBoardProps) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const pieceSize = boardSize / gridSize;

  // Report board rect to parent whenever it changes
  const updateBoardRect = useCallback(() => {
    if (boardRef.current) {
      onBoardRef(boardRef.current.getBoundingClientRect());
    }
  }, [onBoardRef]);

  // Pointer events handlers for mouse and touch drag-and-drop
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    onDragStart(x, y, pieceSize, gridSize);
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [onDragStart, pieceSize, gridSize]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (selectedPieceId === null || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    onDragMove(x, y);
  }, [selectedPieceId, onDragMove]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (selectedPieceId === null || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    onDragEnd(x, y, pieceSize, gridSize);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {
      // Ignore
    }
  }, [selectedPieceId, onDragEnd, pieceSize, gridSize]);

  useEffect(() => {
    updateBoardRect();
    window.addEventListener('resize', updateBoardRect);
    return () => window.removeEventListener('resize', updateBoardRect);
  }, [updateBoardRect]);

  // Format elapsed time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Stats bar */}
      <div className="flex items-center gap-6">
        <GlassPanel variant="light" className="flex items-center gap-2 px-4 py-2">
          <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          <span className="text-white/70 text-xs font-medium tracking-wide">MOVES</span>
          <span className="text-white font-bold text-lg tabular-nums">{moveCount}</span>
        </GlassPanel>

        <GlassPanel variant="light" className="flex items-center gap-2 px-4 py-2">
          <svg className="w-4 h-4 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-white/70 text-xs font-medium tracking-wide">TIME</span>
          <span className="text-white font-bold text-lg tabular-nums">{formatTime(elapsedTime)}</span>
        </GlassPanel>
      </div>

      {/* Puzzle board */}
      <GlassPanel className="p-2 relative">
        <div
          ref={boardRef}
          className="relative select-none touch-none"
          style={{ width: boardSize, height: boardSize, touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Ghost overlay showing target image at low opacity */}
          <div
            className="absolute inset-0 rounded-lg overflow-hidden opacity-15 pointer-events-none"
            style={{
              backgroundImage: `url(${fullImageUrl})`,
              backgroundSize: 'cover',
            }}
          />

          {/* Grid lines */}
          <div className="absolute inset-0 pointer-events-none z-10">
            {Array.from({ length: gridSize - 1 }).map((_, i) => (
              <React.Fragment key={i}>
                {/* Vertical line */}
                <div
                  className="absolute top-0 bottom-0 w-px bg-white/10"
                  style={{ left: (i + 1) * pieceSize }}
                />
                {/* Horizontal line */}
                <div
                  className="absolute left-0 right-0 h-px bg-white/10"
                  style={{ top: (i + 1) * pieceSize }}
                />
              </React.Fragment>
            ))}
          </div>

          {/* Puzzle pieces */}
          {pieces.map((piece) => {
            const isSelected = piece.id === selectedPieceId;
            const isDragging = isSelected && dragPosition;

            // Position: either at the drag position or snapped to grid cell
            const left = isDragging
              ? dragPosition.x - pieceSize / 2
              : piece.currentCol * pieceSize;
            const top = isDragging
              ? dragPosition.y - pieceSize / 2
              : piece.currentRow * pieceSize;

            return (
              <div
                key={piece.id}
                className={`absolute overflow-hidden select-none cursor-grab active:cursor-grabbing ${
                  isDragging
                    ? 'z-30 scale-105 shadow-2xl shadow-violet-500/40 cursor-grabbing'
                    : 'z-20 shadow-md'
                } ${
                  !isDragging ? 'transition-all duration-300 ease-out' : ''
                } ${
                  isSelected && !isDragging
                    ? 'ring-2 ring-violet-400/60'
                    : ''
                }`}
                style={{
                  width: pieceSize - 2,
                  height: pieceSize - 2,
                  left: left + 1,
                  top: top + 1,
                  borderRadius: 6,
                }}
              >
                <img
                  src={piece.imageDataUrl}
                  alt={`Puzzle piece ${piece.id}`}
                  className="w-full h-full object-cover pointer-events-none"
                  draggable={false}
                />

                {/* Subtle overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                {/* Glow effect when being dragged */}
                {isDragging && (
                  <div className="absolute inset-0 border-2 border-violet-400/50 rounded-md pointer-events-none" />
                )}
              </div>
            );
          })}
        </div>
      </GlassPanel>

      {/* Instructions */}
      <GlassPanel variant="light" className="px-5 py-2.5 max-w-sm">
        <p className="text-white/50 text-[11px] text-center leading-relaxed">
          <span className="text-emerald-300">Gesture (1 jari telunjuk + 1 tengah naik)</span> atau <span className="text-violet-300">Drag Mouse</span> untuk menggeser &rarr; Lepaskan untuk menukar kepingan
        </p>
      </GlassPanel>
    </div>
  );
});

export default PuzzleBoard;
