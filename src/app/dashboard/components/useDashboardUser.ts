'use client';

import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useBusiness } from '@/context/BusinessContext';
import { AuthUser, BusinessType, PlanId } from '@/types';

export function useDashboardUser() {
  const { user: authUser, logout } = useAuth();
  const { business } = useBusiness();

  const user = useMemo<AuthUser | null>(() => {
    if (!authUser || !business) {
      return null;
    }

    return {
      id: business.businessId,
      ownerName: business.ownerName,
      businessName: business.businessName,
      email: business.email,
      phone: business.phone,
      plan: ((business.selectedPlan === 'usage_based' ? 'custom' : business.selectedPlan) ??
        'custom') as PlanId,
      businessType: (business.businessType ?? 'academy') as BusinessType,
      recordsUsed: business.currentUsage ?? 0,
      recordLimit: business.recordLimit ?? business.planLimit ?? 50,
      createdAt: business.createdAt ?? new Date().toISOString(),
    };
  }, [authUser, business]);

  return {
    authUser,
    business,
    logout,
    user,
  };
}
