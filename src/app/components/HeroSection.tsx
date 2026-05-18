import React from 'react';
import Link from 'next/link';
import { ArrowRight, Zap, Shield, TrendingUp } from 'lucide-react';

export default function HeroSection() {
  const badges = [
    { icon: Zap, text: '8 Industry Types' },
    { icon: Shield, text: 'Secure & Reliable' },
    { icon: TrendingUp, text: 'Real-time Analytics' },
  ];

  const trustedBy = ['Academy', 'Hotel', 'Restaurant', 'Clinic', 'Service Center', 'Gym', 'Salon'];

  return (
    <section className="gradient-hero min-h-screen flex items-center pt-16 pb-24 relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />
      {/* Glow orbs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl bg-primary pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/6 w-64 h-64 rounded-full opacity-10 blur-3xl bg-accent pointer-events-none" />
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Announcement badge */}
          <div className="inline-flex items-center gap-2 glass-card-light px-4 py-2 rounded-full text-sm mb-8 border border-indigo-100">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse inline-block" />
            <span className="text-primary font-500">New: WhatsApp notifications now live</span>
            <ArrowRight size={14} className="text-primary" />
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-800 text-foreground leading-tight mb-6">
            Run Any Business From
            <br />
            <span className="gradient-text">One Powerful Dashboard</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
            BizManage adapts to your industry — Academy, Hotel, Restaurant, Clinic, or any other
            business. One login, one platform, complete control.
          </p>

          {/* Feature badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
            {badges?.map((badge) => (
              <div
                key={`hero-badge-${badge?.text}`}
                className="flex items-center gap-2 glass-card px-4 py-2 rounded-full text-sm"
              >
                <badge.icon size={14} className="text-primary" />
                <span className="text-muted-foreground">{badge?.text}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <a href="#features" className="btn-outline px-8 py-4 rounded-xl text-base font-500">
              See All Features
            </a>
          </div>

          {/* Trusted by */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-muted-foreground mr-2">Trusted by:</span>
            {trustedBy?.map((type) => (
              <span
                key={`trusted-${type}`}
                className="text-xs badge-neutral px-2.5 py-1 rounded-full"
              >
                {type}
              </span>
            ))}
          </div>
        </div>

        {/* Dashboard preview card */}
        <div className="mt-20 max-w-5xl mx-auto">
          <div className="glass-card rounded-2xl overflow-hidden border border-border shadow-card">
            {/* Fake browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-muted/60 border-b border-border">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-danger/60" />
                <div className="w-3 h-3 rounded-full bg-warning/60" />
                <div className="w-3 h-3 rounded-full bg-success/60" />
              </div>
              <div className="flex-1 mx-4 bg-muted rounded-md h-5 flex items-center px-3">
                <span className="text-2xs text-muted-foreground">app.bizmanage.in/dashboard</span>
              </div>
            </div>
            {/* Dashboard preview content */}
            <div className="p-6 bg-background">
              <div className="flex gap-4">
                {/* Sidebar preview */}
                <div className="hidden sm:flex flex-col gap-2 w-36 flex-shrink-0">
                  {['Dashboard', 'Students', 'Courses', 'Fees', 'Reports']?.map((item, idx) => (
                    <div
                      key={`prev-nav-${item}`}
                      className={`h-7 rounded-md text-xs flex items-center px-2.5 ${
                        idx === 0 ? 'sidebar-active text-xs' : 'text-muted-foreground bg-muted/40'
                      }`}
                    >
                      <div className="w-2.5 h-2.5 rounded-sm bg-current opacity-50 mr-2 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
                {/* Main content preview */}
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Total Students', value: '284', color: 'bg-primary/10' },
                      { label: 'Fees Collected', value: '₹4.8L', color: 'bg-success/10' },
                      { label: 'Active Courses', value: '18', color: 'bg-accent/10' },
                      { label: 'Pending Fees', value: '₹38K', color: 'bg-danger/10' },
                    ]?.map((card) => (
                      <div
                        key={`prev-card-${card?.label}`}
                        className={`${card?.color} rounded-lg p-3 border border-border/60`}
                      >
                        <div className="text-2xs text-muted-foreground mb-1">{card?.label}</div>
                        <div className="text-base font-700 text-foreground font-tabular">
                          {card?.value}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 bg-muted/40 rounded-lg h-24 flex items-center justify-center border border-border/60">
                      <div className="flex items-end gap-1 h-12">
                        {[40, 65, 45, 80, 55, 90, 70]?.map((h, i) => (
                          <div
                            key={`prev-bar-${i}`}
                            className="w-4 rounded-sm bg-primary/50"
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="bg-muted/40 rounded-lg h-24 flex flex-col justify-center items-center gap-1 border border-border/60">
                      <div className="text-2xs text-muted-foreground">Plan Usage</div>
                      <div className="text-lg font-700 text-foreground">42/50</div>
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-warning rounded-full" style={{ width: '84%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto text-center">
          {[
            { value: '5,000+', label: 'Businesses' },
            { value: '8', label: 'Industry Types' },
            { value: '99.9%', label: 'Uptime SLA' },
            { value: '₹499/mo', label: 'Starting At' },
          ]?.map((stat) => (
            <div key={`hero-stat-${stat?.label}`}>
              <div className="text-3xl font-800 gradient-text font-tabular">{stat?.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat?.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
