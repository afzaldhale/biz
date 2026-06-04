'use client';

import React, { useEffect, useState } from 'react';
import { useBusiness } from '@/context/BusinessContext';
import { getHotelGuests } from '@/services/hotelGuestsService';
import { exportToCSV, exportToExcel } from '@/utils/exportGuests';
import { toast } from 'sonner';

export default function HotelDashboardPage() {
  const { business } = useBusiness();
  const businessId = business?.businessId ?? '';
  const [guests, setGuests] = useState<any[]>([]);

  useEffect(() => {
    if (!businessId) return;
    void (async () => {
      try {
        const rows = await getHotelGuests(businessId);
        setGuests(rows as any[]);
      } catch (err) {
        console.error('[hotel-dashboard] load', err);
      }
    })();
  }, [businessId]);

  const today = new Date().toISOString().slice(0, 10);
  const totalGuests = guests.length;
  const todaysGuests = guests.filter(
    (g) => (g.checkInDateTime ?? '').slice(0, 10) === today
  ).length;
  const month = new Date().getMonth();
  const monthsGuests = guests.filter(
    (g) => new Date(g.checkInDateTime).getMonth() === month
  ).length;

  const handleQuickExportCSV = () => {
    try {
      const rows = guests.map((g) => ({
        guestId: g.guestId ?? g.id,
        customerName: g.customerName,
        age: g.age,
        aadhaarNumber: g.aadhaarNumber,
        vehicleNumber: g.vehicleNumber ?? '',
        address: g.address,
        checkInDateTime: g.checkInDateTime,
        checkOutDateTime: g.checkOutDateTime ?? '',
      }));
      exportToCSV(rows, `guests-${new Date().toISOString()}.csv`);
      toast.success('Data Exported Successfully');
    } catch (err) {
      console.error('[hotel-dashboard] export csv', err);
      toast.error('Unable To Export Data');
    }
  };

  const handleQuickExportExcel = () => {
    try {
      const rows = guests.map((g) => ({
        guestId: g.guestId ?? g.id,
        customerName: g.customerName,
        age: g.age,
        aadhaarNumber: g.aadhaarNumber,
        vehicleNumber: g.vehicleNumber ?? '',
        address: g.address,
        checkInDateTime: g.checkInDateTime,
        checkOutDateTime: g.checkOutDateTime ?? '',
      }));
      exportToExcel(rows, `guests-${new Date().toISOString()}.xlsx`);
      toast.success('Data Exported Successfully');
    } catch (err) {
      console.error('[hotel-dashboard] export excel', err);
      toast.error('Unable To Export Data');
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-700">Hotel Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg bg-card">
          <div className="text-sm text-muted-foreground">Total Guests</div>
          <div className="text-2xl font-700">{totalGuests}</div>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <div className="text-sm text-muted-foreground">Today's Guests</div>
          <div className="text-2xl font-700">{todaysGuests}</div>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <div className="text-sm text-muted-foreground">This Month's Guests</div>
          <div className="text-2xl font-700">{monthsGuests}</div>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={handleQuickExportCSV} className="px-3 py-2 border rounded-lg">
          Quick Export CSV
        </button>
        <button onClick={handleQuickExportExcel} className="px-3 py-2 border rounded-lg">
          Quick Export Excel
        </button>
      </div>
    </div>
  );
}
