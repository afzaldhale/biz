export type BusinessType =
  | 'academy' |'hotel' |'restaurant' |'clinic' |'service-center' |'gym' |'salon' |'custom';

export type PlanId = 'basic' | 'medium' | 'advance' | 'premium' | 'pro' | 'custom';

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  recordLimit: number | null;
  features: string[];
  popular?: boolean;
  color: string;
}

export interface Industry {
  id: BusinessType;
  name: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  modules: string[];
}

export interface AuthUser {
  id: string;
  ownerName: string;
  businessName: string;
  email: string;
  phone: string;
  plan: PlanId;
  businessType: BusinessType;
  recordsUsed: number;
  createdAt: string;
}

export interface BusinessProfile {
  businessId: string;
  ownerId: string;
  status: 'pending_verification' | 'active' | 'suspended';
  ownerName: string;
  businessName: string;
  businessType: BusinessType;
  selectedPlan: PlanId;
  planLimit?: number | null;
  currentUsage?: number;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  businessId: string;
  ownerName: string;
  email: string;
  phone: string;
  role: 'owner';
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KPICard {
  id: string;
  label: string;
  value: string | number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: string;
  color: string;
}

export interface ActivityItem {
  id: string;
  action: string;
  entity: string;
  entityName: string;
  time: string;
  status: 'completed' | 'pending' | 'cancelled' | 'active';
  amount?: string;
}

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
  section?: string;
}

export interface NavGroup {
  section: string;
  items: SidebarNavItem[];
}

export interface StudentRecord {
  id: string;
  admissionId: string;
  studentName: string;
  courseName: string;
  phone: string;
  email: string;
  parentName: string;
  status: 'active' | 'pending' | 'completed';
  admissionDate: string;
  feeAmount: number;
  paidAmount: number;
  notes?: string;
  createdAt?: string;
}

export interface GymMemberRecord {
  id: string;
  memberId: string;
  fullName: string;
  phone: string;
  email: string;
  membershipPlan: string;
  trainerName?: string;
  joiningDate: string;
  renewalDate: string;
  feeAmount: number;
  paidAmount: number;
  status: 'active' | 'paused' | 'expired';
  emergencyContact?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GymPaymentRecord {
  id: string;
  memberDocId: string;
  memberId: string;
  memberName: string;
  membershipPlan: string;
  invoiceId: string;
  paymentDate: string;
  billingPeriod: string;
  amount: number;
  paymentMethod: 'cash' | 'upi' | 'card' | 'bank-transfer';
  notes?: string;
  createdAt?: string;
}

export interface CourseRecord {
  id: string;
  title: string;
  instructor: string;
  category: string;
  duration: string;
  fee: number;
  notes?: string;
  createdAt?: string;
}

export interface FeeRecord {
  id: string;
  title: string;
  description: string;
  studentName: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  notes?: string;
  createdAt?: string;
}

export interface GenericBusinessRecord {
  id: string;
  title: string;
  reference?: string;
  amount?: number;
  date?: string;
  status?: string;
  notes?: string;
  createdAt?: string;
}
