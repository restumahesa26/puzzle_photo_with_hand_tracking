'use client';

// =============================================================================
// useWebcam — Manages webcam stream lifecycle with proper cleanup
// =============================================================================

import { useRef, useState, useEffect, useCallback } from 'react';

interface UseWebcamReturn {
  /** Ref to attach to the <video> element */
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** Whether the webcam stream is ready and playing */
  isReady: boolean;
  /** Error message if webcam access failed */
  error: string | null;
  /** Restart the webcam stream (e.g., after capture) */
  restart: () => void;
  /** The current media stream */
  stream: MediaStream | null;
}

export function useWebcam(isActive: boolean = true): UseWebcamReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsReady(false);
  }, []);

  const startWebcam = useCallback(async () => {
    try {
      setError(null);
      setIsReady(false);

      // Stop any existing stream first
      stopWebcam();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.width = videoRef.current.videoWidth;
            videoRef.current.height = videoRef.current.videoHeight;
            videoRef.current.play();
            setIsReady(true);
          }
        };
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to access webcam';
      setError(message);
      console.error('Webcam error:', err);
    }
  }, [stopWebcam]);

  useEffect(() => {
    if (isActive) {
      startWebcam();
    } else {
      stopWebcam();
    }

    return () => {
      stopWebcam();
    };
  }, [isActive, startWebcam, stopWebcam]);

  return {
    videoRef,
    isReady,
    error,
    restart: startWebcam,
    stream: streamRef.current,
  };
}
