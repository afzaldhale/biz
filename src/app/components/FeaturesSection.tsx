import React from 'react';
import {
  LayoutDashboard,
  Bell,
  BarChart2,
  CreditCard,
  Shield,
  Smartphone,
  Users,
  RefreshCw,
} from 'lucide-react';

const features = [
  {
    id: 'feat-1',
    icon: LayoutDashboard,
    title: 'Dynamic Industry Dashboard',
    description:
      'Your dashboard auto-configures based on your business type. Academy gets student management, Hotel gets room control — no manual setup.',
    color: '#2563EB',
  },
  {
    id: 'feat-2',
    icon: BarChart2,
    title: 'Real-time Analytics',
    description:
      'Revenue trends, weekly activity, and performance metrics updated live. Make data-driven decisions with charts built for your industry.',
    color: '#7C3AED',
  },
  {
    id: 'feat-3',
    icon: CreditCard,
    title: 'INR Billing & Invoicing',
    description:
      'GST-compliant billing, invoice generation, receipt printing, and payment tracking — all in Indian Rupees with proper tax handling.',
    color: '#10B981',
  },
  {
    id: 'feat-4',
    icon: Bell,
    title: 'Smart Notifications',
    description:
      'WhatsApp and SMS alerts for fee dues, appointment reminders, booking confirmations, and ticket updates. Keep customers informed automatically.',
    color: '#F59E0B',
  },
  {
    id: 'feat-5',
    icon: Shield,
    title: 'Plan-Based Access Control',
    description:
      "Record limits enforced per plan tier. Upgrade prompts appear when you approach limits. Clear usage tracking so you're never surprised.",
    color: '#0891B2',
  },
  {
    id: 'feat-6',
    icon: Smartphone,
    title: 'Fully Responsive',
    description:
      'Manage your business from any device — desktop, tablet, or phone. Every screen is optimized for touch and small displays.',
    color: '#EA580C',
  },
  {
    id: 'feat-7',
    icon: Users,
    title: 'Multi-Staff Support',
    description:
      'Add staff accounts based on your plan. Role-based access ensures each team member only sees what they need.',
    color: '#EC4899',
  },
  {
    id: 'feat-8',
    icon: RefreshCw,
    title: 'Seamless Plan Upgrades',
    description:
      'Outgrowing your current plan? Upgrade in one click without losing any data. Your business grows, your plan grows with it.',
    color: '#38BDF8',
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-muted/40">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 badge-neutral px-3 py-1.5 rounded-full text-xs font-600 mb-4">
            Everything You Need
          </div>
          <h2 className="text-4xl md:text-5xl font-800 text-foreground mb-4">
            Features Built for <span className="gradient-text">Real Operations</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Not generic SaaS features — every capability is designed around how actual businesses in
            India operate day to day.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features?.map((feature) => (
            <div
              key={feature?.id}
              className="glass-card card-hover rounded-2xl p-6 border border-border"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${feature?.color}18` }}
              >
                <feature.icon size={22} style={{ color: feature?.color }} />
              </div>
              <h3 className="text-base font-700 text-foreground mb-2.5">{feature?.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature?.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
