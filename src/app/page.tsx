"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { useUser, useFirestore } from "@/firebase"

/**
 * Root Redirector with Cinematic Splash Screen.
 * Displays the QIVO logo while handling intelligent routing.
 */
export default function RootPage() {
  const router = useRouter()
  const { user, loading, isInitialized } = useUser()
  const db = useFirestore()

  useEffect(() => {
    if (isInitialized && !loading) {
      const checkDestination = async () => {
        // Minimum display time for the splash screen vibe
        const startTime = Date.now();
        
        if (user) {
          try {
            const userRef = doc(db, "users", user.uid)
            const snap = await getDoc(userRef)
            
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, 1500 - elapsedTime);

            setTimeout(() => {
              if (snap.exists() && snap.data().onboardingComplete) {
                router.replace("/home")
              } else {
                if (user.isAnonymous) {
                  router.replace("/fastonboard")
                } else {
                  router.replace("/onboarding")
                }
              }
            }, remainingTime);
          } catch (e) {
            console.error("Root redirection error:", e)
            router.replace("/welcome")
          }
        } else {
          const elapsedTime = Date.now() - startTime;
          const remainingTime = Math.max(0, 1500 - elapsedTime);
          setTimeout(() => router.replace("/welcome"), remainingTime);
        }
      }

      checkDestination()
    }
  }, [user, loading, isInitialized, router, db])

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#00A2FF]/20 rounded-full blur-[100px] animate-pulse-slow" />
      
      <div className="relative z-10 flex flex-col items-center gap-6">
        <h1 className="text-7xl font-logo text-white tracking-tight drop-shadow-2xl animate-in fade-in zoom-in-95 duration-1000">
          QIVO
        </h1>
      </div>

      {/* Subtle loader at the bottom */}
      <div className="absolute bottom-16 inset-x-0 flex justify-center">
        <div className="flex gap-1.5">
          <div className="w-1 h-1 bg-[#00A2FF] rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1 h-1 bg-[#00A2FF] rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1 h-1 bg-[#00A2FF] rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  )
}
