'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { BusinessProfile, UserProfile } from '@/types';
import { getBusinessById, getUserProfile } from '@/services/businessService';
import { getAppErrorMessage } from '@/utils/appErrorHandler';
import { useAuth } from './AuthContext';
import type { SessionUser } from '@/services/authService';

interface BusinessContextType {
  business: BusinessProfile | null;
  userProfile: UserProfile | null;
  businessType: string | null;
  selectedPlan: string | null;
  planLimit: number | null;
  recordLimit: number | null;
  currentUsage: number;
  remainingRecords: number;
  monthlyPrice: number;
  nextBillingDate: string | null;
  businessLoading: boolean;
  businessError: string | null;
  businessReady: boolean;
  hasBusinessAccess: boolean;
  refreshBusiness: (firebaseUser?: SessionUser | null) => Promise<void>;
  canCreateRecord: () => boolean;
  isOnline: boolean;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider = ({ children }: { children: ReactNode }) => {
  const { user, isOnline } = useAuth();
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [businessLoading, setBusinessLoading] = useState(true);
  const [businessError, setBusinessError] = useState<string | null>(null);
  const [businessReady, setBusinessReady] = useState(false);

  const refreshBusiness = useCallback(
    async (firebaseUser?: SessionUser | null) => {
      const activeUser = firebaseUser ?? user;

      setBusinessError(null);
      setBusinessReady(false);
      setBusinessLoading(true);

      if (!activeUser) {
        setBusiness(null);
        setUserProfile(null);
        return;
      }

      try {
        const profile = await getUserProfile(activeUser.uid);
        setUserProfile(profile);

        if (!profile?.businessId) {
          setBusiness(null);
          return;
        }

        const businessProfile = await getBusinessById(profile.businessId);
        setBusiness(businessProfile);
        setBusinessReady(Boolean(businessProfile));
      } catch (error) {
        console.error('[business-context] failed to load business state', error);
        setUserProfile(null);
        setBusiness(null);
        setBusinessError(getAppErrorMessage(error, 'Unable to load business profile.'));
      } finally {
        setBusinessLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    void refreshBusiness();
  }, [refreshBusiness]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[business-context]', {
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
  }, [business, businessError, businessLoading, businessReady, user]);

  const hasBusinessAccess = Boolean(
    user &&
    user.emailVerified &&
    userProfile?.businessId &&
    business &&
    business.status === 'active'
  );

  const contextValue = useMemo<BusinessContextType>(
    () => ({
      business,
      userProfile,
      businessType: business?.businessType ?? null,
      selectedPlan: business?.selectedPlan ?? null,
      planLimit: typeof business?.planLimit === 'number' ? business.planLimit : null,
      recordLimit: typeof business?.recordLimit === 'number' ? business.recordLimit : null,
      currentUsage: typeof business?.currentUsage === 'number' ? business.currentUsage : 0,
      remainingRecords:
        typeof business?.remainingRecords === 'number'
          ? business.remainingRecords
          : Math.max(
              0,
              (typeof business?.recordLimit === 'number'
                ? business.recordLimit
                : typeof business?.planLimit === 'number'
                  ? business.planLimit
                  : 0) - (typeof business?.currentUsage === 'number' ? business.currentUsage : 0)
            ),
      monthlyPrice: typeof business?.monthlyPrice === 'number' ? business.monthlyPrice : 0,
      nextBillingDate: business?.nextBillingDate ?? null,
      businessLoading,
      businessError,
      businessReady,
      hasBusinessAccess,
      refreshBusiness,
      canCreateRecord: () => {
        const recordLimit =
          typeof business?.recordLimit === 'number'
            ? business.recordLimit
            : typeof business?.planLimit === 'number'
              ? business.planLimit
              : 0;
        const currentUsage = typeof business?.currentUsage === 'number' ? business.currentUsage : 0;

        return currentUsage < recordLimit;
      },
      isOnline,
    }),
    [
      business,
      businessError,
      businessLoading,
      businessReady,
      hasBusinessAccess,
      isOnline,
      business?.monthlyPrice,
      business?.nextBillingDate,
      business?.planLimit,
      business?.recordLimit,
      business?.remainingRecords,
      refreshBusiness,
      userProfile,
    ]
  );

  return <BusinessContext.Provider value={contextValue}>{children}</BusinessContext.Provider>;
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within BusinessProvider');
  }
  return context;
};
