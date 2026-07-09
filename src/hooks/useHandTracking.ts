'use client';

// =============================================================================
// useHandTracking — MediaPipe HandLandmarker lifecycle and detection loop
// =============================================================================

import { useRef, useState, useEffect, useCallback } from 'react';
import { HandState } from '@/types';
import { extractHandState } from '@/lib/handUtils';

interface UseHandTrackingReturn {
  /** Current hand state (position, pinch) — null if no hand detected */
  handState: HandState | null;
  /** Whether the MediaPipe model is still loading */
  isLoading: boolean;
  /** Error message if initialization failed */
  error: string | null;
}

export function useHandTracking(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  isVideoReady: boolean
): UseHandTrackingReturn {
  const [handState, setHandState] = useState<HandState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs to avoid stale closures in the animation loop
  const handLandmarkerRef = useRef<import('@mediapipe/tasks-vision').HandLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const wasPinchingRef = useRef<boolean>(false);

  // Initialize HandLandmarker
  const initHandLandmarker = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Dynamic import to avoid SSR issues
      const { FilesetResolver, HandLandmarker } = await import(
        '@mediapipe/tasks-vision'
      );

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      const landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      handLandmarkerRef.current = landmarker;
      setIsLoading(false);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to initialize hand tracking';
      setError(message);
      setIsLoading(false);
      console.error('HandLandmarker init error:', err);
    }
  }, []);

  const lastDetectionTimeRef = useRef<number>(0);

  // Detection loop using requestAnimationFrame
  const detectLoop = useCallback(() => {
    const video = videoRef.current;
    const landmarker = handLandmarkerRef.current;

    if (!video || !landmarker || video.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(detectLoop);
      return;
    }

    // Only process when we have a new frame
    if (video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime;

      try {
        const now = performance.now();
        const results = landmarker.detectForVideo(video, now);

        if (results.landmarks && results.landmarks.length > 0) {
          const state = extractHandState(
            results.landmarks[0],
            wasPinchingRef.current
          );
          wasPinchingRef.current = state.isPinching;
          setHandState(state);
        } else {
          setHandState(null);
          wasPinchingRef.current = false;
        }
      } catch (err) {
        console.error('Detection error:', err);
      }
    }

    animationFrameRef.current = requestAnimationFrame(detectLoop);
  }, [videoRef]);

  // Start/stop the detection loop based on video readiness
  useEffect(() => {
    if (isVideoReady && handLandmarkerRef.current && !isLoading) {
      animationFrameRef.current = requestAnimationFrame(detectLoop);
    }

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isVideoReady, isLoading, detectLoop]);

  // Initialize on mount
  useEffect(() => {
    initHandLandmarker();

    return () => {
      // Cleanup: close the landmarker and cancel animation frame
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
        handLandmarkerRef.current = null;
      }
    };
  }, [initHandLandmarker]);

  return { handState, isLoading, error };
}
