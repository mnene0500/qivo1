
"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { BottomNav } from "./BottomNav"
import { Suspense, useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { useUser } from "@/firebase/auth/use-user"

/**
 * @fileOverview Viewport-Centric App Shell with Scroll Persistence.
 */

function ShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user } = useUser()
  const mainRef = useRef<HTMLElement>(null)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => { setMounted(true) }, [])

  const isChatDetail = pathname === '/chats' && searchParams.has('startWith')
  const showNav = user && ['/home', '/chats', '/profile'].includes(pathname || "") && !isChatDetail;

  useEffect(() => {
    if (mainRef.current && mounted && pathname) {
      const saved = sessionStorage.getItem(`scroll_${pathname}`);
      if (saved) {
        setTimeout(() => { if (mainRef.current) mainRef.current.scrollTop = parseInt(saved); }, 50);
      } else {
        mainRef.current.scrollTop = 0;
      }
    }
  }, [pathname, mounted])

  useEffect(() => {
    const current = mainRef.current;
    if (!current || !pathname) return;
    const handleScroll = () => sessionStorage.setItem(`scroll_${pathname}`, current.scrollTop.toString());
    current.addEventListener('scroll', handleScroll, { passive: true });
    return () => current.removeEventListener('scroll', handleScroll);
  }, [pathname])

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-white relative">
      <main 
        ref={mainRef}
        className={cn(
          "flex-1 w-full overflow-y-auto overflow-x-hidden relative z-0 no-scrollbar flex flex-col",
          mounted && showNav ? "pb-16" : "pb-0"
        )}
      >
        <div className={cn("flex-1 flex flex-col", !mounted && "invisible")}>{children}</div>
      </main>
      {mounted && showNav && <BottomNav />}
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}><ShellContent>{children}</ShellContent></Suspense>
}
