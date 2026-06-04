'use client';

import React from 'react';
import GuestList from '@/components/hotel/GuestList';

export default function HotelGuestsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-700">Guests</h1>
      <GuestList />
    </div>
  );
}
