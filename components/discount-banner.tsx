"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"

interface BannerSettings {
  enabled: boolean
  text: string
  buttonText: string
  buttonUrl: string
  backgroundColor: string
}

export function DiscountBanner() {
  const { data: session, status } = useSession()
  const [settings, setSettings] = useState<BannerSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const planId = session?.user?.SubscriptionPlan?.id || "guest"

  useEffect(() => {
    // Wait until session status is resolved
    if (status === "loading") return

    const fetchSettings = async () => {
      try {
        const response = await fetch(`/api/settings/discount-banner?planId=${planId}`)
        if (response.ok) {
          const data = await response.json()
          setSettings(data)
        }
      } catch (error) {
        console.error("Error fetching banner settings:", error)
        setSettings({ enabled: false, text: "", buttonText: "", buttonUrl: "", backgroundColor: "" })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [status, planId])

  // Don't render while loading or if disabled
  if (isLoading || status === "loading" || !settings?.enabled) {
    return null
  }

  return (
    <div
      className="w-full py-4 px-4 md:px-8"
      style={{ backgroundColor: settings.backgroundColor }}
    >
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-[1400px] mx-auto">
      <span className="text-white font-bold font-['Montserrat'] text-[16px] leading-[24px] uppercase tracking-wide text-center md:text-left">
        {settings.text}
      </span>
      <Link
        href={settings.buttonUrl}
        className="border-2 border-white text-white px-6 py-2 font-bold font-['Montserrat'] text-[14px] leading-[24px] uppercase hover:bg-white hover:text-black transition-colors whitespace-nowrap"
        style={{ ["--hover-text-color" as string]: settings.backgroundColor }}
      >
        {settings.buttonText}
      </Link>
    </div>
    </div>
  )
}
