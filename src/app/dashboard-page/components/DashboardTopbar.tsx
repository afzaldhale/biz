'use client';

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AuthUser } from '@/types';
import { Menu, Search, Bell, ChevronDown, LogOut, Settings, User, HelpCircle } from 'lucide-react';
import { getIndustryById } from '@/data/industries';

interface TopbarProps {
  user: AuthUser;
  onMenuToggle: () => void;
  onLogout: () => void | Promise<void>;
  onNavChange: (navId: string) => void;
}

function DashboardTopbar({ user, onMenuToggle, onLogout, onNavChange }: TopbarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const industry = useMemo(() => getIndustryById(user.businessType), [user.businessType]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const menuRef = useRef<HTMLDivElement>(null);

  const handleToggleUserMenu = useCallback(() => {
    setUserMenuOpen((current) => !current);
  }, []);

  const handleCloseUserMenu = useCallback(() => {
    setUserMenuOpen(false);
  }, []);

  const handleUserMenuAction = useCallback(
    (navId: string) => {
      onNavChange(navId);
      handleCloseUserMenu();
    },
    [handleCloseUserMenu, onNavChange],
  );

  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        handleCloseUserMenu();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCloseUserMenu();
      }
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [handleCloseUserMenu]);

  return (
    <header className="h-14 bg-white border-b border-border flex items-center justify-between px-4 md:px-6 flex-shrink-0 sticky top-0 z-20">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu size={18} />
        </button>
        <div className="hidden sm:block">
          <span className="text-sm text-muted-foreground">{greeting}, </span>
          <span className="text-sm font-600 text-foreground">{user.ownerName.split(' ')[0]}</span>
        </div>
        {industry && (
          <span
            className="hidden md:inline-flex text-xs px-2.5 py-1 rounded-full font-600"
            style={{ backgroundColor: industry.bgColor, color: industry.color }}
          >
            {industry.name}
          </span>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-muted border border-border rounded-lg px-3 py-1.5 w-52">
          <Search size={14} className="text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none w-full"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors" aria-label="Notifications">
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-danger" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={handleToggleUserMenu}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-muted/30 transition-colors"
          >
            <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-700 text-white">{user.ownerName.charAt(0).toUpperCase()}</span>
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-600 text-foreground leading-tight">{user.ownerName.split(' ')[0]}</div>
              <div className="text-2xs text-muted-foreground capitalize leading-tight">{user.plan}</div>
            </div>
            <ChevronDown size={13} className={`text-muted-foreground transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {userMenuOpen && (
            <div ref={menuRef} className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-border rounded-xl shadow-card overflow-hidden z-50 animate-fade-in">
              <div className="px-4 py-3 border-b border-border">
                <div className="text-sm font-600 text-foreground">{user.ownerName}</div>
                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
              </div>
              <div className="py-1">
                {[
                  { id: 'nav-profile', icon: User, label: 'My Profile' },
                  { id: 'nav-settings', icon: Settings, label: 'Settings' },
                  { id: 'nav-help', icon: HelpCircle, label: 'Help & Support' },
                ].map((item) => (
                  <button
                    key={item.id}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                    onClick={() => handleUserMenuAction(item.id)}
                  >
                    <item.icon size={15} />
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="border-t border-border py-1">
                <button
                  onClick={() => { handleCloseUserMenu(); onLogout(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-danger/10 transition-colors"
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

export default memo(DashboardTopbar);
