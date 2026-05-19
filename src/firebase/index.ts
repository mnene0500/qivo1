
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';
import { firebaseConfig } from './config';
import { useUser } from './auth/use-user';
import { useCollection } from './firestore/use-collection';
import { useDoc } from './firestore/use-doc';
import { useMemo } from 'react';

/**
 * Idempotent initialization of Firebase services.
 * Returns null for services if the configuration is missing to prevent hard crashes.
 */
export function initializeFirebase() {
  // Check for the absolute minimum required key
  const apiKey = firebaseConfig.apiKey || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const isConfigValid = !!(apiKey && apiKey !== 'undefined');
  
  if (!isConfigValid) {
    if (typeof window !== 'undefined') {
      console.warn("QIVO: Firebase configuration is missing or invalid. Check Vercel Env Vars.");
    } else {
      console.error("[Firebase Server] API Key missing. Service actions will fail.");
    }
    return { 
      firebaseApp: null as unknown as FirebaseApp, 
      firestore: null as unknown as Firestore, 
      auth: null as unknown as Auth, 
      database: null as unknown as Database 
    };
  }

  let app: FirebaseApp;
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    
    const firestore = getFirestore(app);
    const auth = getAuth(app);
    const database = getDatabase(app);

    return { firebaseApp: app, firestore, auth, database };
  } catch (err: any) {
    console.error("[Firebase Init Error]:", err.message);
    return { 
      firebaseApp: null as unknown as FirebaseApp, 
      firestore: null as unknown as Firestore, 
      auth: null as unknown as Auth, 
      database: null as unknown as Database 
    };
  }
}

// Re-export provider and hooks
export * from './provider';
export { FirebaseClientProvider } from './client-provider';

/**
 * Memoize Firebase references to prevent unnecessary re-renders.
 */
export function useMemoFirebase<T>(factory: () => T, deps: any[]): T {
  return useMemo(factory, deps);
}

export { useUser, useCollection, useDoc };
