'use client';

import React from 'react';
import { useBusiness } from '@/context/BusinessContext';
import HotelRoomsPanel from '@/app/dashboard-page/components/modules/HotelRoomsPanel';
import { AuthUser } from '@/types';

export default function HotelRoomsPage() {
  const { business } = useBusiness();

  if (!business) {
    return <div className="p-6 text-sm text-muted-foreground">Loading rooms...</div>;
  }

  const user = {
    id: business.businessId,
    ownerName: business.ownerName,
    businessName: business.businessName,
    email: business.email,
    phone: business.phone ?? '',
    subscriptionLabel: business.selectedPlan ?? '',
    businessType: business.businessType,
    recordsUsed: business.currentUsage ?? 0,
    recordLimit: business.recordLimit ?? business.planLimit ?? 0,
    createdAt: business.createdAt,
  } as AuthUser;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-700 tracking-[0.24em] text-primary uppercase">Rooms</p>
        <h1 className="text-2xl font-700 text-foreground mt-1">Rooms</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your hotel room inventory and availability from a dedicated page.
        </p>
      </div>
      <HotelRoomsPanel user={user} />
    </div>
  );
}
