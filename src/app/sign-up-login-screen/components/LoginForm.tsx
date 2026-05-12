'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { BusinessType, PlanId } from '@/types';
import { saveBusinessProfile } from '@/services/businessService';
import { setCurrentSession } from '@/services/authService';

interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

// Demo credentials for mock login
const DEMO_ACCOUNTS = [
  { role: 'Academy Owner', email: 'priya@starsinstitute.in', password: 'Stars@2024', businessType: 'academy', plan: 'advance' },
  { role: 'Hotel Manager', email: 'rajesh@grandpalace.in', password: 'Palace@2024', businessType: 'hotel', plan: 'premium' },
  { role: 'Restaurant Owner', email: 'anita@spicegarden.in', password: 'Spice@2024', businessType: 'restaurant', plan: 'medium' },
  { role: 'Clinic Admin', email: 'dr.sharma@healthfirst.in', password: 'Health@2024', businessType: 'clinic', plan: 'advance' },
] satisfies { role: string; email: string; password: string; businessType: BusinessType; plan: PlanId }[];

interface LoginFormProps {
  onSwitchToSignup: () => void;
}

export default function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginFormValues>({
    defaultValues: { rememberMe: false },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setAuthError('');

    // Mock authentication — replace with real API call
    await new Promise((r) => setTimeout(r, 1000));

    const matched = DEMO_ACCOUNTS.find(
      (acc) => acc.email.toLowerCase() === data.email.toLowerCase() && acc.password === data.password
    );

    if (matched) {
      const now = new Date().toISOString();
      const userId = `user-${matched.businessType}`;

      setCurrentSession({
        id: userId,
        ownerName: matched.role,
        businessName: 'Demo Business',
        email: matched.email,
        phone: '+91 98765 43210',
        plan: matched.plan,
        businessType: matched.businessType,
        recordsUsed: 42,
        createdAt: now,
      });
      await saveBusinessProfile({
        businessId: userId,
        ownerId: userId,
        ownerName: matched.role,
        businessName: 'Demo Business',
        businessType: matched.businessType,
        selectedPlan: matched.plan,
        planLimit: matched.plan === 'medium' ? 150 : 500,
        currentUsage: 42,
        email: matched.email,
        phone: '+91 98765 43210',
        createdAt: now,
        updatedAt: now,
      });

      toast.success('Welcome back! Redirecting to your dashboard...');
      router.push('/dashboard-page');
    } else {
      setAuthError('Invalid credentials — use the demo accounts below to sign in');
      setIsLoading(false);
    }
  };

  const fillCredentials = (email: string, password: string) => {
    setValue('email', email);
    setValue('password', password);
    setAuthError('');
  };

  return (
    <div className="animate-slide-up">
      <div className="mb-8">
        <h1 className="text-2xl font-700 text-foreground mb-1">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to your BizManage account</p>
      </div>

      {authError && (
        <div className="flex items-start gap-3 badge-danger px-4 py-3 rounded-xl mb-6 text-sm">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{authError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email */}
        <div>
          <label className="block text-sm font-600 text-foreground mb-1.5">Email Address</label>
          <input
            type="email"
            placeholder="you@yourbusiness.in"
            className={`w-full bg-input border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring transition-all ${
              errors.email ? 'border-danger/60 focus:ring-danger/30' : 'border-border focus:border-primary/60'
            }`}
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
            })}
          />
          {errors.email && <p className="text-xs text-danger mt-1.5">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-600 text-foreground mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Your password"
              className={`w-full bg-input border rounded-xl px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring transition-all ${
                errors.password ? 'border-danger/60 focus:ring-danger/30' : 'border-border focus:border-primary/60'
              }`}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Minimum 6 characters' },
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-danger mt-1.5">{errors.password.message}</p>}
        </div>

        {/* Remember me + Forgot */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-border bg-input accent-primary"
              {...register('rememberMe')}
            />
            <span className="text-sm text-muted-foreground">Remember me</span>
          </label>
          <button type="button" className="text-sm text-primary hover:text-accent font-600 transition-colors">
            Forgot password?
          </button>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full py-3.5 rounded-xl text-sm font-600 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign In to Dashboard'
          )}
        </button>
      </form>

      {/* Demo accounts */}
      <div className="mt-6 glass-card rounded-xl border border-border/60 overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/20 border-b border-border/40">
          <p className="text-xs font-600 text-muted-foreground uppercase tracking-wider">Demo Accounts — Click to autofill</p>
        </div>
        <div className="divide-y divide-border/30">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={`demo-${acc.email}`}
              type="button"
              onClick={() => fillCredentials(acc.email, acc.password)}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/20 transition-colors text-left"
            >
              <div>
                <div className="text-xs font-600 text-foreground">{acc.role}</div>
                <div className="text-2xs text-muted-foreground font-mono">{acc.email}</div>
              </div>
              <span className="text-2xs badge-info px-2 py-0.5 rounded-full capitalize">{acc.businessType}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground text-center mt-6">
        Don't have an account?{' '}
        <button onClick={onSwitchToSignup} className="text-primary hover:text-accent font-600 transition-colors">
          Sign up free
        </button>
      </p>
    </div>
  );
}
