'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUser, BusinessType, PlanId } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useBusiness } from '@/context/BusinessContext';
import DashboardSidebar from './DashboardSidebar';
import DashboardTopbar from './DashboardTopbar';
import DashboardContent from './DashboardContent';
import ErrorBoundary from '@/components/ErrorBoundary';
import NetworkStatusBanner from '@/components/ui/NetworkStatusBanner';
import { DashboardShellSkeletonBlock } from '@/components/ui/Skeleton';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export function DashboardShellSkeleton() {
  return <DashboardShellSkeletonBlock />;
}

export default function DashboardShell() {
  const router = useRouter();
  const { user: authUser, logout } = useAuth();
  const { business } = useBusiness();
  const { isOffline } = useNetworkStatus();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('nav-dashboard');

  const user = useMemo<AuthUser | null>(() => {
    if (!authUser || !business) {
      return null;
    }

    return {
      id: business.businessId,
      ownerName: business.ownerName,
      businessName: business.businessName,
      email: business.email,
      phone: business.phone,
      plan: (business.selectedPlan ?? 'advance') as PlanId,
      businessType: (business.businessType ?? 'academy') as BusinessType,
      recordsUsed: business.currentUsage ?? 0,
      createdAt: business.createdAt ?? new Date().toISOString(),
    };
  }, [authUser, business]);

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

  const handleNavChange = useCallback((navId: string) => {
    setActiveNav(navId);
  }, []);

  if (!authUser || !business || !user) {
    return <DashboardShellSkeleton />;
  }

  return (
    <div className="min-h-screen bg-muted/30 flex">
      <div className="fixed inset-x-0 top-0 z-50">
        <NetworkStatusBanner isOffline={isOffline} />
      </div>
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
        <main className="flex-1 overflow-auto p-4 pt-6 md:p-6 xl:p-8">
          <ErrorBoundary>
            <DashboardContent user={user} activeNav={activeNav} onNavChange={handleNavChange} />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
