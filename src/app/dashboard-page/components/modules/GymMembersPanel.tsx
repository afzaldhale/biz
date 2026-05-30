'use client';

import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  CalendarDays,
  CreditCard,
  Download,
  PencilLine,
  Phone,
  Plus,
  Printer,
  ReceiptText,
  Search,
  Trash2,
  UserRound,
  UserRoundPlus,
  Users,
  Wallet,
  Weight,
  X,
} from 'lucide-react';
import {
  AuthUser,
  GymAttendanceRecord,
  GymMemberRecord,
  GymPaymentRecord,
  GymReceiptRecord,
  GymTrainerRecord,
} from '@/types';
import { useBusiness } from '@/context/BusinessContext';
import { addGymMember, deleteGymMember, getGymMembers, updateGymMember } from '@/services/gymMemberService';
import { addGymPayment, deleteGymPayment, getGymPayments } from '@/services/gymPaymentService';
import { addGymTrainer, deleteGymTrainer, getGymTrainers, updateGymTrainer } from '@/services/gymTrainerService';
import { deleteGymAttendance, getGymAttendance, upsertGymAttendance } from '@/services/gymAttendanceService';
import { addGymReceipt, deleteGymReceipt, getGymReceipts } from '@/services/gymReceiptService';
import { SubscriptionLimitError } from '@/services/subscriptionService';

type GymView = 'members' | 'trainers' | 'billing' | 'reports';
type MemberProfileTab = 'overview' | 'payments' | 'attendance' | 'receipts';

interface GymMembersPanelProps {
  user: AuthUser;
  initialView?: GymView;
}

interface MemberFormValues {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  membershipPlan: string;
  feeAmount: string;
  joiningDate: string;
  renewalDate: string;
  status: GymMemberRecord['status'];
  trainerId: string;
  heightCm: string;
  weightKg: string;
  fitnessGoal: NonNullable<GymMemberRecord['fitnessGoal']>;
  notes: string;
}

interface TrainerFormValues {
  name: string;
  phone: string;
  email: string;
  specialization: string;
  salary: string;
  status: GymTrainerRecord['status'];
}

interface PaymentFormValues {
  amount: string;
  paymentDate: string;
  paymentMethod: GymPaymentRecord['paymentMethod'];
  transactionId: string;
  billingPeriod: string;
  notes: string;
}

interface AttendanceFormValues {
  attendanceDate: string;
  status: GymAttendanceRecord['status'];
}

const memberPlanOptions = ['Monthly', 'Quarterly', 'Half-Yearly', 'Annual', 'Personal Training'];
const defaultMemberForm: MemberFormValues = {
  fullName: '',
  phone: '',
  email: '',
  address: '',
  emergencyContact: '',
  membershipPlan: 'Monthly',
  feeAmount: '',
  joiningDate: new Date().toISOString().slice(0, 10),
  renewalDate: new Date().toISOString().slice(0, 10),
  status: 'active',
  trainerId: '',
  heightCm: '',
  weightKg: '',
  fitnessGoal: 'general-fitness',
  notes: '',
};

const defaultTrainerForm: TrainerFormValues = {
  name: '',
  phone: '',
  email: '',
  specialization: '',
  salary: '',
  status: 'active',
};

const defaultPaymentForm: PaymentFormValues = {
  amount: '',
  paymentDate: new Date().toISOString().slice(0, 10),
  paymentMethod: 'cash',
  transactionId: '',
  billingPeriod: new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(
    new Date()
  ),
  notes: '',
};

const defaultAttendanceForm: AttendanceFormValues = {
  attendanceDate: new Date().toISOString().slice(0, 10),
  status: 'present',
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPaymentMethod(method: GymPaymentRecord['paymentMethod']) {
  if (method === 'upi') return 'UPI';
  if (method === 'card') return 'Card';
  if (method === 'bank') return 'Bank';
  return 'Cash';
}

function formatGoal(goal?: GymMemberRecord['fitnessGoal']) {
  if (goal === 'weight-loss') return 'Weight Loss';
  if (goal === 'weight-gain') return 'Weight Gain';
  if (goal === 'strength') return 'Strength';
  return 'General Fitness';
}

function buildMemberId(totalMembers: number) {
  return `GYM-${String(totalMembers + 1201).padStart(4, '0')}`;
}

function buildTrainerId(totalTrainers: number) {
  return `TRN-${String(totalTrainers + 201).padStart(4, '0')}`;
}

function buildInvoiceId() {
  return `PAY-${Date.now().toString().slice(-8)}`;
}

function buildReceiptNumber() {
  return `RCT-${Date.now().toString().slice(-8)}`;
}

function calculateBmi(heightCm?: number, weightKg?: number) {
  if (!heightCm || !weightKg) return 0;
  const heightM = heightCm / 100;
  if (!heightM) return 0;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}

function getCurrentMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = new Date(year, month, 1).toISOString().slice(0, 10);
  const end = new Date(year, month + 1, 0).toISOString().slice(0, 10);
  return { start, end };
}

function getAttendanceSummary(memberId: string, attendance: GymAttendanceRecord[]) {
  const { start, end } = getCurrentMonthRange();
  const currentMonthEntries = attendance.filter(
    (item) =>
      item.memberDocId === memberId && item.attendanceDate >= start && item.attendanceDate <= end
  );
  const present = currentMonthEntries.filter((item) => item.status === 'present').length;
  const absent = currentMonthEntries.filter((item) => item.status === 'absent').length;
  const total = present + absent;
  const percentage = total ? Math.round((present / total) * 100) : 0;

  return { present, absent, percentage, total };
}

function getStatusBadge(status: GymMemberRecord['status'] | GymTrainerRecord['status']) {
  if (status === 'active') return 'badge-success';
  if (status === 'paused') return 'badge-warning';
  return 'badge-danger';
}

function findTrainerName(trainers: GymTrainerRecord[], trainerId: string) {
  return trainers.find((trainer) => trainer.id === trainerId)?.name ?? '';
}

function openReceiptWindow(
  businessName: string,
  payment: GymPaymentRecord,
  receipt: GymReceiptRecord | undefined,
  member?: GymMemberRecord | null,
  mode: 'print' | 'download' = 'print'
) {
  const receiptWindow = window.open('', '_blank', 'width=900,height=760');

  if (!receiptWindow) {
    toast.error('Popup blocked. Please allow popups to print or download receipts.');
    return;
  }

  receiptWindow.document.write(`
    <html>
      <head>
        <title>Receipt ${receipt?.receiptNumber ?? payment.receiptNumber ?? payment.invoiceId}</title>
        <style>
          body { font-family: Arial, sans-serif; background: #f8fafc; color: #0f172a; padding: 28px; }
          .sheet { max-width: 760px; margin: 0 auto; background: white; border-radius: 24px; padding: 32px; border: 1px solid #e2e8f0; }
          .header { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin-bottom: 28px; }
          .brand { font-size: 26px; font-weight: 700; color: #7c3aed; }
          .sub { margin-top: 6px; color: #64748b; }
          .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
          .box { border: 1px solid #e2e8f0; border-radius: 18px; padding: 16px; }
          .label { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #64748b; margin-bottom: 6px; }
          .value { font-size: 15px; font-weight: 600; color: #0f172a; }
          .summary { margin-top: 18px; background: linear-gradient(135deg, rgba(124,58,237,.08), rgba(168,85,247,.14)); border-radius: 18px; padding: 18px; }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="header">
            <div>
              <div class="brand">${businessName}</div>
              <div class="sub">Gym Payment Receipt</div>
            </div>
            <div>
              <div><strong>Receipt No:</strong> ${receipt?.receiptNumber ?? payment.receiptNumber ?? payment.invoiceId}</div>
              <div><strong>Date:</strong> ${receipt?.paymentDate ?? payment.paymentDate}</div>
            </div>
          </div>
          <div class="grid">
            <div class="box"><div class="label">Member Name</div><div class="value">${payment.memberName}</div></div>
            <div class="box"><div class="label">Member ID</div><div class="value">${payment.memberId}</div></div>
            <div class="box"><div class="label">Plan</div><div class="value">${payment.membershipPlan}</div></div>
            <div class="box"><div class="label">Payment Method</div><div class="value">${formatPaymentMethod(payment.paymentMethod)}</div></div>
            <div class="box"><div class="label">Amount</div><div class="value">${formatCurrency(payment.amount)}</div></div>
            <div class="box"><div class="label">Transaction ID</div><div class="value">${payment.transactionId || '-'}</div></div>
          </div>
          <div class="summary">
            <div><strong>Joining Date:</strong> ${member?.joiningDate ?? '-'}</div>
            <div><strong>Renewal Date:</strong> ${member?.renewalDate ?? '-'}</div>
            <div><strong>Outstanding Balance:</strong> ${formatCurrency(
              Math.max((member?.feeAmount ?? payment.amount) - (member?.paidAmount ?? payment.amount), 0)
            )}</div>
          </div>
        </div>
      </body>
    </html>
  `);

  receiptWindow.document.close();
  receiptWindow.focus();
  if (mode === 'download') {
    toast.info('Use "Save as PDF" in the print dialog to download the receipt.');
  }
  receiptWindow.print();
}

function ModalShell({
  children,
  title,
  subtitle,
  onClose,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center">
        <div className="w-full max-w-3xl overflow-hidden rounded-[28px] border border-border bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-5">
            <div>
              <p className="text-xs font-700 uppercase tracking-[0.22em] text-primary">{subtitle}</p>
              <h2 className="mt-1 text-xl font-700 text-foreground">{title}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/70 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X size={18} />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function GymMembersPanel({ user, initialView = 'members' }: GymMembersPanelProps) {
  const { refreshBusiness, business, currentUsage, recordLimit } = useBusiness();
  const [activeView, setActiveView] = useState<GymView>(initialView);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<GymMemberRecord[]>([]);
  const [payments, setPayments] = useState<GymPaymentRecord[]>([]);
  const [receipts, setReceipts] = useState<GymReceiptRecord[]>([]);
  const [attendance, setAttendance] = useState<GymAttendanceRecord[]>([]);
  const [trainers, setTrainers] = useState<GymTrainerRecord[]>([]);
  const [selectedMember, setSelectedMember] = useState<GymMemberRecord | null>(null);
  const [profileTab, setProfileTab] = useState<MemberProfileTab>('overview');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | GymMemberRecord['status']>('all');
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [trainerModalOpen, setTrainerModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingTrainerId, setEditingTrainerId] = useState<string | null>(null);
  const [memberFormValues, setMemberFormValues] = useState<MemberFormValues>(defaultMemberForm);
  const [trainerFormValues, setTrainerFormValues] = useState<TrainerFormValues>(defaultTrainerForm);
  const [paymentFormValues, setPaymentFormValues] = useState<PaymentFormValues>(defaultPaymentForm);
  const [attendanceFormValues, setAttendanceFormValues] =
    useState<AttendanceFormValues>(defaultAttendanceForm);
  const [saving, setSaving] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    const [membersResult, paymentsResult, trainersResult, attendanceResult, receiptsResult] =
      await Promise.allSettled([
        getGymMembers(user.id),
        getGymPayments(user.id),
        getGymTrainers(user.id),
        getGymAttendance(user.id),
        getGymReceipts(user.id),
      ]);

    if (membersResult.status === 'fulfilled') {
      setMembers(
        membersResult.value.map((member) => ({
          ...member,
          address: member.address ?? '',
          trainerId: member.trainerId ?? '',
          trainerName: member.trainerName ?? '',
          emergencyContact: member.emergencyContact ?? '',
          notes: member.notes ?? '',
          heightCm: Number(member.heightCm ?? 0) || undefined,
          weightKg: Number(member.weightKg ?? 0) || undefined,
          bmi:
            Number(member.bmi ?? 0) ||
            calculateBmi(Number(member.heightCm ?? 0), Number(member.weightKg ?? 0)),
          fitnessGoal: member.fitnessGoal ?? 'general-fitness',
        }))
      );
    } else {
      console.error('[gym] unable to load members', membersResult.reason);
      toast.error('Unable to load members right now.');
    }

    if (paymentsResult.status === 'fulfilled') {
      setPayments(
        paymentsResult.value.map((payment) => ({
          ...payment,
          paymentMethod:
            String(payment.paymentMethod ?? 'cash') === 'bank-transfer'
              ? 'bank'
              : ((payment.paymentMethod ?? 'cash') as GymPaymentRecord['paymentMethod']),
          transactionId: payment.transactionId ?? '',
          receiptId: payment.receiptId ?? '',
          receiptNumber: payment.receiptNumber ?? payment.invoiceId,
        }))
      );
    }

    if (trainersResult.status === 'fulfilled') {
      setTrainers(trainersResult.value);
    }

    if (attendanceResult.status === 'fulfilled') {
      setAttendance(attendanceResult.value);
    }

    if (receiptsResult.status === 'fulfilled') {
      setReceipts(receiptsResult.value);
    }

    setLoading(false);
  }, [user.id]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const attendanceMap = useMemo(() => {
    const nextMap = new Map<string, ReturnType<typeof getAttendanceSummary>>();
    members.forEach((member) => {
      nextMap.set(member.id, getAttendanceSummary(member.id, attendance));
    });
    return nextMap;
  }, [attendance, members]);

  const trainerStats = useMemo(() => {
    const counts = new Map<string, { totalAssigned: number; activeAssigned: number }>();
    trainers.forEach((trainer) => counts.set(trainer.id, { totalAssigned: 0, activeAssigned: 0 }));

    members.forEach((member) => {
      if (!member.trainerId || !counts.has(member.trainerId)) return;
      const entry = counts.get(member.trainerId)!;
      entry.totalAssigned += 1;
      if (member.status === 'active') {
        entry.activeAssigned += 1;
      }
    });

    return counts;
  }, [members, trainers]);

  const dashboardStats = useMemo(() => {
    const activeMembers = members.filter((member) => member.status === 'active').length;
    const feesCollected = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const pendingPayments = members.reduce(
      (sum, member) => sum + Math.max(member.feeAmount - member.paidAmount, 0),
      0
    );
    return {
      totalMembers: members.length,
      activeMembers,
      feesCollected,
      pendingPayments,
    };
  }, [members, payments]);

  const filteredMembers = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    return members.filter((member) => {
      const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
      const matchesSearch =
        !query ||
        [
          member.memberId,
          member.fullName,
          member.phone,
          member.email,
          member.membershipPlan,
          member.trainerName,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      return matchesStatus && matchesSearch;
    });
  }, [deferredSearch, members, statusFilter]);

  const filteredPayments = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return payments.filter((payment) => {
      if (!query) return true;
      return [
        payment.invoiceId,
        payment.receiptNumber,
        payment.memberName,
        payment.memberId,
        payment.billingPeriod,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [deferredSearch, payments]);

  const filteredTrainers = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return trainers.filter((trainer) => {
      if (!query) return true;
      return [trainer.trainerId, trainer.name, trainer.phone, trainer.email, trainer.specialization]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [deferredSearch, trainers]);

  const selectedMemberPayments = useMemo(
    () => payments.filter((payment) => payment.memberDocId === selectedMember?.id),
    [payments, selectedMember]
  );

  const selectedMemberReceipts = useMemo(
    () => receipts.filter((receipt) => receipt.memberDocId === selectedMember?.id),
    [receipts, selectedMember]
  );

  const selectedMemberAttendance = useMemo(
    () => attendance.filter((item) => item.memberDocId === selectedMember?.id),
    [attendance, selectedMember]
  );

  const openCreateMemberModal = useCallback(() => {
    setEditingMemberId(null);
    setMemberFormValues(defaultMemberForm);
    setMemberModalOpen(true);
  }, []);

  const openEditMemberModal = useCallback((member: GymMemberRecord) => {
    setEditingMemberId(member.id);
    setMemberFormValues({
      fullName: member.fullName,
      phone: member.phone,
      email: member.email,
      address: member.address ?? '',
      emergencyContact: member.emergencyContact ?? '',
      membershipPlan: member.membershipPlan,
      feeAmount: String(member.feeAmount || ''),
      joiningDate: member.joiningDate,
      renewalDate: member.renewalDate,
      status: member.status,
      trainerId: member.trainerId ?? '',
      heightCm: member.heightCm ? String(member.heightCm) : '',
      weightKg: member.weightKg ? String(member.weightKg) : '',
      fitnessGoal: member.fitnessGoal ?? 'general-fitness',
      notes: member.notes ?? '',
    });
    setMemberModalOpen(true);
  }, []);

  const openMemberProfile = useCallback((member: GymMemberRecord, tab: MemberProfileTab = 'overview') => {
    setSelectedMember(member);
    setProfileTab(tab);
  }, []);

  const openPaymentModal = useCallback((member: GymMemberRecord) => {
    setSelectedMember(member);
    setPaymentFormValues({
      ...defaultPaymentForm,
      amount: String(Math.max(member.feeAmount - member.paidAmount, 0) || member.feeAmount || ''),
    });
    setPaymentModalOpen(true);
  }, []);

  const openAttendanceModal = useCallback((member: GymMemberRecord) => {
    setSelectedMember(member);
    setAttendanceFormValues(defaultAttendanceForm);
    setAttendanceModalOpen(true);
  }, []);

  const openCreateTrainerModal = useCallback(() => {
    setEditingTrainerId(null);
    setTrainerFormValues(defaultTrainerForm);
    setTrainerModalOpen(true);
  }, []);

  const openEditTrainerModal = useCallback((trainer: GymTrainerRecord) => {
    setEditingTrainerId(trainer.id);
    setTrainerFormValues({
      name: trainer.name,
      phone: trainer.phone,
      email: trainer.email,
      specialization: trainer.specialization,
      salary: String(trainer.salary),
      status: trainer.status,
    });
    setTrainerModalOpen(true);
  }, []);

  const handleMemberSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSaving(true);

      const feeAmount = Number(memberFormValues.feeAmount || 0);
      const heightCm = Number(memberFormValues.heightCm || 0);
      const weightKg = Number(memberFormValues.weightKg || 0);
      const trainerName = findTrainerName(trainers, memberFormValues.trainerId);
      const bmi = calculateBmi(heightCm || undefined, weightKg || undefined);
      const existingMember = members.find((member) => member.id === editingMemberId) ?? null;

      const nextMember: GymMemberRecord = {
        id: existingMember?.id ?? '',
        memberId: existingMember?.memberId ?? buildMemberId(members.length),
        fullName: memberFormValues.fullName.trim(),
        phone: memberFormValues.phone.trim(),
        email: memberFormValues.email.trim(),
        address: memberFormValues.address.trim(),
        emergencyContact: memberFormValues.emergencyContact.trim(),
        membershipPlan: memberFormValues.membershipPlan,
        trainerId: memberFormValues.trainerId,
        trainerName,
        joiningDate: memberFormValues.joiningDate,
        renewalDate: memberFormValues.renewalDate,
        feeAmount,
        paidAmount: existingMember?.paidAmount ?? 0,
        status: memberFormValues.status,
        heightCm: heightCm || undefined,
        weightKg: weightKg || undefined,
        bmi: bmi || undefined,
        fitnessGoal: memberFormValues.fitnessGoal,
        notes: memberFormValues.notes.trim(),
        createdAt: existingMember?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        if (editingMemberId) {
          await updateGymMember(user.id, editingMemberId, nextMember);
          setMembers((current) =>
            current.map((member) => (member.id === editingMemberId ? { ...nextMember, id: editingMemberId } : member))
          );
          if (selectedMember?.id === editingMemberId) {
            setSelectedMember({ ...nextMember, id: editingMemberId });
          }
          toast.success('Member updated successfully.');
        } else {
          const createdId = await addGymMember(user.id, nextMember);
          setMembers((current) => [{ ...nextMember, id: createdId }, ...current]);
          await refreshBusiness();
          toast.success('Member created successfully.');
        }

        setMemberModalOpen(false);
      } catch (error) {
        if (error instanceof SubscriptionLimitError) {
          setLimitModalOpen(true);
          await refreshBusiness();
        } else {
          toast.error(error instanceof Error ? error.message : 'Unable to save this member.');
        }
      } finally {
        setSaving(false);
      }
    },
    [editingMemberId, memberFormValues, members, refreshBusiness, selectedMember, trainers, user.id]
  );

  const handleTrainerSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSaving(true);

      const existingTrainer = trainers.find((trainer) => trainer.id === editingTrainerId) ?? null;
      const nextTrainer: GymTrainerRecord = {
        id: existingTrainer?.id ?? '',
        trainerId: existingTrainer?.trainerId ?? buildTrainerId(trainers.length),
        name: trainerFormValues.name.trim(),
        phone: trainerFormValues.phone.trim(),
        email: trainerFormValues.email.trim(),
        specialization: trainerFormValues.specialization.trim(),
        salary: Number(trainerFormValues.salary || 0),
        status: trainerFormValues.status,
        createdAt: existingTrainer?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        if (editingTrainerId) {
          await updateGymTrainer(user.id, editingTrainerId, nextTrainer);
          setTrainers((current) =>
            current.map((trainer) => (trainer.id === editingTrainerId ? { ...nextTrainer, id: editingTrainerId } : trainer))
          );
          setMembers((current) =>
            current.map((member) =>
              member.trainerId === editingTrainerId ? { ...member, trainerName: nextTrainer.name } : member
            )
          );
          toast.success('Trainer updated successfully.');
        } else {
          const createdId = await addGymTrainer(user.id, nextTrainer);
          setTrainers((current) => [{ ...nextTrainer, id: createdId }, ...current]);
          toast.success('Trainer added successfully.');
        }

        setTrainerModalOpen(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to save this trainer.');
      } finally {
        setSaving(false);
      }
    },
    [editingTrainerId, trainerFormValues, trainers, user.id]
  );

  const handlePaymentSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!selectedMember) return;
      setSaving(true);

      const amount = Number(paymentFormValues.amount || 0);
      const paymentId = buildInvoiceId();
      const receiptNumber = buildReceiptNumber();

      const paymentRecord: GymPaymentRecord = {
        id: '',
        memberDocId: selectedMember.id,
        memberId: selectedMember.memberId,
        memberName: selectedMember.fullName,
        membershipPlan: selectedMember.membershipPlan,
        invoiceId: paymentId,
        receiptNumber,
        paymentDate: paymentFormValues.paymentDate,
        billingPeriod: paymentFormValues.billingPeriod.trim(),
        amount,
        paymentMethod: paymentFormValues.paymentMethod,
        transactionId: paymentFormValues.transactionId.trim(),
        notes: paymentFormValues.notes.trim(),
        createdAt: new Date().toISOString(),
      };

      try {
        const createdPaymentId = await addGymPayment(user.id, paymentRecord);
        const receiptRecord: GymReceiptRecord = {
          id: '',
          receiptId: '',
          receiptNumber,
          paymentId: createdPaymentId,
          memberDocId: selectedMember.id,
          memberId: selectedMember.memberId,
          memberName: selectedMember.fullName,
          amount,
          paymentDate: paymentFormValues.paymentDate,
          paymentMethod: paymentFormValues.paymentMethod,
          transactionId: paymentFormValues.transactionId.trim(),
          createdAt: new Date().toISOString(),
        };
        const createdReceiptId = await addGymReceipt(user.id, receiptRecord);

        const updatedMember: GymMemberRecord = {
          ...selectedMember,
          paidAmount: selectedMember.paidAmount + amount,
          status: selectedMember.status === 'expired' ? 'active' : selectedMember.status,
          updatedAt: new Date().toISOString(),
        };

        await updateGymMember(user.id, selectedMember.id, updatedMember);

        const savedPayment = {
          ...paymentRecord,
          id: createdPaymentId,
          receiptId: createdReceiptId,
        };
        const savedReceipt = {
          ...receiptRecord,
          id: createdReceiptId,
          receiptId: createdReceiptId,
        };

        setPayments((current) => [savedPayment, ...current]);
        setReceipts((current) => [savedReceipt, ...current]);
        setMembers((current) =>
          current.map((member) => (member.id === selectedMember.id ? updatedMember : member))
        );
        setSelectedMember(updatedMember);
        setPaymentModalOpen(false);
        toast.success('Payment saved and receipt generated.');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to save this payment.');
      } finally {
        setSaving(false);
      }
    },
    [paymentFormValues, selectedMember, user.id]
  );

  const handleAttendanceSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!selectedMember) return;
      setSaving(true);

      try {
        const attendanceId = await upsertGymAttendance(user.id, {
          memberDocId: selectedMember.id,
          memberId: selectedMember.memberId,
          memberName: selectedMember.fullName,
          attendanceDate: attendanceFormValues.attendanceDate,
          status: attendanceFormValues.status,
        });

        const nextRecord: GymAttendanceRecord = {
          id: attendanceId,
          attendanceId,
          memberDocId: selectedMember.id,
          memberId: selectedMember.memberId,
          memberName: selectedMember.fullName,
          attendanceDate: attendanceFormValues.attendanceDate,
          status: attendanceFormValues.status,
          updatedAt: new Date().toISOString(),
        };

        setAttendance((current) => {
          const withoutCurrentDate = current.filter((item) => item.id !== attendanceId);
          return [nextRecord, ...withoutCurrentDate].sort((a, b) =>
            b.attendanceDate.localeCompare(a.attendanceDate)
          );
        });
        setAttendanceModalOpen(false);
        toast.success('Attendance updated.');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to save attendance.');
      } finally {
        setSaving(false);
      }
    },
    [attendanceFormValues, selectedMember, user.id]
  );

  const handleDeleteMember = useCallback(
    async (member: GymMemberRecord) => {
      const confirmed = window.confirm(`Delete ${member.fullName} and all linked payments, attendance, and receipts?`);
      if (!confirmed) return;

      try {
        await Promise.all(
          payments
            .filter((payment) => payment.memberDocId === member.id)
            .map((payment) => deleteGymPayment(user.id, payment.id))
        );
        await Promise.all(
          receipts
            .filter((receipt) => receipt.memberDocId === member.id)
            .map((receipt) => deleteGymReceipt(user.id, receipt.id))
        );
        await Promise.all(
          attendance
            .filter((entry) => entry.memberDocId === member.id)
            .map((entry) => deleteGymAttendance(user.id, entry.id))
        );
        await deleteGymMember(user.id, member.id);
        await refreshBusiness();

        setMembers((current) => current.filter((item) => item.id !== member.id));
        setPayments((current) => current.filter((item) => item.memberDocId !== member.id));
        setReceipts((current) => current.filter((item) => item.memberDocId !== member.id));
        setAttendance((current) => current.filter((item) => item.memberDocId !== member.id));
        if (selectedMember?.id === member.id) {
          setSelectedMember(null);
        }
        toast.success('Member deleted successfully.');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to delete this member.');
      }
    },
    [attendance, payments, receipts, refreshBusiness, selectedMember, user.id]
  );

  const handleDeleteTrainer = useCallback(
    async (trainer: GymTrainerRecord) => {
      const assignedMembers = members.filter((member) => member.trainerId === trainer.id);
      const confirmed = window.confirm(
        assignedMembers.length
          ? `Delete ${trainer.name}? ${assignedMembers.length} assigned member(s) will become unassigned.`
          : `Delete ${trainer.name}?`
      );
      if (!confirmed) return;

      try {
        await Promise.all(
          assignedMembers.map((member) =>
            updateGymMember(user.id, member.id, {
              ...member,
              trainerId: '',
              trainerName: '',
              updatedAt: new Date().toISOString(),
            })
          )
        );
        await deleteGymTrainer(user.id, trainer.id);
        setMembers((current) =>
          current.map((member) =>
            member.trainerId === trainer.id ? { ...member, trainerId: '', trainerName: '' } : member
          )
        );
        setTrainers((current) => current.filter((item) => item.id !== trainer.id));
        toast.success('Trainer deleted successfully.');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to delete this trainer.');
      }
    },
    [members, user.id]
  );

  const upcomingRenewals = useMemo(
    () =>
      [...members]
        .filter((member) => member.status === 'active')
        .sort((a, b) => a.renewalDate.localeCompare(b.renewalDate))
        .slice(0, 8),
    [members]
  );

  const pendingMembers = useMemo(
    () =>
      [...members]
        .filter((member) => member.feeAmount > member.paidAmount)
        .sort(
          (a, b) =>
            Math.max(b.feeAmount - b.paidAmount, 0) - Math.max(a.feeAmount - a.paidAmount, 0)
        )
        .slice(0, 8),
    [members]
  );

  const lowAttendanceMembers = useMemo(
    () =>
      [...members]
        .filter((member) => (attendanceMap.get(member.id)?.percentage ?? 0) < 75)
        .sort(
          (a, b) =>
            (attendanceMap.get(a.id)?.percentage ?? 0) - (attendanceMap.get(b.id)?.percentage ?? 0)
        )
        .slice(0, 8),
    [attendanceMap, members]
  );

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-700 uppercase tracking-[0.24em] text-primary">Gym Operations</p>
          <h1 className="mt-1 text-2xl font-700 text-foreground">Member-centered management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage members, trainer assignment, attendance, billing, and receipt history from one premium workspace.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-600 text-primary">
            Capacity {currentUsage} / {recordLimit ?? business?.planLimit ?? 0} members
          </span>
          <button type="button" onClick={openCreateTrainerModal} className="btn-outline rounded-xl px-4 py-2.5 text-sm">
            Add Trainer
          </button>
          <button type="button" onClick={openCreateMemberModal} className="btn-primary rounded-xl px-4 py-2.5 text-sm">
            Add Member
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-border p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="inline-flex rounded-2xl bg-muted/60 p-1">
            {([
              ['members', 'Members'],
              ['trainers', 'Trainers'],
              ['billing', 'Billing'],
              ['reports', 'Reports'],
            ] as Array<[GymView, string]>).map(([view, label]) => (
              <button
                key={view}
                type="button"
                onClick={() => setActiveView(view)}
                className={`rounded-xl px-4 py-2 text-sm font-600 transition-colors ${
                  activeView === view ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-1 flex-col gap-3 lg:max-w-xl lg:flex-row">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={
                  activeView === 'members'
                    ? 'Search member, phone, trainer, plan, or member ID'
                    : activeView === 'trainers'
                      ? 'Search trainer, phone, specialization, or trainer ID'
                      : activeView === 'billing'
                        ? 'Search payment, receipt, period, or member'
                        : 'Search reports'
                }
                className="w-full rounded-xl border border-border bg-input py-3 pl-11 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {activeView === 'members' && (
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as 'all' | GymMemberRecord['status'])}
                className="rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="expired">Expired</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {activeView === 'members' && (
        <div className="glass-card overflow-hidden rounded-2xl border border-border">
          <div className="border-b border-border px-5 py-4">
            <p className="text-sm font-700 text-foreground">Members</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The primary gym hub for member info, attendance, payments, trainer assignment, and receipt history.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[1500px] w-full">
              <thead className="bg-muted/40">
                <tr>
                  {[
                    'Member ID',
                    'Name',
                    'Phone',
                    'Trainer',
                    'Plan',
                    'Joining Date',
                    'Renewal Date',
                    'Fees Paid',
                    'Pending',
                    'Attendance %',
                    'Status',
                    'Actions',
                  ].map((label) => (
                    <th key={label} className="px-4 py-3 text-left text-[11px] font-700 uppercase tracking-wider text-muted-foreground">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {!loading && filteredMembers.length === 0 && (
                  <tr>
                    <td colSpan={12} className="px-5 py-14 text-center text-sm text-muted-foreground">
                      No members match the current filters.
                    </td>
                  </tr>
                )}
                {filteredMembers.map((member) => {
                  const attendanceSummary = attendanceMap.get(member.id) ?? {
                    present: 0,
                    absent: 0,
                    percentage: 0,
                  };
                  const pending = Math.max(member.feeAmount - member.paidAmount, 0);

                  return (
                    <tr key={member.id} className="hover:bg-muted/20">
                      <td className="px-4 py-4 text-sm font-600 text-foreground">{member.memberId}</td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => openMemberProfile(member)}
                          className="text-left"
                        >
                          <p className="text-sm font-700 text-foreground">{member.fullName}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{member.email || 'No email added'}</p>
                        </button>
                      </td>
                      <td className="px-4 py-4 text-sm text-foreground">{member.phone}</td>
                      <td className="px-4 py-4 text-sm text-foreground">{member.trainerName || 'Unassigned'}</td>
                      <td className="px-4 py-4 text-sm text-foreground">{member.membershipPlan}</td>
                      <td className="px-4 py-4 text-sm text-foreground">{member.joiningDate}</td>
                      <td className="px-4 py-4 text-sm text-foreground">{member.renewalDate}</td>
                      <td className="px-4 py-4 text-sm font-600 text-foreground">{formatCurrency(member.paidAmount)}</td>
                      <td className="px-4 py-4 text-sm font-600 text-foreground">{formatCurrency(pending)}</td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-600 text-foreground">{attendanceSummary.percentage}%</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {attendanceSummary.present} Present | {attendanceSummary.absent} Absent
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-600 capitalize ${getStatusBadge(member.status)}`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => openMemberProfile(member)} className="btn-outline rounded-lg px-3 py-2 text-xs">View</button>
                          <button type="button" onClick={() => openEditMemberModal(member)} className="btn-outline rounded-lg px-3 py-2 text-xs">Edit</button>
                          <button type="button" onClick={() => openPaymentModal(member)} className="btn-outline rounded-lg px-3 py-2 text-xs">Payment</button>
                          <button type="button" onClick={() => openAttendanceModal(member)} className="btn-outline rounded-lg px-3 py-2 text-xs">Attendance</button>
                          <button type="button" onClick={() => openMemberProfile(member, 'receipts')} className="btn-outline rounded-lg px-3 py-2 text-xs">Receipt History</button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMember(member)}
                            className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger transition-colors hover:bg-danger/10"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeView === 'trainers' && (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredTrainers.map((trainer) => {
            const stats = trainerStats.get(trainer.id) ?? { totalAssigned: 0, activeAssigned: 0 };
            return (
              <div key={trainer.id} className="glass-card rounded-2xl border border-border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-700 uppercase tracking-[0.18em] text-primary">{trainer.trainerId}</p>
                    <h3 className="mt-1 text-lg font-700 text-foreground">{trainer.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{trainer.specialization}</p>
                  </div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-600 capitalize ${getStatusBadge(trainer.status)}`}>
                    {trainer.status}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-muted/25 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Contact</p>
                    <p className="mt-2 text-sm font-600 text-foreground">{trainer.phone}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{trainer.email}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-muted/25 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Salary</p>
                    <p className="mt-2 text-sm font-700 text-foreground">{formatCurrency(trainer.salary)}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-muted/25 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Assigned Members</p>
                    <p className="mt-2 text-2xl font-700 text-foreground">{stats.totalAssigned}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-muted/25 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Active Members</p>
                    <p className="mt-2 text-2xl font-700 text-foreground">{stats.activeAssigned}</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button type="button" onClick={() => openEditTrainerModal(trainer)} className="btn-outline rounded-xl px-4 py-2 text-sm">
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTrainer(trainer)}
                    className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-2 text-sm text-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
          {!loading && filteredTrainers.length === 0 && (
            <div className="glass-card rounded-2xl border border-border p-10 text-center text-sm text-muted-foreground xl:col-span-2">
              No trainers found yet.
            </div>
          )}
        </div>
      )}

      {activeView === 'billing' && (
        <div className="glass-card overflow-hidden rounded-2xl border border-border">
          <div className="border-b border-border px-5 py-4">
            <p className="text-sm font-700 text-foreground">Billing and receipts</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Payments stay attached to members and each payment generates a receipt entry.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-muted/40">
                <tr>
                  {['Receipt Number', 'Member Name', 'Amount', 'Date', 'Payment Method', 'Transaction ID', 'Actions'].map((label) => (
                    <th key={label} className="px-4 py-3 text-left text-[11px] font-700 uppercase tracking-wider text-muted-foreground">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {!loading && filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-14 text-center text-sm text-muted-foreground">
                      No payment records found.
                    </td>
                  </tr>
                )}
                {filteredPayments.map((payment) => {
                  const receipt = receipts.find((item) => item.paymentId === payment.id);
                  const member = members.find((item) => item.id === payment.memberDocId) ?? null;

                  return (
                    <tr key={payment.id} className="hover:bg-muted/20">
                      <td className="px-4 py-4 text-sm font-600 text-foreground">{receipt?.receiptNumber ?? payment.receiptNumber ?? payment.invoiceId}</td>
                      <td className="px-4 py-4 text-sm text-foreground">{payment.memberName}</td>
                      <td className="px-4 py-4 text-sm font-600 text-foreground">{formatCurrency(payment.amount)}</td>
                      <td className="px-4 py-4 text-sm text-foreground">{payment.paymentDate}</td>
                      <td className="px-4 py-4 text-sm text-foreground">{formatPaymentMethod(payment.paymentMethod)}</td>
                      <td className="px-4 py-4 text-sm text-foreground">{payment.transactionId || '-'}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => openReceiptWindow(user.businessName, payment, receipt, member, 'download')} className="btn-outline rounded-lg px-3 py-2 text-xs">
                            <Download size={14} className="inline-block mr-1" />
                            Download PDF
                          </button>
                          <button type="button" onClick={() => openReceiptWindow(user.businessName, payment, receipt, member, 'print')} className="btn-outline rounded-lg px-3 py-2 text-xs">
                            <Printer size={14} className="inline-block mr-1" />
                            Print Receipt
                          </button>
                          <button type="button" onClick={() => openMemberProfile(member ?? members[0], 'payments')} className="btn-outline rounded-lg px-3 py-2 text-xs" disabled={!member}>
                            View Member
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeView === 'reports' && (
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="glass-card rounded-2xl border border-border p-5">
            <p className="text-sm font-700 text-foreground">Dashboard-aligned summary</p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Total Members</span><span className="font-700 text-foreground">{dashboardStats.totalMembers}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Active Members</span><span className="font-700 text-foreground">{dashboardStats.activeMembers}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Fees Collected</span><span className="font-700 text-foreground">{formatCurrency(dashboardStats.feesCollected)}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Pending Payments</span><span className="font-700 text-foreground">{formatCurrency(dashboardStats.pendingPayments)}</span></div>
            </div>
          </div>
          <div className="glass-card rounded-2xl border border-border p-5 xl:col-span-2">
            <p className="text-sm font-700 text-foreground">Upcoming renewals</p>
            <div className="mt-4 space-y-3">
              {upcomingRenewals.length ? upcomingRenewals.map((member) => (
                <button key={member.id} type="button" onClick={() => openMemberProfile(member)} className="flex w-full items-center justify-between rounded-2xl border border-border bg-muted/20 px-4 py-3 text-left">
                  <div>
                    <p className="text-sm font-600 text-foreground">{member.fullName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{member.membershipPlan} | {member.trainerName || 'Unassigned trainer'}</p>
                  </div>
                  <span className="text-sm font-700 text-foreground">{member.renewalDate}</span>
                </button>
              )) : <p className="text-sm text-muted-foreground">No upcoming renewals.</p>}
            </div>
          </div>
          <div className="glass-card rounded-2xl border border-border p-5 xl:col-span-2">
            <p className="text-sm font-700 text-foreground">Pending payments watchlist</p>
            <div className="mt-4 space-y-3">
              {pendingMembers.length ? pendingMembers.map((member) => (
                <button key={member.id} type="button" onClick={() => openMemberProfile(member, 'payments')} className="flex w-full items-center justify-between rounded-2xl border border-border bg-muted/20 px-4 py-3 text-left">
                  <div>
                    <p className="text-sm font-600 text-foreground">{member.fullName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{member.memberId} | Paid {formatCurrency(member.paidAmount)}</p>
                  </div>
                  <span className="text-sm font-700 text-danger">{formatCurrency(Math.max(member.feeAmount - member.paidAmount, 0))}</span>
                </button>
              )) : <p className="text-sm text-muted-foreground">No pending balances right now.</p>}
            </div>
          </div>
          <div className="glass-card rounded-2xl border border-border p-5">
            <p className="text-sm font-700 text-foreground">Attendance watchlist</p>
            <div className="mt-4 space-y-3">
              {lowAttendanceMembers.length ? lowAttendanceMembers.map((member) => (
                <button key={member.id} type="button" onClick={() => openMemberProfile(member, 'attendance')} className="flex w-full items-center justify-between rounded-2xl border border-border bg-muted/20 px-4 py-3 text-left">
                  <div>
                    <p className="text-sm font-600 text-foreground">{member.fullName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {(attendanceMap.get(member.id)?.present ?? 0)} Present | {(attendanceMap.get(member.id)?.absent ?? 0)} Absent
                    </p>
                  </div>
                  <span className="text-sm font-700 text-foreground">{attendanceMap.get(member.id)?.percentage ?? 0}%</span>
                </button>
              )) : <p className="text-sm text-muted-foreground">Attendance is healthy this month.</p>}
            </div>
          </div>
        </div>
      )}

      {selectedMember && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-4xl overflow-y-auto border-l border-border bg-white shadow-card">
          <div className="sticky top-0 z-10 border-b border-border bg-white/95 px-6 py-5 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-700 uppercase tracking-[0.22em] text-primary">{selectedMember.memberId}</p>
                <h2 className="mt-1 text-2xl font-700 text-foreground">{selectedMember.fullName}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedMember.membershipPlan} | Trainer {selectedMember.trainerName || 'Unassigned'}
                </p>
              </div>
              <button type="button" onClick={() => setSelectedMember(null)} className="rounded-full bg-muted p-2 text-muted-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="mt-4 inline-flex rounded-2xl bg-muted/60 p-1">
              {([
                ['overview', 'Overview'],
                ['payments', 'Payments'],
                ['attendance', 'Attendance'],
                ['receipts', 'Receipts'],
              ] as Array<[MemberProfileTab, string]>).map(([tab, label]) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setProfileTab(tab)}
                  className={`rounded-xl px-4 py-2 text-sm font-600 ${profileTab === tab ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-5 p-6">
            {profileTab === 'overview' && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="glass-card rounded-2xl border border-border p-5">
                    <p className="text-sm font-700 text-foreground">Member Information</p>
                    <div className="mt-4 space-y-2 text-sm">
                      <p><span className="font-600 text-foreground">Phone:</span> {selectedMember.phone}</p>
                      <p><span className="font-600 text-foreground">Email:</span> {selectedMember.email || '-'}</p>
                      <p><span className="font-600 text-foreground">Address:</span> {selectedMember.address || '-'}</p>
                      <p><span className="font-600 text-foreground">Emergency Contact:</span> {selectedMember.emergencyContact || '-'}</p>
                    </div>
                  </div>
                  <div className="glass-card rounded-2xl border border-border p-5">
                    <p className="text-sm font-700 text-foreground">Membership Details</p>
                    <div className="mt-4 space-y-2 text-sm">
                      <p><span className="font-600 text-foreground">Plan Name:</span> {selectedMember.membershipPlan}</p>
                      <p><span className="font-600 text-foreground">Monthly Fee:</span> {formatCurrency(selectedMember.feeAmount)}</p>
                      <p><span className="font-600 text-foreground">Joining Date:</span> {selectedMember.joiningDate}</p>
                      <p><span className="font-600 text-foreground">Renewal Date:</span> {selectedMember.renewalDate}</p>
                      <p><span className="font-600 text-foreground">Membership Status:</span> {selectedMember.status}</p>
                    </div>
                  </div>
                  <div className="glass-card rounded-2xl border border-border p-5">
                    <p className="text-sm font-700 text-foreground">Fitness Information</p>
                    <div className="mt-4 space-y-2 text-sm">
                      <p><span className="font-600 text-foreground">Height:</span> {selectedMember.heightCm ? `${selectedMember.heightCm} cm` : '-'}</p>
                      <p><span className="font-600 text-foreground">Weight:</span> {selectedMember.weightKg ? `${selectedMember.weightKg} kg` : '-'}</p>
                      <p><span className="font-600 text-foreground">BMI:</span> {selectedMember.bmi || '-'}</p>
                      <p><span className="font-600 text-foreground">Goal:</span> {formatGoal(selectedMember.fitnessGoal)}</p>
                    </div>
                  </div>
                  <div className="glass-card rounded-2xl border border-border p-5">
                    <p className="text-sm font-700 text-foreground">Operations Snapshot</p>
                    <div className="mt-4 space-y-2 text-sm">
                      <p><span className="font-600 text-foreground">Assigned Trainer:</span> {selectedMember.trainerName || 'Unassigned'}</p>
                      <p><span className="font-600 text-foreground">Attendance:</span> {(attendanceMap.get(selectedMember.id)?.present ?? 0)} Present | {(attendanceMap.get(selectedMember.id)?.absent ?? 0)} Absent</p>
                      <p><span className="font-600 text-foreground">Attendance Percentage:</span> {attendanceMap.get(selectedMember.id)?.percentage ?? 0}%</p>
                      <p><span className="font-600 text-foreground">Receipts:</span> {selectedMemberReceipts.length}</p>
                    </div>
                  </div>
                </div>
                <div className="glass-card rounded-2xl border border-border p-5">
                  <p className="text-sm font-700 text-foreground">Notes</p>
                  <p className="mt-3 text-sm text-muted-foreground">{selectedMember.notes || 'No notes added.'}</p>
                </div>
              </>
            )}

            {profileTab === 'payments' && (
              <div className="glass-card rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-700 text-foreground">Payment History</p>
                  <button type="button" onClick={() => openPaymentModal(selectedMember)} className="btn-primary rounded-xl px-4 py-2 text-sm">
                    Record Payment
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {selectedMemberPayments.length ? selectedMemberPayments.map((payment) => (
                    <div key={payment.id} className="rounded-2xl border border-border bg-muted/20 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="text-sm font-600 text-foreground">{payment.receiptNumber ?? payment.invoiceId}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{payment.paymentDate} | {payment.billingPeriod}</p>
                        </div>
                        <div className="text-sm text-foreground">{formatCurrency(payment.amount)} | {formatPaymentMethod(payment.paymentMethod)}</div>
                      </div>
                    </div>
                  )) : <p className="text-sm text-muted-foreground">No payment history found.</p>}
                </div>
              </div>
            )}

            {profileTab === 'attendance' && (
              <div className="glass-card rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-700 text-foreground">Attendance History</p>
                  <button type="button" onClick={() => openAttendanceModal(selectedMember)} className="btn-primary rounded-xl px-4 py-2 text-sm">
                    Mark Attendance
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {selectedMemberAttendance.length ? selectedMemberAttendance.map((record) => (
                    <div key={record.id} className="flex items-center justify-between rounded-2xl border border-border bg-muted/20 p-4">
                      <div>
                        <p className="text-sm font-600 text-foreground">{record.attendanceDate}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Member attendance</p>
                      </div>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-600 capitalize ${record.status === 'present' ? 'badge-success' : 'badge-danger'}`}>
                        {record.status}
                      </span>
                    </div>
                  )) : <p className="text-sm text-muted-foreground">No attendance history found.</p>}
                </div>
              </div>
            )}

            {profileTab === 'receipts' && (
              <div className="glass-card rounded-2xl border border-border p-5">
                <p className="text-sm font-700 text-foreground">Receipt History</p>
                <div className="mt-4 space-y-3">
                  {selectedMemberReceipts.length ? selectedMemberReceipts.map((receipt) => {
                    const payment = payments.find((item) => item.id === receipt.paymentId);
                    return (
                      <div key={receipt.id} className="rounded-2xl border border-border bg-muted/20 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <p className="text-sm font-600 text-foreground">{receipt.receiptNumber}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{receipt.paymentDate} | {formatPaymentMethod(receipt.paymentMethod)}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => payment && openReceiptWindow(user.businessName, payment, receipt, selectedMember, 'download')} className="btn-outline rounded-lg px-3 py-2 text-xs" disabled={!payment}>
                              Download PDF
                            </button>
                            <button type="button" onClick={() => payment && openReceiptWindow(user.businessName, payment, receipt, selectedMember, 'print')} className="btn-outline rounded-lg px-3 py-2 text-xs" disabled={!payment}>
                              Print Receipt
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }) : <p className="text-sm text-muted-foreground">No receipts found.</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {memberModalOpen && (
        <ModalShell title={editingMemberId ? 'Edit member' : 'Add member'} subtitle="Member Form" onClose={() => setMemberModalOpen(false)}>
          <form onSubmit={handleMemberSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5 text-sm">
                <span className="font-600 text-foreground">Full Name</span>
                <input required value={memberFormValues.fullName} onChange={(event) => setMemberFormValues((current) => ({ ...current, fullName: event.target.value }))} className="w-full rounded-xl border border-border bg-input px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring" />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-600 text-foreground">Phone</span>
                <input required value={memberFormValues.phone} onChange={(event) => setMemberFormValues((current) => ({ ...current, phone: event.target.value }))} className="w-full rounded-xl border border-border bg-input px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring" />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-600 text-foreground">Email</span>
                <input value={memberFormValues.email} onChange={(event) => setMemberFormValues((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-xl border border-border bg-input px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring" />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-600 text-foreground">Address</span>
                <input value={memberFormValues.address} onChange={(event) => setMemberFormValues((current) => ({ ...current, address: event.target.value }))} className="w-full rounded-xl border border-border bg-input px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring" />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-600 text-foreground">Emergency Contact</span>
                <input value={memberFormValues.emergencyContact} onChange={(event) => setMemberFormValues((current) => ({ ...current, emergencyContact: event.target.value }))} className="w-full rounded-xl border border-border bg-input px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring" />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-600 text-foreground">Plan Name</span>
                <select value={memberFormValues.membershipPlan} onChange={(event) => setMemberFormValues((current) => ({ ...current, membershipPlan: event.target.value }))} className="w-full rounded-xl border border-border bg-input px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring">
                  {memberPlanOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-600 text-foreground">Monthly Fee</span>
                <input required type="number" min="0" value={memberFormValues.feeAmount} onChange={(event) => setMemberFormValues((current) => ({ ...current, feeAmount: event.target.value }))} className="w-full rounded-xl border border-border bg-input px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring" />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-600 text-foreground">Assigned Trainer</span>
                <select value={memberFormValues.trainerId} onChange={(event) => setMemberFormValues((current) => ({ ...current, trainerId: event.target.value }))} className="w-full rounded-xl border border-border bg-input px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Unassigned</option>
                  {trainers.map((trainer) => <option key={trainer.id} value={trainer.id}>{trainer.name}</option>)}
                </select>
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-600 text-foreground">Joining Date</span>
                <input required type="date" value={memberFormValues.joiningDate} onChange={(event) => setMemberFormValues((current) => ({ ...current, joiningDate: event.target.value }))} className="w-full rounded-xl border border-border bg-input px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring" />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-600 text-foreground">Renewal Date</span>
                <input required type="date" value={memberFormValues.renewalDate} onChange={(event) => setMemberFormValues((current) => ({ ...current, renewalDate: event.target.value }))} className="w-full rounded-xl border border-border bg-input px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring" />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-600 text-foreground">Status</span>
                <select value={memberFormValues.status} onChange={(event) => setMemberFormValues((current) => ({ ...current, status: event.target.value as GymMemberRecord['status'] }))} className="w-full rounded-xl border border-border bg-input px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="expired">Expired</option>
                </select>
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-600 text-foreground">Height (cm)</span>
                <input type="number" min="0" value={memberFormValues.heightCm} onChange={(event) => setMemberFormValues((current) => ({ ...current, heightCm: event.target.value }))} className="w-full rounded-xl border border-border bg-input px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring" />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-600 text-foreground">Weight (kg)</span>
                <input type="number" min="0" value={memberFormValues.weightKg} onChange={(event) => setMemberFormValues((current) => ({ ...current, weightKg: event.target.value }))} className="w-full rounded-xl border border-border bg-input px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring" />
              </label>
              <label className="space-y-1.5 text-sm md:col-span-2">
                <span className="font-600 text-foreground">Goal</span>
                <select value={memberFormValues.fitnessGoal} onChange={(event) => setMemberFormValues((current) => ({ ...current, fitnessGoal: event.target.value as NonNullable<GymMemberRecord['fitnessGoal']> }))} className="w-full rounded-xl border border-border bg-input px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="weight-loss">Weight Loss</option>
                  <option value="weight-gain">Weight Gain</option>
                  <option value="strength">Strength</option>
                  <option value="general-fitness">General Fitness</option>
                </select>
              </label>
              <label className="space-y-1.5 text-sm md:col-span-2">
                <span className="font-600 text-foreground">Notes</span>
                <textarea value={memberFormValues.notes} onChange={(event) => setMemberFormValues((current) => ({ ...current, notes: event.target.value }))} className="min-h-28 w-full rounded-xl border border-border bg-input px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring" />
              </label>
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setMemberModalOpen(false)} className="btn-outline rounded-xl px-4 py-2.5 text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary rounded-xl px-5 py-2.5 text-sm disabled:opacity-60">{saving ? 'Saving...' : editingMemberId ? 'Update Member' : 'Create Member'}</button>
            </div>
          </form>
        </ModalShell>
      )}

      {trainerModalOpen && (
        <ModalShell title={editingTrainerId ? 'Edit trainer' : 'Add trainer'} subtitle="Trainer Form" onClose={() => setTrainerModalOpen(false)}>
          <form onSubmit={handleTrainerSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5 text-sm"><span className="font-600 text-foreground">Name</span><input required value={trainerFormValues.name} onChange={(event) => setTrainerFormValues((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-xl border border-border bg-input px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring" /></label>
              <label className="space-y-1.5 text-sm"><span className="font-600 text-foreground">Phone</span><input required value={trainerFormValues.phone} onChange={(event) => setTrainerFormValues((current) => ({ ...current, phone: event.target.value }))} className="w-full rounded-xl border border-border bg-input px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring" /></label>
              <label className="space-y-1.5 text-sm"><span className="font-600 text-foreground">Email</span><input value={trainerFormValues.email} onChange={(event) => setTrainerFormValues((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-xl border border-border bg-input px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring" /></label>
              <label className="space-y-1.5 text-sm"><span className="font-600 text-foreground">Specialization</span><input required value={trainerFormValues.specialization} onChange={(event) => setTrainerFormValues((current) => ({ ...current, specialization: event.target.value }))} className="w-full rounded-xl border border-border bg-input px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring" /></label>
              <label className="space-y-1.5 text-sm"><span className="font-600 text-foreground">Salary</span><input required type="number" min="0" value={trainerFormValues.salary} onChange={(event) => setTrainerFormValues((current) => ({ ...current, salary: event.target.value }))} className="w-full rounded-xl border border-border bg-input px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring" /></label>
              <label className="space-y-1.5 text-sm"><span className="font-600 text-foreground">Status</span><select value={trainerFormValues.status} onChange={(event) => setTrainerFormValues((current) => ({ ...current, status: event.target.value as GymTrainerRecord['status'] }))} className="w-full rounded-xl border border-border bg-input px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring"><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setTrainerModalOpen(false)} className="btn-outline rounded-xl px-4 py-2.5 text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary rounded-xl px-5 py-2.5 text-sm disabled:opacity-60">{saving ? 'Saving...' : editingTrainerId ? 'Update Trainer' : 'Create Trainer'}</button>
            </div>
          </form>
        </ModalShell>
      )}

      {paymentModalOpen && selectedMember && (
        <ModalShell title={`Record payment for ${selectedMember.fullName}`} subtitle="Member Payment" onClose={() => setPaymentModalOpen(false)}>
          <form onSubmit={handlePaymentSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5 text-sm"><span className="font-600 text-foreground">Amount</span><input required type="number" min="1" value={paymentFormValues.amount} onChange={(event) => setPaymentFormValues((current) => ({ ...current, amount: event.target.value }))} className="w-full rounded-xl border border-border bg-input px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring" /></label>
              <label className="space-y-1.5 text-sm"><span className="font-600 text-foreground">Date</span><input required type="date" value={paymentFormValues.paymentDate} onChange={(event) => setPaymentFormValues((current) => ({ ...current, paymentDate: event.target.value }))} className="w-full rounded-xl border border-border bg-input px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring" /></label>
              <label className="space-y-1.5 text-sm"><span className="font-600 text-foreground">Payment Method</span><select value={paymentFormValues.paymentMethod} onChange={(event) => setPaymentFormValues((current) => ({ ...current, paymentMethod: event.target.value as GymPaymentRecord['paymentMethod'] }))} className="w-full rounded-xl border border-border bg-input px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring"><option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option><option value="bank">Bank</option></select></label>
              <label className="space-y-1.5 text-sm"><span className="font-600 text-foreground">Transaction ID</span><input value={paymentFormValues.transactionId} onChange={(event) => setPaymentFormValues((current) => ({ ...current, transactionId: event.target.value }))} className="w-full rounded-xl border border-border bg-input px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring" /></label>
              <label className="space-y-1.5 text-sm md:col-span-2"><span className="font-600 text-foreground">Billing Period</span><input required value={paymentFormValues.billingPeriod} onChange={(event) => setPaymentFormValues((current) => ({ ...current, billingPeriod: event.target.value }))} className="w-full rounded-xl border border-border bg-input px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring" /></label>
              <label className="space-y-1.5 text-sm md:col-span-2"><span className="font-600 text-foreground">Notes</span><textarea value={paymentFormValues.notes} onChange={(event) => setPaymentFormValues((current) => ({ ...current, notes: event.target.value }))} className="min-h-28 w-full rounded-xl border border-border bg-input px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring" /></label>
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setPaymentModalOpen(false)} className="btn-outline rounded-xl px-4 py-2.5 text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary rounded-xl px-5 py-2.5 text-sm disabled:opacity-60">{saving ? 'Saving...' : 'Save Payment'}</button>
            </div>
          </form>
        </ModalShell>
      )}

      {attendanceModalOpen && selectedMember && (
        <ModalShell title={`Mark attendance for ${selectedMember.fullName}`} subtitle="Attendance" onClose={() => setAttendanceModalOpen(false)}>
          <form onSubmit={handleAttendanceSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5 text-sm"><span className="font-600 text-foreground">Date</span><input required type="date" value={attendanceFormValues.attendanceDate} onChange={(event) => setAttendanceFormValues((current) => ({ ...current, attendanceDate: event.target.value }))} className="w-full rounded-xl border border-border bg-input px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring" /></label>
              <label className="space-y-1.5 text-sm"><span className="font-600 text-foreground">Status</span><select value={attendanceFormValues.status} onChange={(event) => setAttendanceFormValues((current) => ({ ...current, status: event.target.value as GymAttendanceRecord['status'] }))} className="w-full rounded-xl border border-border bg-input px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring"><option value="present">Present</option><option value="absent">Absent</option></select></label>
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setAttendanceModalOpen(false)} className="btn-outline rounded-xl px-4 py-2.5 text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary rounded-xl px-5 py-2.5 text-sm disabled:opacity-60">{saving ? 'Saving...' : 'Save Attendance'}</button>
            </div>
          </form>
        </ModalShell>
      )}

      {limitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[28px] border border-border bg-white shadow-card">
            <div className="border-b border-border px-6 py-5">
              <p className="text-xs font-700 uppercase tracking-[0.22em] text-primary">Member Limit Reached</p>
              <h2 className="mt-1 text-xl font-700 text-foreground">You have reached your current subscription capacity.</h2>
            </div>
            <div className="space-y-5 px-6 py-6">
              <p className="text-sm text-muted-foreground">Upgrade your plan to add more members.</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Capacity</p>
                  <p className="mt-2 text-2xl font-700 text-foreground">{recordLimit ?? business?.recordLimit ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Current</p>
                  <p className="mt-2 text-2xl font-700 text-foreground">{currentUsage}</p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Remaining</p>
                  <p className="mt-2 text-2xl font-700 text-foreground">{Math.max((recordLimit ?? business?.recordLimit ?? 0) - currentUsage, 0)}</p>
                </div>
              </div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setLimitModalOpen(false)} className="btn-outline rounded-xl px-4 py-2.5 text-sm">Cancel</button>
                <button
                  type="button"
                  onClick={() => {
                    setLimitModalOpen(false);
                    window.location.assign('/dashboard/subscription');
                  }}
                  className="btn-primary rounded-xl px-4 py-2.5 text-sm"
                >
                  Upgrade Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
