import React from 'react';
import Link from 'next/link';
import { MOCK_BUSINESSES } from '@/lib/mockData';
import { StatusBadge, PlanBadge } from '@/components/admin/AdminBadge';
import { ArrowRight } from 'lucide-react';

// BACKEND INTEGRATION POINT: Replace with getAllBusinesses({ limit: 5, orderBy: 'createdAt' }) from adminBusinessService.ts

export default function RecentBusinessesTable() {
  const recent = MOCK_BUSINESSES?.slice(0, 5);

  return (
    <div className="bg-card border border-border rounded-2xl shadow-card h-full">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-700 text-foreground">Recent Businesses</h3>
          <p className="text-xs text-muted-foreground">Latest tenant signups</p>
        </div>
        <Link
          href="/business-management"
          className="flex items-center gap-1.5 text-xs font-600 text-primary hover:underline"
        >
          View all
          <ArrowRight size={12} />
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left px-6 py-3 text-[11px] font-700 text-muted-foreground uppercase tracking-wide">
                Business
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-700 text-muted-foreground uppercase tracking-wide">
                Plan
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-700 text-muted-foreground uppercase tracking-wide">
                Status
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-700 text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                City
              </th>
            </tr>
          </thead>
          <tbody>
            {recent?.map((biz) => (
              <tr key={biz?.id} className="border-b border-border/30 last:border-0 row-hover">
                <td className="px-6 py-3.5">
                  <p className="text-sm font-600 text-foreground">{biz?.businessName}</p>
                  <p className="text-[11px] text-muted-foreground">{biz?.ownerName}</p>
                </td>
                <td className="px-4 py-3.5">
                  <PlanBadge plan={biz?.plan} />
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={biz?.status} />
                </td>
                <td className="px-4 py-3.5 hidden md:table-cell">
                  <span className="text-xs text-muted-foreground">{biz?.city}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
