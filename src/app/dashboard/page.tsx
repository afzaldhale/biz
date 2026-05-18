'use client';

import React from 'react';
import DashboardContent from '@/app/dashboard-page/components/DashboardContent';
import { useDashboardUser } from './components/useDashboardUser';
import { DashboardShellSkeleton } from '@/app/dashboard-page/components/DashboardShell';

export default function DashboardPage() {
  const { user } = useDashboardUser();

  if (!user) {
    return <DashboardShellSkeleton />;
  }

  return <DashboardContent user={user} activeNav="nav-dashboard" onNavChange={() => undefined} />;
}
