
"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, SlidersHorizontal, Loader2, BadgeCheck, Sparkles, MapPin } from "lucide-react"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useUser } from "@/firebase/auth/use-user"

interface UserProfile {
  uid: string
  name: string
  photo_url: string
  country: string
  gender: string
  dob: string
  interests?: string
  is_verified?: boolean
  updated_at: string
}

const PAGE_SIZE = 12;

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
  const { user: currentUser, loading: authLoading, isInitialized } = useUser()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    if (currentUser?.id) {
      supabase.from('users').select('gender, blocking, blocked_by').eq('uid', currentUser.id).single().then(({ data }) => setProfile(data))
    }
  }, [currentUser?.id])

  const fetchUsers = useCallback(async (pageNum = 0) => {
    if (!profile) return
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);

    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const oppositeGender = profile.gender === 'male' ? 'female' : 'male';
    const blockedList = [...(profile.blocking || []), ...(profile.blocked_by || [])];

    try {
      const query = supabase
        .from('users')
        .select('uid, name, photo_url, country, dob, is_verified, interests, updated_at')
        .eq('onboarding_complete', true)
        .eq('gender', oppositeGender)
        .is('is_deleted', false)
        .not('uid', 'in', `(${[currentUser!.id, ...blockedList].join(',')})`)
        .order('updated_at', { ascending: false })
        .range(from, to);

      if (searchQuery) query.ilike('name', `%${searchQuery}%`);
      if (selectedInterest) query.ilike('interests', `%${selectedInterest}%`);

      const { data, error } = await query;

      if (!error && data) {
        if (pageNum === 0) setUsers(data as any);
        else setUsers(prev => [...prev, ...(data as any)]);
        setHasMore(data.length === PAGE_SIZE);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [profile, currentUser?.id, searchQuery, selectedInterest])

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(0), 400);
    return () => clearTimeout(timer);
  }, [fetchUsers])

  return (
    <div className="flex-1 bg-[#F9FAFB] min-h-screen flex flex-col pb-24 select-none">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5 px-4 pt-8 pb-4 space-y-4">
        <h1 className="text-2xl font-black text-black tracking-tight flex items-center gap-2 px-1">Explore <Sparkles className="w-5 h-5 text-[#00A2FF]" /></h1>
        <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" /><Input placeholder="Search users..." className="rounded-full h-14 pl-12 bg-gray-50 border-none font-bold" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
      </header>

      <main className="flex-1 p-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">{[...Array(4)].map((_, i) => <div key={i} className="aspect-[3/4] bg-white rounded-3xl animate-pulse" />)}</div>
        ) : users.length === 0 ? (
          <div className="py-40 text-center opacity-40"><p className="font-black text-sm uppercase">No matches found</p></div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {users.map((user) => (
                <Card key={user.uid} className="relative aspect-[3/4] overflow-hidden border-none rounded-[2rem] shadow-xl active:scale-95 transition-all" onClick={() => router.push(`/users/${user.uid}`)}>
                  <Image src={user.photo_url} alt={user.name} fill className="object-cover" sizes="50vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 inset-x-4">
                    <div className="flex items-center gap-1.5 mb-1"><p className="text-white font-black text-sm truncate">{user.name}</p>{user.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-[#00A2FF] fill-white" />}</div>
                    <div className="flex items-center gap-2"><span className="bg-[#006400] text-white px-2 py-0.5 rounded-lg text-[9px] font-bold">{calculateAge(user.dob)}</span><span className="text-[9px] text-white/60 font-bold uppercase truncate">{user.country}</span></div>
                  </div>
                </Card>
              ))}
            </div>
            {hasMore && (
              <div className="py-10 flex justify-center">
                <Button onClick={() => { const n = page + 1; setPage(n); fetchUsers(n); }} disabled={loadingMore} variant="ghost" className="text-[10px] font-black uppercase tracking-widest">
                  {loadingMore ? <Loader2 className="animate-spin" /> : "Load More"}
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
