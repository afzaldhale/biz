import React from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Building2,
  UtensilsCrossed,
  Stethoscope,
  Wrench,
  Dumbbell,
  Scissors,
  LayoutGrid,
  ArrowRight,
} from 'lucide-react';

const iconMap: Record<
  string,
  React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>
> = {
  GraduationCap,
  Building2,
  UtensilsCrossed,
  Stethoscope,
  Wrench,
  Dumbbell,
  Scissors,
  LayoutGrid,
};

const industries = [
  {
    id: 'academy',
    name: 'Academy / Coaching',
    description: 'Students, courses, fees, attendance & certificates',
    icon: 'GraduationCap',
    color: '#7C3AED',
    bgColor: 'rgba(124,58,237,0.1)',
    modules: ['Students', 'Courses', 'Fees', 'Receipts'],
  },
  {
    id: 'hotel',
    name: 'Hotel / Lodging',
    description: 'Room management, bookings, guests & billing',
    icon: 'Building2',
    color: '#0891B2',
    bgColor: 'rgba(8,145,178,0.1)',
    modules: ['Rooms', 'Bookings', 'Guests', 'Billing'],
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    description: 'Orders, table management, menu & KOT',
    icon: 'UtensilsCrossed',
    color: '#EA580C',
    bgColor: 'rgba(234,88,12,0.1)',
    modules: ['Orders', 'Tables', 'Menu', 'Billing'],
  },
  {
    id: 'clinic',
    name: 'Clinic / Healthcare',
    description: 'Patients, appointments, prescriptions & billing',
    icon: 'Stethoscope',
    color: '#10B981',
    bgColor: 'rgba(16,185,129,0.1)',
    modules: ['Patients', 'Appointments', 'Prescriptions', 'Billing'],
  },
  {
    id: 'service-center',
    name: 'Service Center',
    description: 'Repair tickets, technicians, customers & invoices',
    icon: 'Wrench',
    color: '#F59E0B',
    bgColor: 'rgba(245,158,11,0.1)',
    modules: ['Tickets', 'Technicians', 'Customers', 'Invoices'],
  },
  {
    id: 'gym',
    name: 'Gym / Fitness',
    description: 'Members, classes, trainers & renewals',
    icon: 'Dumbbell',
    color: '#EF4444',
    bgColor: 'rgba(239,68,68,0.1)',
    modules: ['Members', 'Classes', 'Trainers', 'Billing'],
  },
  {
    id: 'salon',
    name: 'Salon / Spa',
    description: 'Appointments, stylists, services & products',
    icon: 'Scissors',
    color: '#EC4899',
    bgColor: 'rgba(236,72,153,0.1)',
    modules: ['Appointments', 'Stylists', 'Services', 'Billing'],
  },
  {
    id: 'custom',
    name: 'Custom Business',
    description: 'Flexible modules for any business workflow',
    icon: 'LayoutGrid',
    color: '#38BDF8',
    bgColor: 'rgba(56,189,248,0.1)',
    modules: ['Customers', 'Billing', 'Staff', 'Reports'],
  },
];

export default function IndustriesSection() {
  return (
    <section id="industries" className="py-24 bg-background">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 badge-info px-3 py-1.5 rounded-full text-xs font-600 mb-4">
            8 Industry Types
          </div>
          <h2 className="text-4xl md:text-5xl font-800 text-foreground mb-4">
            Built for <span className="gradient-text">Every Business</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose your industry and get an instantly configured dashboard with all the modules your
            business needs — no setup required.
          </p>
        </div>

        {/* Industry Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {industries.map((industry) => {
            const IconComponent = iconMap[industry.icon];
            return (
              <div
                key={`industry-card-${industry.id}`}
                className="glass-card industry-card-border rounded-2xl p-6 cursor-pointer group"
              >
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: industry.bgColor }}
                >
                  {IconComponent && (
                    <IconComponent
                      size={24}
                      className="transition-colors"
                      style={{ color: industry.color } as React.CSSProperties}
                    />
                  )}
                </div>

                {/* Content */}
                <h3 className="text-base font-700 text-foreground mb-2">{industry.name}</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {industry.description}
                </p>

                {/* Modules */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {industry.modules.map((mod) => (
                    <span
                      key={`ind-mod-${industry.id}-${mod}`}
                      className="text-2xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-500 border border-border/60"
                    >
                      {mod}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <Link
                  href="/sign-up-login-screen"
                  className="flex items-center gap-1.5 text-sm font-600 transition-colors group-hover:gap-2.5"
                  style={{ color: industry.color }}
                >
                  Get Started
                  <ArrowRight
                    size={14}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
