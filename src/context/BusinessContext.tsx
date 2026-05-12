"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { BusinessProfile } from '@/types';
import { getBusinessProfile } from '@/services/businessService';
import { subscribeToStorageKey } from '@/services/storageCache';
import { useAuth } from './AuthContext';

interface BusinessContextType {
  business: BusinessProfile | null;
  businessType: string | null;
  selectedPlan: string | null;
  planLimit: number | null;
  currentUsage: number;
  businessLoading: boolean;
  refreshBusiness: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);
const BUSINESSES_KEY = 'bizmanage_businesses';

export const BusinessProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [businessLoading, setBusinessLoading] = useState(true);

  const refreshBusiness = useCallback(async () => {
    if (!user) {
      setBusiness(null);
      setBusinessLoading(false);
      return;
    }

    setBusinessLoading(true);
    const profile = await getBusinessProfile(user.uid);
    setBusiness(profile);
    setBusinessLoading(false);
  }, [user]);

  useEffect(() => {
    refreshBusiness();
  }, [refreshBusiness]);

  useEffect(() => {
    if (!user) {
      return;
    }

    return subscribeToStorageKey(BUSINESSES_KEY, refreshBusiness);
  }, [refreshBusiness, user]);

  const contextValue = useMemo<BusinessContextType>(
    () => ({
      business,
      businessType: business?.businessType ?? null,
      selectedPlan: business?.selectedPlan ?? null,
      planLimit: typeof business?.planLimit === 'number' ? business.planLimit : null,
      currentUsage: typeof business?.currentUsage === 'number' ? business.currentUsage : 0,
      businessLoading,
      refreshBusiness,
    }),
    [business, businessLoading, refreshBusiness],
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
