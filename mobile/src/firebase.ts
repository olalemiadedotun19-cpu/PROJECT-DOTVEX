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

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!firebaseApp) {
    if (getApps().length === 0) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      firebaseApp = getApps()[0];
    }
  }
  return firebaseApp;
}

export function getFirebaseAuth(): Auth {
  if (!firebaseAuth) {
    firebaseAuth = getAuth(getFirebaseApp());
  }
  return firebaseAuth;
}
