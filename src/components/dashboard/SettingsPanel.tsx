'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BusinessProfile } from '@/types';
import { getBusinessProfile, saveBusinessProfile } from '@/services/businessService';

interface SettingsPanelProps {
  businessId: string;
}

export default function SettingsPanel({ businessId }: SettingsPanelProps) {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [form, setForm] = useState({
    invoicePrefix: '',
    receiptFooterNote: '',
    currency: '',
    timezone: '',
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
          setError('Business settings not found.');
          return;
        }

        setProfile(business);
        setForm({
          invoicePrefix: business.invoicePrefix ?? '',
          receiptFooterNote: business.receiptFooterNote ?? '',
          currency: business.currency ?? 'INR',
          timezone: business.timezone ?? 'Asia/Kolkata',
        });
      })
      .catch((caught) => {
        if (cancelled) return;
        setError(caught instanceof Error ? caught.message : 'Unable to load settings.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) return;

    setSaving(true);
    try {
      const updatedProfile = {
        ...profile,
        invoicePrefix: form.invoicePrefix,
        receiptFooterNote: form.receiptFooterNote,
        currency: form.currency,
        timezone: form.timezone,
        updatedAt: new Date().toISOString(),
      };

      await saveBusinessProfile(updatedProfile);
      setProfile(updatedProfile);
      toast.success('Settings saved successfully.');
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-border/60 h-full animate-pulse">
        <div className="h-6 w-52 mb-4 rounded bg-muted" />
        <div className="space-y-3">
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
        <h2 className="text-lg font-semibold">Could not load settings</h2>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-700 text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure business preferences, invoice defaults, and timezone settings.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          Subscription model: <span className="font-600 text-foreground">Record-based billing</span>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="glass-card rounded-2xl border border-border/60 p-6 space-y-6"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-foreground">
            <span>Invoice prefix</span>
            <input
              name="invoicePrefix"
              value={form.invoicePrefix}
              onChange={handleChange}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              placeholder="e.g. INV"
            />
          </label>

          <label className="space-y-2 text-sm text-foreground">
            <span>Currency</span>
            <input
              name="currency"
              value={form.currency}
              onChange={handleChange}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              placeholder="INR"
            />
          </label>

          <label className="space-y-2 text-sm text-foreground md:col-span-2">
            <span>Receipt footer note</span>
            <textarea
              name="receiptFooterNote"
              value={form.receiptFooterNote}
              onChange={handleChange}
              rows={4}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary resize-none"
              placeholder="Thank you for your business"
            />
          </label>

          <label className="space-y-2 text-sm text-foreground md:col-span-2">
            <span>Timezone</span>
            <input
              name="timezone"
              value={form.timezone}
              onChange={handleChange}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              placeholder="Asia/Kolkata"
            />
          </label>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Last updated:{' '}
            {profile?.updatedAt ? new Date(profile.updatedAt).toLocaleString('en-IN') : 'Unknown'}
          </div>
          <button
            type="submit"
            className="btn-primary px-5 py-3 rounded-xl disabled:opacity-60"
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
