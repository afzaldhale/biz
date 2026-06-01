'use client';

import React, { useCallback, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { AuthUser } from '@/types';
import { getSidebarNavItems } from '@/utils/dashboardResolver';
import { getDashboardHrefFromNavId } from './dashboardRoutes';

interface DashboardModuleContentProps {
  module: string;
  user: AuthUser;
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
          <div key={index} className="h-40 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
      <div className="glass-card rounded-2xl border border-border p-5">
        <div className="h-[420px] rounded-xl bg-muted animate-pulse" />
      </div>
    </div>
  );
}

const AcademyStudentsPanel = dynamic(
  () => import('@/app/dashboard-page/components/modules/AcademyStudentsPanel'),
  {
    loading: () => <ModuleSkeleton />,
  }
);

const AcademyCoursesPanel = dynamic(
  () => import('@/app/dashboard-page/components/modules/AcademyCoursesPanel'),
  {
    loading: () => <ModuleSkeleton />,
  }
);

const AcademyFeesPanel = dynamic(
  () => import('@/app/dashboard-page/components/modules/AcademyFeesPanel'),
  {
    loading: () => <ModuleSkeleton />,
  }
);

const AcademyReceiptsPanel = dynamic(
  () => import('@/app/dashboard-page/components/modules/AcademyReceiptsPanel'),
  {
    loading: () => <ModuleSkeleton />,
  }
);

const AcademyAttendancePanel = dynamic(
  () => import('@/app/dashboard-page/components/modules/AcademyAttendancePanel'),
  {
    loading: () => <ModuleSkeleton />,
  }
);

const GenericBusinessModulePanel = dynamic(
  () => import('@/app/dashboard-page/components/modules/GenericBusinessModulePanel'),
  {
    loading: () => <ModuleSkeleton />,
  }
);

const GymMembersPanel = dynamic(
  () => import('@/app/dashboard-page/components/modules/GymMembersPanel'),
  {
    loading: () => <ModuleSkeleton />,
  }
);

const HotelRoomsPanel = dynamic(
  () => import('@/app/dashboard-page/components/modules/HotelRoomsPanel'),
  {
    loading: () => <ModuleSkeleton />,
  }
);

const HotelBookingsPanel = dynamic(
  () => import('@/app/dashboard-page/components/modules/HotelBookingsPanel'),
  {
    loading: () => <ModuleSkeleton />,
  }
);

const HotelGuestsPanel = dynamic(
  () => import('@/app/dashboard-page/components/modules/HotelGuestsPanel'),
  {
    loading: () => <ModuleSkeleton />,
  }
);

const HotelHousekeepingPanel = dynamic(
  () => import('@/app/dashboard-page/components/modules/HotelHousekeepingPanel'),
  {
    loading: () => <ModuleSkeleton />,
  }
);

const ProfilePanel = dynamic(() => import('@/components/dashboard/ProfilePanel'), {
  loading: () => <ModuleSkeleton />,
});

const SettingsPanel = dynamic(() => import('@/components/dashboard/SettingsPanel'), {
  loading: () => <ModuleSkeleton />,
});

const SubscriptionPanel = dynamic(() => import('@/components/subscription/SubscriptionPanel'), {
  loading: () => <ModuleSkeleton />,
});

const HelpSupportPanel = dynamic(() => import('@/components/dashboard/HelpSupportPanel'), {
  loading: () => <ModuleSkeleton />,
});

export default function DashboardModuleContent({ module, user }: DashboardModuleContentProps) {
  const router = useRouter();
  const activeNav = `nav-${module}`;

  useEffect(() => {
    if (user.businessType === 'gym' && (module === 'classes' || module === 'memberships')) {
      router.replace('/dashboard/members');
    }
  }, [module, router, user.businessType]);

  const handleNavigate = useCallback(
    (navId: string) => {
      router.push(getDashboardHrefFromNavId(navId));
    },
    [router]
  );

  const navLabelMap = useMemo(
    () =>
      new Map(
        getSidebarNavItems(user.businessType)
          .flatMap((group) => group.items)
          .map((item) => [item.id, item.label])
      ),
    [user.businessType]
  );

  if (user.businessType === 'gym' && (module === 'classes' || module === 'memberships')) {
    return <ModuleSkeleton />;
  }

  if (module === 'profile') {
    return <ProfilePanel businessId={user.id} />;
  }

  if (module === 'settings') {
    return <SettingsPanel businessId={user.id} />;
  }

  if (module === 'subscription') {
    return <SubscriptionPanel />;
  }

  if (module === 'help') {
    return <HelpSupportPanel businessId={user.id} ownerName={user.ownerName} />;
  }

  if (user.businessType === 'academy') {
    if (module === 'students') {
      return <AcademyStudentsPanel user={user} onNavigate={handleNavigate} />;
    }

    if (module === 'courses') {
      return <AcademyCoursesPanel user={user} onNavigate={handleNavigate} />;
    }

    if (module === 'fees') {
      return <AcademyFeesPanel user={user} onNavigate={handleNavigate} />;
    }

    if (module === 'receipts') {
      return <AcademyReceiptsPanel user={user} onNavigate={handleNavigate} />;
    }

    if (module === 'attendance') {
      return <AcademyAttendancePanel user={user} onNavigate={handleNavigate} />;
    }
  }

  if (user.businessType === 'hotel') {
    if (module === 'rooms') {
      return <HotelRoomsPanel user={user} />;
    }

    if (module === 'bookings') {
      return <HotelBookingsPanel user={user} />;
    }

    if (module === 'guests') {
      return <HotelGuestsPanel user={user} />;
    }

    if (module === 'housekeeping') {
      return <HotelHousekeepingPanel user={user} />;
    }
  }

  if (user.businessType === 'gym' && ['members', 'trainers', 'billing', 'reports'].includes(module)) {
    return (
      <GymMembersPanel
        user={user}
        initialView={
          module === 'billing'
            ? 'billing'
            : module === 'trainers'
              ? 'trainers'
              : module === 'reports'
                ? 'reports'
                : 'members'
        }
      />
    );
  }

  return (
    <GenericBusinessModulePanel
      user={user}
      activeNav={activeNav}
      moduleTitle={navLabelMap.get(activeNav) ?? 'Module'}
    />
  );
}
