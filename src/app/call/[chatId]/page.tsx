
"use client"

import { useEffect, useRef, use, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useUser, useDoc, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"
import { Loader2, Coins, AlertCircle } from "lucide-react"
import { deductCallCoinsAction } from "@/app/actions/call-actions"
import { useToast } from "@/hooks/use-toast"

/**
 * @fileOverview One-on-one Video/Voice call interface with per-minute billing.
 */
export default function CallPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const containerRef = useRef<HTMLDivElement>(null)
  const billingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const zpRef = useRef<any>(null)
  
  const isVideo = searchParams.get('type') !== 'voice'
  const isCaller = searchParams.get('caller') === 'true'
  const partnerName = searchParams.get('partner') || "Partner"
  
  const { data: profile } = useDoc<any>(user?.uid ? doc(db, "users", user.uid) : null)
  const [isJoined, setIsJoined] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDeduction = async () => {
    if (!user || !isCaller) return true;
    
    const type = isVideo ? 'video' : 'voice';
    const result = await deductCallCoinsAction(user.uid, type, partnerName);
    
    if (!result.success) {
      toast({ variant: "destructive", title: "Balance Depleted", description: result.error });
      if (zpRef.current) {
        zpRef.current.leaveRoom();
      }
      router.replace("/chats");
      return false;
    }
    return true;
  }

  useEffect(() => {
    if (!user || !profile || !containerRef.current) return

    const initCall = async () => {
      try {
        const { ZegoUIKitPrebuilt } = await import('@zegocloud/zego-uikit-prebuilt')
        
        const appID = Number(process.env.NEXT_PUBLIC_ZEGO_APP_ID)
        const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET || "ea06598c894f6f874530007d468f7004"
        
        if (!appID) {
          setError("Zego App ID is missing. Check environment variables.")
          return
        }

        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID,
          serverSecret,
          chatId,
          user.uid,
          profile.name || "User"
        )

        const zp = ZegoUIKitPrebuilt.create(kitToken)
        zpRef.current = zp;
        
        zp.joinRoom({
          container: containerRef.current,
          mode: ZegoUIKitPrebuilt.OneONoneCall,
          showPreJoinView: false,
          scenario: {
            mode: isVideo ? ZegoUIKitPrebuilt.VideoCall : ZegoUIKitPrebuilt.VoiceCall,
          },
          onUserJoin: async (users) => {
            // BILLING TRIGGER: Start charging when the partner joins
            if (isCaller && !billingIntervalRef.current) {
               const success = await handleDeduction();
               if (success) {
                 billingIntervalRef.current = setInterval(handleDeduction, 60000);
               }
            }
          },
          onLeaveRoom: () => {
            if (billingIntervalRef.current) {
              clearInterval(billingIntervalRef.current);
            }
            router.replace("/chats")
          },
        })
        setIsJoined(true)
      } catch (err: any) {
        console.error("Zego Init Error:", err)
        setError(err.message || "Failed to initialize call service.")
      }
    }

    initCall()

    return () => {
      if (billingIntervalRef.current) {
        clearInterval(billingIntervalRef.current);
      }
    }
  }, [user, profile, chatId, isVideo, router, isCaller])

  if (error) {
    return (
      <div className="flex-1 bg-black flex flex-col items-center justify-center text-white p-10 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="font-bold uppercase tracking-widest text-xs mb-6">{error}</p>
        <Button onClick={() => router.replace("/chats")} className="rounded-full bg-white text-black font-bold uppercase tracking-widest text-[10px]">Go Back</Button>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="flex-1 bg-black flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-[#00A2FF]" />
        <p className="mt-4 font-bold uppercase tracking-widest text-[10px]">Preparing Call...</p>
      </div>
    )
  }

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative">
      <div ref={containerRef} className="w-full h-full" />
      
      {isCaller && isJoined && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex items-center gap-2">
           <Coins className="w-3.5 h-3.5 text-yellow-500" />
           <span className="text-[10px] font-black text-white uppercase tracking-widest">
             {isVideo ? '150' : '70'} coins / min
           </span>
        </div>
      )}
    </div>
  )
}
