"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  ChevronLeft, 
  Headphones, 
  MessageSquare, 
  ShieldCheck,
  Zap,
  Globe,
  Clock
} from "lucide-react"

/**
 * @fileOverview Minimalist Support page for QIVO.
 */
export default function CustomerSupportPage() {
  const router = useRouter()
  
  const handleWhatsAppChat = () => window.open("https://wa.me/254713934404", "_blank")

  return (
    <div className="flex-1 bg-white min-h-screen flex flex-col select-none">
      <header className="px-4 h-16 flex items-center border-b bg-white sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft className="w-6 h-6 text-black" />
        </Button>
        <h1 className="text-sm font-black text-black uppercase tracking-widest ml-2">Support Center</h1>
      </header>

      <main className="flex-1 p-8 flex flex-col items-center justify-center space-y-10">
        <div className="relative">
          <div className="w-24 h-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center">
            <Headphones className="w-12 h-12 text-[#00A2FF]" />
          </div>
          <div className="absolute -top-1 -right-1 flex h-6 w-6">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-6 w-6 bg-green-500 border-4 border-white"></span>
          </div>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-black tracking-tight uppercase">Direct Support</h2>
          <p className="text-sm font-medium text-gray-400 leading-relaxed max-w-[240px]">
            Need help with diamonds or coins? Chat with our team instantly.
          </p>
        </div>

        <Button 
          onClick={handleWhatsAppChat}
          className="w-full max-w-xs h-16 bg-[#25D366] hover:bg-[#128C7E] rounded-full text-white font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <MessageSquare className="w-5 h-5 fill-current" />
          Chat on WhatsApp
        </Button>

        <div className="grid grid-cols-2 gap-4 w-full max-w-xs pt-4">
          <div className="p-4 bg-gray-50 rounded-2xl text-center space-y-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500 mx-auto" />
            <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Safe & Secure</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-2xl text-center space-y-1">
            <Zap className="w-4 h-4 text-amber-500 mx-auto" />
            <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Fast Reply</p>
          </div>
        </div>
      </main>

      <footer className="p-10 text-center">
        <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.4em]">Available 24/7 Global</p>
      </footer>
    </div>
  )
}
