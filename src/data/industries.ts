import { Industry } from '@/types';

export const industries: Industry[] = [
  {
    id: 'academy',
    name: 'Academy / Coaching',
    description:
      'Manage students, courses, fees, attendance, and certificates for your coaching institute.',
    icon: 'GraduationCap',
    color: '#7C3AED',
    bgColor: 'rgba(124, 58, 237, 0.12)',
    modules: ['Students', 'Courses', 'Fees', 'Attendance', 'Certificates', 'Reports'],
  },
  {
    id: 'hotel',
    name: 'Hotel / Lodging',
    description: 'Manage guest registrations and room inventory with a simple lodge workflow.',
    icon: 'Building2',
    color: '#0891B2',
    bgColor: 'rgba(8, 145, 178, 0.12)',
    modules: ['Rooms', 'Guests', 'Subscription', 'Settings'],
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    description: 'Track orders, manage tables, update menu items, and process bills efficiently.',
    icon: 'UtensilsCrossed',
    color: '#EA580C',
    bgColor: 'rgba(234, 88, 12, 0.12)',
    modules: ['Orders', 'Tables', 'Menu', 'Kitchen', 'Billing', 'Reports'],
  },
  {
    id: 'clinic',
    name: 'Clinic / Healthcare',
    description: 'Streamline patient records, appointments, prescriptions, and medical billing.',
    icon: 'Stethoscope',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.12)',
    modules: ['Patients', 'Appointments', 'Prescriptions', 'Billing', 'Reports'],
  },
  {
    id: 'service-center',
    name: 'Service Center',
    description:
      'Manage repair tickets, assign technicians, track job progress, and invoice customers.',
    icon: 'Wrench',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.12)',
    modules: ['Tickets', 'Technicians', 'Customers', 'Invoices', 'Reports'],
  },
  {
    id: 'gym',
    name: 'Gym / Fitness',
    description: 'Manage members, trainer assignments, attendance, payments, and monthly renewals.',
    icon: 'Dumbbell',
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.12)',
    modules: ['Members', 'Trainers', 'Billing', 'Reports', 'Subscription', 'Settings'],
  },
  {
    id: 'salon',
    name: 'Salon / Spa',
    description:
      'Book appointments, manage stylists, track services, and handle payments seamlessly.',
    icon: 'Scissors',
    color: '#EC4899',
    bgColor: 'rgba(236, 72, 153, 0.12)',
    modules: ['Appointments', 'Stylists', 'Services', 'Products', 'Billing', 'Reports'],
  },
  {
    id: 'custom',
    name: 'Custom Business',
    description:
      'A flexible dashboard for any business type — configure modules to fit your workflow.',
    icon: 'LayoutGrid',
    color: '#38BDF8',
    bgColor: 'rgba(56, 189, 248, 0.12)',
    modules: ['Customers', 'Billing', 'Staff', 'Inventory', 'Reports'],
  },
];

export const getIndustryById = (id: string): Industry | undefined =>
  industries.find((i) => i.id === id);
