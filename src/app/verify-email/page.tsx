"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Loader2, Mail, RefreshCcw, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { activateBusinessAfterVerification } from '@/services/businessService';
import { useAuth } from '@/context/AuthContext';
import { useBusiness } from '@/context/BusinessContext';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, resendVerification, reloadUser, refreshUser, isEmailVerified } = useAuth();
  const { refreshBusiness } = useBusiness();
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState('We sent a secure verification link to your inbox.');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pageState, setPageState] = useState<'idle' | 'resent' | 'checking' | 'verified' | 'notVerified'>('idle');

  const emailAddress = useMemo(() => user?.email ?? 'your email address', [user]);

  const handleBusinessActivation = async (verifiedUserId: string) => {
    await activateBusinessAfterVerification(verifiedUserId);
    await refreshUser();
    await refreshBusiness();
  };

  const redirectToDashboard = async () => {
    setSuccess('Email verified successfully. Redirecting to dashboard...');
    toast.success('Email verified. Welcome to your dashboard.');
    router.replace('/dashboard');
    router.refresh();
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    setIsResending(true);
    setPageState('idle');

    try {
      await resendVerification();
      setPageState('resent');
      setSuccess('Verification email sent again. Please check your inbox.');
      setStatusMessage('We resent the verification link to your inbox. It may take a few seconds to arrive.');
      toast.success('Verification email sent again. Please check your inbox.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send verification email.';
      setError(message);
      setPageState('notVerified');
    } finally {
      setIsResending(false);
    }
  };

  const handleVerified = async () => {
    setError('');
    setSuccess('');
    setPageState('checking');
    setIsChecking(true);

    try {
      const refreshedUser = await reloadUser();

      if (!refreshedUser) {
        router.replace('/sign-up-login-screen');
        return;
      }

      if (!refreshedUser.emailVerified) {
        setError('Your email is not verified yet. Please open the verification link from your inbox.');
        setPageState('notVerified');
        return;
      }

      await handleBusinessActivation(refreshedUser.uid);
      setPageState('verified');
      await redirectToDashboard();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to confirm verification right now.';
      setError(message);
      setPageState('notVerified');
    } finally {
      setIsChecking(false);
    }
  };

  const checkVerificationSilently = async () => {
    if (!user || pageState === 'verified') {
      return;
    }

    try {
      const refreshedUser = await reloadUser();
      if (refreshedUser?.emailVerified) {
        await handleBusinessActivation(refreshedUser.uid);
        setPageState('verified');
        await redirectToDashboard();
      }
    } catch {
      // Poll silently without showing errors
    }
  };

  useEffect(() => {
    if (user && !isEmailVerified && pageState !== 'verified') {
      const interval = window.setInterval(() => {
        void checkVerificationSilently();
      }, 5000);

      return () => window.clearInterval(interval);
    }

    return undefined;
  }, [user, isEmailVerified, pageState]);

  const steps = [
    { label: 'Account created', active: true },
    { label: 'Email sent', active: true },
    { label: 'Verify email', active: !isEmailVerified },
    { label: 'Dashboard unlocked', active: isEmailVerified },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950/80 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-slate-950/30 p-8 text-center text-white">
          <p className="text-sm uppercase tracking-[0.35em] text-sky-300/80">Verification required</p>
          <h1 className="mt-6 text-3xl font-semibold">Please sign in again to continue verification</h1>
          <p className="mt-4 max-w-xl mx-auto text-sm text-slate-300">We could not find an authenticated user session. Sign back in so we can confirm the verification state securely.</p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/sign-up-login-screen" className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400">
              Back to Login
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="absolute inset-0 overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-[20%] h-[340px] w-[340px] rounded-full bg-violet-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1400px] items-center px-4 py-16">
        <div className="grid w-full gap-10 lg:grid-cols-[1.15fr_1fr]">
          <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/80 p-10 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
            <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-sky-400 via-violet-500 to-fuchsia-500 opacity-80" />
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-sky-500/10 text-sky-300 ring-1 ring-sky-300/20">
                <Mail size={28} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-sky-300/80">BizManage</p>
                <h1 className="mt-2 text-3xl font-semibold text-white">Verify your email to activate your business dashboard</h1>
              </div>
            </div>

            <p className="max-w-xl text-sm leading-7 text-slate-300">
              We sent a secure verification link to <span className="font-semibold text-white">{emailAddress}</span>. Once verified, your BizManage workspace will be activated and your dashboard access will unlock instantly.
            </p>

            <div className="mt-10 grid gap-4 rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-6 shadow-inner shadow-slate-950/20">
              <div className="flex items-center gap-3 rounded-3xl border border-slate-800/80 bg-slate-900/80 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-300">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Secure verification</p>
                  <p className="text-sm text-slate-400">Encrypted link delivery for your business data.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-3xl border border-slate-800/80 bg-slate-900/80 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
                  <Sparkles size={24} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Workspace protection</p>
                  <p className="text-sm text-slate-400">Only verified owners can access the dashboard.</p>
                </div>
              </div>
            </div>

            <div className="mt-10 overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/20">
              <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-300">Verification progress</h2>
              <div className="mt-6 space-y-4">
                {steps.map((step, index) => (
                  <div key={step.label} className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${step.active ? 'bg-sky-500/10 text-sky-300 ring-1 ring-sky-300/20' : 'bg-white/5 text-slate-500'}`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{step.label}</p>
                      <p className="text-sm text-slate-400">{index === 2 ? 'Open the link in your inbox to complete verification.' : index === 3 ? 'Dashboard access unlocks after email verification.' : 'Completed'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="relative rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-950/95 to-slate-900/90 p-8 shadow-2xl shadow-slate-950/30">
            <div className="absolute -right-16 top-10 h-40 w-40 rounded-full bg-sky-500/10 blur-3xl" />
            <div className="absolute -left-16 bottom-10 h-44 w-44 rounded-full bg-violet-500/10 blur-3xl" />
            <div className="relative rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-slate-950/30">
              <div className="mb-8 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-sky-300/80">Action required</p>
                  <h2 className="mt-3 text-3xl font-semibold text-white">Check your inbox</h2>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/10 text-sky-300 shadow-lg shadow-sky-500/10">
                  <Mail size={24} />
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.3em] text-sky-300/80">Verification email</p>
                      <p className="mt-2 text-sm text-slate-300">Sent to</p>
                      <p className="mt-1 font-semibold text-white break-all">{emailAddress}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-sky-500/10 text-sky-300">
                      <ShieldCheck size={20} />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  <button
                    type="button"
                    onClick={handleVerified}
                    disabled={isChecking || pageState === 'verified'}
                    className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-3xl bg-sky-500 px-6 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isChecking ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Checking verification...
                      </>
                    ) : pageState === 'verified' ? (
                      <>
                        <CheckCircle2 size={18} />
                        Verified — continue to dashboard
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={18} />
                        I have verified my email
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-6 text-sm font-semibold text-slate-100 transition hover:border-sky-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isResending ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <RefreshCcw size={18} />
                        Resend verification email
                      </>
                    )}
                  </button>

                  <Link href="/sign-up-login-screen" className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-3xl border border-white/10 bg-slate-900 px-6 text-sm font-semibold text-slate-200 transition hover:bg-slate-800">
                    <ArrowRight size={16} />
                    Back to login
                  </Link>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/80 p-4 text-sm text-slate-300">
                  <p>{statusMessage}</p>
                </div>

                {error && (
                  <div className="rounded-[1.5rem] border border-danger/20 bg-danger/10 p-4 text-sm text-danger-100">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-950/20 p-4 text-sm text-emerald-200">
                    {success}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-5 text-slate-300 shadow-inner shadow-slate-950/20">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-300/80">Smart verification</p>
              <p className="mt-3 text-sm leading-7">Your verification status is checked automatically every few seconds while this page is open. No reload is required once the email is confirmed.</p>
            </div>
          </section>
        </div>
      </div>

      <style jsx global>{`
        @keyframes floatEnvelope {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes sparkle {
          0%, 100% { opacity: 0.55; transform: translateY(0) scale(1); }
          50% { opacity: 1; transform: translateY(-4px) scale(1.05); }
        }

        .verify-email-float {
          animation: floatEnvelope 5s ease-in-out infinite;
        }

        .verify-email-sparkle {
          animation: sparkle 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
