"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { BusinessProfile, UserProfile } from '@/types';
import { getBusinessById, getUserProfile } from '@/services/businessService';
import { useAuth } from './AuthContext';
import type { SessionUser } from '@/services/authService';

interface BusinessContextType {
  business: BusinessProfile | null;
  userProfile: UserProfile | null;
  businessType: string | null;
  selectedPlan: string | null;
  planLimit: number | null;
  currentUsage: number;
  businessLoading: boolean;
  hasBusinessAccess: boolean;
  refreshBusiness: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [businessLoading, setBusinessLoading] = useState(true);

  const refreshBusiness = useCallback(async (firebaseUser?: SessionUser | null) => {
    const activeUser = firebaseUser ?? user;

    if (!activeUser) {
      setBusiness(null);
      setUserProfile(null);
      setBusinessLoading(false);
      return;
    }

    setBusinessLoading(true);

    try {
      const profile = await getUserProfile(activeUser.uid);

      if (!profile?.businessId) {
        setUserProfile(profile);
        setBusiness(null);
        return;
      }

      const businessProfile = await getBusinessById(profile.businessId);
      setUserProfile(profile);
      setBusiness(businessProfile);
    } catch {
      setUserProfile(null);
      setBusiness(null);
    } finally {
      setBusinessLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refreshBusiness();
  }, [refreshBusiness]);

  const hasBusinessAccess = Boolean(
    user &&
      user.emailVerified &&
      userProfile?.businessId &&
      business &&
      business.status === 'active',
  );

  const contextValue = useMemo<BusinessContextType>(
    () => ({
      business,
      userProfile,
      businessType: business?.businessType ?? null,
      selectedPlan: business?.selectedPlan ?? null,
      planLimit: typeof business?.planLimit === 'number' ? business.planLimit : null,
      currentUsage: typeof business?.currentUsage === 'number' ? business.currentUsage : 0,
      businessLoading,
      hasBusinessAccess,
      refreshBusiness,
    }),
    [business, userProfile, businessLoading, hasBusinessAccess, refreshBusiness],
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
