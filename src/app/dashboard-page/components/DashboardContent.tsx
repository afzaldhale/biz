'use client';

import React, { memo, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ArrowUpRight } from 'lucide-react';
import { AuthUser, ActivityItem, BusinessType, KPICard } from '@/types';
import { kpiData, activityData } from '@/data/mockData';
import { getQuickActions, getSidebarNavItems } from '@/utils/dashboardResolver';
import { getIndustryById } from '@/data/industries';
import { getPlanById } from '@/data/plans';
import ModulePlaceholder from './modules/ModulePlaceholder';

interface DashboardContentProps {
  user: AuthUser;
  activeNav: string;
  onNavChange: (navId: string) => void;
}

function OverviewSkeletonCard() {
  return <div className="h-40 rounded-2xl bg-muted animate-pulse" />;
}

function OverviewChartSkeleton() {
  return <div className="glass-card rounded-2xl border border-border p-5 h-[320px] bg-white/70 animate-pulse" />;
}

function ModuleSkeleton() {
  return (
    <div className="max-w-screen-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-48 rounded bg-muted animate-pulse" />
        <div className="h-4 w-80 rounded bg-muted animate-pulse" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <OverviewSkeletonCard key={index} />
        ))}
      </div>
      <div className="glass-card rounded-2xl border border-border p-5">
        <div className="h-[420px] rounded-xl bg-muted animate-pulse" />
      </div>
    </div>
  );
}

const KPIGrid = dynamic(() => import('./KPIGrid'), {
  loading: () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <OverviewSkeletonCard key={index} />
      ))}
    </div>
  ),
});

const ActivityTable = dynamic(() => import('./ActivityTable'), {
  loading: () => <OverviewChartSkeleton />,
});

const QuickActions = dynamic(() => import('./QuickActions'), {
  loading: () => <OverviewChartSkeleton />,
});

const PlanUsageCard = dynamic(() => import('./PlanUsageCard'), {
  loading: () => <OverviewChartSkeleton />,
});

const RevenueChart = dynamic(() => import('./RevenueChart'), {
  loading: () => <OverviewChartSkeleton />,
});

const WeeklyActivityChart = dynamic(() => import('./WeeklyActivityChart'), {
  loading: () => <OverviewChartSkeleton />,
});

const AcademyStudentsPanel = dynamic(() => import('./modules/AcademyStudentsPanel'), {
  loading: () => <ModuleSkeleton />,
});

interface OverviewContentProps {
  activities: ActivityItem[];
  businessType: BusinessType;
  dateStr: string;
  industryName: string;
  kpis: KPICard[];
  nearLimit: boolean;
  plan: ReturnType<typeof getPlanById>;
  quickActions: { id: string; label: string; icon: string; color: string }[];
  recordLimit: number;
  recordsUsed: number;
  usagePct: number;
}

const DashboardOverview = memo(function DashboardOverview({
  activities,
  businessType,
  dateStr,
  industryName,
  kpis,
  nearLimit,
  plan,
  quickActions,
  recordLimit,
  recordsUsed,
  usagePct,
}: OverviewContentProps) {
  return (
    <div className="max-w-screen-2xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-700 text-foreground">{industryName} Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{dateStr} · Last updated just now</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs badge-neutral px-3 py-1.5 rounded-full font-500 capitalize">
            {plan?.name} Plan
          </span>
          {nearLimit && (
            <span className="text-xs badge-warning px-3 py-1.5 rounded-full font-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-warning inline-block" />
              {usagePct}% records used
            </span>
          )}
        </div>
      </div>

      {nearLimit && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-warning/40 bg-warning/8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-warning/15 flex items-center justify-center flex-shrink-0">
              <ArrowUpRight size={16} className="text-warning" />
            </div>
            <div>
              <p className="text-sm font-600 text-foreground">
                You've used {recordsUsed} of {recordLimit} records ({usagePct}%)
              </p>
              <p className="text-xs text-muted-foreground">
                Upgrade your plan to add more records without interruption.
              </p>
            </div>
          </div>
          <button className="btn-primary text-xs px-4 py-2 rounded-lg flex-shrink-0">
            Upgrade Plan
          </button>
        </div>
      )}

      <KPIGrid kpis={kpis} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <RevenueChart businessType={businessType} />
        </div>
        <div>
          <WeeklyActivityChart />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <ActivityTable activities={activities} businessType={businessType} />
        </div>

        <div className="space-y-5">
          <QuickActions actions={quickActions} />
          <PlanUsageCard
            plan={plan}
            recordsUsed={recordsUsed}
            recordLimit={recordLimit}
            usagePct={usagePct}
          />
        </div>
      </div>
    </div>
  );
});

export default function DashboardContent({
  user,
  activeNav,
  onNavChange,
}: DashboardContentProps) {
  const navLabelMap = useMemo(
    () =>
      new Map(
        getSidebarNavItems(user.businessType)
          .flatMap((group) => group.items)
          .map((item) => [item.id, item.label]),
      ),
    [user.businessType],
  );

  const selectedView = useMemo(() => {
    if (user.businessType === 'academy' && activeNav === 'nav-students') {
      return 'academy-students';
    }

    if (activeNav !== 'nav-dashboard') {
      return 'module-placeholder';
    }

    return 'dashboard-overview';
  }, [activeNav, user.businessType]);

  const overviewData = useMemo(() => {
    const kpis = kpiData[user.businessType] || kpiData.custom;
    const activities = activityData[user.businessType] || activityData.custom;
    const quickActions = getQuickActions(user.businessType);
    const industry = getIndustryById(user.businessType);
    const plan = getPlanById(user.plan);
    const recordsUsed = user.recordsUsed ?? 42;
    const recordLimit = plan?.recordLimit ?? 50;
    const usagePct = recordLimit ? Math.round((recordsUsed / recordLimit) * 100) : 0;

    return {
      kpis,
      activities,
      quickActions,
      industryName: industry?.name ?? 'Business',
      plan,
      recordsUsed,
      recordLimit,
      usagePct,
      nearLimit: usagePct >= 80,
      dateStr: new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    };
  }, [user.businessType, user.plan, user.recordsUsed]);

  if (selectedView === 'academy-students') {
    return <AcademyStudentsPanel user={user} onNavigate={onNavChange} />;
  }

  if (selectedView === 'module-placeholder') {
    return (
      <ModulePlaceholder
        title={navLabelMap.get(activeNav) ?? 'Module'}
        businessType={user.businessType}
        onBackToDashboard={() => onNavChange('nav-dashboard')}
      />
    );
  }

  return (
    <DashboardOverview
      activities={overviewData.activities}
      businessType={user.businessType}
      dateStr={overviewData.dateStr}
      industryName={overviewData.industryName}
      kpis={overviewData.kpis}
      nearLimit={overviewData.nearLimit}
      plan={overviewData.plan}
      quickActions={overviewData.quickActions}
      recordLimit={overviewData.recordLimit}
      recordsUsed={overviewData.recordsUsed}
      usagePct={overviewData.usagePct}
    />
  );
}
