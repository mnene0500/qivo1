
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/firebase"
import { Loader2 } from "lucide-react"

/**
 * Entry point redirect logic.
 * Routes authenticated users to Home and guests to Welcome.
 */
export default function RootEntry() {
  const router = useRouter()
  const { user, loading, isInitialized } = useUser()

  useEffect(() => {
    if (isInitialized && !loading) {
      if (user) {
        router.replace("/home")
      } else {
        router.replace("/welcome")
      }
    }
  }, [user, loading, isInitialized, router])

  return (
    <div className="flex-1 bg-black min-h-screen flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-white/5 rounded-full" />
        <div className="w-20 h-20 border-4 border-[#00A2FF] border-t-transparent rounded-full animate-spin absolute inset-0" />
      </div>
      <p className="mt-8 text-[10px] font-black text-white/40 uppercase tracking-[0.4em] animate-pulse">
        Synchronising Flow...
      </p>
    </div>
  )
}
