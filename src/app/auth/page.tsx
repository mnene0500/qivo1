"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { ref, set as rtdbSet } from "firebase/database"
import { useAuth, useFirestore, useDatabase } from "@/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ChevronLeft, Mail, UserPlus, Loader2 } from "lucide-react"

export default function UnifiedAuthPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const auth = useAuth()
  const db = useFirestore()
  const rtdb = useDatabase()

  const passwordStrength = useMemo(() => {
    if (!password) return 0
    let strength = 0
    if (password.length >= 8) strength += 1
    if (/[a-z]/.test(password)) strength += 1
    if (/[A-Z]/.test(password)) strength += 1
    if (/[0-9]/.test(password)) strength += 1
    if (/[^A-Za-z0-9]/.test(password)) strength += 1
    return (strength / 5) * 100
  }, [password])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !auth) return
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push("/home")
    } catch (error: any) {
      toast({ variant: "destructive", title: "Login failed", description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!email || !password || !auth || !db || !rtdb) return
    if (passwordStrength < 40) {
      toast({ variant: "destructive", title: "Weak Password", description: "Please use a stronger password." })
      return
    }

    setLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // Auto-generate name from email prefix
      const emailPrefix = email.split('@')[0];
      const nameFromEmail = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1).replace(/[._]/g, ' ');
      
      const qId = Math.floor(1000000 + Math.random() * 900000000).toString();
      const userData = {
        uid: user.uid,
        email: user.email,
        name: nameFromEmail,
        matchFlowId: qId,
        onboardingComplete: false, 
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        gender: "not specified",
        dob: "2000-01-01",
        country: "Kenya",
        photoURL: `https://picsum.photos/seed/${user.uid}/400/400`,
        isVerified: false,
        isAdmin: false,
        isDeleted: false,
        blocking: [],
        blockedBy: []
      }

      await setDoc(doc(db, "users", user.uid), userData)
      await rtdbSet(ref(rtdb, `balances/${user.uid}`), {
        coins: 150,
        diamonds: 0,
        updatedAt: Date.now()
      })

      router.push("/fastonboard")
    } catch (error: any) {
      toast({ variant: "destructive", title: "Registration failed", description: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col p-6 space-y-10 bg-white min-h-screen select-none">
      <header className="flex items-center">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="rounded-full">
          <ChevronLeft className="w-6 h-6 text-black" />
        </Button>
        <h2 className="text-xl font-bold text-[#00A2FF] flex-1 text-center pr-10 uppercase tracking-tighter">QIVO Access</h2>
      </header>

      <div className="flex-1 flex flex-col justify-center space-y-8 max-w-sm mx-auto w-full">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black text-black tracking-tight">Welcome</h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Login or Join QIVO</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[10px] font-black uppercase text-gray-400 ml-1">Email Address</Label>
              <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-2xl h-14 border-gray-100 bg-gray-50 font-bold text-sm text-black" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[10px] font-black uppercase text-gray-400 ml-1">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="rounded-2xl h-14 border-gray-100 bg-gray-50 font-bold text-sm text-black" />
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <Button type="submit" disabled={loading} className="w-full rounded-full h-14 text-base font-bold bg-[#00A2FF] hover:bg-[#0081CC] shadow-xl shadow-blue-100 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Mail className="w-5 h-5" /> Login</>}
            </Button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-100"></div>
              <span className="flex-shrink mx-4 text-[10px] font-black text-gray-300 uppercase">New User?</span>
              <div className="flex-grow border-t border-gray-100"></div>
            </div>

            <Button type="button" variant="outline" disabled={loading} onClick={handleRegister} className="w-full rounded-full h-14 text-base font-bold border-2 border-gray-100 text-black hover:bg-gray-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><UserPlus className="w-5 h-5" /> Create Account</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
