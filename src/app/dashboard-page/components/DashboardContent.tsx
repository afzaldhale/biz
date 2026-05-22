'use client';

import React, { memo, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { ArrowUpRight } from 'lucide-react';
import { AuthUser, ActivityItem, BusinessType, KPICard } from '@/types';
import { getQuickActions, getSidebarNavItems } from '@/utils/dashboardResolver';
import { getIndustryById } from '@/data/industries';
import { getPlanById } from '@/data/plans';
import { getDashboardStats, DashboardStats } from '@/services/dashboardService';
import { getRecentActivities } from '@/services/activityService';

interface DashboardContentProps {
  user: AuthUser;
  activeNav: string;
  onNavChange: (navId: string) => void;
}

function OverviewSkeletonCard() {
  return <div className="h-40 rounded-2xl bg-muted animate-pulse" />;
}

function OverviewChartSkeleton() {
  return (
    <div className="glass-card rounded-2xl border border-border p-5 h-[320px] bg-white/70 animate-pulse" />
  );
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

const AcademyOverviewPanel = dynamic(() => import('./modules/AcademyOverviewPanel'), {
  loading: () => <ModuleSkeleton />,
});

const AcademyCoursesPanel = dynamic(() => import('./modules/AcademyCoursesPanel'), {
  loading: () => <ModuleSkeleton />,
});

const AcademyFeesPanel = dynamic(() => import('./modules/AcademyFeesPanel'), {
  loading: () => <ModuleSkeleton />,
});

const AcademyReceiptsPanel = dynamic(() => import('./modules/AcademyReceiptsPanel'), {
  loading: () => <ModuleSkeleton />,
});

const AcademyAttendancePanel = dynamic(() => import('./modules/AcademyAttendancePanel'), {
  loading: () => <ModuleSkeleton />,
});

const GenericBusinessModulePanel = dynamic(() => import('./modules/GenericBusinessModulePanel'), {
  loading: () => <ModuleSkeleton />,
});

const GymMembersPanel = dynamic(() => import('./modules/GymMembersPanel'), {
  loading: () => <ModuleSkeleton />,
});

const ProfilePanel = dynamic(() => import('@/components/dashboard/ProfilePanel'), {
  loading: () => <ModuleSkeleton />,
});

const SettingsPanel = dynamic(() => import('@/components/dashboard/SettingsPanel'), {
  loading: () => <ModuleSkeleton />,
});

const HelpSupportPanel = dynamic(() => import('@/components/dashboard/HelpSupportPanel'), {
  loading: () => <ModuleSkeleton />,
});

const defaultKpis: Record<BusinessType, KPICard[]> = {
  academy: [
    {
      id: 'kpi-academy-1',
      label: 'Total Students',
      value: 0,
      change: 0,
      changeType: 'neutral',
      icon: 'Users',
      color: '#7C3AED',
    },
    {
      id: 'kpi-academy-2',
      label: 'Active Courses',
      value: 0,
      change: 0,
      changeType: 'neutral',
      icon: 'BookOpen',
      color: '#2563EB',
    },
    {
      id: 'kpi-academy-3',
      label: 'Fees Collected',
      value: '₹0',
      change: 0,
      changeType: 'neutral',
      icon: 'IndianRupee',
      color: '#10B981',
    },
    {
      id: 'kpi-academy-4',
      label: 'Pending Fees',
      value: '₹0',
      change: 0,
      changeType: 'neutral',
      icon: 'AlertCircle',
      color: '#EF4444',
    },
  ],
  gym: [
    {
      id: 'kpi-gym-1',
      label: 'Active Members',
      value: 0,
      change: 0,
      changeType: 'neutral',
      icon: 'Users',
      color: '#EF4444',
    },
    {
      id: 'kpi-gym-2',
      label: 'Classes Today',
      value: 0,
      change: 0,
      changeType: 'neutral',
      icon: 'Dumbbell',
      color: '#2563EB',
    },
    {
      id: 'kpi-gym-3',
      label: 'Monthly Revenue',
      value: '₹0',
      change: 0,
      changeType: 'neutral',
      icon: 'IndianRupee',
      color: '#10B981',
    },
    {
      id: 'kpi-gym-4',
      label: 'Expiring This Week',
      value: 0,
      change: 0,
      changeType: 'neutral',
      icon: 'AlertCircle',
      color: '#F59E0B',
    },
  ],
  hotel: [
    {
      id: 'kpi-hotel-1',
      label: 'Total Rooms',
      value: 0,
      change: 0,
      changeType: 'neutral',
      icon: 'DoorOpen',
      color: '#0891B2',
    },
    {
      id: 'kpi-hotel-2',
      label: 'Available Rooms',
      value: 0,
      change: 0,
      changeType: 'neutral',
      icon: 'BedSingle',
      color: '#F59E0B',
    },
    {
      id: 'kpi-hotel-3',
      label: 'Occupied Rooms',
      value: 0,
      change: 0,
      changeType: 'neutral',
      icon: 'BedDouble',
      color: '#2563EB',
    },
    {
      id: 'kpi-hotel-4',
      label: "Today's Revenue",
      value: '₹0',
      change: 0,
      changeType: 'neutral',
      icon: 'IndianRupee',
      color: '#10B981',
    },
  ],
  restaurant: [
    {
      id: 'kpi-rest-1',
      label: "Today's Orders",
      value: 0,
      change: 0,
      changeType: 'neutral',
      icon: 'ShoppingBag',
      color: '#EA580C',
    },
    {
      id: 'kpi-rest-2',
      label: 'Active Tables',
      value: 0,
      change: 0,
      changeType: 'neutral',
      icon: 'LayoutGrid',
      color: '#2563EB',
    },
    {
      id: 'kpi-rest-3',
      label: 'Total Revenue',
      value: '₹0',
      change: 0,
      changeType: 'neutral',
      icon: 'IndianRupee',
      color: '#10B981',
    },
    {
      id: 'kpi-rest-4',
      label: 'Pending Orders',
      value: 0,
      change: 0,
      changeType: 'neutral',
      icon: 'Clock',
      color: '#EF4444',
    },
  ],
  clinic: [
    {
      id: 'kpi-clinic-1',
      label: "Today's Appointments",
      value: 0,
      change: 0,
      changeType: 'neutral',
      icon: 'Calendar',
      color: '#10B981',
    },
    {
      id: 'kpi-clinic-2',
      label: 'Total Patients',
      value: 0,
      change: 0,
      changeType: 'neutral',
      icon: 'Users',
      color: '#2563EB',
    },
    {
      id: 'kpi-clinic-3',
      label: 'Total Revenue',
      value: '₹0',
      change: 0,
      changeType: 'neutral',
      icon: 'IndianRupee',
      color: '#7C3AED',
    },
    {
      id: 'kpi-clinic-4',
      label: 'Pending Follow-ups',
      value: 0,
      change: 0,
      changeType: 'neutral',
      icon: 'AlertCircle',
      color: '#EF4444',
    },
  ],
  'service-center': [
    {
      id: 'kpi-svc-1',
      label: 'Open Tickets',
      value: 0,
      change: 0,
      changeType: 'neutral',
      icon: 'Ticket',
      color: '#F59E0B',
    },
    {
      id: 'kpi-svc-2',
      label: 'Assigned Technicians',
      value: 0,
      change: 0,
      changeType: 'neutral',
      icon: 'Wrench',
      color: '#2563EB',
    },
    {
      id: 'kpi-svc-3',
      label: 'Completed Services',
      value: 0,
      change: 0,
      changeType: 'neutral',
      icon: 'CheckCircle',
      color: '#10B981',
    },
    {
      id: 'kpi-svc-4',
      label: 'Total Revenue',
      value: '₹0',
      change: 0,
      changeType: 'neutral',
      icon: 'IndianRupee',
      color: '#7C3AED',
    },
  ],
  salon: [
    {
      id: 'kpi-salon-1',
      label: "Today's Appointments",
      value: 0,
      change: 0,
      changeType: 'neutral',
      icon: 'Calendar',
      color: '#EC4899',
    },
    {
      id: 'kpi-salon-2',
      label: 'Active Stylists',
      value: 0,
      change: 0,
      changeType: 'neutral',
      icon: 'UserCheck',
      color: '#2563EB',
    },
    {
      id: 'kpi-salon-3',
      label: "Today's Revenue",
      value: '₹0',
      change: 0,
      changeType: 'neutral',
      icon: 'IndianRupee',
      color: '#10B981',
    },
    {
      id: 'kpi-salon-4',
      label: 'Pending Bookings',
      value: 0,
      change: 0,
      changeType: 'neutral',
      icon: 'Clock',
      color: '#EF4444',
    },
  ],
  custom: [
    {
      id: 'kpi-custom-1',
      label: 'Total Customers',
      value: 0,
      change: 0,
      changeType: 'neutral',
      icon: 'Users',
      color: '#38BDF8',
    },
    {
      id: 'kpi-custom-2',
      label: 'Active Staff',
      value: 0,
      change: 0,
      changeType: 'neutral',
      icon: 'UserCheck',
      color: '#2563EB',
    },
    {
      id: 'kpi-custom-3',
      label: 'Total Revenue',
      value: '₹0',
      change: 0,
      changeType: 'neutral',
      icon: 'IndianRupee',
      color: '#10B981',
    },
    {
      id: 'kpi-custom-4',
      label: 'Pending Bills',
      value: 0,
      change: 0,
      changeType: 'neutral',
      icon: 'FileWarning',
      color: '#EF4444',
    },
  ],
};

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
  revenueData: Array<{ month: string; revenue: number }>;
  weeklyActivityData: Array<{ day: string; count: number }>;
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
  revenueData,
  weeklyActivityData,
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
            {plan?.name ?? 'Business'} Plan
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
          <RevenueChart businessType={businessType} data={revenueData} />
        </div>
        <div>
          <WeeklyActivityChart data={weeklyActivityData} />
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

function formatWeeklyData(activities: ActivityItem[]) {
  const counts: Record<string, number> = {
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
    Sat: 0,
    Sun: 0,
  };

  activities.forEach((activity) => {
    const date = new Date(activity.time);
    if (Number.isNaN(date.getTime())) return;
    const day = date.toLocaleDateString('en-US', { weekday: 'short' });
    counts[day] = (counts[day] ?? 0) + 1;
  });

  return Object.entries(counts).map(([day, count]) => ({ day, count }));
}

export default function DashboardContent({ user, activeNav, onNavChange }: DashboardContentProps) {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([getDashboardStats(user.id, user.businessType), getRecentActivities(user.id, 5)])
      .then(([stats, activities]) => {
        if (!cancelled) {
          setDashboardStats(stats);
          setRecentActivities(activities);
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : 'Unable to load dashboard data.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user.businessType, user.id]);

  const selectedView = useMemo(() => {
    if (activeNav === 'nav-profile') return 'profile';
    if (activeNav === 'nav-settings') return 'settings';
    if (activeNav === 'nav-help') return 'help';

    if (activeNav === 'nav-dashboard' && user.businessType === 'academy') {
      return 'academy-overview';
    }

    if (user.businessType === 'academy') {
      if (activeNav === 'nav-students') {
        return 'academy-students';
      }
      if (activeNav === 'nav-courses') {
        return 'academy-courses';
      }
      if (activeNav === 'nav-fees') {
        return 'academy-fees';
      }
      if (activeNav === 'nav-receipts') {
        return 'academy-receipts';
      }
      if (activeNav === 'nav-attendance') {
        return 'academy-attendance';
      }
    }

    if (
      user.businessType === 'gym' &&
      ['nav-members', 'nav-memberships', 'nav-billing'].includes(activeNav)
    ) {
      return 'gym-members';
    }

    if (activeNav !== 'nav-dashboard') {
      return 'generic-module';
    }

    return 'dashboard-overview';
  }, [activeNav, user.businessType]);

  const overviewData = useMemo(() => {
    const kpis = dashboardStats?.kpis ?? defaultKpis[user.businessType] ?? defaultKpis.custom;
    const activities = recentActivities;
    const quickActions = getQuickActions(user.businessType);
    const industry = getIndustryById(user.businessType);
    const plan = getPlanById(user.plan);
    const recordsUsed = user.recordsUsed ?? 0;
    const recordLimit = plan?.recordLimit ?? 50;
    const usagePct = recordLimit ? Math.round((recordsUsed / recordLimit) * 100) : 0;
    const revenueData = dashboardStats?.revenueTrend ?? [];
    const weeklyData = activities.length ? formatWeeklyData(activities) : [];

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
      revenueData,
      weeklyData,
    };
  }, [dashboardStats, recentActivities, user.businessType, user.plan, user.recordsUsed]);

  const navLabelMap = useMemo(
    () =>
      new Map(
        getSidebarNavItems(user.businessType)
          .flatMap((group) => group.items)
          .map((item) => [item.id, item.label])
      ),
    [user.businessType]
  );

  if (selectedView === 'academy-overview') {
    return <AcademyOverviewPanel user={user} onNavigate={onNavChange} />;
  }

  if (selectedView === 'academy-students') {
    return <AcademyStudentsPanel user={user} onNavigate={onNavChange} />;
  }

  if (selectedView === 'academy-courses') {
    return <AcademyCoursesPanel user={user} onNavigate={onNavChange} />;
  }

  if (selectedView === 'academy-fees') {
    return <AcademyFeesPanel user={user} onNavigate={onNavChange} />;
  }

  if (selectedView === 'academy-receipts') {
    return <AcademyReceiptsPanel user={user} onNavigate={onNavChange} />;
  }

  if (selectedView === 'academy-attendance') {
    return <AcademyAttendancePanel user={user} onNavigate={onNavChange} />;
  }

  if (selectedView === 'gym-members') {
    return (
      <GymMembersPanel
        user={user}
        initialView={activeNav === 'nav-billing' ? 'payments' : 'members'}
      />
    );
  }

  if (loading && selectedView === 'dashboard-overview') {
    return <ModuleSkeleton />;
  }

  if (error && selectedView === 'dashboard-overview') {
    return (
      <div className="glass-card rounded-2xl p-6 border border-red-200 bg-red-50 text-red-700">
        <h2 className="text-lg font-semibold">Unable to load dashboard</h2>
        <p className="text-sm mt-2">{error}</p>
      </div>
    );
  }

  if (selectedView === 'generic-module') {
    return (
      <GenericBusinessModulePanel
        user={user}
        activeNav={activeNav}
        moduleTitle={navLabelMap.get(activeNav) ?? 'Module'}
      />
    );
  }

  if (selectedView === 'profile') {
    return <ProfilePanel businessId={user.id} />;
  }

  if (selectedView === 'settings') {
    return <SettingsPanel businessId={user.id} />;
  }

  if (selectedView === 'help') {
    return <HelpSupportPanel businessId={user.id} ownerName={user.ownerName} />;
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
      revenueData={overviewData.revenueData}
      weeklyActivityData={overviewData.weeklyData}
    />
  );
}
