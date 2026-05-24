"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, Coins, Trophy, Loader2, Wallet, UserCheck, Search } from "lucide-react"
import { useUser } from "@/firebase/auth/use-user"
import { useToast } from "@/hooks/use-toast"
import { awardCoinsAction } from "@/app/actions/matchflow-actions"
import { supabase } from "@/lib/supabase"
import { useBalance } from "@/lib/providers/BalanceProvider"

export default function AwardCoinsPage() {
  const router = useRouter()
  const { user } = useUser()
  const { toast } = useToast()
  const { coins } = useBalance();
  
  const [targetId, setTargetId] = useState("")
  const [resolvedUser, setResolvedUser] = useState<{ uid: string, name: string } | null>(null)
  const [searching, setSearching] = useState(false)
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    if (!user?.id) return
    const fetchData = async () => {
      const { data: p } = await supabase.from('users').select('*').eq('uid', user.id).single()
      if (p) setProfile(p)
    }
    fetchData()
  }, [user?.id])

  // AUTOMATIC USER LOOKUP
  useEffect(() => {
    const lookupUser = async () => {
      if (targetId.length < 5) {
        setResolvedUser(null)
        return
      }
      setSearching(true)
      try {
        const { data, error } = await supabase
          .from('users')
          .select('uid, name')
          .eq('match_flow_id', targetId.trim())
          .maybeSingle()
        
        if (data) {
          setResolvedUser(data)
        } else {
          setResolvedUser(null)
        }
      } catch (e) {
        setResolvedUser(null)
      } finally {
        setSearching(false)
      }
    }

    const timer = setTimeout(lookupUser, 500)
    return () => clearTimeout(timer)
  }, [targetId])

  const handleAward = async () => {
    if (!user || !resolvedUser || !amount) return
    
    const numAmount = Number(amount);
    if (numAmount < 1 || isNaN(numAmount)) {
      toast({ variant: "destructive", title: "Invalid amount." });
      return;
    }

    if (!profile?.is_admin && coins < numAmount) {
      toast({ variant: "destructive", title: "Insufficient Balance" });
      return;
    }

    setLoading(true)
    try {
      // Use the resolved UID directly for the award action
      const result = await awardCoinsAction(user.id, targetId, numAmount)
      if (result.success) {
        toast({ title: "Transfer Successful", description: result.message })
        setTargetId("")
        setAmount("")
        setResolvedUser(null)
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error })
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Operation failed." })
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = profile?.is_admin

  return (
    <div className="flex-1 bg-white min-h-screen flex flex-col select-none">
      <header className="px-4 h-16 flex items-center justify-between border-b bg-white sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full text-black">
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-sm font-black text-black uppercase tracking-widest">Coin Center</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 p-8 flex flex-col items-center space-y-8">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-yellow-50 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
            <Coins className="w-10 h-10 text-yellow-500" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-black tracking-tight">Transfer Coins</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {isAdmin ? "Master Admin Terminal" : "Merchant Sales Portal"}
            </p>
          </div>
        </div>

        {!isAdmin && (
          <div className="w-full max-w-sm p-6 bg-gray-50 rounded-3xl border border-black/5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-xl"><Wallet className="w-5 h-5 text-[#00A2FF]" /></div>
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Available Wallet</span>
            </div>
            <span className="text-lg font-black text-black">{coins} <span className="text-[10px] text-gray-400 font-bold uppercase">Coins</span></span>
          </div>
        )}

        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Recipient Numeric ID</label>
            <div className="relative">
              <Input 
                placeholder="e.g. 1234567" 
                value={targetId} 
                onChange={(e) => setTargetId(e.target.value)} 
                className="rounded-2xl h-16 text-center text-xl font-bold tracking-widest border-gray-100 bg-gray-50 text-black"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {searching ? <Loader2 className="w-4 h-4 animate-spin text-gray-300" /> : <Search className="w-4 h-4 text-gray-200" />}
              </div>
            </div>
          </div>

          {resolvedUser && (
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl animate-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Recipient Found</p>
                  <p className="text-sm font-bold text-blue-900 truncate">{resolvedUser.name}</p>
                  <p className="text-[9px] font-mono text-blue-400 truncate">UID: {resolvedUser.uid}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Amount to Send</label>
            <Input 
              type="number"
              placeholder="0" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              className="rounded-2xl h-16 text-center text-xl font-bold border-gray-100 bg-gray-50 text-black"
            />
          </div>

          <Button 
            onClick={handleAward} 
            disabled={loading || !resolvedUser || !amount}
            className="w-full h-16 rounded-full bg-black text-white font-black uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-all"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Confirm Transfer
              </div>
            )}
          </Button>
        </div>
      </main>
    </div>
  )
}
