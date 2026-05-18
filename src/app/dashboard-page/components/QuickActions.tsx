'use client';

import React, { memo, useCallback } from 'react';
import { toast } from 'sonner';
import {
  UserPlus,
  IndianRupee,
  Printer,
  BookOpen,
  LogIn,
  CalendarCheck,
  LogOut,
  Receipt,
  Plus,
  LayoutGrid,
  UtensilsCrossed,
  Calendar,
  FileText,
  Ticket,
  Wrench,
  RefreshCw,
  Package,
  Sparkles,
  UserCheck,
  BarChart2,
} from 'lucide-react';

const iconMap: Record<
  string,
  React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>
> = {
  UserPlus,
  IndianRupee,
  Printer,
  BookOpen: BookOpen,
  LogIn,
  CalendarCheck,
  LogOut,
  Receipt,
  Plus,
  LayoutGrid,
  UtensilsCrossed,
  Calendar,
  FileText,
  Ticket,
  Wrench,
  RefreshCw,
  Package,
  Sparkles,
  UserCheck,
  BarChart2,
  BookPlus: BookOpen,
  CalendarPlus: Calendar,
};

interface QuickActionsProps {
  actions: { id: string; label: string; icon: string; color: string }[];
}

function QuickActions({ actions }: QuickActionsProps) {
  const handleActionClick = useCallback((label: string) => {
    toast.success(`Opening ${label}...`);
  }, []);

  return (
    <div className="glass-card rounded-2xl border border-border p-5">
      <h3 className="text-base font-700 text-foreground mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-2.5">
        {actions.map((action) => {
          const IconComp = iconMap[action.icon];
          return (
            <button
              key={action.id}
              onClick={() => handleActionClick(action.label)}
              className="flex flex-col items-center gap-2 p-3.5 rounded-xl border border-border hover:border-primary/30 bg-muted/30 hover:bg-muted/60 transition-all duration-150 group active:scale-95"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${action.color}18` }}
              >
                {IconComp && <IconComp size={17} style={{ color: action.color }} />}
              </div>
              <span className="text-xs font-600 text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default memo(QuickActions);
