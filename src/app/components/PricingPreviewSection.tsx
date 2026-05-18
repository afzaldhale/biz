import React from 'react';
import Link from 'next/link';
import { ArrowRight, Zap, ShieldCheck, Sparkles } from 'lucide-react';
import { MIN_RECORDS, INTERNAL_PRICE_PER_RECORD } from '@/utils/pricing';

export default function PricingPreviewSection() {
  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary shadow-sm">
            <Zap size={16} />
            Pay only for the records you need
          </div>
          <h2 className="mt-6 text-4xl md:text-5xl font-extrabold text-foreground">
            Record-based pricing for growing businesses
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Start with {MIN_RECORDS} records at ₹
            {(MIN_RECORDS * INTERNAL_PRICE_PER_RECORD).toLocaleString('en-IN')}/month. Add more
            records anytime and scale seamlessly.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-start">
          <div className="rounded-[2rem] border border-border/70 bg-white p-8 shadow-card">
            <div className="mb-8 space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primary/80">
                Flexible pricing
              </p>
              <h3 className="text-3xl font-semibold text-foreground">₹9 per record / month</h3>
              <p className="text-base text-muted-foreground">
                A modern SaaS model built around your record volume, with a predictable minimum and
                no hidden fees.
              </p>
            </div>
            <div className="grid gap-4">
              <div className="rounded-3xl bg-slate-50 p-5">
                <h4 className="text-sm font-semibold text-foreground">Starter commitment</h4>
                <p className="mt-2 text-sm text-muted-foreground">
                  Begin with the smallest stable package for fast onboarding.
                </p>
                <div className="mt-4 flex items-center justify-between text-sm font-semibold text-foreground">
                  <span>{MIN_RECORDS.toLocaleString('en-IN')} records</span>
                  <span>
                    ₹{(MIN_RECORDS * INTERNAL_PRICE_PER_RECORD).toLocaleString('en-IN')}/month
                  </span>
                </div>
              </div>
              <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6">
                <div className="flex items-center gap-3 text-primary">
                  <ShieldCheck size={20} />
                  <span className="text-sm font-semibold">Transparent billing</span>
                </div>
                <ul className="mt-4 space-y-3 text-sm text-foreground">
                  <li>✓ ₹9 per record / month</li>
                  <li>✓ Minimum {MIN_RECORDS} records</li>
                  <li>✓ Monthly pricing with annual view</li>
                  <li>✓ No license or setup surcharge</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="rounded-[2rem] bg-gradient-to-br from-primary/10 to-slate-50 p-8 shadow-xl border border-primary/10">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primary/80">
                Pricing summary
              </p>
              <h3 className="mt-4 text-3xl font-semibold text-foreground">
                Start with the records you need
              </h3>
            </div>
            <div className="space-y-4 rounded-[1.75rem] bg-white p-6 shadow-sm border border-border/70">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Price per record</span>
                <span className="font-semibold text-foreground">
                  ₹{INTERNAL_PRICE_PER_RECORD}/month
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Minimum records</span>
                <span className="font-semibold text-foreground">{MIN_RECORDS}</span>
              </div>
              <div className="border-t border-border/70 pt-4">
                <p className="text-sm text-muted-foreground">Monthly starting price</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">
                  ₹{(MIN_RECORDS * INTERNAL_PRICE_PER_RECORD).toLocaleString('en-IN')}/month
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Annual equivalent</p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  ₹{(MIN_RECORDS * INTERNAL_PRICE_PER_RECORD * 12).toLocaleString('en-IN')}/year
                </p>
              </div>
            </div>
            <div className="mt-8 rounded-[1.75rem] border border-border/70 bg-white p-6 shadow-sm">
              <p className="text-sm text-muted-foreground">Example monthly pricing</p>
              <div className="mt-4 grid gap-3">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm text-muted-foreground">250 records</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    ₹2,250/mo · ₹27,000/yr
                  </p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm text-muted-foreground">500 records</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    ₹4,500/mo · ₹54,000/yr
                  </p>
                </div>
              </div>
            </div>
            <Link
              href="/sign-up-login-screen"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-primary px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-indigo-600"
            >
              Start onboarding
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        <div className="mt-10 text-center text-sm text-muted-foreground">
          <Sparkles size={16} className="inline-block mr-2" />
          All pricing is usage-based and scales with your business records.
        </div>
      </div>
    </section>
  );
}
