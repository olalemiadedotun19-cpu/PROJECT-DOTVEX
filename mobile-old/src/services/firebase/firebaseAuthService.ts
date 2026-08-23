import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { getFirebaseAuth } from './firebaseConfig';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  providerId: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser | null;
  error?: string;
}

function mapUser(user: User | null): AuthUser | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
    providerId: user.providerData[0]?.providerId || 'unknown',
  };
}

export async function signUp(email: string, password: string, displayName: string): Promise<AuthResult> {
  try {
    const auth = getFirebaseAuth();
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName && result.user) {
      await updateProfile(result.user, { displayName });
    }
    return { success: true, user: mapUser(result.user) };
  } catch (error: any) {
    return { success: false, error: getErrorMessage(error.code) };
  }
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    const auth = getFirebaseAuth();
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: mapUser(result.user) };
  } catch (error: any) {
    return { success: false, error: getErrorMessage(error.code) };
  }
}

export async function signInWithGoogle(googleIdToken: string): Promise<AuthResult> {
  try {
    const auth = getFirebaseAuth();
    const credential = GoogleAuthProvider.credential(googleIdToken);
    const result = await signInWithCredential(auth, credential);
    return { success: true, user: mapUser(result.user) };
  } catch (error: any) {
    return { success: false, error: getErrorMessage(error.code) };
  }
}

export async function signOut(): Promise<AuthResult> {
  try {
    const auth = getFirebaseAuth();
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: getErrorMessage(error.code) };
  }
}

export async function resetPassword(email: string): Promise<AuthResult> {
  try {
    const auth = getFirebaseAuth();
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: getErrorMessage(error.code) };
  }
}

export function getCurrentUser(): AuthUser | null {
  const auth = getFirebaseAuth();
  return mapUser(auth.currentUser);
}

export function getIdToken(): Promise<string | null> {
  const auth = getFirebaseAuth();
  if (!auth.currentUser) return Promise.resolve(null);
  return auth.currentUser.getIdToken();
}

export function getAuthToken(): Promise<string | null> {
  return getIdToken();
}

export function onAuthChange(callback: (user: AuthUser | null) => void): () => void {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, (user) => callback(mapUser(user)));
}

function getErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/popup-closed-by-user': 'Sign-in cancelled.',
  };
  return messages[code] || 'An unexpected error occurred. Please try again.';
}
