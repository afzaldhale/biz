'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  Check,
  Coffee,
  Dumbbell,
  Home,
  Minus,
  Scissors,
  ShieldCheck,
  Stethoscope,
  BookOpen,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';
import AppLogo from '@/components/ui/AppLogo';
import { BusinessType } from '@/types';
import {
  MAX_UI_INPUT,
  MIN_RECORDS,
  calculateMonthlyPrice,
  formatINR,
  getBillableRecords,
  getRecordLabel,
  parseRecordCount,
} from '@/utils/pricing';
import { useAuth } from '@/context/AuthContext';
import { useBusiness } from '@/context/BusinessContext';
import { setupBusinessForUser } from '@/services/businessService';

const RECORD_STEP = 10;

const businessTypeCards: Array<{
  id: BusinessType;
  title: string;
  label: string;
  icon: React.ElementType;
}> = [
  {
    id: 'academy',
    title: 'Academy / Coaching Institute',
    label: 'Student operations',
    icon: BookOpen,
  },
  { id: 'hotel', title: 'Hotel / Lodging', label: 'Guest stays and bookings', icon: Home },
  { id: 'restaurant', title: 'Restaurant', label: 'Orders and customer flow', icon: Coffee },
  { id: 'clinic', title: 'Clinic', label: 'Patients and consultations', icon: Stethoscope },
  { id: 'gym', title: 'Gym / Fitness', label: 'Members and renewals', icon: Dumbbell },
  { id: 'salon', title: 'Salon', label: 'Clients and appointments', icon: Scissors },
  {
    id: 'service-center',
    title: 'Service Center',
    label: 'Tickets and service jobs',
    icon: Wrench,
  },
  { id: 'custom', title: 'Custom Business', label: 'Flexible setup for any team', icon: Briefcase },
];

const progressSteps = [
  { id: '01', title: 'Business Type' },
  { id: '02', title: 'Records' },
  { id: '03', title: 'Dashboard' },
];

const trustBadges = [
  { icon: ShieldCheck, label: 'Secure workspace' },
  { icon: Building2, label: 'Industry-specific dashboard' },
  { icon: BadgeCheck, label: 'Usage-based billing' },
];

interface BusinessSetupValues {
  businessType: BusinessType;
  businessName: string;
  records: number;
}

function normalizeRecordValue(value: string | number): number {
  const parsed = parseRecordCount(value);
  if (parsed < MIN_RECORDS) {
    return MIN_RECORDS;
  }
  return Math.min(parsed, MAX_UI_INPUT);
}

export default function BusinessSetupPage() {
  const router = useRouter();
  const { user, authLoading } = useAuth();
  const { business, userProfile, businessLoading, refreshBusiness } = useBusiness();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recordInput, setRecordInput] = useState(String(MIN_RECORDS));

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BusinessSetupValues>({
    defaultValues: {
      businessType: 'academy',
      businessName: '',
      records: MIN_RECORDS,
    },
  });

  const recordsRegistration = register('records', {
    min: { value: MIN_RECORDS, message: `Minimum ${MIN_RECORDS} records required` },
    max: { value: MAX_UI_INPUT, message: `Maximum ${MAX_UI_INPUT} records allowed` },
    valueAsNumber: true,
  });

  const businessName = watch('businessName') ?? '';
  const selectedBusinessType = watch('businessType') ?? 'academy';
  const records = watch('records') ?? MIN_RECORDS;
  const billableRecords = useMemo(() => getBillableRecords(records), [records]);
  const monthlyPrice = useMemo(() => calculateMonthlyPrice(records), [records]);
  const recordLabel = useMemo(() => getRecordLabel(selectedBusinessType), [selectedBusinessType]);

  useEffect(() => {
    if (authLoading || businessLoading) {
      return;
    }

    if (!user) {
      router.replace('/sign-up-login-screen');
      return;
    }

    if (!user.emailVerified) {
      router.replace('/verify-email');
      return;
    }

    if (userProfile?.onboardingCompleted && business?.status === 'active') {
      router.replace('/dashboard');
    }
  }, [authLoading, businessLoading, user, userProfile, business, router]);

  useEffect(() => {
    setRecordInput(String(records));
  }, [records]);

  const handleTypeSelect = (type: BusinessType) => {
    setValue('businessType', type, { shouldValidate: true, shouldDirty: true });
  };

  const updateRecordCount = (nextValue: number) => {
    const normalized = normalizeRecordValue(nextValue);
    setValue('records', normalized, { shouldValidate: true, shouldDirty: true });
    setRecordInput(String(normalized));
  };

  const handleRecordInputChange = (rawValue: string) => {
    setRecordInput(rawValue);

    if (rawValue.trim() === '') {
      return;
    }

    const normalized = normalizeRecordValue(rawValue);
    setValue('records', normalized, { shouldValidate: true, shouldDirty: true });
  };

  const handleRecordInputBlur = () => {
    if (recordInput.trim() === '') {
      updateRecordCount(MIN_RECORDS);
      return;
    }

    updateRecordCount(normalizeRecordValue(recordInput));
  };

  const onSubmit = async (data: BusinessSetupValues) => {
    if (!user) {
      router.replace('/sign-up-login-screen');
      return;
    }

    setIsSubmitting(true);

    try {
      await setupBusinessForUser({
        uid: user.uid,
        businessName: data.businessName.trim(),
        businessType: data.businessType,
        recordsLimit: normalizeRecordValue(data.records),
        estimatedRecords: normalizeRecordValue(data.records),
      });

      await refreshBusiness();
      toast.success('Business workspace configured successfully. Redirecting to dashboard...');
      router.replace('/dashboard');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to save your business setup right now.';
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f7f9ff_0%,#eef2ff_48%,#f8fbff_100%)] text-foreground">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-12 h-56 w-56 rounded-full bg-sky-300/25 blur-3xl animate-pulse" />
        <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-indigo-300/25 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-violet-300/20 blur-3xl animate-pulse" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid w-full items-start gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-8">
          <section className="glass-card relative overflow-hidden rounded-[2rem] p-5 shadow-[0_24px_80px_rgba(79,70,229,0.12)] sm:p-7 lg:p-8">
            <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(135deg,rgba(99,102,241,0.16),rgba(56,189,248,0.08))]" />
            <div className="relative space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-3 rounded-full border border-indigo-200/70 bg-white/80 px-3 py-2 shadow-sm backdrop-blur">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#4f46e5,#7c3aed)] text-white shadow-lg shadow-indigo-500/20">
                    <AppLogo
                      src="/assets/images/app_logo.png"
                      size={22}
                      className="justify-center"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
                      BizManage
                    </p>
                    <p className="text-xs text-muted-foreground">Complete your setup</p>
                  </div>
                </div>
                <span className="rounded-full border border-indigo-200/70 bg-white/70 px-3 py-1 text-xs font-semibold text-primary shadow-sm">
                  Setup Guide
                </span>
              </div>

              <div className="space-y-3">
                <h1 className="max-w-xl text-3xl font-bold tracking-tight text-slate-950 sm:text-[2.2rem]">
                  Set up your business workspace
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                  Choose your industry, define your business details, and we&apos;ll configure your
                  dashboard automatically.
                </p>
              </div>

              <div className="grid gap-3 rounded-[1.75rem] border border-white/60 bg-white/55 p-4 backdrop-blur sm:grid-cols-3">
                {progressSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className="rounded-2xl border border-indigo-100/80 bg-white/80 p-3 shadow-sm"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[linear-gradient(135deg,#4f46e5,#7c3aed)] text-xs font-semibold text-white">
                        {index + 1}
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/70">
                        {step.id}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {businessTypeCards.map((option) => {
                  const Icon = option.icon;
                  const selected = selectedBusinessType === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleTypeSelect(option.id)}
                      className={`group relative flex min-h-[96px] items-start gap-4 overflow-hidden rounded-[1.5rem] border p-4 text-left transition duration-200 ${
                        selected
                          ? 'border-transparent bg-[linear-gradient(135deg,rgba(79,70,229,0.16),rgba(168,85,247,0.14),rgba(56,189,248,0.10))] shadow-[0_14px_34px_rgba(79,70,229,0.14)] ring-1 ring-indigo-200/80'
                          : 'border-slate-200/90 bg-white/75 shadow-sm hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-white hover:shadow-[0_16px_32px_rgba(99,102,241,0.10)]'
                      }`}
                    >
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition ${
                          selected
                            ? 'bg-[linear-gradient(135deg,#4f46e5,#7c3aed)] text-white shadow-lg shadow-indigo-500/20'
                            : 'bg-slate-50 text-primary group-hover:bg-indigo-50'
                        }`}
                      >
                        <Icon size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-950">{option.title}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{option.label}</p>
                      </div>
                      {selected ? (
                        <div className="ml-auto flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-primary shadow-sm">
                          <Check size={14} />
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-2">
                {trustBadges.map((badge) => {
                  const Icon = badge.icon;
                  return (
                    <div
                      key={badge.label}
                      className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-2 text-xs font-medium text-slate-600 shadow-sm backdrop-blur"
                    >
                      <Icon size={14} className="text-primary" />
                      {badge.label}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="glass-card rounded-[2rem] p-5 shadow-[0_24px_80px_rgba(79,70,229,0.12)] sm:p-7 lg:p-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <span className="inline-flex items-center rounded-full border border-indigo-200/70 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">
                  Quick Business Setup
                </span>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[2rem]">
                    Finish onboarding and open your dashboard
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    We&apos;ll use your selected industry to tailor modules, records, and the
                    initial workspace experience.
                  </p>
                </div>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                <input type="hidden" {...register('businessType')} />
                <input type="hidden" {...recordsRegistration} />

                <div className="rounded-[1.75rem] border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur sm:p-5">
                  <label className="mb-2 block text-sm font-semibold text-slate-900">
                    Business Name
                  </label>
                  <input
                    type="text"
                    placeholder="Stars Institute / Grand Palace Hotel"
                    className={`w-full rounded-2xl border bg-white/90 px-4 py-3 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 ${
                      errors.businessName ? 'border-danger/60' : 'border-slate-200'
                    }`}
                    {...register('businessName', {
                      required: 'Business name is required',
                      minLength: { value: 3, message: 'Enter a valid business name' },
                    })}
                  />
                  {errors.businessName ? (
                    <p className="mt-2 text-xs text-danger">{errors.businessName.message}</p>
                  ) : null}
                </div>

                <div className="rounded-[1.75rem] border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900">
                        Records required
                      </label>
                      <p className="mt-1 text-xs text-slate-500">
                        Minimum billing starts at {MIN_RECORDS} records.
                      </p>
                    </div>
                    <span className="rounded-full border border-indigo-200/70 bg-indigo-50 px-3 py-1 text-xs font-semibold text-primary">
                      {recordLabel}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => updateRecordCount(billableRecords - RECORD_STEP)}
                      className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={billableRecords <= MIN_RECORDS}
                      aria-label="Decrease records"
                    >
                      <Minus size={18} />
                    </button>
                    <div className="relative flex-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={recordInput}
                        onChange={(event) => handleRecordInputChange(event.target.value)}
                        onBlur={handleRecordInputBlur}
                        className={`w-full rounded-2xl border bg-white/95 px-4 py-3 text-center text-base font-semibold text-slate-950 transition focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 ${
                          errors.records ? 'border-danger/60' : 'border-slate-200'
                        }`}
                        aria-label="Records required"
                      />
                      <p className="mt-2 text-center text-xs text-slate-500">
                        Enter a value between {MIN_RECORDS} and{' '}
                        {MAX_UI_INPUT.toLocaleString('en-IN')}.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateRecordCount(billableRecords + RECORD_STEP)}
                      className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
                      aria-label="Increase records"
                    >
                      +
                    </button>
                  </div>

                  {billableRecords === MIN_RECORDS && records < MIN_RECORDS ? (
                    <p className="mt-3 text-xs text-amber-600">
                      Minimum billing is applied at {MIN_RECORDS} records.
                    </p>
                  ) : null}

                  {errors.records ? (
                    <p className="mt-2 text-xs text-danger">{errors.records.message}</p>
                  ) : null}
                </div>

                <div className="rounded-[1.75rem] border border-indigo-100/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(238,242,255,0.88))] p-4 shadow-sm sm:p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Pricing Summary</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Billing is calculated from your selected record volume.
                      </p>
                    </div>
                    <div className="rounded-full border border-indigo-200/80 bg-white/90 px-3 py-1 text-xs font-semibold text-primary">
                      Usage based
                    </div>
                  </div>

                  <div className="space-y-3 text-sm text-slate-700">
                    <div className="flex items-center justify-between gap-4">
                      <span>Records selected</span>
                      <span className="font-semibold text-slate-950">
                        {records.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Billable records</span>
                      <span className="font-semibold text-slate-950">
                        {billableRecords.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Minimum billing</span>
                      <span className="font-semibold text-slate-950">
                        {MIN_RECORDS.toLocaleString('en-IN')} records
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-t border-indigo-100 pt-4">
                      <span className="text-sm font-semibold text-slate-900">
                        Estimated monthly price
                      </span>
                      <span className="text-xl font-bold tracking-tight text-slate-950">
                        {formatINR(monthlyPrice)}
                      </span>
                    </div>
                  </div>

                  {records < MIN_RECORDS ? (
                    <p className="mt-4 text-xs text-amber-600">
                      Minimum billing is applied at {MIN_RECORDS} records.
                    </p>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || businessName.trim().length === 0}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#4f46e5_0%,#7c3aed_55%,#3b82f6_100%)] px-6 py-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(79,70,229,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_44px_rgba(79,70,229,0.34)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Setting up workspace...' : 'Complete Setup & Open Dashboard'}
                  <ArrowRight size={18} />
                </button>

                <p className="text-center text-xs text-slate-500">
                  You can update these details later from Settings.
                </p>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
