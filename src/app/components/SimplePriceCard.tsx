'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function SimplePriceCard() {
  return (
    <section className="mx-auto my-12 w-full max-w-md px-4">
      <div className="rounded-[1.75rem] border border-border/70 bg-white p-6 shadow-card">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/5">
            <Sparkles size={20} className="text-primary" />
          </div>

          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">Price per record</p>
            <div className="mt-1 flex items-baseline justify-center gap-2">
              <span className="text-3xl font-extrabold leading-none">₹9</span>
              <span className="text-sm text-muted-foreground">/month</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Minimum 50 records · Usage-based billing
            </p>
          </div>

          <div className="mt-4 w-full">
            <div className="rounded-lg border border-border/50 bg-slate-50 p-3 text-left">
              <p className="text-sm font-semibold text-foreground">Simple billing</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Only pay for records in use. No setup or licensing fees — predictable and
                transparent.
              </p>
            </div>
          </div>

          <div className="mt-5 w-full">
            <Link
              href="/sign-up-login-screen"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
            >
              Start onboarding
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
