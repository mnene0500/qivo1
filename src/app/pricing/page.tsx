"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, MessageSquare, Coins, Star } from "lucide-react"

/**
 * @fileOverview Displays the cost of interactions in QIVO.
 */
export default function PricingPage() {
  const router = useRouter()

  const costs = [
    { 
      label: "Texting", 
      icon: MessageSquare, 
      price: "15 Coins", 
      unit: "Per Message", 
      color: "bg-blue-50 text-blue-600",
      desc: "Instant direct messages to any user"
    }
  ]

  return (
    <div className="flex-1 bg-white min-h-screen flex flex-col select-none">
      <header className="px-4 h-16 flex items-center border-b bg-white sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft className="w-6 h-6 text-black" />
        </Button>
        <h1 className="text-sm font-black text-black uppercase tracking-widest ml-2">Charge Settings</h1>
      </header>

      <main className="flex-1 p-6 space-y-8">
        <div className="p-8 bg-black rounded-[2.5rem] text-white relative overflow-hidden">
          <Star className="absolute -right-4 -top-4 w-24 h-24 text-white/5 rotate-12" />
          <div className="relative z-10">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-1">Interaction Rates</h2>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Global Qivo Economy</p>
          </div>
        </div>

        <div className="space-y-4">
          {costs.map((item) => (
            <div key={item.label} className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 flex items-center gap-5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${item.color}`}>
                <item.icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-black uppercase tracking-widest text-black">{item.label}</h3>
                  <div className="flex items-center gap-1">
                    <Coins className="w-3 h-3 text-yellow-500" />
                    <span className="text-sm font-black text-black">{item.price}</span>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{item.desc}</p>
                <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mt-2">{item.unit}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="p-10 text-center">
        <Button 
          variant="outline" 
          onClick={() => router.push("/recharge")}
          className="rounded-full h-14 px-8 border-2 font-black uppercase tracking-widest text-[10px]"
        >
          Top Up Coins
        </Button>
      </footer>
    </div>
  )
}
