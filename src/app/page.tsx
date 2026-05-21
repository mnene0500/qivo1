"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/firebase"

/**
 * Root Redirector with Cinematic Splash Screen.
 * Optimized for speed and handles session verification via hybrid auth.
 */
export default function RootPage() {
  const router = useRouter()
  const { user, loading: authLoading, isInitialized } = useUser()
  const [minTimeElapsed, setMinTimeElapsed] = useState(false)

  useEffect(() => {
    const brandingTimer = setTimeout(() => setMinTimeElapsed(true), 600)
    
    const safetyTimer = setTimeout(() => {
      if (!isInitialized || authLoading) {
        router.replace("/welcome")
      }
    }, 4000)

    return () => {
      clearTimeout(brandingTimer)
      clearTimeout(safetyTimer)
    }
  }, [isInitialized, authLoading, router])

  useEffect(() => {
    if (!minTimeElapsed || !isInitialized || authLoading) return

    if (user) {
      // Logic inside useUser or welcome/page.tsx handles profile checks
      router.replace("/home")
    } else {
      router.replace("/welcome")
    }
  }, [user, isInitialized, authLoading, router, minTimeElapsed])

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#00A2FF]/20 rounded-full blur-[100px] animate-pulse-slow" />
      
      <div className="relative z-10 flex flex-col items-center gap-6">
        <h1 className="text-7xl font-logo text-white tracking-tight drop-shadow-2xl animate-in fade-in zoom-in-95 duration-700">
          QIVO
        </h1>
      </div>

      <div className="absolute bottom-16 inset-x-0 flex justify-center">
        <div className="flex gap-1.5">
          <div className="w-1.5 h-1.5 bg-[#00A2FF]/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1.5 h-1.5 bg-[#00A2FF]/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1.5 h-1.5 bg-[#00A2FF]/40 rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  )
}
