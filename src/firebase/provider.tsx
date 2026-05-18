'use client';

import React, { createContext, useContext } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { Database } from 'firebase/database';

export interface FirebaseContextValue {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  database: Database;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export function FirebaseProvider({
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
    <FirebaseContext.Provider value={{ firebaseApp, firestore, auth, database }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

export function useFirebaseApp() {
  return useFirebase().firebaseApp;
}

export function useFirestore() {
  return useFirebase().firestore;
}

export function useAuth() {
  return useFirebase().auth;
}

export function useDatabase() {
  return useFirebase().database;
}
