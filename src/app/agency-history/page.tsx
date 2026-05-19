"use client"

import { useMemo } from "react"
import { collection, query, where, limit, doc } from "firebase/firestore"
import { useFirestore, useUser, useCollection, useDoc } from "@/firebase"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Banknote, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface WithdrawalRequest {
  id: string
  diamonds: number
  amountKes: number
  status: 'pending' | 'paid' | 'rejected'
  createdAt: any
  agencyId: string
}

interface UserProfile {
  agencyId?: string
}

export default function AgencyHistoryPage() {
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()

  const { data: profile } = useDoc<UserProfile>(user?.uid && db ? doc(db, "users", user.uid) : null)

  const withdrawalsQuery = useMemo(() => {
    if (!db || !user?.uid || !profile?.agencyId) return null
    return query(
      collection(db, "agencies", profile.agencyId, "withdrawals"),
      where("uid", "==", user.uid),
      limit(50) 
    )
  }, [db, user?.uid, profile?.agencyId])

  const { data: withdrawals, loading } = useCollection<WithdrawalRequest>(withdrawalsQuery)

  const sortedWithdrawals = useMemo(() => {
    return [...withdrawals].sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0)
      const bTime = b.createdAt?.toMillis?.() || (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0)
      return bTime - aTime
    })
  }, [withdrawals])

  const formatTimestamp = (ts: any) => {
    if (!ts) return "---"
    const date = ts.toDate ? ts.toDate() : (ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts))
    return format(date, "MMM d, HH:mm")
  }

  return (
    <div className="flex-1 bg-white min-h-screen flex flex-col">
      <header className="px-4 h-16 flex items-center justify-between border-b sticky top-0 bg-white z-50">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft className="w-6 h-6 text-black" />
        </Button>
        <h1 className="text-base font-black text-black">Payout History</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#00A2FF]" />
          </div>
        ) : sortedWithdrawals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 px-12 text-center space-y-4 opacity-40">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Banknote className="w-8 h-8 text-gray-400" />
            </div>
            <div className="space-y-1">
              <p className="font-black text-sm uppercase tracking-widest">No Payouts Yet</p>
              <p className="text-[10px] font-bold text-gray-400">Your withdrawal requests will appear here.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {sortedWithdrawals.map((req) => (
              <div key={req.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-black text-black">Ksh {req.amountKes}</p>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {formatTimestamp(req.createdAt)} • {req.diamonds} Diamonds
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl w-fit">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Agency ID: {req.agencyId}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="p-8 text-center bg-gray-50/50">
        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em] leading-relaxed">
          Showing last 50 transactions. Contact your agent if a payment is missing.
        </p>
      </footer>
    </div>
  )
}

function StatusBadge({ status }: { status: WithdrawalRequest['status'] }) {
  const configs = {
    pending: { icon: Clock, text: 'Pending', className: 'text-amber-500 bg-amber-50 border-amber-100' },
    paid: { icon: CheckCircle2, text: 'Paid', className: 'text-green-600 bg-green-50 border-green-100' },
    rejected: { icon: XCircle, text: 'Rejected', className: 'text-red-500 bg-red-50 border-red-100' }
  }

  const config = configs[status]
  const Icon = config.icon

  return (
    <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest", config.className)}>
      <Icon className="w-3 h-3" />
      {config.text}
    </div>
  )
}
