'use client';

import React, { useState } from 'react';
import { Business, BusinessStatus } from '@/lib/mockData';
import { StatusBadge } from '@/components/admin/AdminBadge';
import { X, RefreshCw } from 'lucide-react';

interface BusinessStatusModalProps {
  business: Business;
  loading: boolean;
  onConfirm: (newStatus: BusinessStatus) => void;
  onClose: () => void;
}

const STATUS_OPTIONS: { value: BusinessStatus; label: string; description: string }[] = [
  {
    value: 'active',
    label: 'Active',
    description: 'Business is fully operational. All users can access the platform.',
  },
  {
    value: 'pending_verification',
    label: 'Pending Verification',
    description: 'Awaiting admin review of business documents and email verification.',
  },
  {
    value: 'suspended',
    label: 'Suspended',
    description: 'Immediately blocks all users from accessing BizManage. Reversible.',
  },
  {
    value: 'cancelled',
    label: 'Cancelled',
    description: 'Subscription cancelled. Business data retained for 30 days then archived.',
  },
];

export default function BusinessStatusModal({
  business,
  loading,
  onConfirm,
  onClose,
}: BusinessStatusModalProps) {
  const [selected, setSelected] = useState<BusinessStatus>(business.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-card-lg w-full max-w-md fade-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-50">
              <RefreshCw size={16} className="text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-700 text-foreground">Change Business Status</h3>
              <p className="text-xs text-muted-foreground">{business.businessName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-xs text-muted-foreground mb-4">
            Current status: <StatusBadge status={business.status} />
          </p>

          <div className="space-y-2 mb-6">
            {STATUS_OPTIONS.map((opt) => (
              <label
                key={`status-opt-modal-${opt.value}`}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selected === opt.value
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border hover:border-border/80 hover:bg-muted/30'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value={opt.value}
                  checked={selected === opt.value}
                  onChange={() => setSelected(opt.value)}
                  className="mt-0.5 accent-primary"
                />
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <StatusBadge status={opt.value} />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{opt.description}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 text-sm font-600 text-foreground bg-muted hover:bg-muted/80 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(selected)}
              disabled={loading || selected === business.status}
              className="flex-1 py-2.5 text-sm font-700 btn-primary rounded-xl disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Update Status'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
