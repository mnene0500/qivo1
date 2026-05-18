
"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { collection, query, where, limit, getDocs, doc } from "firebase/firestore"
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Search, 
  SlidersHorizontal, 
  Hash, 
  Star, 
  MapPin, 
  Loader2, 
  Heart,
  BadgeCheck,
  TrendingUp,
  Sparkles
} from "lucide-react"
import { BottomNav } from "@/components/layout/BottomNav"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface UserProfile {
  uid: string
  name: string
  photoURL: string
  country: string
  gender: string
  dob: string
  interests?: string
  isVerified?: boolean
  onboardingComplete: boolean
  blocking?: string[]
  blockedBy?: string[]
}

const POPULAR_INTERESTS = ["Travel", "Music", "Cooking", "Photography", "Fitness", "Art", "Tech", "Dancing"]

function calculateAge(dob: string) {
  if (!dob) return 22
  const birthDate = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
  return age
}

export default function ExplorePage() {
  const router = useRouter()
  const { user: currentUser, loading: authLoading } = useUser()
  const db = useFirestore()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)

  const currentUserRef = useMemoFirebase(() => currentUser?.uid ? doc(db, "users", currentUser.uid) : null, [db, currentUser?.uid])
  const { data: profile } = useDoc<UserProfile>(currentUserRef)

  const fetchUsers = useCallback(async () => {
    if (!db || !profile) return
    setLoading(true)
    try {
      // Economical query: limit results for discovery
      const q = query(
        collection(db, "users"),
        where("onboardingComplete", "==", true),
        limit(50)
      )
      const snap = await getDocs(q)
      const fetched = snap.docs.map(d => ({ ...d.data() } as UserProfile))
      
      // Filter out self and blocked users
      const blockedList = [...(profile.blocking || []), ...(profile.blockedBy || [])]
      const filtered = fetched.filter(u => 
        u.uid !== currentUser?.uid && 
        !blockedList.includes(u.uid)
      )
      
      setUsers(filtered)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [db, profile, currentUser?.uid])

  useEffect(() => {
    if (profile) fetchUsers()
  }, [profile, fetchUsers])

  const filteredResults = useMemo(() => {
    let result = users
    if (searchQuery) {
      const lowQuery = searchQuery.toLowerCase()
      result = result.filter(u => 
        u.name.toLowerCase().includes(lowQuery) || 
        u.interests?.toLowerCase().includes(lowQuery)
      )
    }
    if (selectedInterest) {
      result = result.filter(u => u.interests?.toLowerCase().includes(selectedInterest.toLowerCase()))
    }
    return result
  }, [users, searchQuery, selectedInterest])

  if (authLoading && !users.length) {
    return (
      <div className="flex-1 bg-white min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00A2FF]" />
      </div>
    )
  }

  return (
    <div className="flex-1 bg-[#F9FAFB] min-h-screen flex flex-col pb-24 select-none">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5 px-4 pt-8 pb-4 space-y-4">
        <div className="flex items-center justify-between px-1">
          <h1 className="text-2xl font-black text-black tracking-tight flex items-center gap-2">
            Explore
            <Sparkles className="w-5 h-5 text-[#00A2FF] fill-current" />
          </h1>
          <Button variant="ghost" size="icon" className="rounded-full bg-gray-50">
            <SlidersHorizontal className="w-4 h-4 text-gray-400" />
          </Button>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-[#00A2FF] transition-colors" />
          <Input 
            placeholder="Search by name or bio..." 
            className="rounded-full h-14 pl-12 bg-gray-50 border-none shadow-inner text-sm font-bold placeholder:text-gray-300 focus-visible:ring-2 focus-visible:ring-[#00A2FF]/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button 
            onClick={() => setSelectedInterest(null)}
            className={cn(
              "px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
              selectedInterest === null ? "bg-[#00A2FF] text-white shadow-lg shadow-blue-100" : "bg-gray-100 text-gray-400"
            )}
          >
            All
          </button>
          {POPULAR_INTERESTS.map(interest => (
            <button 
              key={interest}
              onClick={() => setSelectedInterest(interest)}
              className={cn(
                "px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                selectedInterest === interest ? "bg-[#00A2FF] text-white shadow-lg shadow-blue-100" : "bg-gray-100 text-gray-400"
              )}
            >
              #{interest}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 p-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-[3/4] bg-white rounded-3xl animate-pulse border border-black/5" />
            ))}
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-6 opacity-40">
            <div className="w-20 h-20 bg-gray-100 rounded-[2.5rem] flex items-center justify-center">
              <Search className="w-10 h-10 text-gray-300" />
            </div>
            <div className="space-y-1">
              <p className="font-black text-sm uppercase tracking-widest text-black">No matches found</p>
              <p className="text-[10px] font-bold text-gray-400">Try a different keyword or interest</p>
            </div>
            <Button variant="outline" onClick={() => { setSearchQuery(""); setSelectedInterest(null); }} className="rounded-full font-bold">Clear Filters</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredResults.map((user) => (
              <Card 
                key={user.uid} 
                className="relative aspect-[3/4] overflow-hidden border-none rounded-[2rem] shadow-xl group cursor-pointer active:scale-95 transition-all"
                onClick={() => router.push(`/users/${user.uid}`)}
              >
                <Image 
                  src={user.photoURL} 
                  alt={user.name} 
                  fill 
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                
                <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[8px] font-black text-white uppercase tracking-widest">Active</span>
                </div>

                <div className="absolute bottom-4 inset-x-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-white font-black text-sm truncate tracking-tight">{user.name}</p>
                    {user.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-[#00A2FF] fill-white shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-[#006400] text-white px-2 py-0.5 rounded-lg text-[9px] font-bold">{calculateAge(user.dob)}</span>
                    <div className="flex items-center gap-1 text-white/60">
                      <MapPin className="w-2.5 h-2.5" />
                      <span className="text-[9px] font-bold uppercase tracking-tighter truncate">{user.country}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-12 p-8 rounded-[3rem] bg-gradient-to-br from-indigo-600 to-blue-500 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="relative z-10 space-y-4">
            <div className="w-12 h-12 bg-white/15 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-black tracking-tight leading-none">Find Your<br/>Vibe Faster</h3>
            <p className="text-[10px] font-medium text-white/70 leading-relaxed uppercase tracking-widest">
              Our AI engine tracks global engagement to show you trending profiles daily.
            </p>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
