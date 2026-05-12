import React from 'react';
import { TrendingUp, Clock, HeadphonesIcon, Lock, Globe, Award } from 'lucide-react';

const reasons = [
  { id: 'why-1', icon: TrendingUp, title: 'Industry-First Design', description: 'Every module is built around how that specific business actually operates — not a generic CRM template.', color: '#2563EB' },
  { id: 'why-2', icon: Clock, title: 'Ready in 2 Minutes', description: 'Sign up, pick your industry, and your dashboard is live. No onboarding calls, no configuration headaches.', color: '#7C3AED' },
  { id: 'why-3', icon: HeadphonesIcon, title: 'Indian Support Team', description: 'Support in Hindi and English via phone, WhatsApp, and email. Real humans who understand your business context.', color: '#10B981' },
  { id: 'why-4', icon: Lock, title: 'Data Security First', description: 'Your business data is encrypted at rest and in transit. Regular backups, role-based access, audit logs.', color: '#F59E0B' },
  { id: 'why-5', icon: Globe, title: 'GST Compliant', description: 'Billing and invoicing built for Indian tax requirements. GST numbers, tax breakdowns, and e-invoice ready.', color: '#0891B2' },
  { id: 'why-6', icon: Award, title: 'No Lock-in', description: 'Export all your data at any time in Excel or PDF. Your data belongs to you — always.', color: '#EA580C' },
];

export default function WhyUsSection() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-800 text-foreground mb-4">
            Why Businesses Choose <span className="gradient-text">BizManage</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We built this for Indian business owners who needed a real operations tool, not another generic SaaS dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons?.map((reason) => (
            <div key={reason?.id} className="flex gap-4 glass-card rounded-2xl p-6 border border-border/60 card-hover">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: `${reason?.color}18` }}
              >
                <reason.icon size={20} style={{ color: reason?.color }} />
              </div>
              <div>
                <h3 className="text-base font-700 text-foreground mb-2">{reason?.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{reason?.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}