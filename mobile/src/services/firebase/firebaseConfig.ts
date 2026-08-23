import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBRyyAmgLN1HX8qmmdsLhLsNCA4yn2vYWI',
  authDomain: 'dotvex-ai.firebaseapp.com',
  projectId: 'dotvex-ai',
  storageBucket: 'dotvex-ai.firebasestorage.app',
  messagingSenderId: '181716283342',
  appId: '1:181716283342:web:aef5f625528e826b3c859f',
};

let firebaseApp: FirebaseApp;
let firebaseAuth: Auth;
let firebaseInitialized = false;

export function getFirebaseApp(): FirebaseApp {
  if (firebaseInitialized && firebaseApp) return firebaseApp;
  try {
    if (getApps().length === 0) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      firebaseApp = getApps()[0];
    }
    firebaseInitialized = true;
  } catch (error) {
    console.error('[DOTVEX] Firebase init error:', (error as Error).message);
    throw error;
  }
  return firebaseApp;
}

export function getFirebaseAuth(): Auth {
  if (!firebaseAuth) {
    firebaseAuth = getAuth(getFirebaseApp());
  }
  return firebaseAuth;
}

export const FIREBASE_CLIENT_ID = '181716283342-3fot88dc41hl1m8gueqm1njkt537nvkg.apps.googleusercontent.com';

export { firebaseConfig };

export const GOOGLE_SIGN_IN_CONFIG = {
  webClientId: FIREBASE_CLIENT_ID,
  offlineAccess: true,
  scopes: ['profile', 'email'],
};
