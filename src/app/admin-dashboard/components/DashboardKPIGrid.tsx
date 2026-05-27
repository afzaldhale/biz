import React from 'react';
import AdminStatCard from '@/components/admin/AdminStatCard';
import {
  Building2,
  CheckCircle2,
  Clock,
  Users,
  DollarSign,
  CreditCard,
  LifeBuoy,
  MessageSquare,
} from 'lucide-react';
import { MOCK_PLATFORM_STATS } from '@/lib/mockData';

export default function DashboardKPIGrid() {
  const stats = MOCK_PLATFORM_STATS;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4">
      <AdminStatCard
        title="Total Businesses"
        value={stats.totalBusinesses}
        subtitle="All registered tenants"
        icon={Building2}
        variant="primary"
        trend={{ value: 20, label: 'vs last month' }}
      />
      <AdminStatCard
        title="Active Businesses"
        value={stats.activeBusinesses}
        subtitle="Revenue-generating"
        icon={CheckCircle2}
        variant="positive"
        trend={{ value: 17, label: 'vs last month' }}
      />
      <AdminStatCard
        title="Pending Verification"
        value={stats.pendingVerification}
        subtitle="Requires admin action"
        icon={Clock}
        variant="alert"
        trend={{ value: 0, label: 'unchanged' }}
      />
      <AdminStatCard
        title="Total Platform Users"
        value={stats.totalUsers.toLocaleString('en-IN')}
        subtitle="Across all businesses"
        icon={Users}
        variant="default"
        trend={{ value: 8, label: 'vs last month' }}
      />
      <AdminStatCard
        title="Expected MRR"
        value={`Rs ${(stats.expectedMRR / 1000).toFixed(1)}K`}
        subtitle="Based on active subscriptions"
        icon={DollarSign}
        variant="positive"
        trend={{ value: 13, label: 'vs last month' }}
      />
      <AdminStatCard
        title="Active Subscriptions"
        value={stats.activeSubscriptions}
        subtitle="Businesses with active billing"
        icon={CreditCard}
        variant="primary"
        trend={{ value: 17, label: 'vs last month' }}
      />
      <AdminStatCard
        title="Open Support Tickets"
        value={stats.openTickets}
        subtitle="Needs response today"
        icon={LifeBuoy}
        variant="warning"
        trend={{ value: -1, label: 'vs yesterday' }}
      />
      <AdminStatCard
        title="Custom Capacity Enquiries"
        value={stats.customEnquiries}
        subtitle="Sales pipeline leads"
        icon={MessageSquare}
        variant="default"
        trend={{ value: 25, label: 'vs last month' }}
      />
    </div>
  );
}
