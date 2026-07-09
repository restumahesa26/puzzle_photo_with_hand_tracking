'use client';

// =============================================================================
// Main page — renders the PuzzleApp as the sole content
// The entire app requires browser APIs (webcam, MediaPipe, canvas)
// so this must be a client component.
// =============================================================================

import PuzzleApp from '@/components/PuzzleApp';

export default function Home() {
  return <PuzzleApp />;
}
