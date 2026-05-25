'use client';

import RetryState from '@/components/ui/RetryState';

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-10">
      <RetryState
        title="Unable to load dashboard"
        description="We hit a problem while loading your workspace. Please try again."
        onRetry={reset}
      />
    </div>
  );
}
