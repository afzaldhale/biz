'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import {
  Eye,
  EyeOff,
  Shield,
  Copy,
  Check,
  Building2,
  Users,
  TrendingUp,
  Lock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';
import { useAdminAuth } from '@/lib/adminAuth';
import { toast } from 'sonner';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const DEMO_CREDENTIALS = [
  { role: 'Super Admin', email: 'superadmin@bizmanage.in', password: 'Admin@2026' },
  { role: 'Support Admin', email: 'support@bizmanage.in', password: 'Support@2026' },
  { role: 'Sales Admin', email: 'sales@bizmanage.in', password: 'Sales@2026' },
];

const PLATFORM_STATS = [
  { label: 'Businesses Managed', value: '12+', icon: Building2 },
  { label: 'Platform Users', value: '847', icon: Users },
  { label: 'Expected MRR', value: '₹28.9K', icon: TrendingUp },
];

export default function AdminLoginForm() {
  const { signIn, isLoading, error } = useAdminAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const onSubmit = async (data: LoginFormData) => {
    const success = await signIn(data.email, data.password);
    if (success) {
      toast.success('Welcome back! Redirecting to dashboard...');
      router.push('/admin-dashboard');
    }
  };

  const handleUseDemoCredential = (email: string, password: string) => {
    setValue('email', email);
    setValue('password', password);
    toast.info('Demo credentials filled in');
  };

  const handleCopy = async (text: string, fieldId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="min-h-screen flex admin-bg-pattern">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] xl:w-[42%] gradient-primary p-10 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-white/15 blur-3xl" />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <AppLogo size={40} />
          <div>
            <span className="text-white font-800 text-xl">BizManage</span>
            <p className="text-white/70 text-xs font-500">Admin Control Center</p>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 px-3 py-1.5 rounded-full mb-6">
            <Shield size={13} className="text-white" />
            <span className="text-white text-xs font-600">
              Restricted Access — Company Admins Only
            </span>
          </div>

          <h1 className="text-3xl xl:text-4xl font-800 text-white leading-tight mb-4">
            Platform Control
            <br />
            <span className="text-white/80">at Your Fingertips</span>
          </h1>
          <p className="text-white/70 text-base leading-relaxed max-w-sm">
            Monitor businesses, manage subscriptions, resolve support tickets, and track revenue —
            all from one secure admin panel.
          </p>

          {/* Platform stats */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            {PLATFORM_STATS.map((stat) => (
              <div
                key={`stat-${stat.label}`}
                className="bg-white/12 border border-white/20 rounded-2xl p-4"
              >
                <stat.icon size={18} className="text-white/80 mb-2" />
                <p className="text-white font-800 text-lg text-tabular">{stat.value}</p>
                <p className="text-white/60 text-[11px] font-500 leading-tight mt-0.5">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Security badges */}
        <div className="relative z-10 flex items-center gap-3">
          {[
            { id: 'badge-auth', label: 'Firebase Auth' },
            { id: 'badge-role', label: 'Role-Based Access' },
            { id: 'badge-enc', label: 'Encrypted' },
          ].map((badge) => (
            <div
              key={badge.id}
              className="flex items-center gap-1.5 bg-white/12 border border-white/20 px-3 py-1.5 rounded-full"
            >
              <CheckCircle2 size={11} className="text-white/80" />
              <span className="text-white/80 text-[11px] font-600">{badge.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <AppLogo size={36} />
            <div>
              <span className="font-800 text-lg gradient-text">BizManage</span>
              <p className="text-muted-foreground text-xs">Admin Portal</p>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/20 px-3 py-1.5 rounded-full mb-4">
              <Lock size={12} className="text-primary" />
              <span className="text-primary text-xs font-700">Admin Access Required</span>
            </div>
            <h2 className="text-2xl font-800 text-foreground mb-2">Sign in to Admin Panel</h2>
            <p className="text-sm text-muted-foreground">
              This portal is restricted to BizManage company administrators.
            </p>
          </div>

          {/* Error state */}
          {error && (
            <div className="mb-5 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-600 text-foreground mb-1.5" htmlFor="email">
                Admin Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="your.email@bizmanage.in"
                {...register('email', {
                  required: 'Email address is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Enter a valid email address',
                  },
                })}
                className={`w-full px-4 py-3 text-sm bg-muted/40 border rounded-xl
                           focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50
                           placeholder:text-muted-foreground transition-all
                           ${errors.email ? 'border-red-400 bg-red-50/30' : 'border-border'}`}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-500 font-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-600 text-foreground mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your admin password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' },
                  })}
                  className={`w-full px-4 py-3 pr-11 text-sm bg-muted/40 border rounded-xl
                             focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50
                             placeholder:text-muted-foreground transition-all
                             ${errors.password ? 'border-red-400 bg-red-50/30' : 'border-border'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-muted transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff size={16} className="text-muted-foreground" />
                  ) : (
                    <Eye size={16} className="text-muted-foreground" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-500 font-500">{errors.password.message}</p>
              )}
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2.5">
              <input
                id="rememberMe"
                type="checkbox"
                {...register('rememberMe')}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30 cursor-pointer"
              />
              <label
                htmlFor="rememberMe"
                className="text-sm text-muted-foreground cursor-pointer select-none"
              >
                Keep me signed in for 7 days
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 rounded-xl text-sm font-700 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <Shield size={15} />
                  <span>Sign In to Admin Panel</span>
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-7 p-4 bg-muted/60 border border-border rounded-2xl">
            <p className="text-xs font-700 text-muted-foreground uppercase tracking-wide mb-3">
              Demo Admin Accounts
            </p>
            <div className="space-y-2">
              {DEMO_CREDENTIALS.map((cred, idx) => (
                <div
                  key={`cred-${idx}`}
                  className="flex items-center justify-between gap-3 p-3 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-700 text-primary mb-0.5">{cred.role}</p>
                    <p className="text-xs text-foreground truncate">{cred.email}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopy(cred.email, `email-${idx}`)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                      aria-label={`Copy ${cred.role} email`}
                      title="Copy email"
                    >
                      {copiedField === `email-${idx}` ? (
                        <Check size={12} className="text-emerald-500" />
                      ) : (
                        <Copy size={12} className="text-muted-foreground" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUseDemoCredential(cred.email, cred.password)}
                      className="px-2.5 py-1 text-[11px] font-700 text-primary bg-primary/8 border border-primary/20 rounded-lg hover:bg-primary/15 transition-colors"
                    >
                      Use
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-3 text-center">
              All passwords follow format: Role@2026
            </p>
          </div>

          {/* Access denied note */}
          <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700 leading-relaxed">
              Normal business users cannot access this panel. If you are a business customer, visit
              your business dashboard instead.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
