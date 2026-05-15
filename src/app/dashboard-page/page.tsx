import React from 'react';
import DashboardShell from '@/app/dashboard-page/components/DashboardShell';
import ProtectedRoute from '@/components/ProtectedRoute';
import { DashboardShellSkeleton } from '@/app/dashboard-page/components/DashboardShell';

export default function DashboardPage() {
  return (
    <ProtectedRoute fallback={<DashboardShellSkeleton />}>
      <DashboardShell />
    </ProtectedRoute>
  );
}
