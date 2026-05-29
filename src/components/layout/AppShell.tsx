"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { BottomNav } from "./BottomNav"
import { Suspense } from "react"
import { cn } from "@/lib/utils"

/**
 * @fileOverview Viewport-Centric App Shell.
 * Ensures persistent UI (BottomNav) stays fixed while content scrolls independently.
 * Explore route removed.
 */
function ShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Logic to determine if global nav should be shown
  const isChatDetail = pathname === '/chats' && searchParams.has('startWith')
  const isCall = pathname?.startsWith('/call/')
  const isWelcome = pathname === '/welcome'
  const isAuth = pathname === '/auth'
  const isSplash = pathname === '/'
  
  const showNav = ['/home', '/chats', '/profile'].includes(pathname || "") && !isChatDetail && !isCall && !isWelcome && !isAuth && !isSplash

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-white">
      {/* 
        MAIN CONTENT AREA: 
        This is the ONLY area that scrolls. Everything else (BottomNav) 
        stays perfectly still.
      */}
      <main className={cn(
        "flex-1 w-full overflow-y-auto overflow-x-hidden relative z-0 no-scrollbar pb-[env(safe-area-inset-bottom)]",
        showNav && "pb-20", // Spacing for BottomNav
        "native-page-transition"
      )}>
        {children}
      </main>
      
      {/* FIXED NAVIGATION: Outside of scroll area */}
      {showNav && <BottomNav />}
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex-1 bg-white h-screen" />}>
      <ShellContent>
        {children}
      </ShellContent>
    </Suspense>
  )
}
