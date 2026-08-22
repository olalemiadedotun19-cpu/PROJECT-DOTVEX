import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDOTVEX_MOBILE_CLIENT_KEY',
  authDomain: 'dotvex-app.firebaseapp.com',
  projectId: 'dotvex-app',
  storageBucket: 'dotvex-app.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:dotvex_mobile_app',
};

let firebaseApp: FirebaseApp;
let firebaseAuth: Auth;

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

export { firebaseConfig };
