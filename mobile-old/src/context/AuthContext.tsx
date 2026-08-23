import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
  AuthUser,
  signIn,
  signUp,
  signOut as firebaseSignOut,
  resetPassword,
  getCurrentUser,
  getIdToken,
  onAuthChange,
  signInWithGoogle,
} from '../services/firebase/firebaseAuthService';
import { GOOGLE_SIGN_IN_CONFIG } from '../services/firebase/firebaseConfig';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
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
    try {
      GoogleSignin.configure(GOOGLE_SIGN_IN_CONFIG);
    } catch (e) {
      console.warn('[DOTVEX] GoogleSignin configure failed:', (e as Error).message);
    }
  }, []);

  useEffect(() => {
    try {
      const unsubscribe = onAuthChange(async (firebaseUser) => {
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
    } catch (e) {
      console.error('[DOTVEX] Auth initialization error:', (e as Error).message);
      setIsInitialized(true);
    }
  }, []);

  const handleSignInWithEmail = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await signIn(email, password);
      return { success: result.success, error: result.error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSignUpWithEmail = useCallback(async (email: string, password: string, displayName: string) => {
    setIsLoading(true);
    try {
      const result = await signUp(email, password, displayName);
      return { success: result.success, error: result.error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSignInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = (userInfo as any).data?.serverAuthCode || (userInfo as any).idToken;

      if (!idToken) {
        const tokens = await GoogleSignin.getTokens();
        const token = tokens.idToken;
        if (!token) {
          return { success: false, error: 'Failed to get Google ID token.' };
        }
        const result = await signInWithGoogle(token);
        return { success: result.success, error: result.error };
      }

      const result = await signInWithGoogle(idToken);
      return { success: result.success, error: result.error };
    } catch (error: any) {
      if (error?.message?.includes('cancelled') || error?.code === '12501') {
        return { success: false, error: 'Sign-in cancelled.' };
      }
      return { success: false, error: error?.message || 'Google sign-in failed.' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await GoogleSignin.signOut().catch(() => {});
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
    signInWithEmail: handleSignInWithEmail,
    signUpWithEmail: handleSignUpWithEmail,
    signInWithGoogle: handleSignInWithGoogle,
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
