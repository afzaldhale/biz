'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useBusiness } from '@/context/BusinessContext';

interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface LoginFormProps {
  onSwitchToSignup: () => void;
}

export default function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const router = useRouter();
  const { login, refreshAuthState } = useAuth();
  const { refreshBusiness } = useBusiness();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: { rememberMe: false },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setAuthError('');

    try {
      const credential = await login(data.email, data.password);
      await credential.user.reload();
      await credential.user.getIdToken(true);
      const refreshedUser = await refreshAuthState();

      if (!refreshedUser?.emailVerified) {
        toast.info('Please verify your email before accessing the dashboard.');
        router.replace('/verify-email');
        return;
      }

      await refreshBusiness(refreshedUser);
      toast.success('Welcome back! Redirecting to your dashboard...');
      router.replace('/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in right now';
      setAuthError(message);
    } finally {
      setIsLoading(false);
    }
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
        <div>
          <label className="block text-sm font-600 text-foreground mb-1.5">Email Address</label>
          <input
            type="email"
            placeholder="you@yourbusiness.in"
            className={`w-full bg-input border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring transition-all ${
              errors.email
                ? 'border-danger/60 focus:ring-danger/30'
                : 'border-border focus:border-primary/60'
            }`}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Enter a valid email address',
              },
            })}
          />
          {errors.email && <p className="text-xs text-danger mt-1.5">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-600 text-foreground mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Your password"
              className={`w-full bg-input border rounded-xl px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring transition-all ${
                errors.password
                  ? 'border-danger/60 focus:ring-danger/30'
                  : 'border-border focus:border-primary/60'
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
          {errors.password && (
            <p className="text-xs text-danger mt-1.5">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-border bg-input accent-primary"
              {...register('rememberMe')}
            />
            <span className="text-sm text-muted-foreground">Remember me</span>
          </label>
          <button
            type="button"
            className="text-sm text-primary hover:text-accent font-600 transition-colors"
          >
            Forgot password?
          </button>
        </div>

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

      <p className="text-sm text-muted-foreground text-center mt-6">
        Don't have an account?{' '}
        <button
          onClick={onSwitchToSignup}
          className="text-primary hover:text-accent font-600 transition-colors"
        >
          Sign up free
        </button>
      </p>
    </div>
  );
}
