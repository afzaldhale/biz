'use client';

import React, { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useBusiness } from '@/context/BusinessContext';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback: ReactNode;
}

export default function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, authLoading } = useAuth();
  const { business, userProfile, businessLoading, hasBusinessAccess } = useBusiness();

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

    if (!userProfile?.businessId || !business || business.status !== 'active') {
      router.replace('/sign-up-login-screen');
    }
  }, [authLoading, business, businessLoading, router, user, userProfile]);

  if (authLoading || businessLoading || !hasBusinessAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
