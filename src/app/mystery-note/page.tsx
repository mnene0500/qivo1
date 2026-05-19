"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { collection, query, where, limit, getDocs, doc } from "firebase/firestore"
import { ref, update, increment as rtdbIncrement, push, set, get } from "firebase/database"
import { useFirestore, useUser, useDoc, useDatabase } from "@/firebase"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, Coins, Users, Loader2, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const RECIPIENT_OPTIONS = [2, 5, 10, 20]
const COST_PER_PERSON = 5

export default function MysteryNotePage() {
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()
  const rtdb = useDatabase()
  const { toast } = useToast()

  const [message, setMessage] = useState("")
  const [recipientCount, setRecipientCount] = useState(2)
  const [isSending, setIsSending] = useState(false)
  const [userCoins, setUserCoins] = useState(0)

  const userRef = useMemo(() => user?.uid && db ? doc(db, "users", user.uid) : null, [db, user?.uid])
  const { data: profile } = useDoc<any>(userRef)

  useEffect(() => {
    if (!user?.uid || !rtdb) return
    const balRef = ref(rtdb, `balances/${user.uid}/coins`)
    get(balRef).then(snap => {
      if (snap.exists()) setUserCoins(snap.val())
    })
  }, [user?.uid, rtdb])

  const totalCost = recipientCount * COST_PER_PERSON

  const handleSend = async () => {
    if (!user || !profile || !message.trim() || !db || !rtdb) return
    if (userCoins < totalCost) {
      toast({ variant: "destructive", title: "Insufficient Coins", description: `You need ${totalCost} coins to send this note.` })
      return
    }

    setIsSending(true)
    try {
      const targetGender = profile.gender === 'male' ? 'female' : 'male'
      const q = query(
        collection(db, "users"),
        where("gender", "==", targetGender),
        where("onboardingComplete", "==", true),
        limit(50)
      )
      const snap = await getDocs(q)
      const allTargets = snap.docs
        .map(d => ({ uid: d.id, ...d.data() } as any))
        .filter(u => u.uid !== user.uid)
        .sort(() => Math.random() - 0.5)
        .slice(0, recipientCount)

      if (allTargets.length < recipientCount) {
        toast({ variant: "destructive", title: "Not enough users", description: "Could not find enough recipients of the opposite gender." })
        setIsSending(false)
        return
      }

      const timestamp = Date.now()
      
      await update(ref(rtdb, `balances/${user.uid}`), {
        coins: rtdbIncrement(-totalCost),
        updatedAt: timestamp
      })
      await push(ref(rtdb, `coin_history/${user.uid}`), {
        amount: -totalCost,
        type: 'mystery_note',
        description: `Sent Mystery Note to ${recipientCount} people`,
        timestamp
      })

      for (const target of allTargets) {
        const ids = [user.uid, target.uid].sort()
        const chatId = `direct_${ids[0]}_${ids[1]}`

        const msgData = {
          text: message.trim(),
          senderId: user.uid,
          timestamp
        }
        
        await set(push(ref(rtdb, `chat_messages/${chatId}`)), msgData)

        const updates: any = {}
        updates[`user_chats/${user.uid}/${chatId}`] = {
          partnerId: target.uid,
          partnerName: target.name || "Unknown",
          partnerPhoto: target.photoURL || "",
          lastMessage: message.trim(),
          lastMessageAt: timestamp,
          unreadCount: 0
        }
        updates[`user_chats/${target.uid}/${chatId}`] = {
          partnerId: user.uid,
          partnerName: profile.name || "User",
          partnerPhoto: profile.photoURL || "",
          lastMessage: message.trim(),
          lastMessageAt: timestamp,
          unreadCount: rtdbIncrement(1)
        }
        await update(ref(rtdb), updates)
      }

      toast({ title: "Note Sent!", description: `Your note was delivered to ${recipientCount} people.` })
      router.push("/chats")
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex-1 bg-[#FF6B00] min-h-screen flex flex-col select-none relative overflow-hidden">
      <div className="absolute -top-10 -right-20 w-80 h-80 opacity-40 pointer-events-none">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 80C140 30 190 50 190 100C190 150 140 170 100 120C60 170 10 150 10 100C10 50 60 30 100 80Z" fill="white" fillOpacity="0.2"/>
            <rect x="95" y="60" width="10" height="80" rx="5" fill="white" fillOpacity="0.3"/>
        </svg>
      </div>

      <header className="px-4 h-16 flex items-center bg-transparent z-50">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full text-white hover:bg-white/10">
          <ChevronLeft className="w-8 h-8" />
        </Button>
      </header>

      <main className="flex-1 px-6 pt-4 pb-10 space-y-8 overflow-y-auto no-scrollbar">
        <div className="space-y-1">
          <h1 className="text-5xl font-black text-white tracking-tight leading-tight">Leave a message</h1>
          <p className="text-lg font-bold text-white/80">Check others messages</p>
        </div>

        <div className="space-y-3">
          {["Hello. I'm not here for money, I just want to chat", "💕💕 nice to meet you here 💗", "hi honey I'm alone, so maybe we can do sth nice together???"].map((t, i) => (
            <div key={i} className={cn(
              "px-5 py-3 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-white font-bold text-sm max-w-[90%]",
              i % 2 === 1 ? "ml-auto rounded-br-none" : "mr-auto rounded-bl-none"
            )}>
              {t}
            </div>
          ))}
        </div>

        <div className="bg-white/30 backdrop-blur-xl border border-white/20 rounded-[3rem] p-8 shadow-2xl mt-10 space-y-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-white leading-tight">Tell me a little<br/>secret 🤫 ..</h2>
            <div className="flex items-center justify-between pt-4">
               <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-400 rounded-full shadow-sm">
                  <Coins className="w-3.5 h-3.5 text-orange-700" />
                  <span className="text-[10px] font-black text-orange-900 uppercase">5 coins/person</span>
               </div>
               
               <div className="flex items-center gap-2 px-4 py-1.5 bg-white/20 rounded-full border border-white/30">
                  <Users className="w-3.5 h-3.5 text-white" />
                  <select 
                    value={recipientCount} 
                    onChange={(e) => setRecipientCount(Number(e.target.value))}
                    className="bg-transparent border-none text-xs font-black text-white outline-none cursor-pointer"
                  >
                    {RECIPIENT_OPTIONS.map(n => <option key={n} value={n} className="text-black">{n} people</option>)}
                  </select>
               </div>
            </div>
          </div>

          <div className="relative">
            <Textarea 
              placeholder="Write down your joys/annoyances/doubts/little secrets.."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-white rounded-3xl min-h-[160px] border-none text-black font-bold placeholder:text-gray-300 p-6 text-sm resize-none focus-visible:ring-2 focus-visible:ring-yellow-400/50"
            />
          </div>

          <Button 
            onClick={handleSend}
            disabled={isSending || !message.trim()}
            className="w-full h-16 rounded-full bg-[#FF6B00] hover:bg-[#E65A00] text-white font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-orange-900/20 active:scale-95 transition-all"
          >
            {isSending ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Send for {totalCost} Coins
              </div>
            )}
          </Button>
        </div>
      </main>

      <footer className="p-8 text-center bg-transparent">
        <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">QIVO Anonymous Flux</p>
      </footer>
    </div>
  )
}
