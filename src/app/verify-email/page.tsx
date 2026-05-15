"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, MailCheck, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { activateBusinessAfterVerification } from '@/services/businessService';
import { useAuth } from '@/context/AuthContext';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, resendVerification, reloadUser } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const emailAddress = useMemo(() => user?.email ?? 'your email address', [user]);

  const handleResend = async () => {
    setError('');
    setSuccess('');
    setIsResending(true);

    try {
      await resendVerification();
      setSuccess('Verification email sent again. Please check your inbox.');
      toast.success('Verification email sent.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send verification email.';
      setError(message);
    } finally {
      setIsResending(false);
    }
  };

  const handleVerified = async () => {
    setError('');
    setSuccess('');
    setIsChecking(true);

    try {
      const refreshedUser = await reloadUser();

      if (!refreshedUser) {
        router.push('/sign-up-login-screen');
        return;
      }

      if (!refreshedUser.emailVerified) {
        setError('Email not verified yet. Please check your inbox.');
        return;
      }

      await activateBusinessAfterVerification(refreshedUser.uid);
      setSuccess('Email verified successfully. Redirecting to your dashboard.');
      toast.success('Email verified. Welcome to your dashboard.');
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to confirm verification right now.';
      setError(message);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg border border-border p-8">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MailCheck size={28} />
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-700 text-foreground">Verify your email</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Verification email sent. Please verify your email to continue.
          </p>
          <p className="mt-2 text-sm font-600 text-foreground break-all">{emailAddress}</p>
        </div>

        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="btn-primary w-full py-3.5 rounded-xl text-sm font-600 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isResending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Sending email...
              </>
            ) : (
              <>
                <RefreshCcw size={16} />
                Resend verification email
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleVerified}
            disabled={isChecking}
            className="w-full py-3.5 rounded-xl text-sm font-600 border border-border bg-background hover:bg-muted/50 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isChecking ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Checking verification...
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                I have verified my email
              </>
            )}
          </button>

          <Link
            href="/sign-up-login-screen"
            className="w-full py-3.5 rounded-xl text-sm font-600 border border-border bg-white hover:bg-muted/40 transition-colors flex items-center justify-center"
          >
            Back to login
          </Link>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}
      </div>
    </div>
  );
}
