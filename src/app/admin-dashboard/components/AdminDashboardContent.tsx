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

  if (!admin) {
    return (
      <div className="admin-bg-pattern flex min-h-screen items-center justify-center">
        <div className="max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <span className="text-2xl">Locked</span>
          </div>
          <h2 className="mb-2 text-lg font-700 text-foreground">Access Denied</h2>
          <p className="mb-5 text-sm text-muted-foreground">
            This area is restricted to BizManage administrators. Please sign in with an admin
            account.
          </p>
          <button
            onClick={() => router.push('/')}
            className="btn-primary w-full rounded-xl px-5 py-2.5 text-sm font-600"
          >
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout currentPath="/admin-dashboard">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-800 text-foreground">Platform Overview</h1>
          <p className="text-sm text-muted-foreground">
            Last updated: 15 May 2026, 8:27 PM IST
            <span className="ml-2 inline-flex items-center gap-1 text-emerald-600">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live
            </span>
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/8 px-4 py-2.5 text-sm font-600 text-primary transition-colors hover:bg-primary/15">
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <DashboardKPIGrid />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5">
        <div className="lg:col-span-3">
          <MRRTrendChart />
        </div>
        <div className="lg:col-span-2">
          <PlanDistributionChart />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5">
        <div className="lg:col-span-3">
          <RecentBusinessesTable />
        </div>
        <div className="flex flex-col gap-6 lg:col-span-2">
          <IndustryDistributionChart />
          <RecentTicketsFeed />
        </div>
      </div>
    </AdminLayout>
  );
}
