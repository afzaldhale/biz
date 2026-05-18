'use client';

import React from 'react';
import { DashboardShellSkeleton } from '@/app/dashboard-page/components/DashboardShell';
import DashboardModuleContent from '../components/DashboardModuleContent';
import { useDashboardUser } from '../components/useDashboardUser';

interface DashboardModulePageProps {
  params: Promise<{
    module: string;
  }>;
}

export default function DashboardModulePage({ params }: DashboardModulePageProps) {
  const { user } = useDashboardUser();
  const resolvedParams = React.use(params);

  if (!user) {
    return <DashboardShellSkeleton />;
  }

  return <DashboardModuleContent module={resolvedParams.module} user={user} />;
}
