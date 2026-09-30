import { useEffect, useRef } from 'react';
import { viewTracker } from '../services/viewTracker';

export interface UsePostViewTrackerOptions {
  /**
   * Intersection threshold (0 to 1). Default is 0.5 (50% visibility)
   */
  threshold?: number;
  /**
   * Dwell time in milliseconds before counting as view. Default is 1500 (1.5s)
   */
  dwellTimeMs?: number;
  /**
   * Whether tracking is active. Default is true
   */
  enabled?: boolean;
}

/**
 * Hook to automatically track post views using IntersectionObserver
 * - Observes when >= 50% of the element is visible on viewport
 * - Dwells for 1.5 seconds before submitting to viewTracker queue
 * - Cancels the timer if user scrolls past before 1.5s
 */
export function usePostViewTracker<T extends HTMLElement = HTMLElement>(
  postId?: string | null,
  options?: UsePostViewTrackerOptions
) {
  const elementRef = useRef<T | null>(null);
  const dwellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const threshold = options?.threshold ?? 0.5;
  const dwellTimeMs = options?.dwellTimeMs ?? 1500;
  const enabled = options?.enabled !== false && Boolean(postId);

  useEffect(() => {
    if (!enabled || !postId || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    const targetElement = elementRef.current;
    if (!targetElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // User sees >= 50% of post -> start 1.5s countdown
            if (!dwellTimerRef.current) {
              dwellTimerRef.current = setTimeout(() => {
                viewTracker.track(postId);
                dwellTimerRef.current = null;
              }, dwellTimeMs);
            }
          } else {
            // User scrolled away before 1.5s -> cancel countdown
            if (dwellTimerRef.current) {
              clearTimeout(dwellTimerRef.current);
              dwellTimerRef.current = null;
            }
          }
        });
      },
      {
        threshold,
      }
    );

    observer.observe(targetElement);

    return () => {
      observer.disconnect();
      if (dwellTimerRef.current) {
        clearTimeout(dwellTimerRef.current);
        dwellTimerRef.current = null;
      }
    };
  }, [postId, enabled, threshold, dwellTimeMs]);

  return elementRef;
}
