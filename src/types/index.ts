export type BusinessType =
  | 'academy'
  | 'hotel'
  | 'restaurant'
  | 'clinic'
  | 'service-center'
  | 'gym'
  | 'salon'
  | 'custom';

export type PlanId = 'basic' | 'medium' | 'advance' | 'premium' | 'pro' | 'custom';
export type SubscriptionStatus = 'active' | 'past_due' | 'paused' | 'cancelled';
export type BillingCycle = 'monthly';

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
  subscriptionLabel: string;
  businessType: BusinessType;
  recordsUsed: number;
  recordLimit?: number | null;
  createdAt: string;
}

export interface BusinessProfile {
  businessId: string;
  ownerId: string;
  status: 'pending_verification' | 'active' | 'suspended';
  ownerName: string;
  businessName: string;
  businessType: BusinessType;
  pricingModel?: 'per_record' | string;
  selectedPlan: PlanId | 'usage_based' | string;
  planLimit?: number | null;
  recordLimit?: number | null;
  currentUsage?: number;
  remainingRecords?: number;
  minimumRecords?: number;
  estimatedRecords?: number;
  billableRecords?: number;
  monthlyPrice?: number;
  billingCycle?: BillingCycle | string;
  subscriptionStatus?: SubscriptionStatus | string;
  subscriptionStartDate?: string;
  currentPeriodStart?: string;
  nextBillingDate?: string;
  lastPaymentDate?: string | null;
  email: string;
  phone: string;
  address?: string;
  logoUrl?: string;
  receiptFooterNote?: string;
  invoicePrefix?: string;
  currency?: string;
  timezone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  businessId?: string;
  ownerName: string;
  email: string;
  phone: string;
  role: 'owner';
  emailVerified: boolean;
  onboardingCompleted?: boolean;
  businessName?: string;
  businessType?: BusinessType;
  estimatedRecords?: number;
  billableRecords?: number;
  recordsLimit?: number;
  pricePerRecord?: number;
  monthlyPrice?: number;
  annualPrice?: number;
  minimumRecords?: number;
  pricingModel?: 'per_record' | string;
  billingModel?: 'per_record' | string;
  selectedPlan?: 'usage_based' | string;
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

export type AcademyStudentStatus = 'active' | 'inactive';
export type AcademyCourseStatus = 'active' | 'inactive';
export type AcademyEnrollmentStatus = 'active' | 'completed' | 'cancelled';
export type AcademyPaymentMode = 'cash' | 'upi' | 'bank' | 'card';
export type AcademyFeeStatus = 'paid' | 'partial' | 'pending';
export type AcademyAttendanceStatus = 'present' | 'absent' | 'late';

export interface AcademyStudent {
  id: string;
  studentId: string;
  admissionId: string;
  studentName: string;
  parentName: string;
  phone: string;
  email: string;
  address: string;
  dateOfBirth: string;
  admissionDate: string;
  status: AcademyStudentStatus;
  notes: string;
  totalFees: number;
  paidFees: number;
  pendingFees: number;
  enrolledCourseIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AcademyCourse {
  id: string;
  courseId: string;
  courseName: string;
  duration: string;
  fees: number;
  description: string;
  status: AcademyCourseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AcademyEnrollment {
  id: string;
  enrollmentId: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  courseFees: number;
  enrollmentDate: string;
  status: AcademyEnrollmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AcademyFee {
  id: string;
  feeId: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  enrollmentId: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paymentMode: AcademyPaymentMode;
  paymentDate: string;
  status: AcademyFeeStatus;
  receiptId: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface AcademyReceipt {
  id: string;
  receiptId: string;
  receiptNumber: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  feeId: string;
  amountPaid: number;
  pendingAmount: number;
  paymentMode: AcademyPaymentMode;
  paymentDate: string;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  createdAt: string;
}

export interface AcademyAttendance {
  id: string;
  attendanceId: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  attendanceDate: string;
  status: AcademyAttendanceStatus;
  remarks: string;
  markedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AcademyDashboardSummary {
  totalStudents: number;
  activeCourses: number;
  feesCollected: number;
  pendingFees: number;
  todayAttendanceCount: number;
  todayPresentCount: number;
  todayAbsentCount: number;
  todayLateCount: number;
}

export interface GymMemberRecord {
  id: string;
  memberId: string;
  fullName: string;
  phone: string;
  email: string;
  address?: string;
  membershipPlan: string;
  trainerId?: string;
  trainerName?: string;
  joiningDate: string;
  renewalDate: string;
  feeAmount: number;
  paidAmount: number;
  status: 'active' | 'paused' | 'expired';
  emergencyContact?: string;
  heightCm?: number;
  weightKg?: number;
  bmi?: number;
  fitnessGoal?: 'weight-loss' | 'weight-gain' | 'strength' | 'general-fitness';
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
  receiptId?: string;
  receiptNumber?: string;
  paymentDate: string;
  billingPeriod: string;
  amount: number;
  paymentMethod: 'cash' | 'upi' | 'card' | 'bank';
  transactionId?: string;
  notes?: string;
  createdAt?: string;
}

export interface GymTrainerRecord {
  id: string;
  trainerId: string;
  name: string;
  phone: string;
  email: string;
  specialization: string;
  salary: number;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface GymAttendanceRecord {
  id: string;
  attendanceId: string;
  memberDocId: string;
  memberId: string;
  memberName: string;
  attendanceDate: string;
  status: 'present' | 'absent';
  createdAt?: string;
  updatedAt?: string;
}

export interface GymReceiptRecord {
  id: string;
  receiptId: string;
  receiptNumber: string;
  paymentId: string;
  memberDocId: string;
  memberId: string;
  memberName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: GymPaymentRecord['paymentMethod'];
  transactionId?: string;
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
