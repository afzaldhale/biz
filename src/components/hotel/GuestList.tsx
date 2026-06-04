'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useBusiness } from '@/context/BusinessContext';
import { getHotelGuests, deleteHotelGuest } from '@/services/hotelGuestsService';
import GuestForm from './GuestForm';
import { exportToCSV, exportToExcel } from '@/utils/exportGuests';

export default function GuestList() {
  const { business } = useBusiness();
  const businessId = business?.businessId ?? '';
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const load = async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const rows = await getHotelGuests(businessId);
      setGuests(rows as any[]);
    } catch (err) {
      console.error('[guest-list] load error', err);
      toast.error('Please Try Again');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [businessId]);

  const filtered = useMemo(() => {
    if (!query) return guests;
    const q = query.toLowerCase().trim();
    return guests.filter((g) => {
      return (
        String(g.customerName ?? '')
          .toLowerCase()
          .includes(q) ||
        String(g.aadhaarNumber ?? '')
          .toLowerCase()
          .includes(q) ||
        String(g.vehicleNumber ?? '')
          .toLowerCase()
          .includes(q)
      );
    });
  }, [guests, query]);

  const handleDelete = async (guestId: string) => {
    const ok = confirm('Are you sure you want to delete this guest?');
    if (!ok) return;
    try {
      await deleteHotelGuest(businessId, guestId);
      toast.success('Guest Deleted Successfully');
      await load();
    } catch (err) {
      console.error('[guest-list] delete error', err);
      toast.error('Unable To Delete Guest');
    }
  };

  const handleExportCSV = () => {
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
      console.error('[guest-list] export csv', err);
      toast.error('Unable To Export Data');
    }
  };

  const handleExportExcel = () => {
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
      console.error('[guest-list] export excel', err);
      toast.error('Unable To Export Data');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="px-3 py-2 bg-primary text-white rounded-lg"
          >
            Add Guest
          </button>
          <button onClick={handleExportCSV} className="px-3 py-2 border rounded-lg">
            Export CSV
          </button>
          <button onClick={handleExportExcel} className="px-3 py-2 border rounded-lg">
            Export Excel
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input
            placeholder="Search by name, aadhaar or vehicle"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="px-3 py-2 rounded-lg border"
          />
        </div>
      </div>

      {showForm && (
        <div className="mb-4 p-4 rounded-lg border bg-card">
          <GuestForm
            initial={editing ?? undefined}
            onSaved={async () => {
              setShowForm(false);
              await load();
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-3">
          {/* Desktop table */}
          <div className="hidden md:block">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="text-left">
                  <th className="px-3 py-2">Customer Name</th>
                  <th className="px-3 py-2">Age</th>
                  <th className="px-3 py-2">Aadhaar</th>
                  <th className="px-3 py-2">Vehicle</th>
                  <th className="px-3 py-2">Check-In</th>
                  <th className="px-3 py-2">Check-Out</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((g) => (
                  <tr key={g.guestId ?? g.id} className="border-t">
                    <td className="px-3 py-2">{g.customerName}</td>
                    <td className="px-3 py-2">{g.age}</td>
                    <td className="px-3 py-2">{g.aadhaarNumber}</td>
                    <td className="px-3 py-2">{g.vehicleNumber ?? '-'}</td>
                    <td className="px-3 py-2">{g.checkInDateTime}</td>
                    <td className="px-3 py-2">{g.checkOutDateTime ?? '-'}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditing(g);
                            setShowForm(true);
                          }}
                          className="px-2 py-1 border rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(g.guestId ?? g.id)}
                          className="px-2 py-1 border rounded text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((g) => (
              <div key={g.guestId ?? g.id} className="p-3 border rounded-lg bg-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-600">{g.customerName}</div>
                    <div className="text-xs text-muted-foreground">Aadhaar: {g.aadhaarNumber}</div>
                    <div className="text-xs text-muted-foreground">
                      Vehicle: {g.vehicleNumber ?? '-'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">Age: {g.age}</div>
                    <div className="flex flex-col gap-1 mt-2">
                      <button
                        onClick={() => {
                          setEditing(g);
                          setShowForm(true);
                        }}
                        className="px-2 py-1 border rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(g.guestId ?? g.id)}
                        className="px-2 py-1 border rounded text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Check-In: {g.checkInDateTime}
                </div>
                <div className="text-xs text-muted-foreground">
                  Check-Out: {g.checkOutDateTime ?? '-'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
