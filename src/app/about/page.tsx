"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Heart } from "lucide-react"

export default function AboutPage() {
  const router = useRouter()

  return (
    <div className="flex-1 bg-white min-h-screen flex flex-col">
      <header className="px-4 h-16 flex items-center border-b sticky top-0 bg-white z-50">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft className="w-6 h-6 text-black" />
        </Button>
        <h1 className="text-lg font-bold text-black ml-2">About MatchFlow</h1>
      </header>

      <main className="flex-1 p-6 flex flex-col items-center space-y-8">
        <div className="flex flex-col items-center text-center space-y-4 pt-10">
          <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center">
            <Heart className="w-10 h-10 text-[#00A2FF] fill-current" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-black tracking-tight">Connect with Heart</h2>
            <p className="text-sm text-gray-400 font-medium tracking-widest uppercase">Version 1.2.1</p>
          </div>
        </div>

        <div className="space-y-6 text-center max-w-sm">
          <p className="text-sm text-gray-600 font-medium leading-relaxed">
            MatchFlow is more than just a dating app. It's a platform designed for genuine connections and meaningful conversations.
          </p>
          <p className="text-sm text-gray-600 font-medium leading-relaxed">
            We believe that every interaction counts. Our unique ecosystem allows users to express themselves, find like-minded people, and build lasting relationships in a safe and verified environment.
          </p>
          <p className="text-sm text-gray-600 font-medium leading-relaxed">
            Based in Nairobi, Kenya, we are committed to providing the best social experience for our community across Africa and beyond.
          </p>
        </div>

        <div className="pt-10">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">© 2024 MatchFlow Team</p>
        </div>
      </main>
    </div>
  )
}
