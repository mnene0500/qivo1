"use client"

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { initializeFirebase } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';

/**
 * @fileOverview Hybrid Auth Hook.
 * Uses Supabase as the primary identity provider while bridging to Firebase 
 * to ensure database security rules remain functional.
 */
export function useUser() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const { auth: firebaseAuth } = initializeFirebase();

    // 1. Get initial Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        // Silent bridge to Firebase for database access
        if (firebaseAuth) signInAnonymously(firebaseAuth).catch(() => {});
      }
      setLoading(false);
      setIsInitialized(true);
    });

    // 2. Listen for Auth changes (Sign in, Sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      
      if (currentUser && firebaseAuth) {
        // Maintain Firebase session for Firestore/RTDB rules
        signInAnonymously(firebaseAuth).catch(() => {});
      }
      
      setLoading(false);
      setIsInitialized(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading, isInitialized };
}
