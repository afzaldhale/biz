'use client';

import React, { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useBusiness } from '@/context/BusinessContext';
import RetryState from '@/components/ui/RetryState';
import { useSlowLoading } from '@/hooks/useSlowLoading';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback: ReactNode;
}

export default function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, authLoading, logout } = useAuth();
  const { business, userProfile, businessLoading, businessError, businessReady, refreshBusiness } =
    useBusiness();
  const guardLoading = authLoading || (Boolean(user?.emailVerified) && businessLoading);
  const { showRetry } = useSlowLoading(guardLoading, { retryDelayMs: 8000 });

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      if (pathname !== '/sign-up-login-screen') {
        router.replace('/sign-up-login-screen');
      }
      return;
    }

    if (!user.emailVerified) {
      if (pathname !== '/verify-email') {
        router.replace('/verify-email');
      }
      return;
    }

    if (businessLoading || businessError) {
      return;
    }

    if (!userProfile?.businessId || !business || business.status !== 'active' || !businessReady) {
      if (pathname !== '/business-setup') {
        router.replace('/business-setup');
      }
    }
  }, [
    authLoading,
    business,
    businessError,
    businessLoading,
    businessReady,
    pathname,
    router,
    user,
    userProfile,
  ]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[protected-route]', {
        pathname,
        authLoading,
        businessLoading,
        businessReady,
        user: user
          ? {
              uid: user.uid,
              emailVerified: user.emailVerified,
            }
          : null,
        business: business
          ? {
              businessId: business.businessId,
              status: business.status,
            }
          : null,
        businessError,
      });
    }
  }, [authLoading, business, businessError, businessLoading, businessReady, pathname, user]);

  if (authLoading) {
    return <>{fallback}</>;
  }

  if (!user || !user.emailVerified) {
    return <>{fallback}</>;
  }

  if (businessLoading) {
    if (!showRetry) {
      return <>{fallback}</>;
    }

    return (
      <div className="max-w-screen-2xl mx-auto px-4 py-10">
        <RetryState
          title="Dashboard is taking longer than expected."
          description="We are still loading your business workspace. You can retry the fetch or sign out and start a fresh session."
          onRetry={() => void refreshBusiness(user)}
          secondaryActionLabel="Logout"
          onSecondaryAction={() => void logout()}
        />
      </div>
    );
  }

  if (businessError) {
    return (
      <div className="max-w-screen-2xl mx-auto px-4 py-10">
        <RetryState
          title="Unable to load your business workspace"
          description={businessError}
          onRetry={() => void refreshBusiness(user)}
          secondaryActionLabel="Logout"
          onSecondaryAction={() => void logout()}
        />
      </div>
    );
  }

  if (!userProfile?.businessId || !business || business.status !== 'active' || !businessReady) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
