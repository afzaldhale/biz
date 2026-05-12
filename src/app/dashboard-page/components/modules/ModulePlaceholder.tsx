'use client';

import React, { memo } from 'react';
import { ArrowLeft, Construction, Sparkles } from 'lucide-react';
import { BusinessType } from '@/types';

interface ModulePlaceholderProps {
  title: string;
  businessType: BusinessType;
  onBackToDashboard: () => void;
}

const moduleHints: Record<BusinessType, string> = {
  academy: 'Students is live now. Courses, fees, receipts, attendance, and reports can plug into this same workspace next.',
  hotel: 'Rooms, bookings, guests, and billing can reuse this shell with occupancy widgets and reservation workflows.',
  restaurant: 'Orders, tables, kitchen, and billing can land here with role-based actions and service state tracking.',
  clinic: 'Patients, appointments, prescriptions, and billing can be expanded here with health-focused forms and history views.',
  'service-center': 'Tickets, technicians, customers, and invoices can connect here with repair status timelines and device records.',
  gym: 'Members, classes, trainers, and memberships can be surfaced here with attendance and renewal actions.',
  salon: 'Appointments, stylists, services, and products can fit here with beauty-service scheduling and checkout flows.',
  custom: 'This area is ready for your business-specific module structure and can be tailored section by section.',
};

function ModulePlaceholder({
  title,
  businessType,
  onBackToDashboard,
}: ModulePlaceholderProps) {
  return (
    <div className="max-w-screen-2xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-700 tracking-[0.24em] text-primary uppercase">Module Workspace</p>
          <h1 className="text-2xl font-700 text-foreground mt-1">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            This section is scaffolded and ready for the next CRUD workflow.
          </p>
        </div>
        <button
          type="button"
          onClick={onBackToDashboard}
          className="btn-outline px-4 py-2.5 rounded-xl text-sm inline-flex items-center gap-2 self-start"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
      </div>

      <div className="glass-card rounded-2xl border border-border p-8 md:p-10 overflow-hidden relative">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-indigo-100 via-sky-50 to-emerald-100 opacity-80" />
        <div className="relative grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 badge-info px-3 py-1.5 rounded-full text-xs font-600">
              <Construction size={14} />
              Coming next
            </div>
            <div>
              <h2 className="text-xl font-700 text-foreground">{title} placeholder is ready</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{moduleHints[businessType]}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-white/80 p-4">
                <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">Planned UI</p>
                <p className="text-sm font-600 text-foreground mt-2">Forms, tables, filters, and modal actions</p>
              </div>
              <div className="rounded-2xl border border-border bg-white/80 p-4">
                <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">Planned Data</p>
                <p className="text-sm font-600 text-foreground mt-2">Service-backed records with search, edit, and reporting</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-border bg-white/90 p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-700 text-foreground">Next module preview</p>
              <Sparkles size={16} className="text-primary" />
            </div>
            <div className="space-y-3">
              {['Overview cards', 'Search toolbar', 'Data table', 'Action drawer'].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(ModulePlaceholder);
