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
    // 1. Get initial Supabase session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("[Auth] Session retrieval error:", error.message);
        // If there's an explicit refresh token error, clear local storage
        if (error.message.includes("Refresh Token")) {
          supabase.auth.signOut();
        }
      }
      setUser(session?.user || null);
      setLoading(false);
      setIsInitialized(true);
    });

    // 2. Listen for Auth changes (Sign in, Sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[Auth] State change event:", event);
      
      if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (session?.user) {
        setUser(session.user);
      } else if (event === 'TOKEN_REFRESHED' && !session) {
        // Edge case: refresh triggered but no session returned
        setUser(null);
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
