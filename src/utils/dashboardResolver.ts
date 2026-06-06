import { BusinessType, NavGroup } from '@/types';

const baseNavGroups: NavGroup[] = [
  {
    section: 'OVERVIEW',
    items: [{ id: 'nav-dashboard', label: 'Dashboard', icon: 'LayoutDashboard' }],
  },
];

const settingsGroup: NavGroup = {
  section: 'ACCOUNT',
  items: [
    { id: 'nav-subscription', label: 'Subscription', icon: 'CreditCard' },
    { id: 'nav-settings', label: 'Settings', icon: 'Settings' },
  ],
};

const sidebarNavMap: Record<BusinessType, NavGroup[]> = {
  academy: [
    ...baseNavGroups,
    {
      section: 'MANAGEMENT',
      items: [
        { id: 'nav-students', label: 'Students', icon: 'Users' },
        { id: 'nav-courses', label: 'Courses', icon: 'BookOpen' },
        { id: 'nav-fees', label: 'Fees', icon: 'IndianRupee' },
        { id: 'nav-receipts', label: 'Receipts', icon: 'Receipt' },
        { id: 'nav-attendance', label: 'Attendance', icon: 'ClipboardCheck' },
      ],
    },
    {
      section: 'INSIGHTS',
      items: [{ id: 'nav-reports', label: 'Reports', icon: 'BarChart2' }],
    },
    settingsGroup,
  ],
  hotel: [
    ...baseNavGroups,
    {
      section: 'MANAGEMENT',
      items: [
        { id: 'nav-guests', label: 'Guests', icon: 'Users' },
        { id: 'nav-rooms', label: 'Rooms', icon: 'LayoutGrid' },
      ],
    },
    settingsGroup,
  ],
  restaurant: [
    ...baseNavGroups,
    {
      section: 'OPERATIONS',
      items: [
        { id: 'nav-orders', label: 'Orders', icon: 'ShoppingBag' },
        { id: 'nav-tables', label: 'Tables', icon: 'LayoutGrid' },
        { id: 'nav-menu', label: 'Menu', icon: 'UtensilsCrossed' },
        { id: 'nav-kitchen', label: 'Kitchen', icon: 'ChefHat' },
      ],
    },
    {
      section: 'BILLING',
      items: [],
    },
    settingsGroup,
  ],
  clinic: [
    ...baseNavGroups,
    {
      section: 'PATIENT CARE',
      items: [
        { id: 'nav-patients', label: 'Patients', icon: 'Users' },
        { id: 'nav-appointments', label: 'Appointments', icon: 'Calendar' },
        { id: 'nav-prescriptions', label: 'Prescriptions', icon: 'FileText' },
      ],
    },
    {
      section: 'BILLING',
      items: [
        { id: 'nav-billing', label: 'Billing', icon: 'Receipt' },
        { id: 'nav-reports', label: 'Reports', icon: 'BarChart2' },
      ],
    },
    settingsGroup,
  ],
  'service-center': [
    ...baseNavGroups,
    {
      section: 'OPERATIONS',
      items: [
        { id: 'nav-tickets', label: 'Service Tickets', icon: 'Ticket' },
        { id: 'nav-technicians', label: 'Technicians', icon: 'Wrench' },
        { id: 'nav-customers', label: 'Customers', icon: 'Users' },
      ],
    },
    {
      section: 'BILLING',
      items: [
        { id: 'nav-invoices', label: 'Invoices', icon: 'FileText' },
        { id: 'nav-reports', label: 'Reports', icon: 'BarChart2' },
      ],
    },
    settingsGroup,
  ],
  gym: [
    ...baseNavGroups,
    {
      section: 'MANAGEMENT',
      items: [
        { id: 'nav-members', label: 'Members', icon: 'Users' },
        { id: 'nav-trainers', label: 'Trainers', icon: 'UserCheck' },
      ],
    },
    {
      section: 'BILLING',
      items: [
        { id: 'nav-billing', label: 'Billing', icon: 'Receipt' },
        { id: 'nav-reports', label: 'Reports', icon: 'BarChart2' },
      ],
    },
    settingsGroup,
  ],
  salon: [
    ...baseNavGroups,
    {
      section: 'MANAGEMENT',
      items: [
        { id: 'nav-appointments', label: 'Appointments', icon: 'Calendar' },
        { id: 'nav-stylists', label: 'Stylists', icon: 'Scissors' },
        { id: 'nav-services', label: 'Services', icon: 'Sparkles' },
        { id: 'nav-products', label: 'Products', icon: 'Package' },
      ],
    },
    {
      section: 'BILLING',
      items: [
        { id: 'nav-billing', label: 'Billing', icon: 'Receipt' },
        { id: 'nav-reports', label: 'Reports', icon: 'BarChart2' },
      ],
    },
    settingsGroup,
  ],
  custom: [
    ...baseNavGroups,
    {
      section: 'MANAGEMENT',
      items: [
        { id: 'nav-customers', label: 'Customers', icon: 'Users' },
        { id: 'nav-staff', label: 'Staff', icon: 'UserCheck' },
        { id: 'nav-inventory', label: 'Inventory', icon: 'Package' },
      ],
    },
    {
      section: 'BILLING',
      items: [
        { id: 'nav-billing', label: 'Billing', icon: 'Receipt' },
        { id: 'nav-reports', label: 'Reports', icon: 'BarChart2' },
      ],
    },
    settingsGroup,
  ],
};

const quickActionMap: Record<
  BusinessType,
  { id: string; label: string; icon: string; color: string }[]
> = {
  academy: [
    { id: 'qa-ac-1', label: 'Add Student', icon: 'UserPlus', color: '#7C3AED' },
    { id: 'qa-ac-2', label: 'Collect Fee', icon: 'IndianRupee', color: '#10B981' },
    { id: 'qa-ac-3', label: 'Print Receipt', icon: 'Printer', color: '#2563EB' },
    { id: 'qa-ac-4', label: 'New Course', icon: 'BookPlus', color: '#F59E0B' },
  ],
  hotel: [
    { id: 'qa-ht-1', label: 'Register Guest', icon: 'UserPlus', color: '#0891B2' },
    { id: 'qa-ht-2', label: 'Manage Rooms', icon: 'LayoutGrid', color: '#2563EB' },
    { id: 'qa-ht-3', label: 'Guest List', icon: 'Users', color: '#7C3AED' },
    { id: 'qa-ht-4', label: 'Generate Bill', icon: 'Receipt', color: '#10B981' },
  ],
  restaurant: [
    { id: 'qa-rs-1', label: 'New Order', icon: 'Plus', color: '#EA580C' },
    { id: 'qa-rs-2', label: 'Manage Tables', icon: 'LayoutGrid', color: '#2563EB' },
    { id: 'qa-rs-3', label: 'Update Menu', icon: 'UtensilsCrossed', color: '#7C3AED' },
    { id: 'qa-rs-4', label: 'Generate Bill', icon: 'Receipt', color: '#10B981' },
  ],
  clinic: [
    { id: 'qa-cl-1', label: 'Add Patient', icon: 'UserPlus', color: '#10B981' },
    { id: 'qa-cl-2', label: 'Book Appointment', icon: 'CalendarPlus', color: '#2563EB' },
    { id: 'qa-cl-3', label: 'Write Prescription', icon: 'FileText', color: '#7C3AED' },
    { id: 'qa-cl-4', label: 'Generate Bill', icon: 'Receipt', color: '#F59E0B' },
  ],
  'service-center': [
    { id: 'qa-sv-1', label: 'New Ticket', icon: 'Plus', color: '#F59E0B' },
    { id: 'qa-sv-2', label: 'Assign Tech', icon: 'Wrench', color: '#2563EB' },
    { id: 'qa-sv-3', label: 'Add Customer', icon: 'UserPlus', color: '#7C3AED' },
    { id: 'qa-sv-4', label: 'Create Invoice', icon: 'FileText', color: '#10B981' },
  ],
  gym: [
    { id: 'qa-gm-1', label: 'Add Member', icon: 'UserPlus', color: '#7C3AED' },
    { id: 'qa-gm-2', label: 'Assign Trainer', icon: 'UserCheck', color: '#2563EB' },
    { id: 'qa-gm-3', label: 'Mark Attendance', icon: 'ClipboardCheck', color: '#10B981' },
    { id: 'qa-gm-4', label: 'Collect Fee', icon: 'IndianRupee', color: '#F59E0B' },
  ],
  salon: [
    { id: 'qa-sl-1', label: 'Book Appointment', icon: 'CalendarPlus', color: '#EC4899' },
    { id: 'qa-sl-2', label: 'Add Service', icon: 'Sparkles', color: '#2563EB' },
    { id: 'qa-sl-3', label: 'Add Product', icon: 'Package', color: '#7C3AED' },
    { id: 'qa-sl-4', label: 'Generate Bill', icon: 'Receipt', color: '#10B981' },
  ],
  custom: [
    { id: 'qa-cu-1', label: 'Add Customer', icon: 'UserPlus', color: '#38BDF8' },
    { id: 'qa-cu-2', label: 'Create Invoice', icon: 'FileText', color: '#2563EB' },
    { id: 'qa-cu-3', label: 'Add Staff', icon: 'UserCheck', color: '#7C3AED' },
    { id: 'qa-cu-4', label: 'View Reports', icon: 'BarChart2', color: '#10B981' },
  ],
};

export const getSidebarNavItems = (businessType: BusinessType): NavGroup[] =>
  sidebarNavMap[businessType] ?? sidebarNavMap.custom;

export const getQuickActions = (businessType: BusinessType) =>
  quickActionMap[businessType] ?? quickActionMap.custom;
