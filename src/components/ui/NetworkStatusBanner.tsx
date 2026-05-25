'use client';

import React from 'react';
import { WifiOff } from 'lucide-react';

interface NetworkStatusBannerProps {
  isOffline: boolean;
}

export default function NetworkStatusBanner({ isOffline }: NetworkStatusBannerProps) {
  if (!isOffline) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
      <div className="mx-auto flex max-w-screen-2xl items-center gap-2">
        <WifiOff size={16} />
        <span>You are offline. Some data may not update.</span>
      </div>
    </div>
  );
}
