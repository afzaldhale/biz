"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { SessionUser, signupWithEmail, loginWithEmail, logoutUser } from '@/services/authService';

interface AuthContextType {
  user: SessionUser | null;
  authLoading: boolean;
  loading: boolean;
  signup: typeof signupWithEmail;
  login: typeof loginWithEmail;
  logout: typeof logoutUser;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setUser(null);
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      authLoading,
      loading: authLoading,
      signup: signupWithEmail,
      login: loginWithEmail,
      logout: logoutUser,
    }),
    [authLoading, user],
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
