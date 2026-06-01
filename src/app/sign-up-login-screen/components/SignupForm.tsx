'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { handleAppError } from '@/utils/appErrorHandler';
import { useAuth } from '@/context/AuthContext';

interface SignupFormValues {
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

export default function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const router = useRouter();
  const { signup } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormValues>();

  const password = watch('password');

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);

    try {
      await signup({
        email: data.email,
        password: data.password,
        ownerName: data.ownerName,
        phone: data.phone,
      });

      toast.success(`Account created for ${data.ownerName}. We've sent your verification email.`);
      router.push('/verify-email');
    } catch (error) {
      handleAppError(error, 'Unable to create account right now');
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-slide-up">
      <div className="mb-6">
        <h1 className="text-2xl font-700 text-foreground mb-1">Create your account</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-600 text-foreground mb-1.5">
            Owner / Manager Name
          </label>
          <input
            type="text"
            placeholder="Rajesh Kumar"
            className={`w-full bg-input border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring transition-all ${errors.ownerName ? 'border-danger/60' : 'border-border focus:border-primary/60'}`}
            {...register('ownerName', {
              required: 'Owner name is required',
              minLength: { value: 2, message: 'Minimum 2 characters' },
            })}
          />
          {errors.ownerName && (
            <p className="text-xs text-danger mt-1">{errors.ownerName.message}</p>
          )}
        </div>

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
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-danger mt-1">{errors.password.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-600 text-foreground mb-1.5">
              Confirm Password
            </label>
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
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Toggle confirm password visibility"
              >
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-danger mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          By signing up, you agree to our{' '}
          <Link
            href="/terms-of-service"
            className="text-primary hover:text-accent transition-colors"
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy-policy" className="text-primary hover:text-accent transition-colors">
            Privacy Policy
          </Link>
          .
        </p>

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
            'Create Account & Send Verification Email'
          )}
        </button>
      </form>

      <p className="text-sm text-muted-foreground text-center mt-5">
        Already have an account?{' '}
        <button
          onClick={onSwitchToLogin}
          className="text-primary hover:text-accent font-600 transition-colors"
        >
          Log in
        </button>
      </p>
    </div>
  );
}
