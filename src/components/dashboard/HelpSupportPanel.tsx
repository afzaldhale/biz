'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { createSupportTicket } from '@/services/activityService';

interface HelpSupportPanelProps {
  businessId: string;
  ownerName: string;
}

export default function HelpSupportPanel({ businessId, ownerName }: HelpSupportPanelProps) {
  const [form, setForm] = useState({
    subject: '',
    category: 'General',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      toast.error('Please add a subject and message before sending.');
      return;
    }

    setSubmitting(true);
    try {
      await createSupportTicket(businessId, {
        subject: form.subject,
        category: form.category,
        message: form.message,
        createdBy: ownerName,
      });
      toast.success('Support request sent. Our team will follow up soon.');
      setForm({ subject: '', category: 'General', message: '' });
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Failed to submit support request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-screen-2xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-700 text-foreground">Help & Support</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create a support ticket for technical issues, billing questions or product help.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          Logged in as: <span className="font-600 text-foreground">{ownerName}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-card rounded-2xl border border-border/60 p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-foreground">
            <span>Subject</span>
            <input
              name="subject"
              value={form.subject}
              onChange={handleChange}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              placeholder="Describe your issue"
            />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            <span>Category</span>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            >
              <option>General</option>
              <option>Billing</option>
              <option>Feature Request</option>
              <option>Bug Report</option>
              <option>Account</option>
            </select>
          </label>
        </div>
        <label className="space-y-2 text-sm text-foreground">
          <span>Message</span>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            rows={6}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary resize-none"
            placeholder="Please describe the problem in detail."
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            We aim to respond within one business day.
          </p>
          <button type="submit" className="btn-primary px-5 py-3 rounded-xl disabled:opacity-60" disabled={submitting}>
            {submitting ? 'Sending…' : 'Submit ticket'}
          </button>
        </div>
      </form>
    </div>
  );
}
