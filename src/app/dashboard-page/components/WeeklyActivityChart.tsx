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

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card border border-border/60 rounded-xl px-3 py-2.5 shadow-card">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-700 text-foreground">{payload[0].value} activities</p>
      </div>
    );
  }
  return null;
};

interface WeeklyActivityChartProps {
  data: Array<{ day: string; count: number }>;
}

export default function WeeklyActivityChart({ data }: WeeklyActivityChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-5 border border-border/60 h-full flex flex-col justify-center items-center text-center gap-3">
        <div>
          <h3 className="text-base font-700 text-foreground">Weekly Activity</h3>
          <p className="text-xs text-muted-foreground mt-0.5">No activity yet</p>
        </div>
        <p className="text-sm text-muted-foreground max-w-sm">
          Recent activity will appear here as your team logs operations and updates.
        </p>
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.count));

  return (
    <div className="glass-card rounded-2xl p-5 border border-border/60 h-full">
      <div className="mb-5">
        <h3 className="text-base font-700 text-foreground">Weekly Activity</h3>
        <p className="text-xs text-muted-foreground mt-0.5">This week's operations</p>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barSize={24}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={`bar-cell-${entry.day}`}
                fill={entry.count === maxVal ? 'var(--primary)' : 'var(--muted)'}
                fillOpacity={entry.count === maxVal ? 1 : 0.5}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
