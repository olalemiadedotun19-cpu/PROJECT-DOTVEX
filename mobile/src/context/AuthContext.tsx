import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthUser,
  signIn,
  signUp,
  signOut as firebaseSignOut,
  resetPassword,
  getCurrentUser,
  getIdToken,
  onAuthChange,
} from '../services/firebase/firebaseAuthService';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  getAuthToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_STORAGE_KEY = 'dotvex_auth_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const auth = require('../services/firebase/firebaseAuthService');
    const unsubscribe = auth.onAuthChange(async (firebaseUser: any) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(firebaseUser));
      } else {
        setUser(null);
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      }
      setIsInitialized(true);
    });

    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    }
    setIsInitialized(true);

    return unsubscribe;
  }, []);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await signIn(email, password);
      return { success: result.success, error: result.error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSignUp = useCallback(async (email: string, password: string, displayName: string) => {
    setIsLoading(true);
    try {
      const result = await signUp(email, password, displayName);
      return { success: result.success, error: result.error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await firebaseSignOut();
      return { success: result.success, error: result.error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleResetPassword = useCallback(async (email: string) => {
    setIsLoading(true);
    try {
      const result = await resetPassword(email);
      return { success: result.success, error: result.error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAuthToken = useCallback(async () => {
    return getIdToken();
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isInitialized,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
    getAuthToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
