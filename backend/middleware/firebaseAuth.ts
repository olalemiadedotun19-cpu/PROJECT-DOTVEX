import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';

let firebaseApp: admin.app.App;

function getFirebaseApp(): admin.app.App {
  if (!firebaseApp) {
    try {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        : undefined;

      if (serviceAccount) {
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else if (admin.apps.length > 0) {
        firebaseApp = admin.apps[0]!;
      } else {
        firebaseApp = admin.initializeApp();
      }
    } catch (error) {
      console.error('[DOTVEX] Firebase Admin init failed:', (error as Error).message);
      throw error;
    }
  }
  return firebaseApp;
}

export interface FirebaseAuthInfo {
  uid: string;
  email: string | undefined;
  name: string | undefined;
}

declare global {
  namespace Express {
    interface Request {
      firebaseUser?: FirebaseAuthInfo;
    }
  }
}

export async function verifyFirebaseToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing Authorization header.' } });
    return;
  }

  const idToken = authHeader.slice('Bearer '.length).trim();

  try {
    const decodedToken = await getFirebaseApp().auth().verifyIdToken(idToken);
    req.firebaseUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
    };
    next();
  } catch (error) {
    res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired Firebase ID token.' } });
  }
}

export function getFirebaseUserId(req: Request): string | null {
  return req.firebaseUser?.uid ?? null;
}

export function getFirebaseUser(req: Request): FirebaseAuthInfo | null {
  return req.firebaseUser ?? null;
}
