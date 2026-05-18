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

// Grid plan: 8 cards → grid-cols-4 → row 1: 4 cards, row 2: 4 cards
// Hero card: Total Businesses spans 1 col, Expected MRR spans 1 col (both styled as primary)

export default function DashboardKPIGrid() {
  const stats = MOCK_PLATFORM_STATS;
  // BACKEND INTEGRATION POINT: Replace with getPlatformStats() from platformStatsService.ts

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
      {/* Row 1 */}
      <AdminStatCard
        title="Total Businesses"
        value={stats?.totalBusinesses}
        subtitle="All registered tenants"
        icon={Building2}
        variant="primary"
        trend={{ value: 20, label: 'vs last month' }}
      />
      <AdminStatCard
        title="Active Businesses"
        value={stats?.activeBusinesses}
        subtitle="Revenue-generating"
        icon={CheckCircle2}
        variant="positive"
        trend={{ value: 17, label: 'vs last month' }}
      />
      <AdminStatCard
        title="Pending Verification"
        value={stats?.pendingVerification}
        subtitle="Requires admin action"
        icon={Clock}
        variant="alert"
        trend={{ value: 0, label: 'unchanged' }}
      />
      <AdminStatCard
        title="Total Platform Users"
        value={stats?.totalUsers?.toLocaleString('en-IN')}
        subtitle="Across all businesses"
        icon={Users}
        variant="default"
        trend={{ value: 8, label: 'vs last month' }}
      />
      {/* Row 2 */}
      <AdminStatCard
        title="Expected MRR"
        value={`₹${(stats?.expectedMRR / 1000)?.toFixed(1)}K`}
        subtitle="Based on active plans"
        icon={DollarSign}
        variant="positive"
        trend={{ value: 13, label: 'vs last month' }}
      />
      <AdminStatCard
        title="Active Subscriptions"
        value={stats?.activeSubscriptions}
        subtitle="Paid plan tenants"
        icon={CreditCard}
        variant="primary"
        trend={{ value: 17, label: 'vs last month' }}
      />
      <AdminStatCard
        title="Open Support Tickets"
        value={stats?.openTickets}
        subtitle="Needs response today"
        icon={LifeBuoy}
        variant="warning"
        trend={{ value: -1, label: 'vs yesterday' }}
      />
      <AdminStatCard
        title="Custom Plan Enquiries"
        value={stats?.customEnquiries}
        subtitle="Sales pipeline leads"
        icon={MessageSquare}
        variant="default"
        trend={{ value: 25, label: 'vs last month' }}
      />
    </div>
  );
}
