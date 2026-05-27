import React from 'react';
import { ArrowRight, Zap, Shield, TrendingUp } from 'lucide-react';

export default function HeroSection() {
  const badges = [
    { icon: Zap, text: '8 Industry Types' },
    { icon: Shield, text: 'Secure & Reliable' },
    { icon: TrendingUp, text: 'Real-time Analytics' },
  ];

  const trustedBy = ['Academy', 'Hotel', 'Restaurant', 'Clinic', 'Service Center', 'Gym', 'Salon'];

  return (
    <section className="gradient-hero relative flex min-h-screen items-center overflow-hidden pb-24 pt-16">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="pointer-events-none absolute right-1/4 top-1/4 h-96 w-96 rounded-full bg-primary opacity-20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-1/4 left-1/6 h-64 w-64 rounded-full bg-accent opacity-10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-screen-2xl px-6 lg:px-10">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-100 glass-card-light px-4 py-2 text-sm">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
            <span className="font-500 text-primary">New: WhatsApp notifications now live</span>
            <ArrowRight size={14} className="text-primary" />
          </div>

          <h1 className="mb-6 text-5xl font-800 leading-tight text-foreground md:text-6xl lg:text-7xl">
            Run Any Business From
            <br />
            <span className="gradient-text">One Powerful Dashboard</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            BizManage adapts to your industry - Academy, Hotel, Restaurant, Clinic, or any other
            business. One login, one platform, complete control.
          </p>

          <div className="mb-10 flex flex-wrap items-center justify-center gap-4">
            {badges.map((badge) => (
              <div
                key={`hero-badge-${badge.text}`}
                className="flex items-center gap-2 rounded-full glass-card px-4 py-2 text-sm"
              >
                <badge.icon size={14} className="text-primary" />
                <span className="text-muted-foreground">{badge.text}</span>
              </div>
            ))}
          </div>

          <div className="mb-14 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a href="#features" className="btn-outline rounded-xl px-8 py-4 text-base font-500">
              See All Features
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="mr-2 text-xs text-muted-foreground">Trusted by:</span>
            {trustedBy.map((type) => (
              <span key={`trusted-${type}`} className="badge-neutral rounded-full px-2.5 py-1 text-xs">
                {type}
              </span>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-20 max-w-5xl">
          <div className="overflow-hidden rounded-2xl border border-border glass-card shadow-card">
            <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-danger/60" />
                <div className="h-3 w-3 rounded-full bg-warning/60" />
                <div className="h-3 w-3 rounded-full bg-success/60" />
              </div>
              <div className="mx-4 flex h-5 flex-1 items-center rounded-md bg-muted px-3">
                <span className="text-2xs text-muted-foreground">app.bizmanage.in/dashboard</span>
              </div>
            </div>

            <div className="bg-background p-6">
              <div className="flex gap-4">
                <div className="hidden w-36 flex-shrink-0 flex-col gap-2 sm:flex">
                  {['Dashboard', 'Students', 'Courses', 'Fees', 'Reports'].map((item, idx) => (
                    <div
                      key={`prev-nav-${item}`}
                      className={`flex h-7 items-center rounded-md px-2.5 text-xs ${
                        idx === 0 ? 'sidebar-active text-xs' : 'bg-muted/40 text-muted-foreground'
                      }`}
                    >
                      <div className="mr-2 h-2.5 w-2.5 flex-shrink-0 rounded-sm bg-current opacity-50" />
                      {item}
                    </div>
                  ))}
                </div>

                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {[
                      { label: 'Total Students', value: '284', color: 'bg-primary/10' },
                      { label: 'Fees Collected', value: 'Rs 4.8L', color: 'bg-success/10' },
                      { label: 'Active Courses', value: '18', color: 'bg-accent/10' },
                      { label: 'Pending Fees', value: 'Rs 38K', color: 'bg-danger/10' },
                    ].map((card) => (
                      <div
                        key={`prev-card-${card.label}`}
                        className={`${card.color} rounded-lg border border-border/60 p-3`}
                      >
                        <div className="mb-1 text-2xs text-muted-foreground">{card.label}</div>
                        <div className="font-tabular text-base font-700 text-foreground">
                          {card.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 flex h-24 items-center justify-center rounded-lg border border-border/60 bg-muted/40">
                      <div className="flex h-12 items-end gap-1">
                        {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                          <div
                            key={`prev-bar-${i}`}
                            className="w-4 rounded-sm bg-primary/50"
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex h-24 flex-col items-center justify-center gap-1 rounded-lg border border-border/60 bg-muted/40">
                      <div className="text-2xs text-muted-foreground">Record Usage</div>
                      <div className="text-lg font-700 text-foreground">42/50</div>
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-warning" style={{ width: '84%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-6 text-center md:grid-cols-4">
          {[
            { value: '5,000+', label: 'Businesses' },
            { value: '8', label: 'Industry Types' },
            { value: '99.9%', label: 'Uptime SLA' },
            { value: '50', label: 'Minimum Records' },
          ].map((stat) => (
            <div key={`hero-stat-${stat.label}`}>
              <div className="font-tabular text-3xl font-800 gradient-text">{stat.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
