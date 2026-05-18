"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Mail, Zap, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { signInAnonymously } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { useAuth, useUser, useFirestore } from "@/firebase"
import Image from "next/image"
import Link from "next/link"

/**
 * @fileOverview Welcome / Auth Entry Page.
 * Strictly remains invisible (blank) if any session is detected to prevent flickering.
 */
export default function WelcomePage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const auth = useAuth()
  const db = useFirestore()
  const { user, loading: authLoading, isInitialized } = useUser()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Guard: If user lands here but is already logged in, redirect away silently
  useEffect(() => {
    if (isInitialized && user) {
      const checkRedirect = async () => {
        try {
          const userRef = doc(db, "users", user.uid)
          const snap = await getDoc(userRef)
          if (snap.exists() && snap.data().onboardingComplete) {
            router.replace("/home")
          } else {
            router.replace("/onboarding")
          }
        } catch (e) {
          // If check fails, stay blank until router processes next move
        }
      }
      checkRedirect()
    }
  }, [user, isInitialized, router, db])

  const handleFastLogin = async () => {
    if (auth.currentUser) {
      router.push("/onboarding?fast=true")
      return
    }

    setLoading(true)
    try {
      await signInAnonymously(auth)
      router.push("/onboarding?fast=true")
    } catch (error) {
      setLoading(false)
    }
  }

  // CRITICAL: If auth is loading, or we have a user (redirecting), 
  // or the session isn't confirmed as "empty" yet, show nothing.
  if (!mounted || authLoading || !isInitialized || user) {
    return <div className="flex-1 bg-black min-h-screen" />
  }

  return (
    <div className="relative flex-1 flex flex-col min-h-screen bg-black overflow-hidden select-none">
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0 scale-105 animate-pulse-slow">
        <Image 
          src="https://picsum.photos/seed/matchlove/1000/1500" 
          alt="Welcome" 
          fill 
          className="object-cover opacity-70"
          data-ai-hint="couple romance"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col px-8 pt-48 pb-16 justify-between items-center text-center">
        <div className="flex flex-col items-center space-y-6 animate-in slide-in-from-top-10 duration-1000">
          <div className="space-y-3">
            <h1 className="text-5xl font-logo font-black text-white drop-shadow-2xl tracking-tight">
              MatchFlow
            </h1>
            <div className="flex items-center justify-center gap-2">
              <div className="h-[1px] w-8 bg-white/20" />
              <p className="text-white/60 font-black text-[10px] uppercase tracking-[0.4em]">
                Connect with Heart
              </p>
              <div className="h-[1px] w-8 bg-white/20" />
            </div>
          </div>
        </div>

        <div className="w-full max-w-sm space-y-4 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <Button 
            onClick={() => router.push("/auth")}
            className="w-full h-16 rounded-3xl bg-white text-black hover:bg-white/90 font-bold text-sm tracking-widest uppercase shadow-2xl active:scale-95 transition-all"
          >
            <div className="flex items-center justify-center gap-3">
              <Mail className="w-5 h-5" />
              Continue with Email
            </div>
          </Button>

          <Button 
            disabled={loading}
            onClick={handleFastLogin}
            variant="ghost"
            className="w-full h-16 rounded-3xl border border-white/20 bg-white/5 backdrop-blur-xl text-white hover:bg-white/10 font-bold text-sm tracking-widest uppercase active:scale-95 transition-all"
          >
            <div className="flex items-center justify-center gap-3">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              )}
              Fast login
            </div>
          </Button>

          <div className="pt-8">
            <p className="text-[10px] text-white/30 font-medium px-8 leading-relaxed">
              By entering, you confirm you are 18+ and agree to our{' '}
              <Link href="/terms" className="text-white/50 underline underline-offset-4 decoration-white/20">Terms</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-white/50 underline underline-offset-4 decoration-white/20">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}