import React from 'react';
import Link from 'next/link';
import LandingNavbar from '@/components/LandingNavbar';
import LandingFooter from '@/components/LandingFooter';

interface InfoSection {
  title: string;
  body: string[];
}

interface InfoPageShellProps {
  badge: string;
  description: string;
  eyebrow?: string;
  sections: InfoSection[];
  title: string;
  updatedAt?: string;
}

export default function InfoPageShell({
  badge,
  description,
  eyebrow = 'BizManage',
  sections,
  title,
  updatedAt,
}: InfoPageShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNavbar />
      <main className="px-6 lg:px-10 py-12 md:py-16">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="glass-card rounded-[32px] border border-border p-8 md:p-10">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className="badge-info px-3 py-1.5 rounded-full text-xs font-700 tracking-wide uppercase">
                {badge}
              </span>
              {updatedAt && (
                <span className="text-xs text-muted-foreground">Updated {updatedAt}</span>
              )}
            </div>

            <p className="text-xs font-700 tracking-[0.24em] text-primary uppercase">{eyebrow}</p>
            <h1 className="text-3xl md:text-4xl font-700 text-foreground mt-3">{title}</h1>
            <p className="text-base text-muted-foreground leading-relaxed mt-4 max-w-3xl">
              {description}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/sign-up-login-screen" className="btn-primary px-5 py-3 rounded-xl text-sm">
                Start Free Trial
              </Link>
              <Link href="/#contact" className="btn-outline px-5 py-3 rounded-xl text-sm">
                Contact Support
              </Link>
            </div>
          </div>

          <div className="grid gap-5">
            {sections.map((section) => (
              <section
                key={section.title}
                className="glass-card rounded-[28px] border border-border p-6 md:p-8"
              >
                <h2 className="text-xl font-700 text-foreground">{section.title}</h2>
                <div className="mt-4 space-y-3">
                  {section.body.map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-7 text-muted-foreground">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
