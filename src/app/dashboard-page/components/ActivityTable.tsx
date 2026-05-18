'use client';

import React, { memo, useMemo, useState } from 'react';
import { ActivityItem, BusinessType } from '@/types';
import { Clock, CheckCircle2, XCircle, Activity } from 'lucide-react';

interface ActivityTableProps {
  activities: ActivityItem[];
  businessType: BusinessType;
}

const statusConfig: Record<
  string,
  { label: string; className: string; icon: React.ComponentType<{ size?: number }> }
> = {
  completed: { label: 'Completed', className: 'badge-success', icon: CheckCircle2 },
  pending: { label: 'Pending', className: 'badge-warning', icon: Clock },
  cancelled: { label: 'Cancelled', className: 'badge-danger', icon: XCircle },
  active: { label: 'Active', className: 'badge-info', icon: Activity },
};

function ActivityTable({ activities, businessType }: ActivityTableProps) {
  const [filter, setFilter] = useState<string>('all');

  const filters = useMemo(() => ['all', 'completed', 'pending', 'active', 'cancelled'], []);

  const filtered = useMemo(
    () =>
      filter === 'all' ? activities : activities.filter((activity) => activity.status === filter),
    [activities, filter]
  );

  return (
    <div className="glass-card rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-border">
        <div>
          <h3 className="text-base font-700 text-foreground">Recent Activity</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Latest operations across your business
          </p>
        </div>
        {/* Filter chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {filters.map((f) => (
            <button
              key={`filter-chip-${f}`}
              onClick={() => setFilter(f)}
              className={`text-xs px-2.5 py-1 rounded-full font-500 capitalize transition-all ${
                filter === f
                  ? 'btn-primary'
                  : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/70'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/30">
              <th className="text-left px-5 py-3 text-2xs font-700 text-muted-foreground uppercase tracking-wider">
                Action
              </th>
              <th className="text-left px-5 py-3 text-2xs font-700 text-muted-foreground uppercase tracking-wider">
                Name
              </th>
              <th className="text-left px-5 py-3 text-2xs font-700 text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                Type
              </th>
              <th className="text-left px-5 py-3 text-2xs font-700 text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                Amount
              </th>
              <th className="text-left px-5 py-3 text-2xs font-700 text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                Time
              </th>
              <th className="text-left px-5 py-3 text-2xs font-700 text-muted-foreground uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">
                  No {filter === 'all' ? '' : filter} activities found
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const status = statusConfig[item.status];
                const StatusIcon = status.icon;
                return (
                  <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-500 text-foreground whitespace-nowrap">
                      {item.action}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-foreground font-500 max-w-[140px] truncate">
                      {item.entityName}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground hidden sm:table-cell">
                      {item.entity}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-600 text-foreground font-tabular hidden md:table-cell">
                      {item.amount ?? <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                      {item.time}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 text-2xs font-600 px-2.5 py-1 rounded-full ${status.className}`}
                      >
                        <StatusIcon size={10} />
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Showing {filtered.length} of {activities.length} activities
        </span>
        <button className="text-xs text-primary hover:text-accent font-600 transition-colors">
          View all activity →
        </button>
      </div>
    </div>
  );
}

export default memo(ActivityTable);
