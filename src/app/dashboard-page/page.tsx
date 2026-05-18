import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardShellClient from '@/app/dashboard-page/components/DashboardShellClient';
import { DashboardShellSkeleton } from '@/app/dashboard-page/components/DashboardShell';

export default function DashboardPage() {
  return (
    <ProtectedRoute fallback={<DashboardShellSkeleton />}>
      <DashboardShellClient />
    </ProtectedRoute>
  );
}
