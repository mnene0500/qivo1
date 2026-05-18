'use client';

import React from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { Database } from 'firebase/database';
import { FirebaseProvider } from './provider';

export function FirebaseClientProvider({
  children,
  firebaseApp,
  firestore,
  auth,
  database,
}: {
  children: React.ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  database: Database;
}) {
  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      firestore={firestore}
      auth={auth}
      database={database}
    >
      {children}
    </FirebaseProvider>
  );
}
