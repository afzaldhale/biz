'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { DashboardShellSkeleton } from '@/app/dashboard-page/components/DashboardShell';

const DashboardShell = dynamic(
  () => import('@/app/dashboard-page/components/DashboardShell').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <DashboardShellSkeleton />,
  }
);

export default function DashboardShellClient() {
  return <DashboardShell />;
}
