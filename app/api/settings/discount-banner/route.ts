import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const SETTINGS_KEY = "general_settings"

// GET - Obtener configuración del banner de descuento (público)
export async function GET() {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { key: SETTINGS_KEY },
    })

    const defaultBanner = {
      enabled: true,
      text: "DESCUENTO ESPECIAL PARA MIEMBROS DIAMANTE -30%",
      buttonText: "SUBSCRÍBETE AHORA",
      buttonUrl: "/registro",
      backgroundColor: "#00B1DE",
    }

    if (!settings) {
      return NextResponse.json(defaultBanner)
    }

    const value = settings.value as Record<string, unknown>
    const discountBanner = value?.discountBanner as Record<string, unknown> | undefined

    return NextResponse.json({
      enabled: discountBanner?.enabled ?? defaultBanner.enabled,
      text: discountBanner?.text || defaultBanner.text,
      buttonText: discountBanner?.buttonText || defaultBanner.buttonText,
      buttonUrl: discountBanner?.buttonUrl || defaultBanner.buttonUrl,
      backgroundColor: discountBanner?.backgroundColor || defaultBanner.backgroundColor,
    })
  } catch (error) {
    console.error("Error fetching discount banner settings:", error)
    // Return defaults on error
    return NextResponse.json({
      enabled: true,
      text: "DESCUENTO ESPECIAL PARA MIEMBROS DIAMANTE -30%",
      buttonText: "SUBSCRÍBETE AHORA",
      buttonUrl: "/registro",
      backgroundColor: "#00B1DE",
    })
  }
}
