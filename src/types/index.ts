// =============================================================================
// TypeScript interfaces for the Puzzle Photo Hand Tracking app
// =============================================================================

/** The three phases of the application state machine */
export type GamePhase = 'webcam' | 'playing' | 'solved';

/** Represents a single puzzle piece with its position and image data */
export interface PuzzlePiece {
  /** Unique identifier (0-8 for a 3x3 grid) */
  id: number;
  /** The row this piece belongs to in the solved state */
  correctRow: number;
  /** The column this piece belongs to in the solved state */
  correctCol: number;
  /** Current row position on the board */
  currentRow: number;
  /** Current column position on the board */
  currentCol: number;
  /** Base64 data URL of the cropped image for this piece */
  imageDataUrl: string;
}

/** Tracked state of the user's hand from MediaPipe */
export interface HandState {
  /** Screen-space position of the index finger tip (landmark 8) */
  indexTip: { x: number; y: number };
  /** Screen-space position of the middle finger tip (landmark 12) */
  middleTip: { x: number; y: number };
  /** Whether the user is currently pinching (grab gesture) */
  isPinching: boolean;
  /** Whether the user's hand is closed in a fist */
  isFist: boolean;
  /** Normalized landmarks for all 21 hand points */
  landmarks: { x: number; y: number; z: number }[] | null;
}

/** Configuration for the puzzle grid */
export interface PuzzleConfig {
  /** Number of rows/columns in the grid (e.g., 3 for 3x3) */
  gridSize: number;
  /** Pixel size of each puzzle piece */
  pieceSize: number;
  /** Total pixel size of the puzzle board */
  boardSize: number;
}
