'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    id: 'faq-1',
    question: 'Can I switch my business type after signing up?',
    answer:
      'Yes — you can change your business type from the Settings page. Your account data is preserved, but the dashboard modules will update to match the new business type.',
  },
  {
    id: 'faq-2',
    question: 'What counts as a "record" for record limits?',
    answer:
      'A record is one primary entity in your business — one student, one patient, one booking, one service ticket. Supporting data (fees, appointments, bills) attached to a record do not count separately.',
  },
  {
    id: 'faq-3',
    question: 'Is there a free trial?',
    answer: 'No, we do not offer a free trial. Please contact us for a demo or more information.',
  },
  {
    id: 'faq-4',
    question: 'Can I add staff members to my account?',
    answer:
      'Yes — staff support is available, and each staff member can be assigned specific module access based on your business setup.',
  },
  {
    id: 'faq-5',
    question: 'Do you support multi-branch businesses?',
    answer:
      'Multi-branch support can be enabled for suitable business setups. Each branch gets its own dashboard with separate records, while the owner can view consolidated reports across all branches.',
  },
  {
    id: 'faq-6',
    question: 'How does billing work? Is it monthly or annual?',
    answer:
      'Subscriptions are billed monthly in INR based on selected record capacity, with a minimum of 50 records. Billing details and invoices should follow your production billing setup.',
  },
  {
    id: 'faq-7',
    question: 'What happens when I reach my record limit?',
    answer:
      "You'll see a warning at 80% usage and a hard limit at 100%. You can still view and edit existing records, but adding new ones requires increasing your record capacity. Upgrades are instant.",
  },
  {
    id: 'faq-8',
    question: 'Is my data safe if I cancel my subscription?',
    answer:
      'If you cancel, your account enters a 30-day grace period where you can export all your data. After 30 days, data is permanently deleted. We never sell or share your business data.',
  },
];

export default function FaqSection() {
  const [openId, setOpenId] = useState<string | null>('faq-1');

  return (
    <section id="faq" className="py-24 bg-background">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-800 text-foreground mb-4">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Everything you need to know before getting started.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs?.map((faq) => {
            const isOpen = openId === faq?.id;
            return (
              <div
                key={faq?.id}
                className={`glass-card rounded-xl border transition-all duration-200 ${
                  isOpen ? 'border-primary/40' : 'border-border/60'
                }`}
              >
                <button
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                  onClick={() => setOpenId(isOpen ? null : faq?.id)}
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-600 text-foreground pr-4">{faq?.question}</span>
                  <ChevronDown
                    size={16}
                    className={`text-muted-foreground flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 animate-fade-in">
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq?.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
