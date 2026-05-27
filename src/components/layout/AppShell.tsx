
"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { BottomNav } from "./BottomNav"
import { Suspense } from "react"
import { cn } from "@/lib/utils"

/**
 * @fileOverview Signaling Shell.
 * Optimized for native feel and fixed navigation.
 */
function ShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const isChatDetail = pathname === '/chats' && searchParams.has('startWith')
  const isVisible = ['/home', '/chats', '/profile'].includes(pathname || "") && !isChatDetail

  return (
    <div className="flex-1 flex flex-col relative min-h-screen bg-white">
      {/* WRAP CHILDREN IN TRANSITION CONTAINER */}
      <main className={cn(
        "flex-1 flex flex-col relative z-0",
        isVisible && "pb-20", // Add padding so content doesn't hide behind BottomNav
        "native-page-transition"
      )}>
        {children}
      </main>
      
      {isVisible && <BottomNav />}
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex-1 bg-white" />}>
      <ShellContent>
        {children}
      </ShellContent>
    </Suspense>
  )
}
