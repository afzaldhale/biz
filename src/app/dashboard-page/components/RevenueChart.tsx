'use client';

import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { revenueChartData } from '@/data/mockData';
import { BusinessType } from '@/types';

interface RevenueChartProps {
  businessType: BusinessType;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card border border-border/60 rounded-xl px-4 py-3 shadow-card">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-base font-700 text-foreground font-tabular">
          ₹{payload[0].value.toLocaleString('en-IN')}
        </p>
      </div>
    );
  }
  return null;
};

export default function RevenueChart({ businessType }: RevenueChartProps) {
  const data = revenueChartData.map((d) => ({
    month: d.month,
    revenue: d[businessType as keyof typeof d] as number,
  }));

  return (
    <div className="glass-card rounded-2xl p-5 border border-border/60 h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-700 text-foreground">Revenue Trend</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Last 6 months</p>
        </div>
        <span className="text-xs badge-success px-2.5 py-1 rounded-full font-600">
          +{((data[5].revenue - data[0].revenue) / data[0].revenue * 100).toFixed(1)}% overall
        </span>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="var(--primary)"
            strokeWidth={2.5}
            fill="url(#revenueGrad)"
            dot={{ fill: 'var(--primary)', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: 'var(--primary)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}