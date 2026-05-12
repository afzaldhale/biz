"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import {
  SessionUser,
  getCurrentSessionUser,
  signupWithEmail,
  loginWithEmail,
  logoutUser,
} from '@/services/authService';
import { subscribeToStorageKey } from '@/services/storageCache';

interface AuthContextType {
  user: SessionUser | null;
  authLoading: boolean;
  loading: boolean;
  signup: typeof signupWithEmail;
  login: typeof loginWithEmail;
  logout: typeof logoutUser;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_KEY = 'bizmanage_auth';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SessionUser | null>(() => getCurrentSessionUser());
  const [authLoading, setAuthLoading] = useState(true);

  const syncUser = useCallback(() => {
    setUser(getCurrentSessionUser());
    setAuthLoading(false);
  }, []);

  useEffect(() => {
    syncUser();
    return subscribeToStorageKey(AUTH_KEY, syncUser);
  }, [syncUser]);

  const handleLogout = useCallback<typeof logoutUser>(async () => {
    await logoutUser();
    setUser(null);
  }, []);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      authLoading,
      loading: authLoading,
      signup: signupWithEmail,
      login: loginWithEmail,
      logout: handleLogout,
    }),
    [authLoading, handleLogout, user],
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
