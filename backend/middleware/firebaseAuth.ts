import { Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { getApps, initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import * as fs from 'fs';

let firebaseReady = false;

function getFirebaseApp() {
  if (firebaseReady) {
    return getApps()[0]!;
  }
  try {
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      initializeApp({ credential: applicationDefault() });
    } else if (serviceAccountKey) {
      const parsed = JSON.parse(serviceAccountKey);
      initializeApp({ credential: cert(parsed) });
    } else {
      initializeApp();
    }
    firebaseReady = true;
    return getApps()[0]!;
  } catch (error) {
    console.warn('[DOTVEX] Firebase Admin not configured — using anonymous mode:', (error as Error).message);
    return null;
  }
}

export interface FirebaseAuthInfo {
  uid: string;
  email: string | undefined;
  name: string | undefined;
  provider: string;
}

declare global {
  namespace Express {
    interface Request {
      firebaseUser?: FirebaseAuthInfo;
      userId: string;
    }
  }
}

export async function verifyFirebaseToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const firebaseApp = getFirebaseApp();

  if (authHeader && authHeader.startsWith('Bearer ') && firebaseApp) {
    const idToken = authHeader.slice('Bearer '.length).trim();

    try {
      const decodedToken = await getAuth(firebaseApp).verifyIdToken(idToken);
      req.firebaseUser = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        provider: decodedToken.firebase?.sign_in_provider || 'unknown',
      };
      req.userId = decodedToken.uid;
      next();
      return;
    } catch (error) {
      if ((error as any).code === 'app/no-app') {
        req.userId = 'default';
        next();
        return;
      }
      res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired Firebase ID token.' } });
      return;
    }
  }

  if (firebaseApp && authHeader && authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token.' } });
    return;
  }

  req.userId = 'default';
  next();
}

export function getFirebaseUserId(req: Request): string {
  return req.userId;
}

export function getFirebaseUser(req: Request): FirebaseAuthInfo | null {
  return req.firebaseUser ?? null;
}

export function isFirebaseEnabled(): boolean {
  return getFirebaseApp() !== null;
}
