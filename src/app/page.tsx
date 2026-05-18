"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { useUser, useFirestore } from "@/firebase"

/**
 * Root Redirector with Splash Screen.
 * Immediately determines destination once auth state is resolved.
 * Uses black screen to prevent flashing of unauthenticated UI.
 */
export default function RootPage() {
  const router = useRouter()
  const { user, loading, isInitialized } = useUser()
  const db = useFirestore()

  useEffect(() => {
    if (isInitialized && !loading) {
      const checkDestination = async () => {
        if (user) {
          try {
            const userRef = doc(db, "users", user.uid)
            const snap = await getDoc(userRef)
            if (snap.exists() && snap.data().onboardingComplete) {
              router.replace("/home")
            } else {
              router.replace("/onboarding")
            }
          } catch (e) {
            router.replace("/onboarding")
          }
        } else {
          router.replace("/welcome")
        }
      }

      checkDestination()
    }
  }, [user, loading, isInitialized, router, db])

  return (
    <div className="flex-1 bg-black min-h-screen flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-white/5 rounded-full" />
        <div className="w-20 h-20 border-4 border-[#00A2FF] border-t-transparent rounded-full animate-spin absolute inset-0" />
      </div>
    </div>
  )
}
