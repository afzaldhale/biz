'use client';

import { useEffect, useState } from 'react';

interface UseSlowLoadingOptions {
  retryDelayMs?: number;
  skeletonDelayMs?: number;
}

export function useSlowLoading(isLoading: boolean, options: UseSlowLoadingOptions = {}) {
  const { skeletonDelayMs = 1500, retryDelayMs = 8000 } = options;
  const [showSlowMessage, setShowSlowMessage] = useState(false);
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setShowSlowMessage(false);
      setShowRetry(false);
      return;
    }

    const skeletonTimer = window.setTimeout(() => {
      setShowSlowMessage(true);
    }, skeletonDelayMs);

    const retryTimer = window.setTimeout(() => {
      setShowRetry(true);
    }, retryDelayMs);

    return () => {
      window.clearTimeout(skeletonTimer);
      window.clearTimeout(retryTimer);
    };
  }, [isLoading, retryDelayMs, skeletonDelayMs]);

  return {
    showSlowMessage,
    showRetry,
  };
}
