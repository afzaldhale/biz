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
  const { business, userProfile, businessLoading, hasBusinessAccess, refreshBusiness } =
    useBusiness();
  const [routeChecking, setRouteChecking] = React.useState(true);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    let active = true;

    const checkProtection = async () => {
      setRouteChecking(true);

      try {
        if (!user) {
          return;
        }

        // Refresh business data once when the user is present to ensure cached profile is loaded.
        await refreshBusiness();
      } finally {
        if (active) {
          setRouteChecking(false);
        }
      }
    };

    void checkProtection();

    return () => {
      active = false;
    };
  }, [authLoading, refreshBusiness, user]);

  useEffect(() => {
    if (authLoading || businessLoading || routeChecking) {
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

    if (userProfile?.onboardingCompleted === false) {
      router.replace('/business-setup');
      return;
    }

    if (!userProfile?.businessId || !business || business.status !== 'active') {
      router.replace('/sign-up-login-screen');
      return;
    }
  }, [authLoading, businessLoading, routeChecking, router, user, userProfile, business]);

  if (authLoading || businessLoading || routeChecking || !hasBusinessAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
