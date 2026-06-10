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
  height?: number | null
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

  // Altura configurable desde el admin; si no hay valor se usa el padding clásico
  const customHeight = settings.height && settings.height > 0 ? settings.height : null
  const compact = customHeight !== null && customHeight < 56

  return (
    <div
      className={`w-full px-4 md:px-8 ${customHeight ? "flex items-center" : "py-4"}`}
      style={{
        backgroundColor: settings.backgroundColor,
        ...(customHeight ? { height: `${customHeight}px` } : {}),
      }}
    >
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-[1400px] mx-auto w-full">
      <span
        className={`text-white font-bold font-['Montserrat'] uppercase tracking-wide text-center md:text-left ${
          compact ? "text-[13px] leading-[18px]" : "text-[16px] leading-[24px]"
        }`}
      >
        {settings.text}
      </span>
      <Link
        href={settings.buttonUrl}
        className={`border-2 border-white text-white font-bold font-['Montserrat'] uppercase hover:bg-white hover:text-black transition-colors whitespace-nowrap ${
          compact ? "px-4 py-0.5 text-[12px] leading-[20px]" : "px-6 py-2 text-[14px] leading-[24px]"
        }`}
        style={{ ["--hover-text-color" as string]: settings.backgroundColor }}
      >
        {settings.buttonText}
      </Link>
    </div>
    </div>
  )
}
