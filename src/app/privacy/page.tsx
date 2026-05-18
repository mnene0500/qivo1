"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export default function PrivacyPolicyPage() {
  const router = useRouter()

  return (
    <div className="flex-1 bg-white min-h-screen flex flex-col">
      <header className="px-4 h-16 flex items-center border-b sticky top-0 bg-white z-50">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft className="w-6 h-6 text-black" />
        </Button>
        <h1 className="text-lg font-bold text-black ml-2">Privacy Policy</h1>
      </header>

      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        <section className="space-y-3">
          <h2 className="text-base font-bold text-black">1. Information We Collect</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            We collect information you provide directly to us, such as your name, date of birth, gender, country, and profile photos. We also collect data about your interactions within the app.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-black">2. How We Use Your Information</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            We use the information to provide, maintain, and improve our services, including matching you with other users based on your preferences and location.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-black">3. Data Sharing</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Your profile information (name, age, photo, bio) is visible to other users of the service. We do not sell your personal data to third parties.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-black">4. Security</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            We take reasonable measures to protect your personal information from loss, theft, and unauthorized access. Identity verification helps ensure a safer community.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-black">5. Your Choices</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            You can update your profile information at any time. You can also request the deletion of your account through the app settings, which will remove your personal data from our active servers.
          </p>
        </section>
      </main>
    </div>
  )
}
