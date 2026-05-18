'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Menu, Search, Bell, ChevronDown, User, Settings, LogOut, Shield } from 'lucide-react';
import { useAdminAuth } from '@/lib/adminAuth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface AdminTopbarProps {
  onMobileMenuToggle: () => void;
}

const NOTIFICATIONS = [
  {
    id: 'notif-001',
    type: 'alert',
    message: '3 businesses pending verification',
    time: '2 min ago',
    unread: true,
  },
  {
    id: 'notif-002',
    type: 'ticket',
    message: 'High priority ticket from QuickShip',
    time: '18 min ago',
    unread: true,
  },
  {
    id: 'notif-003',
    type: 'signup',
    message: 'ClearPath Advisory signed up',
    time: '1 hr ago',
    unread: true,
  },
  {
    id: 'notif-004',
    type: 'payment',
    message: 'StyleCraft plan upgrade request',
    time: '3 hr ago',
    unread: false,
  },
];

export default function AdminTopbar({ onMobileMenuToggle }: AdminTopbarProps) {
  const { admin, signOut } = useAdminAuth();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = NOTIFICATIONS.filter((n) => n.unread).length;

  const roleLabel: Record<string, string> = {
    super_admin: 'Super Admin',
    support_admin: 'Support Admin',
    sales_admin: 'Sales Admin',
  };

  const handleSignOut = () => {
    signOut();
    toast.success('Signed out successfully');
    router.push('/admin-login');
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="h-16 bg-card/90 backdrop-blur-sm border-b border-border flex items-center px-4 lg:px-6 gap-4 flex-shrink-0 sticky top-0 z-20">
      {/* Mobile menu toggle */}
      <button
        onClick={onMobileMenuToggle}
        className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
        aria-label="Open navigation menu"
      >
        <Menu size={20} className="text-muted-foreground" />
      </button>

      {/* Search */}
      <div className="relative flex-1 max-w-sm hidden sm:block">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          placeholder="Search businesses, users..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm bg-muted/60 border border-border rounded-xl
                     focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50
                     placeholder:text-muted-foreground transition-all"
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Date */}
        <span className="hidden md:block text-xs font-500 text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-lg border border-border">
          15 May 2026
        </span>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative p-2 rounded-xl hover:bg-muted transition-colors"
            aria-label="Notifications"
          >
            <Bell size={18} className="text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full gradient-primary text-white text-[9px] font-700 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-12 w-80 bg-card border border-border rounded-2xl shadow-card-lg z-50 overflow-hidden slide-up">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="text-sm font-700">Notifications</span>
                <span className="text-xs text-primary font-600 cursor-pointer hover:underline">
                  Mark all read
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {NOTIFICATIONS.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 flex gap-3 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0 cursor-pointer ${n.unread ? 'bg-primary/3' : ''}`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.unread ? 'bg-primary' : 'bg-border'}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-snug">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-muted transition-colors"
          >
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-700 flex-shrink-0">
              {admin?.name?.charAt(0) ?? 'A'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-600 text-foreground leading-tight">
                {admin?.name ?? 'Admin'}
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                {admin ? roleLabel[admin.role] : ''}
              </p>
            </div>
            <ChevronDown
              size={14}
              className={`text-muted-foreground transition-transform hidden md:block ${profileOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-12 w-52 bg-card border border-border rounded-2xl shadow-card-lg z-50 overflow-hidden slide-up">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-700">{admin?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{admin?.email}</p>
              </div>
              <div className="py-1">
                {[
                  { id: 'dd-profile', label: 'My Admin Profile', icon: User },
                  { id: 'dd-settings', label: 'Settings', icon: Settings },
                  { id: 'dd-security', label: 'Security', icon: Shield },
                ].map((item) => (
                  <button
                    key={item.id}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted/60 transition-colors"
                    onClick={() => setProfileOpen(false)}
                  >
                    <item.icon size={15} className="text-muted-foreground" />
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="border-t border-border py-1">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
