import React from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';

export default function LandingFooter() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Product: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Industries', href: '#industries' },
      { label: 'Changelog', href: '#' },
    ],
    Company: [
      { label: 'About Us', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Contact', href: '#contact' },
    ],
    Support: [
      { label: 'Help Center', href: '#' },
      { label: 'Documentation', href: '#' },
      { label: 'API Reference', href: '#' },
      { label: 'Status', href: '#' },
    ],
    Legal: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Refund Policy', href: '#' },
      { label: 'Cookie Policy', href: '#' },
    ],
  };

  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <AppLogo size={36} />
              <span className="font-bold text-xl text-foreground">BizManage</span>
            </Link>
            <a
              href="https://vtechnex.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex text-sm font-700 text-primary hover:text-accent transition-colors mb-3"
            >
              By Vtechnex
            </a>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              One powerful platform for every business type. Academy, Hotel, Restaurant, Clinic -
              manage it all from a single dashboard.
            </p>
            <div className="mt-6 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs badge-success px-2.5 py-1 rounded-full font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-success inline-block"></span>
                All systems operational
              </span>
            </div>
          </div>

          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={`footer-section-${section}`}>
              <h4 className="text-xs font-600 tracking-widest text-muted-foreground uppercase mb-4">
                {section}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={`footer-link-${section}-${link.label}`}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {currentYear} BizManage. All rights reserved. Made with love in India.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <a
              href="https://vtechnex.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-700 text-primary hover:text-accent transition-colors"
            >
              Vtechnex
            </a>
            <p className="text-xs text-muted-foreground">
              GST-compliant · INR billing · Indian support team
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
