'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { firebaseConfig } from './config';
import { useUser } from './auth/use-user';
import { useCollection } from './firestore/use-collection';
import { useDoc } from './firestore/use-doc';
import { useMemo } from 'react';

export function initializeFirebase() {
  let app: FirebaseApp;
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  
  const firestore = getFirestore(app);
  const auth = getAuth(app);
  const database = getDatabase(app);

  return { firebaseApp: app, firestore, auth, database };
}

export * from './provider';
export * from './client-provider';

export function useMemoFirebase<T>(factory: () => T, deps: any[]): T {
  return useMemo(factory, deps);
}

export { useUser, useCollection, useDoc };
