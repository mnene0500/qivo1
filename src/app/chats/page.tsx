"use client"

import { useEffect, useState, Suspense, useCallback, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Send, ChevronLeft, Loader2, User, Lock, Gem, Gift, Video, Phone, Trash2, MoreVertical, Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser } from "@/firebase/auth/use-user"
import { format } from "date-fns"
import { sendGiftAction, clearChatAction } from "@/app/actions/matchflow-actions"
import { checkCallBalanceAction, startCallAction } from "@/app/actions/call-actions"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Message {
  id: string | number
  text: string
  sender_id: string
  timestamp: number
  is_gift?: boolean
  is_optimistic?: boolean
}

interface ChatSummary {
  id: string
  partner_id: string
  partner_name: string
  partner_photo: string
  last_message: string
  last_message_at: number
  unread_count: number
  last_seen_at?: Record<string, number>
  cleared_at?: Record<string, number>
}

const GIFTS = [
  { name: "Rose", icon: "🌹", price: 10 },
  { name: "Coffee", icon: "☕", price: 50 },
  { name: "Heart", icon: "❤️", price: 100 },
  { name: "Diamond", icon: "💎", price: 500 },
  { name: "Luxury Car", icon: "🏎️", price: 1000 },
]

function ChatsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user: currentUser, loading: authLoading, isInitialized } = useUser()
  const startWithId = searchParams.get("startWith")
  const autoMsg = searchParams.get("autoMsg")
  
  const [chatId, setChatId] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [chatSummaries, setChatSummaries] = useState<ChatSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [partnerProfile, setPartnerProfile] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [activeChatClearedAt, setActiveChatClearedAt] = useState<number>(0)
  const [isGifting, setIsGifting] = useState(false)
  const [giftDialogOpen, setGiftDialogOpen] = useState(false)
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null)

  const hasSentAutoMsg = useRef(false)

  useEffect(() => {
    if (isInitialized && !authLoading && !currentUser) {
      router.replace("/welcome")
    }
  }, [currentUser, isInitialized, authLoading, router])

  const markAsSeen = async (id: string, customTime?: number) => {
    if (!currentUser?.id) return
    const { data } = await supabase.from('chats').select('last_seen_at').eq('id', id).maybeSingle()
    const newSeenAt = { ...(data?.last_seen_at || {}), [currentUser.id]: customTime || Date.now() }
    await supabase.from('chats').update({ last_seen_at: newSeenAt }).eq('id', id)
  }

  useEffect(() => {
    if (!currentUser?.id) return
    supabase.from('users').select('*').eq('uid', currentUser.id).maybeSingle().then(({ data }) => setUserProfile(data))
  }, [currentUser?.id])

  const fetchSummaries = useCallback(async () => {
    if (!currentUser?.id || !userProfile) return
    const { data: chatsData } = await supabase.from('chats').select('*').contains('participant_ids', [currentUser.id]).order('last_message_at', { ascending: false })
    if (chatsData) {
      const blockedUids = new Set([...(userProfile.blocking || []), ...(userProfile.blocked_by || [])]);
      const enhanced = await Promise.all(chatsData.map(async (c) => {
        const pId = c.participant_ids.find((id: string) => id !== currentUser.id)
        if (!pId || blockedUids.has(pId)) return null;

        const myClearedAt = c.cleared_at?.[currentUser.id] || 0;
        if (c.last_message_at <= myClearedAt) return null;

        const { data: p } = await supabase.from('users').select('name, photo_url').eq('uid', pId).maybeSingle()
        
        const mySeenAt = c.last_seen_at?.[currentUser.id] || 0;
        const isUnread = c.last_message_at > mySeenAt && c.participant_ids[0] !== currentUser.id;

        return {
          id: c.id,
          partner_id: pId,
          partner_name: p?.name || `User`,
          partner_photo: p?.photo_url || "",
          last_message: c.last_message || "",
          last_message_at: c.last_message_at || Date.now(),
          unread_count: isUnread ? 1 : 0
        } as ChatSummary
      }))
      setChatSummaries(enhanced.filter(Boolean) as ChatSummary[])
    }
    setLoading(false)
  }, [currentUser?.id, userProfile])

  useEffect(() => {
    if (currentUser?.id && userProfile && !startWithId) {
      fetchSummaries()
      const channel = supabase.channel('chats_realtime').on('postgres_changes', { event: '*', table: 'chats' }, () => fetchSummaries()).subscribe()
      return () => { supabase.removeChannel(channel) }
    }
  }, [currentUser?.id, userProfile, startWithId, fetchSummaries])

  useEffect(() => {
    if (currentUser?.id && startWithId) {
      const ids = [currentUser.id, startWithId].sort()
      const cId = `direct_${ids[0]}_${ids[1]}`
      setChatId(cId)
      markAsSeen(cId)
      supabase.from('users').select('*').eq('uid', startWithId).maybeSingle().then(({ data }) => setPartnerProfile(data))
      supabase.from('chats').select('cleared_at').eq('id', cId).maybeSingle().then(({ data }) => setActiveChatClearedAt(data?.cleared_at?.[currentUser.id] || 0))
    }
  }, [currentUser?.id, startWithId])

  useEffect(() => {
    if (!chatId) return
    const fetchMessages = async () => {
      const { data } = await supabase.from('messages').select('*').eq('chat_id', chatId).gt('timestamp', activeChatClearedAt).order('timestamp', { ascending: false }).limit(50)
      if (data) setMessages(data)
    }
    fetchMessages()
    
    const channel = supabase.channel(`messages:${chatId}`).on('postgres_changes', { event: 'INSERT', table: 'messages', filter: `chat_id=eq.${chatId}` }, (payload) => {
      const newMsg = payload.new as Message
      if (newMsg.timestamp <= activeChatClearedAt) return
      setMessages(prev => {
        const exists = prev.some(m => m.text === newMsg.text && Math.abs(m.timestamp - newMsg.timestamp) < 5000)
        if (exists) return prev.map(m => (m.text === newMsg.text && m.is_optimistic) ? newMsg : m)
        return [newMsg, ...prev]
      })
      markAsSeen(chatId)
    }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [chatId, activeChatClearedAt])

  useEffect(() => {
    if (chatId && autoMsg === 'buy_coins' && !hasSentAutoMsg.current && currentUser?.id && startWithId) {
      hasSentAutoMsg.current = true;
      const text = "I want to buy coins. Please guide me on the payment process.";
      const ts = Date.now();
      supabase.from('chats').upsert({ id: chatId, last_message: text, last_message_at: ts, participant_ids: [currentUser.id, startWithId] }).then(() => {
        supabase.from('messages').insert({ chat_id: chatId, text, sender_id: currentUser.id, timestamp: ts })
      });
    }
  }, [chatId, autoMsg, currentUser?.id, startWithId])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatId || !currentUser?.id || !startWithId) return
    const text = newMessage.trim()
    const timestamp = Date.now()
    const optimisticMsg: Message = { id: `temp-${timestamp}`, text, sender_id: currentUser.id, timestamp, is_optimistic: true }
    
    setMessages(prev => [optimisticMsg, ...prev])
    setNewMessage("")

    const { error: chatError } = await supabase.from('chats').upsert({ 
      id: chatId, 
      last_message: text, 
      last_message_at: timestamp, 
      participant_ids: [currentUser.id, startWithId] 
    })

    if (chatError) {
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
      toast({ variant: "destructive", title: "Chat failed to initialize" })
      return
    }

    const { error: msgError } = await supabase.from('messages').insert({ chat_id: chatId, text, sender_id: currentUser.id, timestamp })
    if (!msgError) {
      await markAsSeen(chatId, timestamp)
    } else {
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
      toast({ variant: "destructive", title: "Failed to send message" })
    }
  }

  const handleClearChat = async (id?: string) => {
    const targetId = id || chatId
    if (!currentUser || !targetId) return
    const res = await clearChatAction(currentUser.id, targetId)
    if (res.success) {
      toast({ title: "Chat Cleared" })
      if (!id) router.push("/chats")
      else fetchSummaries()
      setDeletingChatId(null)
    }
  }

  const handleStartCall = async (type: 'video' | 'voice') => {
    if (!currentUser || !startWithId || !chatId) return
    
    const balanceCheck = await checkCallBalanceAction(currentUser.id, type)
    if (!balanceCheck.success) {
      toast({ variant: "destructive", title: "Insufficient Coins", description: balanceCheck.error })
      router.push("/recharge")
      return
    }

    const res = await startCallAction(chatId, currentUser.id, startWithId, type)
    if (res.success) {
      router.push(`/call/${chatId}?type=${type}&partnerId=${startWithId}&callId=${res.callId}`)
    } else {
      toast({ variant: "destructive", title: "Call Error", description: res.error })
    }
  }

  const handleSendGift = async (gift: typeof GIFTS[0]) => {
    if (!currentUser || !startWithId || !partnerProfile) return
    setIsGifting(true)
    try {
      const res = await sendGiftAction(currentUser.id, startWithId, gift.price, gift.name)
      if (res.success) {
        toast({ title: "Gift Sent!", description: `You sent a ${gift.name}.` })
        setGiftDialogOpen(false)
      } else {
        toast({ variant: "destructive", title: "Error", description: res.error })
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to send gift" })
    } finally {
      setIsGifting(false)
    }
  }

  const isBlocked = userProfile && partnerProfile && (
    (userProfile.blocking || []).includes(partnerProfile.uid) || 
    (userProfile.blocked_by || []).includes(partnerProfile.uid)
  );

  if (authLoading || !isInitialized) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-[#00A2FF]" /></div>

  if (!startWithId) return (
    <div className="flex-1 bg-white min-h-screen pb-20 select-none">
      <header className="px-6 h-16 flex items-center border-b sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <h1 className="text-3xl font-logo text-[#00A2FF]">Chats</h1>
      </header>
      <main className="flex flex-col">
        {loading ? (<div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#00A2FF] font-black" /></div>) : chatSummaries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 opacity-40 px-12 text-center">
            <User className="w-12 h-12 mb-4 text-gray-300" />
            <p className="font-bold text-xs uppercase tracking-[0.2em]">No conversations</p>
          </div>
        ) : chatSummaries.map(s => (
          <div 
            key={s.id} 
            onContextMenu={(e) => { e.preventDefault(); setDeletingChatId(s.id); }}
            onClick={() => router.push(`/chats?startWith=${s.partner_id}`)} 
            className="p-5 flex items-center gap-4 active:bg-gray-50 cursor-pointer"
          >
            <div className="relative">
              <Avatar className="w-14 h-14 border"><AvatarImage src={`${s.partner_photo}?t=${Date.now()}`} className="object-cover" /><AvatarFallback>{s.partner_name[0]}</AvatarFallback></Avatar>
              {s.unread_count > 0 && <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-in zoom-in">{s.unread_count}</div>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between mb-1">
                <p className="text-sm font-black truncate">{s.partner_name}</p>
                <span className="text-[9px] font-bold text-gray-300 uppercase">{format(s.last_message_at, "HH:mm")}</span>
              </div>
              <p className={cn("text-xs truncate", s.unread_count > 0 ? "font-bold text-black" : "text-gray-400")}>{s.last_message}</p>
            </div>
          </div>
        ))}
      </main>

      <AlertDialog open={!!deletingChatId} onOpenChange={(open) => !open && setDeletingChatId(null)}>
        <AlertDialogContent className="rounded-[2rem] max-w-[70vw] p-8 border-none select-none">
          <AlertDialogFooter className="flex flex-row items-center justify-center gap-6">
            <AlertDialogCancel className="flex-1 h-14 rounded-full border-gray-100 bg-gray-50 text-gray-400 font-black uppercase text-[10px] tracking-widest border-none">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleClearChat(deletingChatId!)} className="flex-1 h-14 rounded-full bg-red-500 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-100">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )

  return (
    <div className="flex flex-col h-screen bg-white select-none overflow-hidden">
      <header className="h-16 border-b flex items-center px-4 gap-4 bg-white z-50">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full"><ChevronLeft className="w-6 h-6 text-black" /></Button>
        <div className="flex items-center gap-3 flex-1">
          <Avatar className="w-10 h-10 border"><AvatarImage src={`${partnerProfile?.photo_url}?t=${Date.now()}`} className="object-cover" /><AvatarFallback>{partnerProfile?.name?.[0]}</AvatarFallback></Avatar>
          <div><p className="font-black text-sm leading-none">{partnerProfile?.name || '...'}</p><p className="text-[9px] font-bold text-green-500 uppercase tracking-widest mt-1">{isBlocked ? "Unavailable" : "Available"}</p></div>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="rounded-full text-[#00A2FF]" onClick={() => handleStartCall('voice')}><Phone className="w-5 h-5" /></Button>
          <Button size="icon" variant="ghost" className="rounded-full text-[#00A2FF]" onClick={() => handleStartCall('video')}><Video className="w-5 h-5" /></Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className="rounded-full text-gray-400"><MoreVertical className="w-5 h-5" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl min-w-[160px]">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500 font-bold gap-2"><Trash2 className="w-4 h-4" /> Clear Chat</DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-[2.5rem] max-w-[85vw] p-8 border-none select-none">
                  <AlertDialogHeader className="items-center text-center">
                    <AlertDialogTitle className="text-xl font-bold">Clear conversation?</AlertDialogTitle>
                    <AlertDialogDescription className="text-xs font-bold pt-2 uppercase tracking-widest leading-relaxed text-center">This will hide this chat from your list until a new message is sent.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex flex-row items-center justify-center gap-4 mt-6">
                    <AlertDialogCancel className="flex-1 h-14 rounded-full border-gray-100 bg-gray-50 text-gray-400 font-black uppercase text-[10px] tracking-widest border-none">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleClearChat()} className="flex-1 h-14 rounded-full bg-red-500 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-100">Clear</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 flex flex-col-reverse gap-4 bg-gray-50 no-scrollbar">
        {messages.map(m => {
          const isMe = m.sender_id === currentUser?.id;
          const gift = m.is_gift ? GIFTS.find(g => m.text.includes(g.name)) : null;

          return (
            <div key={m.id} className={cn("max-w-[80%] p-4 rounded-[2rem] text-sm font-medium shadow-sm animate-in zoom-in-95 relative", 
              isMe ? "bg-[#00A2FF] text-white self-end rounded-br-none" : "bg-white text-black self-start rounded-bl-none border",
              m.is_gift && "bg-gradient-to-br from-pink-500 to-rose-600 text-white border-none shadow-pink-100 p-6 flex flex-col items-center text-center gap-3"
            )}>
              {m.is_gift ? (
                <>
                  <div className="text-5xl animate-bounce">{gift?.icon || "🎁"}</div>
                  <p className="font-black uppercase tracking-widest text-[10px]">{gift?.name || "Premium Gift"}</p>
                  {isMe && (
                    <Button 
                      size="sm" 
                      onClick={() => handleSendGift(gift!)} 
                      className="mt-2 h-8 rounded-full bg-white/20 backdrop-blur-md text-white font-black text-[9px] uppercase tracking-widest border border-white/20 hover:bg-white/30"
                    >
                      Send One More
                    </Button>
                  )}
                </>
              ) : m.text}
            </div>
          )
        })}
      </main>

      <footer className="relative p-4 border-t bg-white">
        {isBlocked ? (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
             <div className="flex items-center gap-3 bg-red-50 text-red-600 px-6 py-3 rounded-2xl border border-red-100">
                <Lock className="w-5 h-5" /><span className="text-xs font-black uppercase tracking-widest">Communication Blocked</span>
             </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Dialog open={giftDialogOpen} onOpenChange={setGiftDialogOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="rounded-full h-12 w-12 text-pink-500 hover:bg-pink-50">
                  <Gift className="w-6 h-6" />
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2.5rem] p-8 max-w-[90vw]">
                <DialogHeader className="items-center text-center">
                  <DialogTitle className="text-xl font-bold uppercase tracking-widest">Send a Gift</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-6">
                  {GIFTS.map((gift) => (
                    <button
                      key={gift.name}
                      onClick={() => handleSendGift(gift)}
                      disabled={isGifting}
                      className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-[2rem] border border-gray-100 active:scale-95 transition-all hover:bg-pink-50 hover:border-pink-200"
                    >
                      <span className="text-4xl">{gift.icon}</span>
                      <div className="text-center">
                        <p className="text-[10px] font-black uppercase text-black">{gift.name}</p>
                        <p className="text-[9px] font-bold text-[#00A2FF] flex items-center justify-center gap-1">
                          <Gem className="w-2.5 h-2.5" /> {gift.price}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>

            <input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} className="flex-1 h-12 bg-gray-50 rounded-2xl px-5 text-sm font-bold outline-none border border-transparent focus:border-[#00A2FF]/20 transition-all" placeholder="Type something..." />
            <Button onClick={handleSendMessage} size="icon" className="rounded-full h-12 w-12 bg-[#00A2FF] shadow-lg shadow-blue-100"><Send className="w-5 h-5" /></Button>
          </div>
        )}
      </footer>
    </div>
  )
}

export default function ChatsPage() { return <Suspense fallback={<div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-[#00A2FF]" /></div>}><ChatsContent /></Suspense> }
