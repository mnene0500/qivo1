"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/firebase/auth/use-user"

/**
 * Root Redirector with Splash UI.
 * Shows branding instead of a blank screen during the initial boot sequence.
 */
export default function RootPage() {
  const router = useRouter()
  const { user, loading: authLoading, isInitialized } = useUser()

  useEffect(() => {
    if (!isInitialized || authLoading) return

    if (!user) {
      router.replace("/welcome")
      return
    }

    const checkOnboarding = async () => {
      try {
        const { data } = await supabase
          .from('users')
          .select('onboarding_complete')
          .eq('uid', user.id)
          .maybeSingle()
        
        if (data?.onboarding_complete) {
          router.replace("/home")
        } else {
          router.replace("/fastonboard")
        }
      } catch (err) {
        router.replace("/fastonboard")
      }
    }

    checkOnboarding()
  }, [user, isInitialized, authLoading, router])

  // SHOW SPLASH: Prevents white flash on first load
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center select-none z-[9999]">
       <h1 className="text-8xl font-logo font-black text-[#00A2FF] tracking-tight animate-pulse duration-1000">
         Qivo
       </h1>
    </div>
  );
}
