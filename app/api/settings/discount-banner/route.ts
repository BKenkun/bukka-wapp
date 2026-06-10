import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const SETTINGS_KEY = "discount_banners"

interface BannerConfig {
  planId: string
  enabled: boolean
  text: string
  buttonText: string
  buttonUrl: string
  backgroundColor: string
  height?: number
  startDate?: string | null
  endDate?: string | null
}

// GET - Obtener banner de descuento para un plan específico (público)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const planId = searchParams.get("planId") || "guest"

    const settings = await prisma.siteSettings.findUnique({
      where: { key: SETTINGS_KEY },
    })

    if (!settings) {
      return NextResponse.json({ enabled: false })
    }

    const value = settings.value as { banners?: BannerConfig[] }
    const banners = value?.banners || []

    const banner = banners.find((b) => b.planId === planId)

    if (!banner || !banner.enabled) {
      return NextResponse.json({ enabled: false })
    }

    // Programación por fechas: fuera del rango el banner no se muestra
    const now = new Date()
    if (banner.startDate && now < new Date(banner.startDate)) {
      return NextResponse.json({ enabled: false })
    }
    if (banner.endDate && now > new Date(`${banner.endDate}T23:59:59`)) {
      return NextResponse.json({ enabled: false })
    }

    return NextResponse.json({
      enabled: banner.enabled,
      text: banner.text,
      buttonText: banner.buttonText,
      buttonUrl: banner.buttonUrl,
      backgroundColor: banner.backgroundColor,
      height: banner.height ?? null,
    })
  } catch (error) {
    console.error("Error fetching discount banner settings:", error)
    return NextResponse.json({ enabled: false })
  }
}
