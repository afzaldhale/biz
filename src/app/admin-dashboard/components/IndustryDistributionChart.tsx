'use client';

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { MOCK_PLATFORM_STATS } from '@/lib/mockData';

// BACKEND INTEGRATION POINT: Replace with getIndustryDistribution() from adminBusinessService.ts

const INDUSTRY_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#84cc16',
  '#06b6d4',
];

interface TooltipPayloadItem {
  name: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-card p-2.5 text-xs">
      <p className="font-700 text-foreground">{payload[0].name}</p>
      <p className="text-muted-foreground">
        {payload[0].value} business{payload[0].value !== 1 ? 'es' : ''}
      </p>
    </div>
  );
}

export default function IndustryDistributionChart() {
  const data = MOCK_PLATFORM_STATS.industryDistribution.map((d) => ({
    name: d.industry,
    value: d.count,
  }));

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
      <div className="mb-4">
        <h3 className="text-sm font-700 text-foreground mb-0.5">Industry Distribution</h3>
        <p className="text-xs text-muted-foreground">Businesses by sector</p>
      </div>

      <div className="flex items-center gap-4">
        <ResponsiveContainer width={100} height={100}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={28}
              outerRadius={46}
              dataKey="value"
              strokeWidth={2}
              stroke="var(--card)"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-industry-${entry.name}`}
                  fill={INDUSTRY_COLORS[index % INDUSTRY_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        <div className="flex-1 grid grid-cols-1 gap-1 max-h-[120px] overflow-y-auto pr-1">
          {data.map((d, i) => (
            <div key={`ind-legend-${d.name}`} className="flex items-center gap-1.5 min-w-0">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: INDUSTRY_COLORS[i % INDUSTRY_COLORS.length] }}
              />
              <span className="text-[10px] text-muted-foreground truncate flex-1">{d.name}</span>
              <span className="text-[10px] font-700 text-foreground">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
