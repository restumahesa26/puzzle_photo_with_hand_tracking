// =============================================================================
// Puzzle utility functions: image slicing, shuffling, and solve checking
// =============================================================================

import { PuzzlePiece } from '@/types';

/**
 * Captures the current video frame and slices it into a grid of puzzle pieces.
 *
 * @param video - The HTMLVideoElement to capture from
 * @param gridSize - Number of rows/columns (e.g., 3 for 3x3)
 * @returns Array of PuzzlePiece objects with image data URLs
 */
export function sliceImage(
  video: HTMLVideoElement,
  gridSize: number
): PuzzlePiece[] {
  // Create a hidden canvas to capture the full video frame
  const fullCanvas = document.createElement('canvas');
  const fullCtx = fullCanvas.getContext('2d')!;

  // Use a square crop from the center of the video
  // Fallback to explicit attributes or default 640x480 if videoWidth is 0
  const videoWidth = video.videoWidth || video.width || 640;
  const videoHeight = video.videoHeight || video.height || 480;
  const cropSize = Math.max(1, Math.min(videoWidth, videoHeight));
  const offsetX = Math.max(0, (videoWidth - cropSize) / 2);
  const offsetY = Math.max(0, (videoHeight - cropSize) / 2);

  // Set canvas to a reasonable resolution for puzzle pieces
  const canvasSize = 600;
  fullCanvas.width = canvasSize;
  fullCanvas.height = canvasSize;

  // Draw the cropped, centered square from the video (mirrored)
  fullCtx.save();
  fullCtx.translate(canvasSize, 0);
  fullCtx.scale(-1, 1);
  fullCtx.drawImage(
    video,
    offsetX, offsetY, cropSize, cropSize,
    0, 0, canvasSize, canvasSize
  );
  fullCtx.restore();

  // Slice into pieces
  const pieceSize = canvasSize / gridSize;
  const pieces: PuzzlePiece[] = [];

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const pieceCanvas = document.createElement('canvas');
      pieceCanvas.width = pieceSize;
      pieceCanvas.height = pieceSize;
      const pieceCtx = pieceCanvas.getContext('2d')!;

      pieceCtx.drawImage(
        fullCanvas,
        col * pieceSize, row * pieceSize, pieceSize, pieceSize,
        0, 0, pieceSize, pieceSize
      );

      pieces.push({
        id: row * gridSize + col,
        correctRow: row,
        correctCol: col,
        currentRow: row,
        currentCol: col,
        imageDataUrl: pieceCanvas.toDataURL('image/jpeg', 0.9),
      });
    }
  }

  return pieces;
}

/**
 * Captures the full video frame as a single data URL (for the ghost overlay).
 */
export function captureFullImage(video: HTMLVideoElement): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const videoWidth = video.videoWidth || video.width || 640;
  const videoHeight = video.videoHeight || video.height || 480;
  const cropSize = Math.max(1, Math.min(videoWidth, videoHeight));
  const offsetX = Math.max(0, (videoWidth - cropSize) / 2);
  const offsetY = Math.max(0, (videoHeight - cropSize) / 2);

  const canvasSize = 600;
  canvas.width = canvasSize;
  canvas.height = canvasSize;

  // Mirror the image
  ctx.save();
  ctx.translate(canvasSize, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(
    video,
    offsetX, offsetY, cropSize, cropSize,
    0, 0, canvasSize, canvasSize
  );
  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.9);
}

/**
 * Shuffles puzzle pieces using Fisher-Yates algorithm.
 * Ensures the resulting permutation is solvable (even number of inversions).
 *
 * @param pieces - Array of puzzle pieces to shuffle
 * @returns New array with shuffled currentRow/currentCol values
 */
export function shufflePieces(pieces: PuzzlePiece[]): PuzzlePiece[] {
  const gridSize = Math.sqrt(pieces.length);
  // Create an array of position indices and shuffle them
  const positions = pieces.map((_, i) => i);

  // Fisher-Yates shuffle
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  // Check solvability: count inversions
  let inversions = 0;
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      if (positions[i] > positions[j]) {
        inversions++;
      }
    }
  }

  // If odd number of inversions, swap first two elements to make it even
  if (inversions % 2 !== 0) {
    [positions[0], positions[1]] = [positions[1], positions[0]];
  }

  // If the shuffle results in the solved state, force a swap
  const isSorted = positions.every((pos, idx) => pos === idx);
  if (isSorted) {
    [positions[0], positions[1]] = [positions[1], positions[0]];
    [positions[2], positions[3]] = [positions[3], positions[2]];
  }

  // Apply shuffled positions to pieces
  return pieces.map((piece, index) => {
    const newPosIndex = positions[index];
    return {
      ...piece,
      currentRow: Math.floor(newPosIndex / gridSize),
      currentCol: newPosIndex % gridSize,
    };
  });
}

/**
 * Checks if all puzzle pieces are in their correct positions.
 */
export function isSolved(pieces: PuzzlePiece[]): boolean {
  return pieces.every(
    (piece) =>
      piece.currentRow === piece.correctRow &&
      piece.currentCol === piece.correctCol
  );
}
