'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Briefcase,
  Coffee,
  Dumbbell,
  Home,
  LifeBuoy,
  Scissors,
  Sparkles,
  Stethoscope,
  BookOpen,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';
import { BusinessType } from '@/types';
import {
  MIN_RECORDS,
  calculateMonthlyPrice,
  calculateYearlyPrice,
  formatINR,
} from '@/utils/pricing';
import { useAuth } from '@/context/AuthContext';
import { useBusiness } from '@/context/BusinessContext';
import { setupBusinessForUser } from '@/services/businessService';

const businessTypeCards: Array<{ id: BusinessType; label: string; icon: React.ElementType }> = [
  { id: 'academy', label: 'Academy / Coaching Institute', icon: BookOpen },
  { id: 'hotel', label: 'Hotel / Lodging', icon: Home },
  { id: 'restaurant', label: 'Restaurant', icon: Coffee },
  { id: 'clinic', label: 'Clinic', icon: Stethoscope },
  { id: 'service-center', label: 'Service Center', icon: Wrench },
  { id: 'gym', label: 'Gym', icon: Dumbbell },
  { id: 'salon', label: 'Salon', icon: Scissors },
  { id: 'custom', label: 'Custom Business', icon: Briefcase },
];

interface BusinessSetupValues {
  businessType: BusinessType;
  businessName: string;
  records: number;
}

export default function BusinessSetupPage() {
  const router = useRouter();
  const { user, authLoading } = useAuth();
  const { business, userProfile, businessLoading, refreshBusiness } = useBusiness();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const records = watch('records') ?? MIN_RECORDS;
  const selectedBusinessType = watch('businessType') ?? 'academy';
  const billableRecords = Math.max(records, MIN_RECORDS);
  const monthlyPrice = useMemo(() => calculateMonthlyPrice(records), [records]);
  const annualPrice = useMemo(() => calculateYearlyPrice(records), [records]);

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
      return;
    }
  }, [authLoading, businessLoading, user, userProfile, business, router]);

  const handleTypeSelect = (type: BusinessType) => {
    setValue('businessType', type, { shouldValidate: true, shouldDirty: true });
  };

  const handleRecordsChange = (value: number) => {
    setValue('records', Math.max(MIN_RECORDS, value), { shouldValidate: true, shouldDirty: true });
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
        recordsLimit: Math.max(data.records, MIN_RECORDS),
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
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-screen-2xl flex-col gap-8 px-6 py-12 lg:flex-row lg:items-center lg:gap-10 lg:px-10">
        <section className="flex-1 rounded-[2rem] border border-border/70 bg-white/90 p-8 shadow-card backdrop-blur-sm lg:max-w-xl">
          <div className="inline-flex items-center gap-3 rounded-full bg-primary/5 px-4 py-2 text-sm font-semibold text-primary">
            <Sparkles size={16} />
            Complete your setup
          </div>
          <div className="mt-8 space-y-6">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-primary/80">
                Configure your business workspace
              </p>
              <h1 className="mt-4 text-4xl font-extrabold text-foreground">
                Set up your business details
              </h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Choose your industry, name your business, and define the records volume you need
              today. Your dashboard and billing will be configured from this onboarding step.
            </p>
          </div>

          <div className="mt-10 grid gap-4">
            {businessTypeCards.map((option) => {
              const Icon = option.icon;
              const selected = selectedBusinessType === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleTypeSelect(option.id)}
                  className={`group flex items-center gap-4 rounded-3xl border px-5 py-4 text-left transition ${
                    selected
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border bg-slate-50 hover:border-primary/70 hover:bg-white'
                  }`}
                >
                  <div
                    className={`grid h-12 w-12 place-items-center rounded-2xl ${selected ? 'bg-primary text-white' : 'bg-white text-primary shadow-sm'}`}
                  >
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{option.label}</p>
                    <p className="text-sm text-muted-foreground">{option.label}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="w-full max-w-2xl rounded-[2rem] border border-border/70 bg-white p-8 shadow-card">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.35em] text-primary/80">
              Business onboarding
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-foreground">Quick business setup</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Finish your onboarding now and unlock the BizManage dashboard.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Business Name
              </label>
              <input
                type="text"
                placeholder="Stars Institute / Grand Palace Hotel"
                className={`w-full rounded-3xl border px-4 py-3 text-sm text-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 ${
                  errors.businessName ? 'border-danger/60' : 'border-border'
                }`}
                {...register('businessName', {
                  required: 'Business name is required',
                  minLength: { value: 3, message: 'Enter a valid business name' },
                })}
              />
              {errors.businessName && (
                <p className="mt-2 text-xs text-danger">{errors.businessName.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <div>
                  <label className="block text-sm font-semibold text-foreground">
                    Records required
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Set the number of records your business will manage.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-foreground">
                  Minimum {MIN_RECORDS}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRecordsChange(billableRecords - 10)}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-3xl border border-border bg-slate-50 text-foreground transition hover:border-primary"
                >
                  -
                </button>
                <input
                  type="number"
                  min={MIN_RECORDS}
                  value={billableRecords}
                  onChange={(event) => handleRecordsChange(Number(event.target.value))}
                  className="w-full rounded-3xl border border-border bg-slate-50 px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
                <button
                  type="button"
                  onClick={() => handleRecordsChange(billableRecords + 10)}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-3xl border border-border bg-slate-50 text-foreground transition hover:border-primary"
                >
                  +
                </button>
              </div>
              {errors.records && (
                <p className="mt-2 text-xs text-danger">{errors.records.message}</p>
              )}
            </div>

            <div className="rounded-[1.75rem] border border-border/70 bg-slate-50 p-6">
              <div className="mb-4 text-sm font-semibold text-muted-foreground">
                Pricing summary
              </div>
              <div className="space-y-3 text-sm text-foreground">
                <div className="flex items-center justify-between">
                  <span>Records selected</span>
                  <span>{billableRecords.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Price per record</span>
                  <span>₹9 / month</span>
                </div>
                <div className="flex items-center justify-between border-t border-border/70 pt-4 font-semibold">
                  <span>Monthly price</span>
                  <span>{formatINR(monthlyPrice)}</span>
                </div>
                <div className="flex items-center justify-between font-semibold">
                  <span>Annual price</span>
                  <span>{formatINR(annualPrice)}</span>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Minimum billing starts from {MIN_RECORDS} records. Annual pricing is 12× monthly.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-primary px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Saving setup...' : 'Continue to dashboard'}
              <ArrowRight size={18} />
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
