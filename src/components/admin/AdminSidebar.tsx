'use client';

import React from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  LifeBuoy,
  MessageSquare,
  PackageOpen,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useAdminAuth } from '@/lib/adminAuth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Icon from '@/components/ui/AppIcon';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: number;
  group?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'nav-overview',
    label: 'Overview',
    icon: LayoutDashboard,
    href: '/admin-dashboard',
    group: 'Platform',
  },
  {
    id: 'nav-businesses',
    label: 'Businesses',
    icon: Building2,
    href: '/business-management',
    badge: 3,
    group: 'Platform',
  },
  { id: 'nav-users', label: 'Users', icon: Users, href: '/admin-dashboard', group: 'Platform' },
  {
    id: 'nav-subscriptions',
    label: 'Subscriptions',
    icon: CreditCard,
    href: '/admin-dashboard',
    group: 'Finance',
  },
  {
    id: 'nav-revenue',
    label: 'Revenue',
    icon: TrendingUp,
    href: '/admin-dashboard',
    group: 'Finance',
  },
  {
    id: 'nav-tickets',
    label: 'Support Tickets',
    icon: LifeBuoy,
    href: '/admin-dashboard',
    badge: 3,
    group: 'Operations',
  },
  {
    id: 'nav-enquiries',
    label: 'Enquiries',
    icon: MessageSquare,
    href: '/admin-dashboard',
    badge: 5,
    group: 'Operations',
  },
  {
    id: 'nav-plans',
    label: 'Plans',
    icon: PackageOpen,
    href: '/admin-dashboard',
    group: 'Operations',
  },
  {
    id: 'nav-settings',
    label: 'System Settings',
    icon: Settings,
    href: '/admin-dashboard',
    group: 'Admin',
  },
];

const GROUPS = ['Platform', 'Finance', 'Operations', 'Admin'];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  currentPath: string;
}

export default function AdminSidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
  currentPath,
}: AdminSidebarProps) {
  const { admin, signOut } = useAdminAuth();
  const router = useRouter();

  const handleSignOut = () => {
    signOut();
    toast.success('Signed out of admin panel');
    router.push('/admin-login');
  };

  const isActive = (href: string) => currentPath === href;

  const roleLabel: Record<string, string> = {
    super_admin: 'Super Admin',
    support_admin: 'Support Admin',
    sales_admin: 'Sales Admin',
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden lg:flex flex-col h-screen sticky top-0 z-30
          bg-card border-r border-border sidebar-transition overflow-hidden
          ${collapsed ? 'w-[68px]' : 'w-[240px]'}
        `}
      >
        {/* Logo */}
        <div
          className={`flex items-center h-16 px-4 border-b border-border flex-shrink-0 ${collapsed ? 'justify-center' : 'gap-3'}`}
        >
          <div className="flex items-center gap-2 flex-shrink-0">
            <AppLogo size={32} />
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-sm gradient-text leading-tight">BizManage</span>
                <span className="text-[10px] text-muted-foreground font-medium leading-tight">
                  Admin Portal
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Admin badge */}
        {!collapsed && (
          <div className="mx-3 mt-3 mb-1 px-3 py-2 rounded-lg bg-primary/8 border border-primary/15 flex items-center gap-2">
            <ShieldCheck size={14} className="text-primary flex-shrink-0" />
            <span className="text-[11px] font-600 text-primary truncate">
              {admin ? roleLabel[admin.role] : 'Admin'}
            </span>
          </div>
        )}

        {/* Nav Groups */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {GROUPS.map((group) => {
            const items = NAV_ITEMS.filter((i) => i.group === group);
            return (
              <div key={`group-${group}`} className="mb-1">
                {!collapsed && (
                  <p className="px-3 py-1.5 text-[10px] font-700 uppercase tracking-widest text-muted-foreground/60">
                    {group}
                  </p>
                )}
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5
                        text-sm font-500 nav-item-hover cursor-pointer
                        ${active ? 'nav-item-active font-600' : 'text-foreground/70'}
                        ${collapsed ? 'justify-center' : ''}
                      `}
                    >
                      <Icon
                        size={18}
                        className={`flex-shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`}
                      />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className="flex-shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-700 gradient-primary text-white min-w-[18px] text-center">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
                {!collapsed && group !== 'Admin' && (
                  <div className="border-t border-border/50 my-1.5 mx-1" />
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom: Profile + Logout */}
        <div className="border-t border-border px-2 py-3 flex-shrink-0">
          {!collapsed && admin && (
            <div className="px-3 py-2 mb-2 rounded-lg bg-muted/60">
              <p className="text-sm font-600 text-foreground truncate">{admin.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{admin.email}</p>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
              text-sm font-500 text-red-500 hover:bg-red-50 transition-colors duration-150
              ${collapsed ? 'justify-center' : ''}
            `}
            title={collapsed ? 'Sign Out' : undefined}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className="absolute top-[72px] -right-3 w-6 h-6 rounded-full bg-card border border-border shadow-sm flex items-center justify-center hover:bg-muted transition-colors z-50"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight size={12} className="text-muted-foreground" />
          ) : (
            <ChevronLeft size={12} className="text-muted-foreground" />
          )}
        </button>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[240px] flex flex-col
          bg-card border-r border-border shadow-lg
          transition-transform duration-300 ease-smooth lg:hidden
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          <div className="flex items-center gap-2">
            <AppLogo size={28} />
            <div>
              <span className="font-bold text-sm gradient-text">BizManage</span>
              <p className="text-[10px] text-muted-foreground">Admin Portal</p>
            </div>
          </div>
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft size={16} className="text-muted-foreground" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={`mobile-${item.id}`}
                href={item.href}
                onClick={onMobileClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5
                  text-sm font-500 nav-item-hover
                  ${active ? 'nav-item-active font-600' : 'text-foreground/70'}
                `}
              >
                <Icon
                  size={18}
                  className={`flex-shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-700 gradient-primary text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border px-2 py-3">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-500 text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
