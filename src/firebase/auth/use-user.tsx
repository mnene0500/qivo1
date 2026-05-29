"use client"

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * @fileOverview Pure Supabase Auth Hook.
 * Manages user identity exclusively via Supabase with enhanced refresh token error handling.
 */
export function useUser() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    // 1. Get initial Supabase session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      
      if (error) {
        console.error("Auth initialization error:", error.message);
        // FORCE CLEANUP ON REFRESH TOKEN FAILURE
        if (error.message.includes("Refresh Token") || error.status === 400) {
          localStorage.clear();
          sessionStorage.clear();
          supabase.auth.signOut().then(() => {
            if (mounted) window.location.replace("/welcome");
          });
          return;
        }
      }
      
      setUser(session?.user || null);
      setLoading(false);
      setIsInitialized(true);
    });

    // 2. Listen for Auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setUser(null);
        setLoading(false);
        setIsInitialized(true);
      } else if (session?.user) {
        setUser(session.user);
        setLoading(false);
        setIsInitialized(true);
      } else if (event === 'INITIAL_SESSION' && !session) {
        setUser(null);
        setLoading(false);
        setIsInitialized(true);
      } else if (event === 'TOKEN_REFRESHED' && !session) {
        setUser(null);
        if (mounted) window.location.replace("/welcome");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading, isInitialized };
}
