'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BusinessProfile } from '@/types';
import { getBusinessProfile, saveBusinessProfile } from '@/services/businessService';

interface ProfilePanelProps {
  businessId: string;
}

const initialProfile: BusinessProfile = {
  businessId: '',
  ownerId: '',
  status: 'active',
  ownerName: '',
  businessName: '',
  businessType: 'custom',
  selectedPlan: 'custom',
  email: '',
  phone: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export default function ProfilePanel({ businessId }: ProfilePanelProps) {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [form, setForm] = useState({
    ownerName: '',
    businessName: '',
    email: '',
    phone: '',
    address: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    getBusinessProfile(businessId)
      .then((business) => {
        if (cancelled) return;
        if (!business) {
          setError('Business profile not found.');
          return;
        }

        setProfile(business);
        setForm({
          ownerName: business.ownerName || '',
          businessName: business.businessName || '',
          email: business.email || '',
          phone: business.phone || '',
          address: business.address || '',
        });
      })
      .catch((caught) => {
        if (cancelled) return;
        setError(caught instanceof Error ? caught.message : 'Unable to load profile.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const updatedAt = useMemo(() => profile?.updatedAt ?? '', [profile]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) return;

    setSaving(true);
    try {
      const nextProfile = {
        ...profile,
        ownerName: form.ownerName,
        businessName: form.businessName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        updatedAt: new Date().toISOString(),
      };

      await saveBusinessProfile(nextProfile);
      setProfile(nextProfile);
      toast.success('Profile updated successfully.');
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-border/60 h-full animate-pulse">
        <div className="h-6 w-40 mb-4 rounded bg-muted" />
        <div className="space-y-3">
          <div className="h-12 rounded bg-muted" />
          <div className="h-12 rounded bg-muted" />
          <div className="h-12 rounded bg-muted" />
          <div className="h-12 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-red-200 bg-red-50 text-red-700">
        <h2 className="text-lg font-semibold">Could not load profile</h2>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-700 text-foreground">My Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and update your business details. These values are stored in Firestore.
          </p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          Last saved: {updatedAt ? new Date(updatedAt).toLocaleString('en-IN') : 'Never'}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="glass-card rounded-2xl border border-border/60 p-6 space-y-6"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-foreground">
            <span>Owner name</span>
            <input
              name="ownerName"
              value={form.ownerName}
              onChange={handleChange}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            <span>Business name</span>
            <input
              name="businessName"
              value={form.businessName}
              onChange={handleChange}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            <span>Email address</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            <span>Phone number</span>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </label>
        </div>

        <label className="space-y-2 text-sm text-foreground">
          <span>Address</span>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            rows={4}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary resize-none"
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Business type:{' '}
            <span className="font-600 text-foreground capitalize">
              {profile?.businessType ?? 'custom'}
            </span>
          </div>
          <button
            type="submit"
            className="btn-primary px-5 py-3 rounded-xl disabled:opacity-60"
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
