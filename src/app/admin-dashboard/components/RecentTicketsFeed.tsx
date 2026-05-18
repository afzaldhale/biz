import React from 'react';
import { MOCK_SUPPORT_TICKETS } from '@/lib/mockData';
import { TicketStatusBadge, PriorityBadge } from '@/components/admin/AdminBadge';
import { LifeBuoy } from 'lucide-react';

// BACKEND INTEGRATION POINT: Replace with getSupportTickets({ limit: 4, status: 'open' }) from adminSupportService.ts

export default function RecentTicketsFeed() {
  const tickets = MOCK_SUPPORT_TICKETS?.filter((t) => t?.status !== 'resolved')?.slice(0, 3);

  return (
    <div className="bg-card border border-border rounded-2xl shadow-card flex-1">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LifeBuoy size={15} className="text-primary" />
          <h3 className="text-sm font-700 text-foreground">Open Tickets</h3>
        </div>
        <span className="text-[11px] font-700 text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
          {tickets?.length} urgent
        </span>
      </div>
      <div className="divide-y divide-border/40">
        {tickets?.map((ticket) => (
          <div
            key={ticket?.id}
            className="px-5 py-3.5 hover:bg-muted/30 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-sm font-600 text-foreground leading-snug line-clamp-1">
                {ticket?.subject}
              </p>
              <PriorityBadge priority={ticket?.priority} />
            </div>
            <p className="text-[11px] text-muted-foreground mb-1.5">{ticket?.businessName}</p>
            <div className="flex items-center gap-2">
              <TicketStatusBadge status={ticket?.status} />
              <span className="text-[10px] text-muted-foreground">{ticket?.createdAt}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
