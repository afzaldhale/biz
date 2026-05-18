'use client';

import React, { memo } from 'react';
import { KPICard } from '@/types';
import {
  Users,
  BookOpen,
  IndianRupee,
  AlertCircle,
  DoorOpen,
  BedDouble,
  BedSingle,
  ShoppingBag,
  LayoutGrid,
  Clock,
  Calendar,
  CheckCircle,
  Ticket,
  Wrench,
  Dumbbell,
  UserCheck,
  Scissors,
  FileWarning,
} from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const iconMap: Record<
  string,
  React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>
> = {
  Users,
  BookOpen,
  IndianRupee,
  AlertCircle,
  DoorOpen,
  BedDouble,
  BedSingle,
  ShoppingBag,
  LayoutGrid,
  Clock,
  Calendar,
  CheckCircle,
  Ticket,
  Wrench,
  Dumbbell,
  UserCheck,
  Scissors,
  FileWarning,
};

interface KPIGridProps {
  kpis: KPICard[];
}

function KPIGrid({ kpis }: KPIGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const IconComp = iconMap[kpi.icon];
        const isPositive = kpi.changeType === 'positive';
        const isNegative = kpi.changeType === 'negative';

        return (
          <div key={kpi.id} className="glass-card card-hover rounded-2xl p-5 border border-border">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${kpi.color}18` }}
              >
                {IconComp && <IconComp size={18} style={{ color: kpi.color }} />}
              </div>
              {kpi.change !== 0 && (
                <div
                  className={`flex items-center gap-1 text-xs font-600 px-2 py-1 rounded-full ${
                    isPositive ? 'badge-success' : isNegative ? 'badge-danger' : 'badge-neutral'
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp size={11} />
                  ) : isNegative ? (
                    <TrendingDown size={11} />
                  ) : (
                    <Minus size={11} />
                  )}
                  {Math.abs(kpi.change)}
                  {typeof kpi.change === 'number' && kpi.change % 1 !== 0 ? '' : '%'}
                </div>
              )}
            </div>

            {/* Value */}
            <div className="font-800 text-2xl text-foreground font-tabular mb-1">{kpi.value}</div>
            <div className="text-xs font-500 text-muted-foreground tracking-wide">{kpi.label}</div>

            {/* Bottom bar accent */}
            <div className="mt-4 h-0.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: '60%', backgroundColor: kpi.color, opacity: 0.6 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default memo(KPIGrid);
