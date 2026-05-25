'use client';

import RetryState from '@/components/ui/RetryState';

export default function AdminDashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-10">
      <RetryState
        title="Unable to load admin dashboard"
        description="We hit a problem while loading the admin workspace. Please try again."
        onRetry={reset}
      />
    </div>
  );
}
