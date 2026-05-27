
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { RotateCw, BadgeCheck, FileText, Target, MessageSquare, Loader2 } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useUser } from "@/firebase/auth/use-user"
import { Button } from "@/components/ui/button"

interface UserProfile {
  uid: string
  name: string
  photo_url: string
  country: string
  gender: string
  dob: string
  is_verified?: boolean
  updated_at: string
}

const PAGE_SIZE = 12;

let cachedUsers: UserProfile[] = [];
let cachedTab: 'Recommend' | 'Nearby' = 'Recommend';
let cachedPage = 0;

function calculateAge(dob: string) {
  if (!dob) return 18
  const birthDate = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
  return age
}

export default function HomePage() {
  const router = useRouter()
  const { user: currentUser, loading: authLoading, isInitialized } = useUser()
  
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [users, setUsers] = useState<UserProfile[]>(cachedUsers)
  const [activeTab, setActiveTab] = useState<'Recommend' | 'Nearby'>(cachedTab)
  const [page, setPage] = useState(cachedPage)
  const [hasMore, setHasMore] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  
  const hasFetched = useRef(false)

  const fetchUsers = useCallback(async (pageNum = 0, isManual = false) => {
    if (!profile) return;
    if (pageNum === 0 && isManual) setIsRefreshing(true);
    if (pageNum > 0) setIsLoadingMore(true);

    try {
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const oppositeGender = profile.gender === 'male' ? 'female' : profile.gender === 'female' ? 'male' : null;

      const query = supabase
        .from('users')
        .select('uid, name, photo_url, country, dob, is_verified, updated_at')
        .eq('onboarding_complete', true)
        .is('is_deleted', false)
        .order('updated_at', { ascending: false })
        .range(from, to);

      if (oppositeGender) query.eq('gender', oppositeGender);
      if (activeTab === 'Nearby' && profile.country) query.eq('country', profile.country);

      const { data } = await query;
      if (data) {
        const filtered = (data as any[]).filter(u => u.uid !== currentUser?.id);
        
        if (pageNum === 0) {
          setUsers(filtered);
          cachedUsers = filtered;
        } else {
          setUsers(prev => {
             const existingIds = new Set(prev.map(u => u.uid));
             const uniqueNew = filtered.filter(u => !existingIds.has(u.uid));
             return [...prev, ...uniqueNew];
          });
          cachedUsers = [...cachedUsers, ...filtered.filter(u => !new Set(cachedUsers.map(x => x.uid)).has(u.uid))];
        }
        
        setHasMore(data.length === PAGE_SIZE);
        setPage(pageNum);
        cachedPage = pageNum;
      }
    } catch (err) {
      console.error("Fetch Users Error:", err);
    } finally {
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [currentUser?.id, profile, activeTab]);

  useEffect(() => {
    if (isInitialized && currentUser && !profile) {
      supabase.from('users').select('uid, gender, country, onboarding_complete').eq('uid', currentUser.id).single()
        .then(({ data }) => {
          if (data?.onboarding_complete) {
            setProfile(data);
          } else if (!data && !authLoading) {
             router.replace("/fastonboard");
          }
        });
    }
  }, [isInitialized, currentUser, router, profile, authLoading]);

  useEffect(() => {
    if (profile && !hasFetched.current) {
      if (cachedUsers.length === 0) {
        fetchUsers(0);
      }
      hasFetched.current = true;
    }
  }, [profile, fetchUsers]);

  const handleTabChange = (tab: 'Recommend' | 'Nearby') => {
    if (activeTab === tab) return
    setActiveTab(tab)
    cachedTab = tab
    setPage(0);
    cachedPage = 0;
    fetchUsers(0, true);
  }

  const handleLoadMore = () => {
    if (isLoadingMore || !hasMore) return;
    fetchUsers(page + 1);
  }

  if (authLoading || !isInitialized) return null;

  return (
    <div className="flex-1 bg-white min-h-screen relative select-none">
      <div className="sticky top-0 z-[100] bg-[#00A2FF] shadow-lg">
        <div className="px-4 grid grid-cols-2 gap-3 py-4">
          <button onClick={() => router.push('/mystery-note')} className="h-20 bg-purple-600 border border-white/20 rounded-2xl p-4 flex flex-col items-start justify-center gap-1 active:scale-95 transition-all text-white shadow-lg">
            <FileText className="w-4 h-4 mb-1" /><p className="text-[9px] font-black uppercase tracking-tight">Message Blast</p>
          </button>
          <button onClick={() => router.push('/tasks')} className="h-20 bg-blue-900 border border-white/20 rounded-2xl p-4 flex flex-col items-start justify-center gap-1 active:scale-95 transition-all text-white shadow-lg">
            <Target className="w-4 h-4 mb-1" /><p className="text-[9px] font-black uppercase tracking-tight">Task Center</p>
          </button>
        </div>

        <div className="bg-[#00A2FF] px-6 py-3 flex items-center justify-between border-t border-white/10">
          <div className="flex items-center gap-8">
            {(['Recommend', 'Nearby'] as const).map((tab) => (
              <button key={tab} onClick={() => handleTabChange(tab)} className={cn("text-xs font-black transition-all relative pb-2 uppercase tracking-widest", activeTab === tab ? "text-white" : "text-white/40")}>
                {tab}
                {activeTab === tab && <div className="absolute -bottom-1 left-0 right-0 h-1 bg-white rounded-full" />}
              </button>
            ))}
          </div>
          <button onClick={() => fetchUsers(0, true)} className={cn("p-2 text-white active:scale-90 transition-transform", isRefreshing && "animate-spin")}>
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <main className="px-3 pt-3 pb-32">
        {users.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              {users.map((u) => (
                <Card key={u.uid} className="relative overflow-hidden border-none aspect-[1/1.3] rounded-2xl shadow-sm bg-gray-50 active:scale-95 transition-all cursor-pointer group" onClick={() => router.push(`/users/${u.uid}`)}>
                  <Image src={`${u.photo_url}?t=${u.updated_at}`} alt={u.name} fill className="object-cover" sizes="50vw" priority />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3 text-white flex flex-col gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 mb-0.5">
                        <h4 className="font-black text-sm truncate tracking-tight">{u.name}</h4>
                        {u.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-[#00A2FF] fill-white shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="bg-[#00B200] text-white font-black text-[7px] px-1.5 py-0.5 rounded-sm">{calculateAge(u.dob)}</span>
                        <span className="text-[7px] font-bold uppercase truncate opacity-70 tracking-widest">{u.country}</span>
                      </div>
                    </div>
                    <Button size="sm" className="w-full h-8 rounded-lg bg-[#00A2FF] hover:bg-[#0081CC] text-white font-black text-[10px] uppercase tracking-[0.2em] gap-2 shadow-lg z-10" onClick={(e) => { e.stopPropagation(); router.push(`/chats?startWith=${u.uid}`); }}>
                      <MessageSquare className="w-3 h-3" />CHAT
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            
            {hasMore && (
              <div className="py-10 flex justify-center">
                <Button 
                  onClick={handleLoadMore} 
                  disabled={isLoadingMore} 
                  variant="outline" 
                  className="rounded-full border-gray-100 font-black text-[10px] uppercase tracking-widest h-12 px-10 shadow-sm"
                >
                  {isLoadingMore ? <Loader2 className="w-4 h-4 animate-spin text-[#00A2FF]" /> : "Show More Users"}
                </Button>
              </div>
            )}
          </>
        ) : (
          !isRefreshing && (
            <div className="flex flex-col items-center justify-center py-40 opacity-20">
              <Target className="w-12 h-12 mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest">No users here</p>
            </div>
          )
        )}
      </main>
    </div>
  )
}
