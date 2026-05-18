'use client';

import { initializeFirebase, FirebaseClientProvider } from '@/firebase';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { Toaster } from '@/components/ui/toaster';

const { firebaseApp, firestore, auth, database } = initializeFirebase();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider 
      firebaseApp={firebaseApp} 
      firestore={firestore} 
      auth={auth} 
      database={database}
    >
      <FirebaseErrorListener />
      {children}
      <Toaster />
    </FirebaseClientProvider>
  );
}
