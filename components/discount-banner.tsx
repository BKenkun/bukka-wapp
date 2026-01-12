"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface BannerSettings {
  enabled: boolean
  text: string
  buttonText: string
  buttonUrl: string
  backgroundColor: string
}

export function DiscountBanner() {
  const [settings, setSettings] = useState<BannerSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings/discount-banner")
        if (response.ok) {
          const data = await response.json()
          setSettings(data)
        }
      } catch (error) {
        console.error("Error fetching banner settings:", error)
        // Use defaults on error
        setSettings({
          enabled: true,
          text: "DESCUENTO ESPECIAL PARA MIEMBROS DIAMANTE -30%",
          buttonText: "SUBSCRÍBETE AHORA",
          buttonUrl: "/registro",
          backgroundColor: "#00B1DE",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  // Don't render while loading or if disabled
  if (isLoading || !settings?.enabled) {
    return null
  }

  return (
    <div
      className="w-full py-4 px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4"
      style={{ backgroundColor: settings.backgroundColor }}
    >
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
  )
}
