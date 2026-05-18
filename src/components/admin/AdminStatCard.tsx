import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';

interface AdminStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  variant?: 'default' | 'alert' | 'warning' | 'positive' | 'primary';
  iconColor?: string;
  loading?: boolean;
}

export default function AdminStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  iconColor,
  loading = false,
}: AdminStatCardProps) {
  const variantClasses = {
    default: 'bg-card border border-border',
    alert: 'kpi-alert',
    warning: 'kpi-warning',
    positive: 'kpi-positive',
    primary: 'kpi-primary',
  };

  const iconBgClasses = {
    default: 'bg-muted',
    alert: 'bg-red-100',
    warning: 'bg-amber-100',
    positive: 'bg-emerald-100',
    primary: 'bg-primary/10',
  };

  const iconColorClasses = {
    default: 'text-muted-foreground',
    alert: 'text-red-500',
    warning: 'text-amber-600',
    positive: 'text-emerald-600',
    primary: 'text-primary',
  };

  if (loading) {
    return (
      <div className="rounded-2xl p-5 bg-card border border-border shadow-card">
        <div className="flex items-start justify-between mb-4">
          <div className="skeleton w-9 h-9 rounded-xl" />
          <div className="skeleton w-16 h-5 rounded-lg" />
        </div>
        <div className="skeleton w-24 h-8 rounded-lg mb-2" />
        <div className="skeleton w-32 h-4 rounded-lg" />
      </div>
    );
  }

  return (
    <div
      className={`
        rounded-2xl p-5 shadow-card glass-card-hover
        ${variantClasses[variant]}
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-xl ${iconBgClasses[variant]}`}>
          <Icon size={18} className={iconColor ?? iconColorClasses[variant]} />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-600 px-2 py-1 rounded-lg ${
              trend.value > 0
                ? 'text-emerald-600 bg-emerald-50'
                : trend.value < 0
                  ? 'text-red-500 bg-red-50'
                  : 'text-muted-foreground bg-muted'
            }`}
          >
            {trend.value > 0 ? (
              <TrendingUp size={12} />
            ) : trend.value < 0 ? (
              <TrendingDown size={12} />
            ) : (
              <Minus size={12} />
            )}
            <span>
              {trend.value > 0 ? '+' : ''}
              {trend.value}%
            </span>
          </div>
        )}
      </div>

      <p className="text-2xl font-800 text-foreground text-tabular leading-tight mb-0.5">{value}</p>
      <p className="text-xs font-600 text-muted-foreground uppercase tracking-wide">{title}</p>
      {subtitle && <p className="text-[11px] text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}
