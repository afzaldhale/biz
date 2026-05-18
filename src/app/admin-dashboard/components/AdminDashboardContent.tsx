'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/lib/adminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import DashboardKPIGrid from './DashboardKPIGrid';
import MRRTrendChart from './MRRTrendChart';
import PlanDistributionChart from './PlanDistributionChart';
import IndustryDistributionChart from './IndustryDistributionChart';
import RecentBusinessesTable from './RecentBusinessesTable';
import RecentTicketsFeed from './RecentTicketsFeed';
import { RefreshCw } from 'lucide-react';

export default function AdminDashboardContent() {
  const { admin } = useAdminAuth();
  const router = useRouter();

  // BACKEND INTEGRATION POINT: Check admin auth from Firebase + Firestore admins/{uid}
  // If not authenticated, redirect to /admin-login
  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center admin-bg-pattern">
        <div className="text-center p-8 bg-card border border-border rounded-2xl shadow-card max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <h2 className="text-lg font-700 text-foreground mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground mb-5">
            This area is restricted to BizManage administrators. Please sign in with an admin
            account.
          </p>
          <button
            onClick={() => router?.push('/')}
            className="btn-primary px-5 py-2.5 rounded-xl text-sm font-600 w-full"
          >
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout currentPath="/admin-dashboard">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-800 text-foreground mb-1">Platform Overview</h1>
          <p className="text-sm text-muted-foreground">
            Last updated: 15 May 2026, 8:27 PM IST
            <span className="ml-2 inline-flex items-center gap-1 text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Live
            </span>
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-600 text-primary bg-primary/8 border border-primary/20 rounded-xl hover:bg-primary/15 transition-colors">
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* KPI Cards Bento Grid */}
      <DashboardKPIGrid />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5 gap-6 mt-6">
        {/* MRR Trend — spans 3 cols */}
        <div className="lg:col-span-3">
          <MRRTrendChart />
        </div>
        {/* Plan Distribution — spans 2 cols */}
        <div className="lg:col-span-2">
          <PlanDistributionChart />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5 gap-6 mt-6">
        {/* Recent Businesses — spans 3 cols */}
        <div className="lg:col-span-3">
          <RecentBusinessesTable />
        </div>
        {/* Industry Distribution + Tickets — spans 2 cols */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <IndustryDistributionChart />
          <RecentTicketsFeed />
        </div>
      </div>
    </AdminLayout>
  );
}
