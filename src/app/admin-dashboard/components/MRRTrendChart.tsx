'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { MOCK_PLATFORM_STATS } from '@/lib/mockData';
import { TrendingUp } from 'lucide-react';

interface TooltipPayloadItem {
  value: number;
  name: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-3 text-sm shadow-card">
      <p className="mb-2 font-700 text-foreground">{label}</p>
      {payload.map((entry, i) => (
        <div key={`tooltip-entry-${i}`} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span className="text-muted-foreground">MRR:</span>
          <span className="font-700 text-foreground">Rs {entry.value.toLocaleString('en-IN')}</span>
        </div>
      ))}
    </div>
  );
}

export default function MRRTrendChart() {
  const data = MOCK_PLATFORM_STATS.mrrTrend;
  const latestMRR = data[data.length - 1]?.mrr ?? 0;
  const prevMRR = data[data.length - 2]?.mrr ?? 0;
  const growth = prevMRR > 0 ? (((latestMRR - prevMRR) / prevMRR) * 100).toFixed(1) : '0';

  return (
    <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="mb-1 text-sm font-700 text-foreground">Expected MRR Trend</h3>
          <p className="text-xs text-muted-foreground">
            Based on active subscriptions and selected record capacities - not verified payments
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-700 text-emerald-600">
          <TrendingUp size={12} />+{growth}% MoM
        </div>
      </div>

      <div className="mb-4">
        <p className="text-3xl font-800 text-foreground text-tabular">
          Rs {latestMRR.toLocaleString('en-IN')}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">May 2026 - Expected Subscription Value</p>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{
              fontSize: 11,
              fill: 'var(--muted-foreground)',
              fontFamily: 'var(--font-plus-jakarta)',
            }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{
              fontSize: 11,
              fill: 'var(--muted-foreground)',
              fontFamily: 'var(--font-plus-jakarta)',
            }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `Rs ${(v / 1000).toFixed(0)}K`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="mrr"
            stroke="var(--primary)"
            strokeWidth={2.5}
            fill="url(#mrrGradient)"
            dot={{ fill: 'var(--primary)', strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, fill: 'var(--primary)', stroke: 'white', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
