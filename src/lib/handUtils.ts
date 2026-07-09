// =============================================================================
// Hand tracking utility functions: pinch detection and coordinate mapping
// =============================================================================

import { HandState } from '@/types';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

/** Distance ratio thresholds for finger extension */
const GRAB_THRESHOLD = 1.1;    // Ratio > 1.1 means finger is extended
const RELEASE_THRESHOLD = 0.95; // Ratio < 0.95 means finger is curled

/**
 * Computes the Euclidean distance between two normalized landmarks.
 */
function distance(
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * Extracts hand state from MediaPipe landmarks.
 * Detects grab gesture when the middle finger is raised (extended).
 *
 * @param landmarks - Array of 21 normalized hand landmarks from MediaPipe
 * @param wasPinching - Previous pinching state for hysteresis
 * @returns HandState object with positions and pinch status
 */
export function extractHandState(
  landmarks: NormalizedLandmark[],
  wasPinching: boolean
): HandState {
  const wrist = landmarks[0];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const middlePip = landmarks[10];

  // Calculate distance from wrist to determine if middle finger is extended
  const tipDist = distance(wrist, middleTip);
  const pipDist = distance(wrist, middlePip);
  
  // Ratio > 1 means the tip is further from the wrist than the PIP joint (finger is straight/up)
  const ratio = pipDist > 0 ? tipDist / pipDist : 0;

  // Use hysteresis to prevent flickering
  let isPinching = wasPinching;
  if (wasPinching) {
    if (ratio < RELEASE_THRESHOLD) isPinching = false;
  } else {
    if (ratio > GRAB_THRESHOLD) isPinching = true;
  }

  // Fist detection: all 4 fingers (index, middle, ring, pinky) are curled.
  const isFingerCurled = (tipIdx: number, pipIdx: number) => {
    return distance(wrist, landmarks[tipIdx]) < distance(wrist, landmarks[pipIdx]);
  };
  const isFist = 
    isFingerCurled(8, 6) &&   // Index
    isFingerCurled(12, 10) && // Middle
    isFingerCurled(16, 14) && // Ring
    isFingerCurled(20, 18);   // Pinky

  return {
    indexTip: { x: indexTip.x, y: indexTip.y },
    middleTip: { x: middleTip.x, y: middleTip.y },
    isPinching,
    isFist,
    landmarks: landmarks.map((l) => ({ x: l.x, y: l.y, z: l.z })),
  };
}

/**
 * Maps a normalized landmark coordinate [0,1] to pixel position
 * within a container, with X-axis mirroring for natural interaction.
 *
 * @param normalizedX - X coordinate from MediaPipe (0-1, left-right in camera space)
 * @param normalizedY - Y coordinate from MediaPipe (0-1, top-bottom)
 * @param containerWidth - Width of the target container in pixels
 * @param containerHeight - Height of the target container in pixels
 * @returns Pixel coordinates { x, y }
 */
export function mapToScreen(
  normalizedX: number,
  normalizedY: number,
  containerWidth: number,
  containerHeight: number
): { x: number; y: number } {
  // Mirror X so left hand movement maps to left on screen
  return {
    x: (1 - normalizedX) * containerWidth,
    y: normalizedY * containerHeight,
  };
}

/**
 * Determines which grid cell a pixel position falls into.
 *
 * @param x - Pixel X position
 * @param y - Pixel Y position
 * @param pieceSize - Size of each grid cell in pixels
 * @param gridSize - Number of rows/columns
 * @returns { row, col } or null if outside the grid
 */
export function getGridCell(
  x: number,
  y: number,
  pieceSize: number,
  gridSize: number
): { row: number; col: number } | null {
  const col = Math.floor(x / pieceSize);
  const row = Math.floor(y / pieceSize);

  if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
    return { row, col };
  }
  return null;
}
