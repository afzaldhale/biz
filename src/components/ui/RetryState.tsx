'use client';

import React from 'react';
import { RefreshCcw } from 'lucide-react';

interface RetryStateProps {
  description?: string;
  onRetry: () => void;
  onSecondaryAction?: () => void;
  secondaryActionLabel?: string;
  title?: string;
}

export default function RetryState({
  title = 'Still loading your workspace',
  description = 'Network is slow. Trying to load your workspace.',
  onRetry,
  onSecondaryAction,
  secondaryActionLabel,
}: RetryStateProps) {
  return (
    <div className="glass-card rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-amber-900">
      <h2 className="text-lg font-700">{title}</h2>
      <p className="mt-2 text-sm">{description}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-600 text-amber-900 transition hover:bg-amber-100"
        >
          <RefreshCcw size={14} />
          Retry
        </button>
        {onSecondaryAction && secondaryActionLabel ? (
          <button
            type="button"
            onClick={onSecondaryAction}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-100/60 px-4 py-2.5 text-sm font-600 text-amber-900 transition hover:bg-amber-100"
          >
            {secondaryActionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
