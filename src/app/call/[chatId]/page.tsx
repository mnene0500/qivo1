"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * @fileOverview Calling features have been removed.
 * Redirecting users back to home if they attempt to access call routes.
 */
export default function DeprecatedCallPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace("/home")
  }, [router])

  return null
}
