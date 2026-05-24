
"use client"

import { useEffect, useState, useRef, use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PhoneOff, Mic, MicOff, Video, VideoOff, Camera, Loader2, User } from "lucide-react"
import { useUser } from "@/firebase/auth/use-user"
import { supabase } from "@/lib/supabase"
import { generateAgoraTokenAction, deductCallCoinsAction, endCallAction } from "@/app/actions/call-actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

/**
 * @fileOverview Agora Audio/Video Call Page.
 * Implements real-time signaling via Supabase and per-minute coin deductions.
 */

export default function CallPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = use(params)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useUser()

  const type = searchParams.get("type") as 'video' | 'voice'
  const partnerId = searchParams.get("partnerId")
  const callId = searchParams.get("callId")

  const [rtc, setRtc] = useState<{ client: any, localAudioTrack: any, localVideoTrack: any }>({ 
    client: null, 
    localAudioTrack: null, 
    localVideoTrack: null 
  })
  
  const [joined, setJoined] = useState(false)
  const [muted, setMute] = useState(false)
  const [cameraOff, setCameraOff] = useState(type === 'voice')
  const [remoteUser, setRemoteUser] = useState<any>(null)
  const [partnerProfile, setPartnerProfile] = useState<any>(null)
  const [duration, setDuration] = useState(0)

  const localVideoRef = useRef<HTMLDivElement>(null)
  const remoteVideoRef = useRef<HTMLDivElement>(null)
  const billingTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!partnerId) return
    supabase.from('users').select('*').eq('uid', partnerId).single().then(({ data }) => setPartnerProfile(data))
  }, [partnerId])

  // REALTIME SIGNALING: End call on both sides
  useEffect(() => {
    if (!callId) return
    const channel = supabase.channel(`call-signaling-${callId}`)
      .on('postgres_changes', { event: 'UPDATE', table: 'calls', filter: `id=eq.${callId}` }, (payload) => {
        if (payload.new.status === 'ended') {
          handleEndCall(false)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [callId])

  // BILLING TIMER (Runs every minute)
  useEffect(() => {
    if (joined && user?.id && partnerId) {
      billingTimer.current = setInterval(async () => {
        setDuration(prev => prev + 1)
        // Deduct coins every 60 seconds
        if (duration > 0 && duration % 60 === 0) {
          const res = await deductCallCoinsAction(user.id, type, partnerId)
          if (!res.success) {
            handleEndCall(true)
          }
        }
      }, 1000)
    }
    return () => { if (billingTimer.current) clearInterval(billingTimer.current) }
  }, [joined, duration, user?.id, partnerId, type])

  useEffect(() => {
    const init = async () => {
      if (typeof window === 'undefined') return
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default
      
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" })
      const tokenData = await generateAgoraTokenAction(chatId, user!.id)
      
      await client.join(tokenData.appId, tokenData.channelName, tokenData.token, tokenData.uid)
      
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack()
      let videoTrack = null
      
      if (type === 'video') {
        videoTrack = await AgoraRTC.createCameraVideoTrack()
        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current)
        }
      }

      await client.publish(videoTrack ? [audioTrack, videoTrack] : [audioTrack])
      
      setRtc({ client, localAudioTrack: audioTrack, localVideoTrack: videoTrack })
      setJoined(true)

      client.on("user-published", async (remoteUser, mediaType) => {
        await client.subscribe(remoteUser, mediaType)
        if (mediaType === "video") {
          setRemoteUser(remoteUser)
          setTimeout(() => {
            if (remoteVideoRef.current) remoteUser.videoTrack?.play(remoteVideoRef.current)
          }, 100)
        }
        if (mediaType === "audio") {
          remoteUser.audioTrack?.play()
        }
      })

      client.on("user-unpublished", (user) => {
        if (user.uid === remoteUser?.uid) setRemoteUser(null)
      })

      client.on("user-left", () => {
        handleEndCall(false)
      })
    }

    if (user?.id && chatId) init()
    
    return () => { handleEndCall(false) }
  }, [chatId, user?.id])

  const handleEndCall = async (manual = true) => {
    if (rtc.localAudioTrack) {
      rtc.localAudioTrack.stop()
      rtc.localAudioTrack.close()
    }
    if (rtc.localVideoTrack) {
      rtc.localVideoTrack.stop()
      rtc.localVideoTrack.close()
    }
    if (rtc.client) {
      await rtc.client.leave()
    }
    if (manual && callId) {
      await endCallAction(callId)
    }
    router.replace(`/chats?startWith=${partnerId}`)
  }

  const toggleMute = () => {
    if (rtc.localAudioTrack) {
      rtc.localAudioTrack.setEnabled(muted)
      setMute(!muted)
    }
  }

  const toggleCamera = () => {
    if (rtc.localVideoTrack) {
      rtc.localVideoTrack.setEnabled(cameraOff)
      setCameraOff(!cameraOff)
    }
  }

  const formatDuration = (s: number) => {
    const mins = Math.floor(s / 60)
    const secs = s % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center select-none overflow-hidden">
      {/* REMOTE VIDEO / FULLSCREEN */}
      <div className="absolute inset-0 z-0">
        {type === 'video' && remoteUser ? (
          <div ref={remoteVideoRef} className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900">
             <Avatar className="w-32 h-32 border-4 border-white/10 shadow-2xl">
               <AvatarImage src={partnerProfile?.photo_url} className="object-cover" />
               <AvatarFallback className="bg-zinc-800 text-zinc-500"><User className="w-16 h-16" /></AvatarFallback>
             </Avatar>
             <h2 className="text-white text-2xl font-black mt-6 tracking-tight">{partnerProfile?.name || 'Connecting...'}</h2>
             <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">
               {joined ? formatDuration(duration) : 'Initializing Agora...'}
             </p>
          </div>
        )}
      </div>

      {/* LOCAL VIDEO (Small Overlay) */}
      {type === 'video' && joined && !cameraOff && (
        <div className="absolute top-12 right-6 w-32 aspect-[3/4] bg-zinc-800 rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl z-20">
          <div ref={localVideoRef} className="w-full h-full" />
        </div>
      )}

      {/* CONTROLS */}
      <div className="absolute bottom-16 inset-x-0 px-8 flex items-center justify-center gap-6 z-50">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleMute}
          className={cn("w-16 h-16 rounded-full backdrop-blur-xl border border-white/10 shadow-2xl transition-all active:scale-90", muted ? "bg-red-500 text-white" : "bg-white/10 text-white")}
        >
          {muted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </Button>

        <Button 
          variant="destructive" 
          size="icon" 
          onClick={() => handleEndCall(true)}
          className="w-20 h-20 rounded-full shadow-2xl shadow-red-500/40 border-4 border-white/10 active:scale-95 transition-all"
        >
          <PhoneOff className="w-8 h-8" />
        </Button>

        {type === 'video' && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleCamera}
            className={cn("w-16 h-16 rounded-full backdrop-blur-xl border border-white/10 shadow-2xl transition-all active:scale-90", cameraOff ? "bg-red-500 text-white" : "bg-white/10 text-white")}
          >
            {cameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </Button>
        )}
      </div>

      {!joined && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[110] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#00A2FF]" />
          <p className="text-white text-xs font-black uppercase tracking-widest opacity-60">Securing Channel...</p>
        </div>
      )}
    </div>
  )
}
