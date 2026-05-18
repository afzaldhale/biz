'use client';

import React, { memo, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { toast } from 'sonner';
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Dumbbell,
  IndianRupee,
  PencilLine,
  Printer,
  ReceiptText,
  Search,
  ShieldPlus,
  Trash2,
  UserRoundPlus,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { AuthUser, GymMemberRecord, GymPaymentRecord } from '@/types';
import {
  addGymMember,
  deleteGymMember,
  getGymMembers,
  updateGymMember,
} from '@/services/gymMemberService';
import {
  addGymPayment,
  deleteGymPayment,
  getAllGymPaymentsForMember,
  getGymPayments,
  getGymPaymentsForMember,
} from '@/services/gymPaymentService';

interface GymMembersPanelProps {
  user: AuthUser;
  initialView?: 'members' | 'payments';
}

interface MemberFormValues {
  fullName: string;
  phone: string;
  email: string;
  membershipPlan: string;
  trainerName: string;
  joiningDate: string;
  renewalDate: string;
  feeAmount: string;
  initialPayment: string;
  status: GymMemberRecord['status'];
  emergencyContact: string;
  notes: string;
}

interface PaymentFormValues {
  amount: string;
  paymentDate: string;
  billingPeriod: string;
  paymentMethod: GymPaymentRecord['paymentMethod'];
  notes: string;
}

interface MembersTableProps {
  currentPage: number;
  loading: boolean;
  members: GymMemberRecord[];
  onDelete: (member: GymMemberRecord) => void;
  onEdit: (member: GymMemberRecord) => void;
  onOpenPayments: (member: GymMemberRecord) => void;
  hasMoreMembers: boolean;
  loadMoreMembers: () => void;
}

interface PaymentsTableProps {
  currentPage: number;
  loading: boolean;
  onPrint: (payment: GymPaymentRecord) => void;
  payments: GymPaymentRecord[];
  hasMorePayments: boolean;
  loadMorePayments: () => void;
}

interface MemberFormModalProps {
  editingMemberId: string | null;
  formValues: MemberFormValues;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  submitting: boolean;
}

interface PaymentModalProps {
  formValues: PaymentFormValues;
  loadingHistory: boolean;
  member: GymMemberRecord | null;
  memberPayments: GymPaymentRecord[];
  hasMorePayments: boolean;
  onLoadMorePayments: () => void;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  onClose: () => void;
  onPrint: (payment: GymPaymentRecord) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  submitting: boolean;
}

const rowsPerPageOptions = [10, 20];
const membershipPlanOptions = [
  'Monthly',
  'Quarterly',
  'Half-Yearly',
  'Annual',
  'Personal Training',
];

const emptyMemberForm: MemberFormValues = {
  fullName: '',
  phone: '',
  email: '',
  membershipPlan: 'Monthly',
  trainerName: '',
  joiningDate: new Date().toISOString().slice(0, 10),
  renewalDate: new Date().toISOString().slice(0, 10),
  feeAmount: '',
  initialPayment: '',
  status: 'active',
  emergencyContact: '',
  notes: '',
};

const emptyPaymentForm: PaymentFormValues = {
  amount: '',
  paymentDate: new Date().toISOString().slice(0, 10),
  billingPeriod: new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year: 'numeric',
  }).format(new Date()),
  paymentMethod: 'cash',
  notes: '',
};

function useDebouncedValue<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [delay, value]);

  return debouncedValue;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPaymentMethod(method: GymPaymentRecord['paymentMethod']) {
  switch (method) {
    case 'upi':
      return 'UPI';
    case 'card':
      return 'Card';
    case 'bank-transfer':
      return 'Bank Transfer';
    default:
      return 'Cash';
  }
}

function buildGymMemberId(members: GymMemberRecord[]) {
  return `GYM-${String(members.length + 1201).padStart(4, '0')}`;
}

function buildInvoiceId() {
  return `RCPT-${Date.now().toString().slice(-8)}`;
}

function normalizeGymMemberRecord(
  member: Partial<GymMemberRecord>,
  fallbackId: string
): GymMemberRecord {
  return {
    id: member.id ?? fallbackId,
    memberId: member.memberId ?? fallbackId.toUpperCase(),
    fullName: member.fullName ?? 'Unknown Member',
    phone: member.phone ?? '',
    email: member.email ?? '',
    membershipPlan: member.membershipPlan ?? 'Monthly',
    trainerName: member.trainerName ?? '',
    joiningDate: member.joiningDate ?? new Date().toISOString().slice(0, 10),
    renewalDate: member.renewalDate ?? new Date().toISOString().slice(0, 10),
    feeAmount: Number(member.feeAmount ?? 0),
    paidAmount: Number(member.paidAmount ?? 0),
    status: (member.status as GymMemberRecord['status']) ?? 'active',
    emergencyContact: member.emergencyContact ?? '',
    notes: member.notes ?? '',
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
  };
}

function normalizeGymPaymentRecord(
  payment: Partial<GymPaymentRecord>,
  fallbackId: string
): GymPaymentRecord {
  return {
    id: payment.id ?? fallbackId,
    memberDocId: payment.memberDocId ?? '',
    memberId: payment.memberId ?? '',
    memberName: payment.memberName ?? 'Unknown Member',
    membershipPlan: payment.membershipPlan ?? 'Monthly',
    invoiceId: payment.invoiceId ?? fallbackId.toUpperCase(),
    paymentDate: payment.paymentDate ?? new Date().toISOString().slice(0, 10),
    billingPeriod: payment.billingPeriod ?? '',
    amount: Number(payment.amount ?? 0),
    paymentMethod: (payment.paymentMethod as GymPaymentRecord['paymentMethod']) ?? 'cash',
    notes: payment.notes ?? '',
    createdAt: payment.createdAt,
  };
}

const MembersTable = memo(function MembersTable({
  currentPage,
  loading,
  members,
  onDelete,
  onEdit,
  onOpenPayments,
  hasMoreMembers,
  loadMoreMembers,
}: MembersTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px]">
        <thead className="bg-muted/40">
          <tr>
            <th className="text-left px-5 py-3 text-2xs font-700 text-muted-foreground uppercase tracking-wider">
              Member
            </th>
            <th className="text-left px-5 py-3 text-2xs font-700 text-muted-foreground uppercase tracking-wider">
              Plan
            </th>
            <th className="text-left px-5 py-3 text-2xs font-700 text-muted-foreground uppercase tracking-wider">
              Contact
            </th>
            <th className="text-left px-5 py-3 text-2xs font-700 text-muted-foreground uppercase tracking-wider">
              Status
            </th>
            <th className="text-left px-5 py-3 text-2xs font-700 text-muted-foreground uppercase tracking-wider">
              Billing
            </th>
            <th className="text-right px-5 py-3 text-2xs font-700 text-muted-foreground uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => (
                <tr key={`member-skeleton-${index}`}>
                  <td colSpan={6} className="px-5 py-4">
                    <div className="h-14 rounded-xl bg-muted animate-pulse" />
                  </td>
                </tr>
              ))
            : members.map((member) => {
                const balance = Math.max(member.feeAmount - member.paidAmount, 0);

                return (
                  <tr key={member.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm font-700 text-foreground">{member.fullName}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {member.memberId} | Joined {member.joiningDate}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-600 text-foreground">{member.membershipPlan}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Trainer {member.trainerName || 'Unassigned'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-foreground">{member.phone}</p>
                      <p className="text-xs text-muted-foreground mt-1">{member.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-600 capitalize ${
                          member.status === 'active'
                            ? 'badge-success'
                            : member.status === 'paused'
                              ? 'badge-warning'
                              : 'badge-danger'
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-700 text-foreground">
                        {formatCurrency(member.paidAmount)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Due {formatCurrency(balance)} | Renewal {member.renewalDate}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenPayments(member)}
                          className="btn-outline px-3 py-2 rounded-lg text-xs inline-flex items-center gap-1.5"
                        >
                          <Wallet size={14} />
                          Fees
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(member)}
                          className="btn-outline px-3 py-2 rounded-lg text-xs inline-flex items-center gap-1.5"
                        >
                          <PencilLine size={14} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(member)}
                          className="px-3 py-2 rounded-lg text-xs inline-flex items-center gap-1.5 border border-danger/30 bg-danger/5 text-danger hover:bg-danger/10 transition-colors"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          {!loading && members.length === 0 && (
            <tr>
              <td colSpan={6} className="px-5 py-16 text-center">
                <p className="text-sm font-600 text-foreground">No members found on this page.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try a different filter or add a new member.
                </p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {!loading && members.length > 0 && (
        <div className="px-5 py-3 border-t border-border bg-white/80 text-xs text-muted-foreground">
          Page {currentPage}
        </div>
      )}
      {!loading && hasMoreMembers && (
        <div className="px-5 py-4 border-t border-border bg-white/80 text-right">
          <button
            type="button"
            onClick={loadMoreMembers}
            className="btn-outline inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
          >
            Load more members
          </button>
        </div>
      )}
    </div>
  );
});

const PaymentsTable = memo(function PaymentsTable({
  currentPage,
  loading,
  onPrint,
  payments,
  hasMorePayments,
  loadMorePayments,
}: PaymentsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px]">
        <thead className="bg-muted/40">
          <tr>
            <th className="text-left px-5 py-3 text-2xs font-700 text-muted-foreground uppercase tracking-wider">
              Receipt
            </th>
            <th className="text-left px-5 py-3 text-2xs font-700 text-muted-foreground uppercase tracking-wider">
              Member
            </th>
            <th className="text-left px-5 py-3 text-2xs font-700 text-muted-foreground uppercase tracking-wider">
              Period
            </th>
            <th className="text-left px-5 py-3 text-2xs font-700 text-muted-foreground uppercase tracking-wider">
              Method
            </th>
            <th className="text-left px-5 py-3 text-2xs font-700 text-muted-foreground uppercase tracking-wider">
              Amount
            </th>
            <th className="text-right px-5 py-3 text-2xs font-700 text-muted-foreground uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => (
                <tr key={`payment-skeleton-${index}`}>
                  <td colSpan={6} className="px-5 py-4">
                    <div className="h-14 rounded-xl bg-muted animate-pulse" />
                  </td>
                </tr>
              ))
            : payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-sm font-700 text-foreground">{payment.invoiceId}</p>
                    <p className="text-xs text-muted-foreground mt-1">{payment.paymentDate}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-600 text-foreground">{payment.memberName}</p>
                    <p className="text-xs text-muted-foreground mt-1">{payment.memberId}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-foreground">{payment.billingPeriod}</p>
                    <p className="text-xs text-muted-foreground mt-1">{payment.membershipPlan}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-600 badge-info">
                      {formatPaymentMethod(payment.paymentMethod)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-700 text-foreground">
                      {formatCurrency(payment.amount)}
                    </p>
                    {payment.notes && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {payment.notes}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onPrint(payment)}
                        className="btn-outline px-3 py-2 rounded-lg text-xs inline-flex items-center gap-1.5"
                      >
                        <Printer size={14} />
                        Print
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          {!loading && payments.length === 0 && (
            <tr>
              <td colSpan={6} className="px-5 py-16 text-center">
                <p className="text-sm font-600 text-foreground">No payments found.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Record member fees to see receipt history here.
                </p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {!loading && payments.length > 0 && (
        <div className="px-5 py-3 border-t border-border bg-white/80 text-xs text-muted-foreground">
          Page {currentPage}
        </div>
      )}
      {!loading && hasMorePayments && (
        <div className="px-5 py-4 border-t border-border bg-white/80 text-right">
          <button
            type="button"
            onClick={loadMorePayments}
            className="btn-outline inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
          >
            Load more payments
          </button>
        </div>
      )}
    </div>
  );
});

const MemberFormModal = memo(function MemberFormModal({
  editingMemberId,
  formValues,
  onChange,
  onClose,
  onSubmit,
  submitting,
}: MemberFormModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center">
        <div className="w-full max-w-4xl glass-card rounded-[28px] border border-border shadow-card overflow-hidden animate-slide-up">
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <div>
              <p className="text-xs font-700 tracking-[0.22em] text-primary uppercase">
                {editingMemberId ? 'Edit Member' : 'New Member'}
              </p>
              <h2 className="text-xl font-700 text-foreground mt-1">
                {editingMemberId ? 'Update Gym Member' : 'Add Gym Member'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors"
              aria-label="Close form"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={onSubmit} className="p-6 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">Member Name</label>
                <input
                  required
                  name="fullName"
                  value={formValues.fullName}
                  onChange={onChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">
                  Membership Plan
                </label>
                <select
                  name="membershipPlan"
                  value={formValues.membershipPlan}
                  onChange={onChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {membershipPlanOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">Phone</label>
                <input
                  required
                  name="phone"
                  value={formValues.phone}
                  onChange={onChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">Email</label>
                <input
                  required
                  type="email"
                  name="email"
                  value={formValues.email}
                  onChange={onChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">Trainer</label>
                <input
                  name="trainerName"
                  value={formValues.trainerName}
                  onChange={onChange}
                  placeholder="Assigned trainer name"
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">
                  Emergency Contact
                </label>
                <input
                  name="emergencyContact"
                  value={formValues.emergencyContact}
                  onChange={onChange}
                  placeholder="Emergency contact number"
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">
                  Joining Date
                </label>
                <input
                  required
                  type="date"
                  name="joiningDate"
                  value={formValues.joiningDate}
                  onChange={onChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">
                  Renewal Date
                </label>
                <input
                  required
                  type="date"
                  name="renewalDate"
                  value={formValues.renewalDate}
                  onChange={onChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">
                  Membership Fee
                </label>
                <input
                  required
                  min="0"
                  type="number"
                  name="feeAmount"
                  value={formValues.feeAmount}
                  onChange={onChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">
                  {editingMemberId ? 'Opening Payment Locked' : 'Opening Payment'}
                </label>
                <input
                  min="0"
                  type="number"
                  name="initialPayment"
                  value={formValues.initialPayment}
                  onChange={onChange}
                  disabled={Boolean(editingMemberId)}
                  placeholder={editingMemberId ? 'Use fee history to add new payments' : 'Optional'}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-600 text-foreground mb-1.5">Status</label>
                <select
                  name="status"
                  value={formValues.status}
                  onChange={onChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-600 text-foreground mb-1.5">Notes</label>
                <textarea
                  name="notes"
                  rows={4}
                  value={formValues.notes}
                  onChange={onChange}
                  placeholder="Workout goals, medical notes, trainer preferences, or renewal remarks"
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="btn-outline px-5 py-3 rounded-xl text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary px-5 py-3 rounded-xl text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving...' : editingMemberId ? 'Update Member' : 'Add Member'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});

const PaymentModal = memo(function PaymentModal({
  formValues,
  loadingHistory,
  member,
  memberPayments,
  hasMorePayments,
  onLoadMorePayments,
  onChange,
  onClose,
  onPrint,
  onSubmit,
  submitting,
}: PaymentModalProps) {
  if (!member) {
    return null;
  }

  const outstanding = Math.max(member.feeAmount - member.paidAmount, 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center">
        <div className="w-full max-w-5xl glass-card rounded-[28px] border border-border shadow-card overflow-hidden animate-slide-up">
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <div>
              <p className="text-xs font-700 tracking-[0.22em] text-primary uppercase">
                Fee Collection
              </p>
              <h2 className="text-xl font-700 text-foreground mt-1">{member.fullName}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Record payments, print receipts, and review fee history for this member.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors"
              aria-label="Close payment panel"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-border bg-white/80 p-4">
                <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">
                  Member ID
                </p>
                <p className="text-sm font-700 text-foreground mt-2">{member.memberId}</p>
              </div>
              <div className="rounded-2xl border border-border bg-white/80 p-4">
                <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">
                  Plan
                </p>
                <p className="text-sm font-700 text-foreground mt-2">{member.membershipPlan}</p>
              </div>
              <div className="rounded-2xl border border-border bg-white/80 p-4">
                <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">
                  Collected
                </p>
                <p className="text-sm font-700 text-foreground mt-2">
                  {formatCurrency(member.paidAmount)}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-white/80 p-4">
                <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">
                  Outstanding
                </p>
                <p className="text-sm font-700 text-foreground mt-2">
                  {formatCurrency(outstanding)}
                </p>
              </div>
            </div>

            <form onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
              <div className="rounded-2xl border border-border bg-white/90 p-5 space-y-4">
                <div>
                  <p className="text-base font-700 text-foreground">Record Payment</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Each payment creates a printable receipt and updates the member balance.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-600 text-foreground mb-1.5">Amount</label>
                  <input
                    required
                    min="1"
                    type="number"
                    name="amount"
                    value={formValues.amount}
                    onChange={onChange}
                    className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-600 text-foreground mb-1.5">
                    Payment Date
                  </label>
                  <input
                    required
                    type="date"
                    name="paymentDate"
                    value={formValues.paymentDate}
                    onChange={onChange}
                    className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-600 text-foreground mb-1.5">
                    Billing Period
                  </label>
                  <input
                    required
                    name="billingPeriod"
                    value={formValues.billingPeriod}
                    onChange={onChange}
                    placeholder="May 2026"
                    className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-600 text-foreground mb-1.5">
                    Payment Method
                  </label>
                  <select
                    name="paymentMethod"
                    value={formValues.paymentMethod}
                    onChange={onChange}
                    className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="bank-transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-600 text-foreground mb-1.5">Notes</label>
                  <textarea
                    name="notes"
                    rows={3}
                    value={formValues.notes}
                    onChange={onChange}
                    placeholder="Optional note for this receipt"
                    className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-outline px-5 py-3 rounded-xl text-sm"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary px-5 py-3 rounded-xl text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Saving...' : 'Save Payment'}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-white/90 overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <div>
                    <p className="text-base font-700 text-foreground">Payment History</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      All recorded fees for this member.
                    </p>
                  </div>
                  <span className="badge-neutral px-3 py-1.5 rounded-full text-xs font-600">
                    {memberPayments.length} receipts
                  </span>
                </div>
                <div className="max-h-[440px] overflow-y-auto">
                  {loadingHistory ? (
                    <div className="p-5 space-y-3">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div
                          key={`member-payment-skeleton-${index}`}
                          className="h-20 rounded-xl bg-muted animate-pulse"
                        />
                      ))}
                    </div>
                  ) : memberPayments.length === 0 ? (
                    <div className="px-5 py-16 text-center">
                      <p className="text-sm font-600 text-foreground">No payments recorded yet.</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Add the first payment to start the member fee history.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/70">
                      {memberPayments.map((payment) => (
                        <div
                          key={payment.id}
                          className="px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="text-sm font-700 text-foreground">{payment.invoiceId}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {payment.paymentDate} | {payment.billingPeriod} |{' '}
                              {formatPaymentMethod(payment.paymentMethod)}
                            </p>
                            {payment.notes && (
                              <p className="text-xs text-muted-foreground mt-1">{payment.notes}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="text-sm font-700 text-foreground">
                              {formatCurrency(payment.amount)}
                            </p>
                            <button
                              type="button"
                              onClick={() => onPrint(payment)}
                              className="btn-outline px-3 py-2 rounded-lg text-xs inline-flex items-center gap-1.5"
                            >
                              <Printer size={14} />
                              Print
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {hasMorePayments && !loadingHistory && (
                  <div className="px-5 py-4 border-t border-border text-center">
                    <button
                      type="button"
                      onClick={onLoadMorePayments}
                      className="btn-outline px-5 py-3 rounded-xl text-sm"
                    >
                      Load more receipts
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
});

export default function GymMembersPanel({ initialView = 'members', user }: GymMembersPanelProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'payments'>(initialView);
  const [members, setMembers] = useState<GymMemberRecord[]>([]);
  const [payments, setPayments] = useState<GymPaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | GymMemberRecord['status']>('all');
  const [methodFilter, setMethodFilter] = useState<'all' | GymPaymentRecord['paymentMethod']>(
    'all'
  );
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastMemberDoc, setLastMemberDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(
    null
  );
  const [hasMoreMembers, setHasMoreMembers] = useState(false);
  const [lastPaymentDoc, setLastPaymentDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(
    null
  );
  const [hasMorePayments, setHasMorePayments] = useState(false);
  const [memberPaymentHistory, setMemberPaymentHistory] = useState<GymPaymentRecord[]>([]);
  const [memberPaymentLastDoc, setMemberPaymentLastDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMoreMemberPaymentHistory, setHasMoreMemberPaymentHistory] = useState(false);
  const [isMemberFormOpen, setIsMemberFormOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<GymMemberRecord | null>(null);
  const [memberFormValues, setMemberFormValues] = useState<MemberFormValues>(emptyMemberForm);
  const [paymentFormValues, setPaymentFormValues] = useState<PaymentFormValues>(emptyPaymentForm);
  const [submittingMember, setSubmittingMember] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const debouncedSearchTerm = useDebouncedValue(searchInput, 250);
  const deferredSearchTerm = useDeferredValue(debouncedSearchTerm);

  useEffect(() => {
    setActiveTab(initialView);
  }, [initialView]);

  useEffect(() => {
    let mounted = true;

    async function loadGymData() {
      setLoading(true);
      setLastMemberDoc(null);
      setHasMoreMembers(false);
      setLastPaymentDoc(null);
      setHasMorePayments(false);

      try {
        const [membersPage, paymentsPage] = await Promise.all([
          getGymMembers(user.id, { pageSize: rowsPerPage }),
          getGymPayments(user.id, { pageSize: rowsPerPage }),
        ]);

        if (!mounted) {
          return;
        }

        setMembers(
          membersPage.data
            .map((member, index) => normalizeGymMemberRecord(member, `member-${index + 1}`))
            .sort((a, b) =>
              (b.createdAt ?? b.joiningDate).localeCompare(a.createdAt ?? a.joiningDate)
            )
        );
        setPayments(
          paymentsPage.data
            .map((payment, index) => normalizeGymPaymentRecord(payment, `payment-${index + 1}`))
            .sort((a, b) =>
              (b.createdAt ?? b.paymentDate).localeCompare(a.createdAt ?? a.paymentDate)
            )
        );
        setLastMemberDoc(membersPage.lastDoc);
        setHasMoreMembers(membersPage.hasMore);
        setLastPaymentDoc(paymentsPage.lastDoc);
        setHasMorePayments(paymentsPage.hasMore);
      } catch {
        if (!mounted) {
          return;
        }

        setMembers([]);
        setPayments([]);
        toast.error('Unable to load gym members from Firebase right now.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadGymData();

    return () => {
      mounted = false;
    };
  }, [user.id, rowsPerPage]);

  const loadMoreMembers = useCallback(async () => {
    if (!hasMoreMembers || !lastMemberDoc) return;

    setLoading(true);
    try {
      const nextPage = await getGymMembers(user.id, {
        pageSize: rowsPerPage,
        lastDoc: lastMemberDoc,
      });

      setMembers((current) =>
        [
          ...current,
          ...nextPage.data.map((member, index) =>
            normalizeGymMemberRecord(member, `member-${current.length + index + 1}`)
          ),
        ].sort((a, b) => (b.createdAt ?? b.joiningDate).localeCompare(a.createdAt ?? a.joiningDate))
      );
      setLastMemberDoc(nextPage.lastDoc);
      setHasMoreMembers(nextPage.hasMore);
    } catch {
      toast.error('Unable to load more members.');
    } finally {
      setLoading(false);
    }
  }, [hasMoreMembers, lastMemberDoc, rowsPerPage, user.id]);

  const loadMorePayments = useCallback(async () => {
    if (!hasMorePayments || !lastPaymentDoc) return;

    setLoading(true);
    try {
      const nextPage = await getGymPayments(user.id, {
        pageSize: rowsPerPage,
        lastDoc: lastPaymentDoc,
      });

      setPayments((current) =>
        [
          ...current,
          ...nextPage.data.map((payment, index) =>
            normalizeGymPaymentRecord(payment, `payment-${current.length + index + 1}`)
          ),
        ].sort((a, b) => (b.createdAt ?? b.paymentDate).localeCompare(a.createdAt ?? a.paymentDate))
      );
      setLastPaymentDoc(nextPage.lastDoc);
      setHasMorePayments(nextPage.hasMore);
    } catch {
      toast.error('Unable to load more payments.');
    } finally {
      setLoading(false);
    }
  }, [hasMorePayments, lastPaymentDoc, rowsPerPage, user.id]);

  const filteredMembers = useMemo(() => {
    const query = deferredSearchTerm.trim().toLowerCase();

    return members.filter((member) => {
      const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
      const matchesQuery =
        query.length === 0 ||
        [
          member.fullName,
          member.memberId,
          member.membershipPlan,
          member.phone,
          member.email,
          member.trainerName,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query);

      return matchesStatus && matchesQuery;
    });
  }, [deferredSearchTerm, members, statusFilter]);

  const filteredPayments = useMemo(() => {
    const query = deferredSearchTerm.trim().toLowerCase();

    return payments.filter((payment) => {
      const matchesMethod = methodFilter === 'all' || payment.paymentMethod === methodFilter;
      const matchesQuery =
        query.length === 0 ||
        [
          payment.memberName,
          payment.memberId,
          payment.invoiceId,
          payment.billingPeriod,
          payment.membershipPlan,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query);

      return matchesMethod && matchesQuery;
    });
  }, [deferredSearchTerm, methodFilter, payments]);

  const dashboardStats = useMemo(() => {
    const totalCollected = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalDue = members.reduce((sum, member) => sum + member.feeAmount, 0);
    const activeMembers = members.filter((member) => member.status === 'active').length;
    const thisMonthKey = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
    }).format(new Date());
    const thisMonthPayments = payments
      .filter((payment) => payment.paymentDate.startsWith(thisMonthKey))
      .reduce((sum, payment) => sum + payment.amount, 0);

    return {
      totalMembers: members.length,
      activeMembers,
      totalCollected,
      outstanding: Math.max(
        totalDue - members.reduce((sum, member) => sum + member.paidAmount, 0),
        0
      ),
      thisMonthPayments,
    };
  }, [members, payments]);

  const activeItems = activeTab === 'members' ? filteredMembers : filteredPayments;

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(activeItems.length / rowsPerPage)),
    [activeItems.length, rowsPerPage]
  );

  const paginatedMembers = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredMembers.slice(startIndex, startIndex + rowsPerPage);
  }, [currentPage, filteredMembers, rowsPerPage]);

  const paginatedPayments = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredPayments.slice(startIndex, startIndex + rowsPerPage);
  }, [currentPage, filteredPayments, rowsPerPage]);

  const selectedMemberPayments = useMemo(() => memberPaymentHistory, [memberPaymentHistory]);

  const loadMoreMemberPayments = useCallback(async () => {
    if (!hasMoreMemberPaymentHistory || !memberPaymentLastDoc || !selectedMember) return;

    setPaymentHistoryLoading(true);
    try {
      const nextPage = await getGymPaymentsForMember(user.id, selectedMember.id, {
        pageSize: rowsPerPage,
        lastDoc: memberPaymentLastDoc,
      });

      setMemberPaymentHistory((current) =>
        [
          ...current,
          ...nextPage.data.map((payment, index) =>
            normalizeGymPaymentRecord(payment, `member-payment-${current.length + index + 1}`)
          ),
        ].sort((a, b) => (b.createdAt ?? b.paymentDate).localeCompare(a.createdAt ?? a.paymentDate))
      );
      setMemberPaymentLastDoc(nextPage.lastDoc);
      setHasMoreMemberPaymentHistory(nextPage.hasMore);
    } catch {
      toast.error('Unable to load more payment history.');
    } finally {
      setPaymentHistoryLoading(false);
    }
  }, [hasMoreMemberPaymentHistory, memberPaymentLastDoc, rowsPerPage, selectedMember, user.id]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, deferredSearchTerm, rowsPerPage, statusFilter, methodFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const closeMemberForm = useCallback(() => {
    setIsMemberFormOpen(false);
    setEditingMemberId(null);
    setMemberFormValues(emptyMemberForm);
  }, []);

  const closePaymentModal = useCallback(() => {
    setIsPaymentModalOpen(false);
    setSelectedMember(null);
    setPaymentFormValues(emptyPaymentForm);
    setPaymentHistoryLoading(false);
    setMemberPaymentHistory([]);
    setMemberPaymentLastDoc(null);
    setHasMoreMemberPaymentHistory(false);
  }, []);

  const openCreateMemberForm = useCallback(() => {
    setEditingMemberId(null);
    setMemberFormValues(emptyMemberForm);
    setIsMemberFormOpen(true);
  }, []);

  const openEditMemberForm = useCallback((member: GymMemberRecord) => {
    setEditingMemberId(member.id);
    setMemberFormValues({
      fullName: member.fullName,
      phone: member.phone,
      email: member.email,
      membershipPlan: member.membershipPlan,
      trainerName: member.trainerName ?? '',
      joiningDate: member.joiningDate,
      renewalDate: member.renewalDate,
      feeAmount: String(member.feeAmount),
      initialPayment: String(member.paidAmount),
      status: member.status,
      emergencyContact: member.emergencyContact ?? '',
      notes: member.notes ?? '',
    });
    setIsMemberFormOpen(true);
  }, []);

  const openPaymentModal = useCallback(
    async (member: GymMemberRecord) => {
      setSelectedMember(member);
      setPaymentFormValues({
        ...emptyPaymentForm,
        amount: String(Math.max(member.feeAmount - member.paidAmount, 0) || ''),
      });
      setIsPaymentModalOpen(true);
      setPaymentHistoryLoading(true);

      try {
        const paymentHistoryPage = await getGymPaymentsForMember(user.id, member.id, {
          pageSize: rowsPerPage,
        });

        const normalizedHistory = paymentHistoryPage.data
          .map((payment, index) =>
            normalizeGymPaymentRecord(payment, `member-payment-${index + 1}`)
          )
          .sort((a, b) =>
            (b.createdAt ?? b.paymentDate).localeCompare(a.createdAt ?? a.paymentDate)
          );

        setMemberPaymentHistory(normalizedHistory);
        setMemberPaymentLastDoc(paymentHistoryPage.lastDoc);
        setHasMoreMemberPaymentHistory(paymentHistoryPage.hasMore);
      } catch {
        toast.error('Unable to load payment history for this member.');
      } finally {
        setPaymentHistoryLoading(false);
      }
    },
    [user.id]
  );

  const handleMemberInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = event.target;
      setMemberFormValues((current) => ({
        ...current,
        [name]: value,
      }));
    },
    []
  );

  const handlePaymentInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = event.target;
      setPaymentFormValues((current) => ({
        ...current,
        [name]: value,
      }));
    },
    []
  );

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
  }, []);

  const handleRowsPerPageChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(event.target.value));
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchInput('');
    setStatusFilter('all');
    setMethodFilter('all');
    setCurrentPage(1);
  }, []);

  const handleMemberSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSubmittingMember(true);

      const normalizedFeeAmount = Number(memberFormValues.feeAmount || 0);
      const normalizedOpeningPayment = editingMemberId
        ? 0
        : Number(memberFormValues.initialPayment || 0);
      const existingMember = members.find((member) => member.id === editingMemberId);

      const nextMember: GymMemberRecord = {
        id: editingMemberId ?? `member-${Date.now()}`,
        memberId: existingMember?.memberId ?? buildGymMemberId(members),
        fullName: memberFormValues.fullName.trim(),
        phone: memberFormValues.phone.trim(),
        email: memberFormValues.email.trim(),
        membershipPlan: memberFormValues.membershipPlan,
        trainerName: memberFormValues.trainerName.trim(),
        joiningDate: memberFormValues.joiningDate,
        renewalDate: memberFormValues.renewalDate,
        feeAmount: normalizedFeeAmount,
        paidAmount: existingMember?.paidAmount ?? normalizedOpeningPayment,
        status: memberFormValues.status,
        emergencyContact: memberFormValues.emergencyContact.trim(),
        notes: memberFormValues.notes.trim(),
        createdAt: existingMember?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        if (editingMemberId) {
          await updateGymMember(user.id, editingMemberId, nextMember);
        } else {
          const newMemberId = await addGymMember(user.id, nextMember);
          nextMember.id = newMemberId;

          if (normalizedOpeningPayment > 0) {
            const openingPayment: GymPaymentRecord = {
              id: `payment-${Date.now()}`,
              memberDocId: newMemberId,
              memberId: nextMember.memberId,
              memberName: nextMember.fullName,
              membershipPlan: nextMember.membershipPlan,
              invoiceId: buildInvoiceId(),
              paymentDate: nextMember.joiningDate,
              billingPeriod: new Intl.DateTimeFormat('en-IN', {
                month: 'long',
                year: 'numeric',
              }).format(new Date(nextMember.joiningDate)),
              amount: normalizedOpeningPayment,
              paymentMethod: 'cash',
              notes: 'Opening payment captured during member registration',
              createdAt: new Date().toISOString(),
            };

            const paymentDocId = await addGymPayment(user.id, openingPayment);
            openingPayment.id = paymentDocId;

            setPayments((current) =>
              [openingPayment, ...current].sort((a, b) =>
                (b.createdAt ?? b.paymentDate).localeCompare(a.createdAt ?? a.paymentDate)
              )
            );
          }
        }

        setMembers((current) => {
          if (editingMemberId) {
            return current
              .map((member) => (member.id === editingMemberId ? nextMember : member))
              .sort((a, b) =>
                (b.createdAt ?? b.joiningDate).localeCompare(a.createdAt ?? a.joiningDate)
              );
          }

          return [nextMember, ...current].sort((a, b) =>
            (b.createdAt ?? b.joiningDate).localeCompare(a.createdAt ?? a.joiningDate)
          );
        });
        setMemberPaymentHistory((current) =>
          current.map((payment) =>
            payment.memberDocId === nextMember.id
              ? { ...payment, memberName: nextMember.fullName }
              : payment
          )
        );

        if (selectedMember?.id === nextMember.id) {
          setSelectedMember(nextMember);
        }

        toast.success(
          editingMemberId ? 'Gym member updated successfully.' : 'Gym member added successfully.'
        );
        closeMemberForm();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to save gym member right now.';
        toast.error(message);
      } finally {
        setSubmittingMember(false);
      }
    },
    [closeMemberForm, editingMemberId, memberFormValues, members, selectedMember?.id, user.id]
  );

  const handleDeleteMember = useCallback(
    async (member: GymMemberRecord) => {
      const confirmed = window.confirm(
        `Delete ${member.fullName} and all of their fee history from the gym records?`
      );

      if (!confirmed) {
        return;
      }

      try {
        const memberPayments = await getAllGymPaymentsForMember(user.id, member.id);

        await Promise.all([
          deleteGymMember(user.id, member.id),
          ...memberPayments.map((payment) => deleteGymPayment(user.id, payment.id)),
        ]);

        setMembers((current) => current.filter((item) => item.id !== member.id));
        setPayments((current) => current.filter((payment) => payment.memberDocId !== member.id));

        if (selectedMember?.id === member.id) {
          closePaymentModal();
        }

        toast.success('Gym member removed successfully.');
      } catch {
        toast.error('Unable to delete this gym member right now.');
      }
    },
    [closePaymentModal, selectedMember?.id, user.id]
  );

  const handlePaymentSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!selectedMember) {
        return;
      }

      setSubmittingPayment(true);

      const paymentAmount = Number(paymentFormValues.amount || 0);

      const paymentRecord: GymPaymentRecord = {
        id: `payment-${Date.now()}`,
        memberDocId: selectedMember.id,
        memberId: selectedMember.memberId,
        memberName: selectedMember.fullName,
        membershipPlan: selectedMember.membershipPlan,
        invoiceId: buildInvoiceId(),
        paymentDate: paymentFormValues.paymentDate,
        billingPeriod: paymentFormValues.billingPeriod.trim(),
        amount: paymentAmount,
        paymentMethod: paymentFormValues.paymentMethod,
        notes: paymentFormValues.notes.trim(),
        createdAt: new Date().toISOString(),
      };

      const updatedMember: GymMemberRecord = {
        ...selectedMember,
        paidAmount: selectedMember.paidAmount + paymentAmount,
        status: selectedMember.status === 'expired' ? 'active' : selectedMember.status,
        updatedAt: new Date().toISOString(),
      };

      try {
        const paymentDocId = await addGymPayment(user.id, paymentRecord);
        paymentRecord.id = paymentDocId;
        await updateGymMember(user.id, selectedMember.id, updatedMember);

        setPayments((current) =>
          [paymentRecord, ...current].sort((a, b) =>
            (b.createdAt ?? b.paymentDate).localeCompare(a.createdAt ?? a.paymentDate)
          )
        );
        setMembers((current) =>
          current.map((member) => (member.id === selectedMember.id ? updatedMember : member))
        );
        setMemberPaymentHistory((current) => [paymentRecord, ...current]);
        setSelectedMember(updatedMember);
        setPaymentFormValues({
          ...emptyPaymentForm,
          amount: '',
        });
        toast.success('Payment saved and receipt added to history.');
      } catch {
        toast.error('Unable to save this payment right now.');
      } finally {
        setSubmittingPayment(false);
      }
    },
    [paymentFormValues, selectedMember, user.id]
  );

  const handlePrintReceipt = useCallback(
    (payment: GymPaymentRecord) => {
      const member = members.find((item) => item.id === payment.memberDocId) ?? selectedMember;
      const receiptWindow = window.open('', '_blank', 'width=900,height=760');

      if (!receiptWindow) {
        toast.error('Popup blocked. Please allow popups to print receipts.');
        return;
      }

      const totalFee = member?.feeAmount ?? payment.amount;
      const paidAmount = member?.paidAmount ?? payment.amount;
      const outstanding = Math.max(totalFee - paidAmount, 0);

      receiptWindow.document.write(`
        <html>
          <head>
            <title>Gym Receipt ${payment.invoiceId}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
              .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
              .brand { font-size: 24px; font-weight: 700; color: #dc2626; }
              .subtitle { color: #475569; margin-top: 4px; }
              .card { border: 1px solid #e2e8f0; border-radius: 18px; padding: 24px; }
              .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 16px; }
              .label { font-size: 12px; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
              .value { font-size: 15px; font-weight: 600; }
              .summary { margin-top: 24px; padding: 18px; border-radius: 12px; background: #fef2f2; }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <div class="brand">${user.businessName}</div>
                <div class="subtitle">Gym Fee Receipt</div>
              </div>
              <div>
                <div><strong>Receipt:</strong> ${payment.invoiceId}</div>
                <div><strong>Date:</strong> ${payment.paymentDate}</div>
              </div>
            </div>
            <div class="card">
              <div class="grid">
                <div><div class="label">Member Name</div><div class="value">${payment.memberName}</div></div>
                <div><div class="label">Member ID</div><div class="value">${payment.memberId}</div></div>
                <div><div class="label">Plan</div><div class="value">${payment.membershipPlan}</div></div>
                <div><div class="label">Billing Period</div><div class="value">${payment.billingPeriod}</div></div>
                <div><div class="label">Payment Method</div><div class="value">${formatPaymentMethod(payment.paymentMethod)}</div></div>
                <div><div class="label">Collected Amount</div><div class="value">${formatCurrency(payment.amount)}</div></div>
              </div>
              <div class="summary">
                <div><strong>Total Membership Fee:</strong> ${formatCurrency(totalFee)}</div>
                <div><strong>Total Collected:</strong> ${formatCurrency(paidAmount)}</div>
                <div><strong>Outstanding Balance:</strong> ${formatCurrency(outstanding)}</div>
              </div>
            </div>
          </body>
        </html>
      `);
      receiptWindow.document.close();
      receiptWindow.focus();
      receiptWindow.print();
    },
    [members, selectedMember, user.businessName]
  );

  return (
    <div className="max-w-screen-2xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-700 tracking-[0.24em] text-primary uppercase">
            Gym Management
          </p>
          <h1 className="text-2xl font-700 text-foreground mt-1">Members and Fees</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage member onboarding, fee collection, payment history, and printable receipts from
            one workspace.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className="btn-outline px-4 py-2.5 rounded-xl text-sm inline-flex items-center gap-2"
          >
            <ReceiptText size={16} />
            View Payments
          </button>
          <button
            type="button"
            onClick={openCreateMemberForm}
            className="btn-primary px-4 py-2.5 rounded-xl text-sm inline-flex items-center gap-2"
          >
            <UserRoundPlus size={16} />
            Add Member
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="glass-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">
                Total Members
              </p>
              <p className="text-2xl font-700 text-foreground mt-2">
                {dashboardStats.totalMembers}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center text-primary">
              <Users size={20} />
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">
                Active Members
              </p>
              <p className="text-2xl font-700 text-foreground mt-2">
                {dashboardStats.activeMembers}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600">
              <Dumbbell size={20} />
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">
                Collected Fees
              </p>
              <p className="text-2xl font-700 text-foreground mt-2">
                {formatCurrency(dashboardStats.totalCollected)}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <IndianRupee size={20} />
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">
                Outstanding
              </p>
              <p className="text-2xl font-700 text-foreground mt-2">
                {formatCurrency(dashboardStats.outstanding)}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
              <CreditCard size={20} />
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">
                This Month
              </p>
              <p className="text-2xl font-700 text-foreground mt-2">
                {formatCurrency(dashboardStats.thisMonthPayments)}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
              <CalendarClock size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="inline-flex rounded-2xl bg-muted/60 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('members')}
                className={`px-4 py-2 rounded-xl text-sm font-600 transition-colors ${
                  activeTab === 'members'
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-muted-foreground'
                }`}
              >
                Members
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('payments')}
                className={`px-4 py-2 rounded-xl text-sm font-600 transition-colors ${
                  activeTab === 'payments'
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-muted-foreground'
                }`}
              >
                Payments
              </button>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
                className="bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {rowsPerPageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option} rows
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn-outline px-4 py-3 rounded-xl text-sm"
              >
                Reset Filters
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                value={searchInput}
                onChange={handleSearchChange}
                placeholder={
                  activeTab === 'members'
                    ? 'Search by member, phone, plan, trainer, or member ID'
                    : 'Search by receipt, member, billing period, or plan'
                }
                className="w-full bg-input border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {activeTab === 'members' ? (
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as 'all' | GymMemberRecord['status'])
                }
                className="bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="expired">Expired</option>
              </select>
            ) : (
              <select
                value={methodFilter}
                onChange={(event) =>
                  setMethodFilter(event.target.value as 'all' | GymPaymentRecord['paymentMethod'])
                }
                className="bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All methods</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="bank-transfer">Bank Transfer</option>
              </select>
            )}
          </div>
        </div>

        {activeTab === 'members' ? (
          !loading && filteredMembers.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <p className="text-sm font-600 text-foreground">
                No members match the current filters.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Try a different search or add a new member.
              </p>
            </div>
          ) : (
            <MembersTable
              currentPage={currentPage}
              loading={loading}
              members={paginatedMembers}
              onDelete={handleDeleteMember}
              onEdit={openEditMemberForm}
              onOpenPayments={openPaymentModal}
              hasMoreMembers={hasMoreMembers}
              loadMoreMembers={loadMoreMembers}
            />
          )
        ) : !loading && filteredPayments.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-sm font-600 text-foreground">
              No payment receipts match the current filters.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Record a payment for any member to start the history.
            </p>
          </div>
        ) : (
          <PaymentsTable
            currentPage={currentPage}
            loading={loading}
            onPrint={handlePrintReceipt}
            payments={paginatedPayments}
            hasMorePayments={hasMorePayments}
            loadMorePayments={loadMorePayments}
          />
        )}

        {!loading && activeItems.length > 0 && (
          <div className="px-5 py-4 border-t border-border bg-white/80 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * rowsPerPage + 1}-
              {Math.min(currentPage * rowsPerPage, activeItems.length)} of {activeItems.length}{' '}
              {activeTab === 'members' ? 'members' : 'payments'}
            </p>
            <div className="flex items-center gap-2 self-end md:self-auto">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="btn-outline px-3 py-2 rounded-lg text-xs inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} />
                Prev
              </button>
              <span className="text-xs font-600 text-foreground px-3 py-2 rounded-lg bg-muted">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="btn-outline px-3 py-2 rounded-lg text-xs inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="glass-card rounded-2xl border border-border p-5 xl:col-span-2">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <ReceiptText size={20} />
            </div>
            <div>
              <p className="text-sm font-700 text-foreground">Receipt-ready fee collection</p>
              <p className="text-sm text-muted-foreground mt-1">
                Each saved payment creates a searchable fee history entry and a printable receipt
                that members can save as PDF from the browser print dialog.
              </p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl border border-border p-5">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600 flex-shrink-0">
              <ShieldPlus size={20} />
            </div>
            <div>
              <p className="text-sm font-700 text-foreground">History stays consistent</p>
              <p className="text-sm text-muted-foreground mt-1">
                Member balances are updated from recorded payments so receipt totals and outstanding
                amounts stay aligned.
              </p>
            </div>
          </div>
        </div>
      </div>

      {isMemberFormOpen && (
        <MemberFormModal
          editingMemberId={editingMemberId}
          formValues={memberFormValues}
          onChange={handleMemberInputChange}
          onClose={closeMemberForm}
          onSubmit={handleMemberSubmit}
          submitting={submittingMember}
        />
      )}

      {isPaymentModalOpen && (
        <PaymentModal
          formValues={paymentFormValues}
          loadingHistory={paymentHistoryLoading}
          member={selectedMember}
          memberPayments={selectedMemberPayments}
          hasMorePayments={hasMoreMemberPaymentHistory}
          onLoadMorePayments={loadMoreMemberPayments}
          onChange={handlePaymentInputChange}
          onClose={closePaymentModal}
          onPrint={handlePrintReceipt}
          onSubmit={handlePaymentSubmit}
          submitting={submittingPayment}
        />
      )}
    </div>
  );
}
