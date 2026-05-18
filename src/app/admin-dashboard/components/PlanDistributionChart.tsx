'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { MOCK_PLATFORM_STATS } from '@/lib/mockData';

// BACKEND INTEGRATION POINT: Replace with getPlanDistribution() from adminSubscriptionService.ts

const PLAN_COLORS = ['#6366f1', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

interface TooltipPayloadItem {
  value: number;
  payload: { plan: string; count: number; revenue: number };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-card border border-border rounded-xl shadow-card p-3 text-xs">
      <p className="font-700 text-foreground mb-1">{d.plan} Plan</p>
      <p className="text-muted-foreground">
        Businesses: <span className="font-700 text-foreground">{d.count}</span>
      </p>
      <p className="text-muted-foreground">
        Revenue:{' '}
        <span className="font-700 text-foreground">₹{d.revenue.toLocaleString('en-IN')}/mo</span>
      </p>
    </div>
  );
}

export default function PlanDistributionChart() {
  const data = MOCK_PLATFORM_STATS.planDistribution;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-card h-full">
      <div className="mb-5">
        <h3 className="text-sm font-700 text-foreground mb-1">Plan Distribution</h3>
        <p className="text-xs text-muted-foreground">Businesses per subscription tier</p>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="plan"
            tick={{
              fontSize: 10,
              fill: 'var(--muted-foreground)',
              fontFamily: 'var(--font-plus-jakarta)',
            }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{
              fontSize: 10,
              fill: 'var(--muted-foreground)',
              fontFamily: 'var(--font-plus-jakarta)',
            }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-plan-${entry.plan}`}
                fill={PLAN_COLORS[index % PLAN_COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {data.map((d, i) => (
          <div key={`legend-plan-${d.plan}`} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: PLAN_COLORS[i % PLAN_COLORS.length] }}
            />
            <span className="text-[10px] text-muted-foreground truncate">{d.plan}</span>
            <span className="text-[10px] font-700 text-foreground ml-auto">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
