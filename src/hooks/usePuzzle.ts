'use client';

// =============================================================================
// usePuzzle — Manages puzzle piece state, drag-and-swap, and solve detection
// =============================================================================

import { useState, useCallback, useRef } from 'react';
import { PuzzlePiece, HandState } from '@/types';
import { mapToScreen, getGridCell } from '@/lib/handUtils';
import { isSolved } from '@/lib/puzzleUtils';

interface UsePuzzleReturn {
  /** Current state of all puzzle pieces */
  pieces: PuzzlePiece[];
  /** Set pieces (after slicing and shuffling) */
  setPieces: (pieces: PuzzlePiece[]) => void;
  /** ID of the currently selected/dragged piece, or null */
  selectedPieceId: number | null;
  /** Current drag position in pixels (for the floating piece) */
  dragPosition: { x: number; y: number } | null;
  /** Number of moves made */
  moveCount: number;
  /** Whether the puzzle is solved */
  solved: boolean;
  /** Process hand state to update drag/drop logic */
  processHandInput: (
    handState: HandState,
    boardRect: DOMRect,
    pieceSize: number,
    gridSize: number
  ) => void;
  /** Handle starting drag from mouse/touch */
  handleDragStart: (boardX: number, boardY: number, pieceSize: number, gridSize: number) => void;
  /** Handle moving drag from mouse/touch */
  handleDragMove: (boardX: number, boardY: number) => void;
  /** Handle ending drag from mouse/touch */
  handleDragEnd: (boardX: number, boardY: number, pieceSize: number, gridSize: number) => void;
  /** Reset puzzle state */
  reset: () => void;
}

export function usePuzzle(): UsePuzzleReturn {
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [selectedPieceId, setSelectedPieceId] = useState<number | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const [solved, setSolved] = useState(false);

  // Track previous pinch state to detect transitions
  const wasPinchingRef = useRef(false);

  const reset = useCallback(() => {
    setPieces([]);
    setSelectedPieceId(null);
    setDragPosition(null);
    setMoveCount(0);
    setSolved(false);
    wasPinchingRef.current = false;
  }, []);

  const handleDragStart = useCallback(
    (boardX: number, boardY: number, pieceSize: number, gridSize: number) => {
      if (solved) return;
      const cell = getGridCell(boardX, boardY, pieceSize, gridSize);
      if (cell) {
        const piece = pieces.find(
          (p) => p.currentRow === cell.row && p.currentCol === cell.col
        );
        if (piece) {
          setSelectedPieceId(piece.id);
          setDragPosition({ x: boardX, y: boardY });
        }
      }
    },
    [pieces, solved]
  );

  const handleDragMove = useCallback(
    (boardX: number, boardY: number) => {
      if (solved || selectedPieceId === null) return;
      setDragPosition({ x: boardX, y: boardY });
    },
    [solved, selectedPieceId]
  );

  const handleDragEnd = useCallback(
    (boardX: number, boardY: number, pieceSize: number, gridSize: number) => {
      if (solved || selectedPieceId === null) return;
      const cell = getGridCell(boardX, boardY, pieceSize, gridSize);

      if (cell) {
        setPieces((prevPieces) => {
          const draggedPiece = prevPieces.find((p) => p.id === selectedPieceId);
          const targetPiece = prevPieces.find(
            (p) => p.currentRow === cell.row && p.currentCol === cell.col
          );

          if (draggedPiece && targetPiece && draggedPiece.id !== targetPiece.id) {
            // Swap the two pieces
            const newPieces = prevPieces.map((p) => {
              if (p.id === draggedPiece.id) {
                return {
                  ...p,
                  currentRow: targetPiece.currentRow,
                  currentCol: targetPiece.currentCol,
                };
              }
              if (p.id === targetPiece.id) {
                return {
                  ...p,
                  currentRow: draggedPiece.currentRow,
                  currentCol: draggedPiece.currentCol,
                };
              }
              return p;
            });

            setMoveCount((prev) => prev + 1);

            // Check if solved after swap
            if (isSolved(newPieces)) {
              setSolved(true);
            }

            return newPieces;
          } else if (draggedPiece && !targetPiece) {
            // Dropped in an empty cell within the grid — snap to it
            const newPieces = prevPieces.map((p) => {
              if (p.id === draggedPiece.id) {
                return { ...p, currentRow: cell.row, currentCol: cell.col };
              }
              return p;
            });

            setMoveCount((prev) => prev + 1);

            if (isSolved(newPieces)) {
              setSolved(true);
            }

            return newPieces;
          }

          return prevPieces;
        });
      }

      // Clear selection
      setSelectedPieceId(null);
      setDragPosition(null);
    },
    [selectedPieceId, solved]
  );

  const processHandInput = useCallback(
    (
      handState: HandState,
      boardRect: DOMRect,
      pieceSize: number,
      gridSize: number
    ) => {
      if (solved) return;

      // Map normalized hand coordinates to board-relative pixel coordinates
      const screenPos = mapToScreen(
        handState.indexTip.x,
        handState.indexTip.y,
        window.innerWidth,
        window.innerHeight
      );

      // Convert to board-relative coordinates
      const boardX = screenPos.x - boardRect.left;
      const boardY = screenPos.y - boardRect.top;

      const wasPinching = wasPinchingRef.current;
      const isPinching = handState.isPinching;

      // PINCH START: Select a piece
      if (isPinching && !wasPinching) {
        handleDragStart(boardX, boardY, pieceSize, gridSize);
      }
      // PINCH HOLD: Move the selected piece
      else if (isPinching && wasPinching) {
        handleDragMove(boardX, boardY);
      }
      // PINCH RELEASE: Drop and swap
      else if (!isPinching && wasPinching) {
        handleDragEnd(boardX, boardY, pieceSize, gridSize);
      }

      wasPinchingRef.current = isPinching;
    },
    [solved, handleDragStart, handleDragMove, handleDragEnd]
  );

  return {
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
    reset,
  };
}
