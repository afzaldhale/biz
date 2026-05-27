'use client';

import React, { memo, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import { AuthUser } from '@/types';
import { getSidebarNavItems } from '@/utils/dashboardResolver';
import { getIndustryById } from '@/data/industries';
import { getDashboardHrefFromNavId } from '@/app/dashboard/components/dashboardRoutes';
import { getAcademySidebarCounts } from '@/services/academyDashboardService';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  IndianRupee,
  Receipt,
  ClipboardCheck,
  BarChart2,
  CreditCard,
  Settings,
  DoorOpen,
  CalendarCheck,
  SprayCan,
  ShoppingBag,
  LayoutGrid,
  UtensilsCrossed,
  ChefHat,
  Calendar,
  FileText,
  Ticket,
  Wrench,
  Dumbbell,
  UserCheck,
  Package,
  Scissors,
  Sparkles,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  LayoutDashboard,
  Users,
  BookOpen,
  IndianRupee,
  Receipt,
  ClipboardCheck,
  BarChart2,
  CreditCard,
  Settings,
  DoorOpen,
  CalendarCheck,
  SprayCan,
  ShoppingBag,
  LayoutGrid,
  UtensilsCrossed,
  ChefHat,
  Calendar,
  FileText,
  Ticket,
  Wrench,
  Dumbbell,
  UserCheck,
  Package,
  Scissors,
  Sparkles,
  UserPlus,
};

interface SidebarProps {
  user: AuthUser;
  collapsed: boolean;
  mobileOpen: boolean;
  activeNav: string;
  onCollapse: () => void;
  onMobileClose: () => void;
}

function DashboardSidebar({
  user,
  collapsed,
  mobileOpen,
  activeNav,
  onCollapse,
  onMobileClose,
}: SidebarProps) {
  const navGroups = useMemo(() => getSidebarNavItems(user.businessType), [user.businessType]);
  const industry = useMemo(() => getIndustryById(user.businessType), [user.businessType]);
  const [academyBadges, setAcademyBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    let active = true;

    if (user.businessType !== 'academy') {
      setAcademyBadges({});
      return;
    }

    getAcademySidebarCounts(user.id)
      .then((counts) => {
        if (!active) return;
        setAcademyBadges({
          'nav-students': counts.students,
          'nav-courses': counts.courses,
          'nav-fees': counts.fees,
          'nav-receipts': counts.receipts,
          'nav-attendance': counts.attendance,
        });
      })
      .catch(() => {
        if (!active) return;
        setAcademyBadges({});
      });

    return () => {
      active = false;
    };
  }, [user.businessType, user.id]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-40 hidden lg:flex flex-col bg-white border-r border-border transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Logo */}
        <div
          className={`flex items-center h-14 px-3 border-b border-border flex-shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}
        >
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2">
              <AppLogo size={28} />
              <span className="font-800 text-base text-foreground">BizManage</span>
            </Link>
          )}
          {collapsed && <AppLogo size={28} />}
          <button
            onClick={onCollapse}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors flex-shrink-0"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        {/* Business type badge */}
        {!collapsed && industry && (
          <div className="px-3 py-2.5 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-muted/60">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: industry.bgColor }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: industry.color }}
                />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-600 text-foreground truncate">{user.businessName}</div>
                <div className="text-2xs text-muted-foreground truncate">{industry.name}</div>
              </div>
            </div>
          </div>
        )}

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-2">
          {navGroups.map((group) => (
            <div key={`sidebar-group-${group.section}`} className="mb-2">
              {!collapsed && (
                <div className="px-4 py-1.5 text-2xs font-700 tracking-widest text-muted-foreground uppercase">
                  {group.section}
                </div>
              )}
              {group.items.map((item) => {
                const IconComp = iconMap[item.icon];
                const isActive = activeNav === item.id;
                const badgeValue =
                  user.businessType === 'academy'
                    ? academyBadges[item.id]
                    : item.badge;
                return (
                  <Link
                    key={item.id}
                    href={getDashboardHrefFromNavId(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 mx-1.5 rounded-lg text-sm font-500 transition-all duration-150 relative group ${
                      collapsed ? 'justify-center w-auto' : ''
                    } ${
                      isActive
                        ? 'sidebar-active'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }`}
                    style={{ width: collapsed ? 'calc(100% - 12px)' : 'calc(100% - 12px)' }}
                  >
                    {IconComp && <IconComp size={16} className="flex-shrink-0" />}
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left truncate">{item.label}</span>
                        {badgeValue !== undefined && badgeValue >= 0 && (
                          <span className="text-2xs badge-danger px-1.5 py-0.5 rounded-full font-700 min-w-[18px] text-center">
                            {badgeValue > 99 ? '99+' : badgeValue}
                          </span>
                        )}
                      </>
                    )}
                    {/* Collapsed tooltip */}
                    {collapsed && (
                      <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-white border border-border rounded-lg text-xs text-foreground font-500 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-card">
                        {item.label}
                        {badgeValue !== undefined && badgeValue >= 0 && (
                          <span className="ml-1.5 badge-danger px-1 py-0.5 rounded text-2xs">
                            {badgeValue}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom user */}
        {!collapsed && (
          <div className="p-3 border-t border-border flex-shrink-0">
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-muted/60 transition-colors cursor-pointer">
              <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-700 text-white">
                  {user.ownerName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-600 text-foreground truncate">{user.ownerName}</div>
                <div className="text-2xs text-muted-foreground truncate">
                  {user.subscriptionLabel}
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-40 lg:hidden flex flex-col bg-white border-r border-border w-72 transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <AppLogo size={28} />
            <span className="font-800 text-base text-foreground">BizManage</span>
          </Link>
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {industry && (
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-muted/60">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ backgroundColor: industry.bgColor }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: industry.color }}
                />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-600 text-foreground truncate">{user.businessName}</div>
                <div className="text-2xs text-muted-foreground">{industry.name}</div>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto scrollbar-thin py-2 px-2">
          {navGroups.map((group) => (
            <div key={`mob-group-${group.section}`} className="mb-2">
              <div className="px-3 py-1.5 text-2xs font-700 tracking-widest text-muted-foreground uppercase">
                {group.section}
              </div>
              {group.items.map((item) => {
                const IconComp = iconMap[item.icon];
                const isActive = activeNav === item.id;
                const badgeValue =
                  user.businessType === 'academy'
                    ? academyBadges[item.id]
                    : item.badge;
                return (
                  <Link
                    key={`mob-${item.id}`}
                    href={getDashboardHrefFromNavId(item.id)}
                    onClick={onMobileClose}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-500 transition-all duration-150 ${
                      isActive
                        ? 'sidebar-active'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }`}
                  >
                    {IconComp && <IconComp size={16} className="flex-shrink-0" />}
                    <span className="flex-1 text-left">{item.label}</span>
                    {badgeValue !== undefined && badgeValue >= 0 && (
                      <span className="text-2xs badge-danger px-1.5 py-0.5 rounded-full font-700">
                        {badgeValue > 99 ? '99+' : badgeValue}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center">
              <span className="text-xs font-700 text-white">
                {user.ownerName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-600 text-foreground truncate">{user.ownerName}</div>
              <div className="text-2xs text-muted-foreground">{user.subscriptionLabel}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default memo(DashboardSidebar);
