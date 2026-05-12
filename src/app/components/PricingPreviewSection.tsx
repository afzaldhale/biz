import React from 'react';
import Link from 'next/link';
import { Check, ArrowRight, Zap } from 'lucide-react';

const previewPlans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 499,
    recordLimit: 50,
    color: '#64748B',
    features: ['50 records', '1 staff account', 'Core modules', 'Email support'],
    popular: false,
  },
  {
    id: 'advance',
    name: 'Advance',
    price: 1499,
    recordLimit: 250,
    color: '#7C3AED',
    features: ['250 records', '5 staff accounts', 'Full analytics', 'SMS notifications', 'PDF & Excel export'],
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 2999,
    recordLimit: 1000,
    color: '#D97706',
    features: ['1000 records', '25 staff accounts', 'Enterprise analytics', 'Multi-branch', 'White-label option', 'API access'],
    popular: false,
  },
];

export default function PricingPreviewSection() {
  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 badge-success px-3 py-1.5 rounded-full text-xs font-600 mb-4">
            <Zap size={12} />
            Simple Pricing
          </div>
          <h2 className="text-4xl md:text-5xl font-800 text-foreground mb-4">
            Plans That <span className="gradient-text">Grow With You</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start at ₹499/month and upgrade as your business grows. No hidden charges, no setup fees.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {previewPlans?.map((plan) => (
            <div
              key={`pricing-${plan?.id}`}
              className={`relative rounded-2xl p-7 flex flex-col ${
                plan?.popular
                  ? 'pricing-popular bg-card' :'glass-card border border-border/60'
              }`}
            >
              {plan?.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="btn-primary text-xs px-4 py-1.5 rounded-full font-600">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div className="mb-6">
                <div
                  className="text-xs font-700 tracking-widest uppercase mb-2"
                  style={{ color: plan?.color }}
                >
                  {plan?.name}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-800 text-foreground font-tabular">₹{plan?.price?.toLocaleString('en-IN')}</span>
                  <span className="text-muted-foreground text-sm">/month</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Up to {plan?.recordLimit} records
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-2.5 mb-8 flex-1">
                {plan?.features?.map((feature) => (
                  <li key={`plan-feat-${plan?.id}-${feature}`} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Check size={14} className="text-success flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/sign-up-login-screen"
                className={`w-full py-3 rounded-xl text-sm font-600 text-center flex items-center justify-center gap-2 transition-all ${
                  plan?.popular ? 'btn-primary' : 'btn-outline'
                }`}
              >
                Get Started
                <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>

        {/* View all pricing */}
        <div className="text-center mt-10">
          <p className="text-sm text-muted-foreground mb-3">
            Also available: Medium ₹999, Premium ₹1,999, and Custom Enterprise plans
          </p>
          <Link href="/sign-up-login-screen" className="text-sm text-primary hover:text-accent font-600 transition-colors inline-flex items-center gap-1.5">
            View full pricing comparison
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}