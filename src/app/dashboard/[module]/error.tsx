'use client';

import RetryState from '@/components/ui/RetryState';

export default function DashboardModuleError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-screen-2xl mx-auto">
      <RetryState
        title="Unable to load this workspace section"
        description="We could not load this module right now. Please try again."
        onRetry={reset}
      />
    </div>
  );
}
