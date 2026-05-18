'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Admin, MOCK_ADMINS } from './mockData';

// BACKEND INTEGRATION POINT: Replace mock auth with Firebase Auth + Firestore admins/{uid} lookup
// import { signInWithEmailAndPassword } from 'firebase/auth';
// import { doc, getDoc } from 'firebase/firestore';
// import { auth, db } from './firebase';

interface AdminAuthState {
  admin: Admin | null;
  isLoading: boolean;
  error: string | null;
}

interface AdminAuthContextValue extends AdminAuthState {
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

const MOCK_PASSWORDS: Record<string, string> = {
  'superadmin@bizmanage.in': 'Admin@2026',
  'support@bizmanage.in': 'Support@2026',
  'sales@bizmanage.in': 'Sales@2026',
};

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminAuthState>({
    admin: null,
    isLoading: false,
    error: null,
  });

  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    // Simulate network delay
    await new Promise((res) => setTimeout(res, 1200));

    // BACKEND INTEGRATION POINT: Replace with Firebase signInWithEmailAndPassword
    // then check admins/{uid} in Firestore for role and status
    const expectedPassword = MOCK_PASSWORDS[email.toLowerCase()];
    const admin = MOCK_ADMINS.find((a) => a.email.toLowerCase() === email.toLowerCase());

    if (!admin || expectedPassword !== password) {
      setState({
        admin: null,
        isLoading: false,
        error: 'Invalid credentials — use the demo accounts below to sign in',
      });
      return false;
    }

    if (admin.status !== 'active') {
      setState({
        admin: null,
        isLoading: false,
        error: 'Your admin account has been deactivated. Contact a super admin.',
      });
      return false;
    }

    setState({ admin, isLoading: false, error: null });
    return true;
  }, []);

  const signOut = useCallback(() => {
    // BACKEND INTEGRATION POINT: Firebase signOut()
    setState({ admin: null, isLoading: false, error: null });
  }, []);

  return (
    <AdminAuthContext.Provider value={{ ...state, signIn, signOut }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
