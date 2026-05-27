// BACKEND INTEGRATION POINT: Replace all mock data with Firestore service calls
// from src/services/adminService.ts, adminBusinessService.ts, etc.

export type AdminRole = 'super_admin' | 'support_admin' | 'sales_admin';
export type AdminStatus = 'active' | 'inactive';

export interface Admin {
  uid: string;
  email: string;
  name: string;
  role: AdminRole;
  status: AdminStatus;
  createdAt: string;
  avatar?: string;
}

export type BusinessStatus = 'active' | 'pending_verification' | 'suspended' | 'cancelled';
export type PlanType = 'basic' | 'medium' | 'advance' | 'premium' | 'pro' | 'custom';
export type IndustryType =
  | 'restaurant'
  | 'retail'
  | 'education'
  | 'salon'
  | 'gym'
  | 'healthcare'
  | 'real_estate'
  | 'logistics'
  | 'ecommerce'
  | 'consulting';

export interface Business {
  id: string;
  businessId?: string;
  ownerId?: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  industry: IndustryType;
  businessType?: string;
  plan: PlanType;
  status: BusinessStatus;
  createdAt: string;
  usageCount: number;
  usageLimit: number;
  recordLimit?: number;
  currentUsage?: number;
  remainingRecords?: number;
  monthlyPrice?: number;
  subscriptionStatus?: string;
  nextBillingDate?: string | null;
  city: string;
  emailVerified: boolean;
  lastActive: string;
}

export interface SupportTicket {
  id: string;
  businessId: string;
  businessName: string;
  subject: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
  messagePreview: string;
  priority: 'low' | 'medium' | 'high';
}

export interface PlatformStats {
  totalBusinesses: number;
  activeBusinesses: number;
  pendingVerification: number;
  totalUsers: number;
  expectedMRR: number;
  activeSubscriptions: number;
  openTickets: number;
  customEnquiries: number;
  mrrTrend: { month: string; mrr: number; businesses: number }[];
  planDistribution: { plan: string; count: number; revenue: number }[];
  industryDistribution: { industry: string; count: number }[];
}

export const MOCK_ADMINS: Admin[] = [
  {
    uid: 'admin-001',
    email: 'superadmin@bizmanage.in',
    name: 'Arjun Mehta',
    role: 'super_admin',
    status: 'active',
    createdAt: '2024-01-10',
  },
  {
    uid: 'admin-002',
    email: 'support@bizmanage.in',
    name: 'Priya Sharma',
    role: 'support_admin',
    status: 'active',
    createdAt: '2024-02-14',
  },
  {
    uid: 'admin-003',
    email: 'sales@bizmanage.in',
    name: 'Rohan Verma',
    role: 'sales_admin',
    status: 'active',
    createdAt: '2024-03-05',
  },
];

export const PLAN_PRICES: Record<PlanType, number> = {
  basic: 499,
  medium: 999,
  advance: 1499,
  premium: 1999,
  pro: 2999,
  custom: 4999,
};

export const PLAN_LIMITS: Record<PlanType, number> = {
  basic: 50,
  medium: 150,
  advance: 250,
  premium: 500,
  pro: 1000,
  custom: 9999,
};

export const MOCK_BUSINESSES: Business[] = [
  {
    id: 'biz-001',
    businessName: 'Spice Garden Restaurant',
    ownerName: 'Kavita Nair',
    email: 'kavita@spicegarden.com',
    phone: '+91 98765 43210',
    industry: 'restaurant',
    plan: 'premium',
    status: 'active',
    createdAt: '2025-11-12',
    usageCount: 387,
    usageLimit: 500,
    city: 'Mumbai',
    emailVerified: true,
    lastActive: '2026-05-15',
  },
  {
    id: 'biz-002',
    businessName: 'Bright Minds Academy',
    ownerName: 'Suresh Patel',
    email: 'suresh@brightminds.in',
    phone: '+91 87654 32109',
    industry: 'education',
    plan: 'pro',
    status: 'active',
    createdAt: '2025-10-03',
    usageCount: 812,
    usageLimit: 1000,
    city: 'Ahmedabad',
    emailVerified: true,
    lastActive: '2026-05-14',
  },
  {
    id: 'biz-003',
    businessName: 'FitZone Gym & Wellness',
    ownerName: 'Ankit Sharma',
    email: 'ankit@fitzone.co.in',
    phone: '+91 76543 21098',
    industry: 'gym',
    plan: 'advance',
    status: 'pending_verification',
    createdAt: '2026-05-10',
    usageCount: 0,
    usageLimit: 250,
    city: 'Pune',
    emailVerified: false,
    lastActive: '2026-05-10',
  },
  {
    id: 'biz-004',
    businessName: 'StyleCraft Salon',
    ownerName: 'Deepa Rao',
    email: 'deepa@stylecraft.in',
    phone: '+91 65432 10987',
    industry: 'salon',
    plan: 'medium',
    status: 'active',
    createdAt: '2025-12-20',
    usageCount: 134,
    usageLimit: 150,
    city: 'Bangalore',
    emailVerified: true,
    lastActive: '2026-05-13',
  },
  {
    id: 'biz-005',
    businessName: 'MediCare Clinic',
    ownerName: 'Dr. Rajesh Kumar',
    email: 'rajesh@medicare-clinic.in',
    phone: '+91 54321 09876',
    industry: 'healthcare',
    plan: 'premium',
    status: 'suspended',
    createdAt: '2025-09-15',
    usageCount: 211,
    usageLimit: 500,
    city: 'Delhi',
    emailVerified: true,
    lastActive: '2026-04-28',
  },
  {
    id: 'biz-006',
    businessName: 'HomeNest Realty',
    ownerName: 'Vikram Singh',
    email: 'vikram@homenest.in',
    phone: '+91 43210 98765',
    industry: 'real_estate',
    plan: 'advance',
    status: 'active',
    createdAt: '2025-11-28',
    usageCount: 198,
    usageLimit: 250,
    city: 'Hyderabad',
    emailVerified: true,
    lastActive: '2026-05-12',
  },
  {
    id: 'biz-007',
    businessName: 'QuickShip Logistics',
    ownerName: 'Mohan Reddy',
    email: 'mohan@quickship.in',
    phone: '+91 32109 87654',
    industry: 'logistics',
    plan: 'pro',
    status: 'active',
    createdAt: '2025-08-22',
    usageCount: 743,
    usageLimit: 1000,
    city: 'Chennai',
    emailVerified: true,
    lastActive: '2026-05-15',
  },
  {
    id: 'biz-008',
    businessName: 'TrendHub Fashion',
    ownerName: 'Neha Joshi',
    email: 'neha@trendhub.shop',
    phone: '+91 21098 76543',
    industry: 'ecommerce',
    plan: 'basic',
    status: 'active',
    createdAt: '2026-01-08',
    usageCount: 42,
    usageLimit: 50,
    city: 'Jaipur',
    emailVerified: true,
    lastActive: '2026-05-11',
  },
  {
    id: 'biz-009',
    businessName: 'GrowthEdge Consulting',
    ownerName: 'Aditya Bose',
    email: 'aditya@growthedge.in',
    phone: '+91 10987 65432',
    industry: 'consulting',
    plan: 'custom',
    status: 'active',
    createdAt: '2025-07-14',
    usageCount: 1240,
    usageLimit: 9999,
    city: 'Kolkata',
    emailVerified: true,
    lastActive: '2026-05-14',
  },
  {
    id: 'biz-010',
    businessName: 'FreshMart Retail',
    ownerName: 'Sanjay Gupta',
    email: 'sanjay@freshmart.co.in',
    phone: '+91 99887 76655',
    industry: 'retail',
    plan: 'medium',
    status: 'pending_verification',
    createdAt: '2026-05-13',
    usageCount: 0,
    usageLimit: 150,
    city: 'Lucknow',
    emailVerified: false,
    lastActive: '2026-05-13',
  },
  {
    id: 'biz-011',
    businessName: 'Zenith Yoga Studio',
    ownerName: 'Priyanka Desai',
    email: 'priyanka@zenithyoga.in',
    phone: '+91 88776 65544',
    industry: 'gym',
    plan: 'basic',
    status: 'cancelled',
    createdAt: '2025-06-01',
    usageCount: 12,
    usageLimit: 50,
    city: 'Surat',
    emailVerified: true,
    lastActive: '2025-12-15',
  },
  {
    id: 'biz-012',
    businessName: 'ClearPath Advisory',
    ownerName: 'Rahul Tiwari',
    email: 'rahul@clearpath.in',
    phone: '+91 77665 54433',
    industry: 'consulting',
    plan: 'advance',
    status: 'pending_verification',
    createdAt: '2026-05-14',
    usageCount: 0,
    usageLimit: 250,
    city: 'Nagpur',
    emailVerified: false,
    lastActive: '2026-05-14',
  },
];

export const MOCK_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'ticket-001',
    businessId: 'biz-004',
    businessName: 'StyleCraft Salon',
    subject: 'Billing cycle not updating after plan upgrade',
    category: 'Billing',
    status: 'open',
    createdAt: '2026-05-15',
    messagePreview: 'We upgraded from basic to medium 3 days ago but the limit still shows 50...',
    priority: 'high',
  },
  {
    id: 'ticket-002',
    businessId: 'biz-002',
    businessName: 'Bright Minds Academy',
    subject: 'Student import CSV format issue',
    category: 'Technical',
    status: 'in_progress',
    createdAt: '2026-05-14',
    messagePreview: 'When we try to import more than 500 students via CSV, the upload fails...',
    priority: 'medium',
  },
  {
    id: 'ticket-003',
    businessId: 'biz-007',
    businessName: 'QuickShip Logistics',
    subject: 'API webhook not firing on delivery status change',
    category: 'Integration',
    status: 'open',
    createdAt: '2026-05-13',
    messagePreview:
      "The webhook endpoint we configured isn't receiving events when shipment status...",
    priority: 'high',
  },
  {
    id: 'ticket-004',
    businessId: 'biz-001',
    businessName: 'Spice Garden Restaurant',
    subject: 'Table reservation calendar not syncing',
    category: 'Feature',
    status: 'resolved',
    createdAt: '2026-05-10',
    messagePreview:
      'The reservation calendar stopped syncing with our Google Calendar integration...',
    priority: 'low',
  },
  {
    id: 'ticket-005',
    businessId: 'biz-006',
    businessName: 'HomeNest Realty',
    subject: 'Property listing images not uploading',
    category: 'Technical',
    status: 'open',
    createdAt: '2026-05-15',
    messagePreview: 'Since yesterday, all image uploads fail with a 413 error. Our clients need...',
    priority: 'high',
  },
];

export const MOCK_PLATFORM_STATS: PlatformStats = {
  totalBusinesses: 12,
  activeBusinesses: 7,
  pendingVerification: 3,
  totalUsers: 847,
  expectedMRR: 28941,
  activeSubscriptions: 7,
  openTickets: 3,
  customEnquiries: 5,
  mrrTrend: [
    { month: 'Dec 25', mrr: 14200, businesses: 5 },
    { month: 'Jan 26', mrr: 17800, businesses: 7 },
    { month: 'Feb 26', mrr: 19400, businesses: 8 },
    { month: 'Mar 26', mrr: 22100, businesses: 9 },
    { month: 'Apr 26', mrr: 25600, businesses: 10 },
    { month: 'May 26', mrr: 28941, businesses: 12 },
  ],
  planDistribution: [
    { plan: 'Basic', count: 2, revenue: 998 },
    { plan: 'Medium', count: 2, revenue: 1998 },
    { plan: 'Advance', count: 3, revenue: 4497 },
    { plan: 'Premium', count: 2, revenue: 3998 },
    { plan: 'Pro', count: 2, revenue: 5998 },
    { plan: 'Custom', count: 1, revenue: 4999 },
  ],
  industryDistribution: [
    { industry: 'Restaurant', count: 1 },
    { industry: 'Education', count: 1 },
    { industry: 'Gym/Wellness', count: 2 },
    { industry: 'Salon', count: 1 },
    { industry: 'Healthcare', count: 1 },
    { industry: 'Real Estate', count: 1 },
    { industry: 'Logistics', count: 1 },
    { industry: 'Ecommerce', count: 1 },
    { industry: 'Consulting', count: 2 },
    { industry: 'Retail', count: 1 },
  ],
};
