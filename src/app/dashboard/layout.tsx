import React from 'react';
import DashboardShellLayout from './components/DashboardShellLayout';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShellLayout>{children}</DashboardShellLayout>;
}
