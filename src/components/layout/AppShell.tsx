"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { BottomNav } from "./BottomNav"
import { Suspense, useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { useUser } from "@/firebase/auth/use-user"
import { GlobalCallOverlay } from "../GlobalCallOverlay"

/**
 * @fileOverview Viewport-Centric App Shell with Hardware Navigation Stability.
 * Optimized for mobile history pops and hydration consistency.
 */

function ShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user } = useUser()
  const mainRef = useRef<HTMLElement>(null)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => { 
    setMounted(true) 
  }, [])

  const isChatDetail = pathname === '/chats' && searchParams.has('startWith')
  const isCallScreen = pathname?.startsWith('/call/');
  
  // showNav logic is stable between server and client first pass as user is null on both
  const showNav = user && ['/home', '/chats', '/profile'].includes(pathname || "") && !isChatDetail && !isCallScreen;

  // RECOVERY: Reliably restore scroll on history pop (back button)
  useEffect(() => {
    if (mainRef.current && mounted && pathname) {
      const storageKey = `scroll_${pathname}${searchParams.toString()}`;
      const saved = sessionStorage.getItem(storageKey);
      
      const timer = setTimeout(() => {
        if (mainRef.current) {
          if (saved) {
            mainRef.current.scrollTo({ top: parseInt(saved), behavior: 'instant' });
          } else {
            mainRef.current.scrollTo({ top: 0, behavior: 'instant' });
          }
        }
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams, mounted])

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    if (pathname) {
      const storageKey = `scroll_${pathname}${searchParams.toString()}`;
      sessionStorage.setItem(storageKey, e.currentTarget.scrollTop.toString());
    }
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-white relative">
      <main 
        ref={mainRef}
        onScroll={handleScroll}
        className={cn(
          "flex-1 w-full overflow-y-auto overflow-x-hidden relative z-0 no-scrollbar flex flex-col overscroll-none",
          mounted && showNav ? "pb-16" : "pb-0"
        )}
      >
        <div className={cn("flex-1 flex flex-col", !mounted && "invisible")}>
          {children}
        </div>
      </main>
      {mounted && showNav && <BottomNav />}
      {mounted && user && <GlobalCallOverlay />}
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ShellContent>{children}</ShellContent>
    </Suspense>
  )
}
