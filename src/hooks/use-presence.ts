
"use client"
import { useEffect } from 'react'
import { dailyHeartbeatAction } from '@/app/actions/matchflow-actions'
import { useUser } from '@/firebase/auth/use-user'

/**
 * Hook to manage user presence heartbeat.
 */
export function usePresence() {
  const { user } = useUser()

  useEffect(() => {
    if (!user?.id) return

    const heartbeat = () => dailyHeartbeatAction(user.id);
    heartbeat();
    const interval = setInterval(heartbeat, 60000); 

    return () => clearInterval(interval);
  }, [user?.id])
}
