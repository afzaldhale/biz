'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { BusinessType, PlanId } from '@/types';
import { saveBusinessProfile } from '@/services/businessService';
import { setCurrentSession } from '@/services/authService';

interface SignupFormValues {
  ownerName: string;
  businessName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  plan: PlanId;
  businessType: BusinessType;
}

const planOptions: { id: PlanId; label: string; price: string }[] = [
  { id: 'basic', label: 'Basic', price: '₹499/mo' },
  { id: 'medium', label: 'Medium', price: '₹999/mo' },
  { id: 'advance', label: 'Advance (Popular)', price: '₹1,499/mo' },
  { id: 'premium', label: 'Premium', price: '₹1,999/mo' },
  { id: 'pro', label: 'Pro', price: '₹2,999/mo' },
  { id: 'custom', label: 'Custom Enterprise', price: 'Custom pricing' },
];

const businessTypeOptions: { id: BusinessType; label: string }[] = [
  { id: 'academy', label: 'Academy / Coaching Institute' },
  { id: 'hotel', label: 'Hotel / Lodging' },
  { id: 'restaurant', label: 'Restaurant' },
  { id: 'clinic', label: 'Clinic / Healthcare' },
  { id: 'service-center', label: 'Service Center' },
  { id: 'gym', label: 'Gym / Fitness Center' },
  { id: 'salon', label: 'Salon / Spa' },
  { id: 'custom', label: 'Custom Business' },
];

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

export default function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<SignupFormValues>({
    defaultValues: { plan: 'advance', businessType: 'academy' },
  });

  const password = watch('password');

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);

    // Mock signup — replace with backend API call
    await new Promise((r) => setTimeout(r, 1200));

    const now = new Date().toISOString();
    const user = {
      id: `user-${Date.now()}`,
      ownerName: data.ownerName,
      businessName: data.businessName,
      email: data.email,
      phone: data.phone,
      plan: data.plan,
      businessType: data.businessType,
      recordsUsed: 0,
      createdAt: now,
    };

    setCurrentSession(user);
    await saveBusinessProfile({
      businessId: user.id,
      ownerId: user.id,
      ownerName: data.ownerName,
      businessName: data.businessName,
      businessType: data.businessType,
      selectedPlan: data.plan,
      planLimit: data.plan === 'basic' ? 50 : data.plan === 'medium' ? 150 : 500,
      currentUsage: 0,
      email: data.email,
      phone: data.phone,
      createdAt: now,
      updatedAt: now,
    });
    toast.success(`Welcome to BizManage, ${data.ownerName}! Your dashboard is ready.`);
    router.push('/dashboard-page');
  };

  return (
    <div className="animate-slide-up">
      <div className="mb-6">
        <h1 className="text-2xl font-700 text-foreground mb-1">Create your account</h1>
        <p className="text-sm text-muted-foreground">14-day free trial · No credit card required</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Owner Name */}
        <div>
          <label className="block text-sm font-600 text-foreground mb-1.5">Owner / Manager Name</label>
          <input
            type="text"
            placeholder="Rajesh Kumar"
            className={`w-full bg-input border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring transition-all ${errors.ownerName ? 'border-danger/60' : 'border-border focus:border-primary/60'}`}
            {...register('ownerName', { required: 'Owner name is required', minLength: { value: 2, message: 'Minimum 2 characters' } })}
          />
          {errors.ownerName && <p className="text-xs text-danger mt-1">{errors.ownerName.message}</p>}
        </div>

        {/* Business Name */}
        <div>
          <label className="block text-sm font-600 text-foreground mb-1.5">Business Name</label>
          <input
            type="text"
            placeholder="Stars Institute / Grand Palace Hotel"
            className={`w-full bg-input border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring transition-all ${errors.businessName ? 'border-danger/60' : 'border-border focus:border-primary/60'}`}
            {...register('businessName', { required: 'Business name is required' })}
          />
          {errors.businessName && <p className="text-xs text-danger mt-1">{errors.businessName.message}</p>}
        </div>

        {/* Email + Phone row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-600 text-foreground mb-1.5">Email</label>
            <input
              type="email"
              placeholder="you@business.in"
              className={`w-full bg-input border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring transition-all ${errors.email ? 'border-danger/60' : 'border-border focus:border-primary/60'}`}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
              })}
            />
            {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-600 text-foreground mb-1.5">Phone</label>
            <input
              type="tel"
              placeholder="+91 98765 43210"
              className={`w-full bg-input border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring transition-all ${errors.phone ? 'border-danger/60' : 'border-border focus:border-primary/60'}`}
              {...register('phone', {
                required: 'Phone is required',
                pattern: { value: /^[+\d\s-]{10,14}$/, message: 'Invalid phone number' },
              })}
            />
            {errors.phone && <p className="text-xs text-danger mt-1">{errors.phone.message}</p>}
          </div>
        </div>

        {/* Password + Confirm row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-600 text-foreground mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                className={`w-full bg-input border rounded-xl px-4 py-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring transition-all ${errors.password ? 'border-danger/60' : 'border-border focus:border-primary/60'}`}
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Min. 8 characters' },
                  pattern: { value: /^(?=.*[A-Z])(?=.*\d)/, message: 'Include uppercase and number' },
                })}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Toggle password visibility">
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-danger mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-600 text-foreground mb-1.5">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repeat password"
                className={`w-full bg-input border rounded-xl px-4 py-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring transition-all ${errors.confirmPassword ? 'border-danger/60' : 'border-border focus:border-primary/60'}`}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (val) => val === password || 'Passwords do not match',
                })}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Toggle confirm password visibility">
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-danger mt-1">{errors.confirmPassword.message}</p>}
          </div>
        </div>

        {/* Select Plan */}
        <div>
          <label className="block text-sm font-600 text-foreground mb-1.5">Select Plan</label>
          <p className="text-xs text-muted-foreground mb-2">All plans include a 14-day free trial</p>
          <div className="relative">
            <select
              className={`w-full bg-input border rounded-xl px-4 py-3 text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring transition-all ${errors.plan ? 'border-danger/60' : 'border-border focus:border-primary/60'}`}
              {...register('plan', { required: 'Please select a plan' })}
            >
              {planOptions.map((plan) => (
                <option key={`signup-plan-${plan.id}`} value={plan.id}>
                  {plan.label} — {plan.price}
                </option>
              ))}
            </select>
            <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
          {errors.plan && <p className="text-xs text-danger mt-1">{errors.plan.message}</p>}
        </div>

        {/* Select Business Type */}
        <div>
          <label className="block text-sm font-600 text-foreground mb-1.5">Business Type</label>
          <p className="text-xs text-muted-foreground mb-2">Your dashboard will be configured for this industry</p>
          <div className="relative">
            <select
              className={`w-full bg-input border rounded-xl px-4 py-3 text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring transition-all ${errors.businessType ? 'border-danger/60' : 'border-border focus:border-primary/60'}`}
              {...register('businessType', { required: 'Please select your business type' })}
            >
              {businessTypeOptions.map((biz) => (
                <option key={`signup-biz-${biz.id}`} value={biz.id}>
                  {biz.label}
                </option>
              ))}
            </select>
            <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
          {errors.businessType && <p className="text-xs text-danger mt-1">{errors.businessType.message}</p>}
        </div>

        {/* Terms */}
        <p className="text-xs text-muted-foreground">
          By signing up, you agree to our{' '}
          <a href="#" className="text-primary hover:text-accent transition-colors">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-primary hover:text-accent transition-colors">Privacy Policy</a>.
        </p>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full py-3.5 rounded-xl text-sm font-600 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Creating your account...
            </>
          ) : (
            'Create Account & Go to Dashboard'
          )}
        </button>
      </form>

      <p className="text-sm text-muted-foreground text-center mt-5">
        Already have an account?{' '}
        <button onClick={onSwitchToLogin} className="text-primary hover:text-accent font-600 transition-colors">
          Log in
        </button>
      </p>
    </div>
  );
}
