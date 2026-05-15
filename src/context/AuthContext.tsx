"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { onIdTokenChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import {
  SessionUser,
  signupWithEmailVerification,
  loginUser,
  logoutUser,
  resendVerificationEmail,
  reloadCurrentUser,
} from '@/services/authService';

interface AuthContextType {
  user: SessionUser | null;
  authLoading: boolean;
  loading: boolean;
  signup: typeof signupWithEmailVerification;
  login: typeof loginUser;
  logout: typeof logoutUser;
  resendVerification: typeof resendVerificationEmail;
  reloadUser: typeof reloadCurrentUser;
  refreshUser: () => Promise<SessionUser | null>;
  refreshAuthState: () => Promise<SessionUser | null>;
  isEmailVerified: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setUser(null);
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onIdTokenChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUser = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      const refreshedUser = await reloadCurrentUser();
      setUser(refreshedUser);
      return refreshedUser;
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const refreshAuthState = React.useCallback(async () => {
    return await refreshUser();
  }, [refreshUser]);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      authLoading,
      loading: authLoading || isRefreshing,
      signup: signupWithEmailVerification,
      login: loginUser,
      logout: logoutUser,
      resendVerification: resendVerificationEmail,
      reloadUser: reloadCurrentUser,
      refreshUser,
      refreshAuthState,
      isEmailVerified: Boolean(user?.emailVerified),
    }),
    [authLoading, isRefreshing, user, refreshUser, refreshAuthState],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
