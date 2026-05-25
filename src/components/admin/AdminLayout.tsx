'use client';

import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';
import NetworkStatusBanner from '@/components/ui/NetworkStatusBanner';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPath: string;
}

export default function AdminLayout({ children, currentPath }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { isOffline } = useNetworkStatus();

  return (
    <div className="flex h-screen overflow-hidden admin-bg-pattern">
      <div className="fixed inset-x-0 top-0 z-50">
        <NetworkStatusBanner isOffline={isOffline} />
      </div>
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        currentPath={currentPath}
      />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden transition-all duration-300">
        <AdminTopbar onMobileMenuToggle={() => setMobileSidebarOpen((o) => !o)} />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 xl:px-10 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
