'use client';

import React, { useCallback, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardSidebar from '@/app/dashboard-page/components/DashboardSidebar';
import DashboardTopbar from '@/app/dashboard-page/components/DashboardTopbar';
import { DashboardShellSkeleton } from '@/app/dashboard-page/components/DashboardShell';
import { getDashboardNavIdFromSegment } from './dashboardRoutes';
import { useDashboardUser } from './useDashboardUser';

interface DashboardShellLayoutProps {
  children: React.ReactNode;
}

export default function DashboardShellLayout({ children }: DashboardShellLayoutProps) {
  return (
    <ProtectedRoute fallback={<DashboardShellSkeleton />}>
      <DashboardShellFrame>{children}</DashboardShellFrame>
    </ProtectedRoute>
  );
}

function DashboardShellFrame({ children }: DashboardShellLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { authUser, business, logout, user } = useDashboardUser();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const activeSegment = pathname?.split('/')[2] ?? null;
  const activeNav = getDashboardNavIdFromSegment(activeSegment);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push('/sign-up-login-screen');
  }, [logout, router]);

  const handleCollapse = useCallback(() => {
    setSidebarCollapsed((current) => !current);
  }, []);

  const handleOpenMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(true);
  }, []);

  const handleCloseMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);

  if (!authUser || !business || !user) {
    return <DashboardShellSkeleton />;
  }

  return (
    <div className="min-h-screen bg-muted/30 flex">
      <DashboardSidebar
        user={user}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        activeNav={activeNav}
        onCollapse={handleCollapse}
        onMobileClose={handleCloseMobileSidebar}
      />

      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={handleCloseMobileSidebar}
        />
      )}

      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'
        }`}
      >
        <DashboardTopbar
          user={user}
          onMenuToggle={handleOpenMobileSidebar}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6 xl:p-8">{children}</main>
      </div>
    </div>
  );
}
