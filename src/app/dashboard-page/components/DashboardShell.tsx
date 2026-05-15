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

export function DashboardShellSkeleton() {
  return (
    <div className="min-h-screen bg-muted/30 flex">
      <aside className="hidden lg:flex fixed top-0 left-0 h-full w-60 bg-white border-r border-border flex-col">
        <div className="h-14 border-b border-border px-4 flex items-center">
          <div className="h-7 w-32 rounded-lg bg-muted animate-pulse" />
        </div>
        <div className="p-4 space-y-3">
          <div className="h-16 rounded-xl bg-muted animate-pulse" />
          <div className="h-4 w-20 rounded bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-10 rounded-xl bg-muted animate-pulse" />
            <div className="h-10 rounded-xl bg-muted animate-pulse" />
            <div className="h-10 rounded-xl bg-muted animate-pulse" />
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen lg:ml-60">
        <header className="h-14 bg-white border-b border-border px-4 md:px-6 flex items-center justify-between">
          <div className="h-5 w-40 rounded bg-muted animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="hidden md:block h-9 w-52 rounded-xl bg-muted animate-pulse" />
            <div className="h-9 w-9 rounded-xl bg-muted animate-pulse" />
            <div className="h-9 w-24 rounded-xl bg-muted animate-pulse" />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6 xl:p-8">
          <div className="max-w-screen-2xl mx-auto space-y-6">
            <div className="space-y-2">
              <div className="h-7 w-56 rounded bg-muted animate-pulse" />
              <div className="h-4 w-72 rounded bg-muted animate-pulse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="glass-card rounded-2xl border border-border p-5">
                  <div className="h-24 rounded-xl bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardShell() {
  const router = useRouter();
  const { user: authUser, logout } = useAuth();
  const { business } = useBusiness();
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
      <DashboardSidebar
        user={user}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        activeNav={activeNav}
        onNavChange={handleNavChange}
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
          onNavChange={handleNavChange}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6 xl:p-8">
          <ErrorBoundary>
            <DashboardContent
              user={user}
              activeNav={activeNav}
              onNavChange={handleNavChange}
            />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
