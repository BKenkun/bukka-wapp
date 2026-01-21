import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { defaultVideoAccessSettings } from "@/lib/get-video-access-settings"

const SETTINGS_KEY = "video_access_settings"

// GET - Obtener configuración de pantalla bloqueada (público)
export async function GET() {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { key: SETTINGS_KEY },
    })

    if (!settings) {
      return NextResponse.json(defaultVideoAccessSettings.lockScreen)
    }

    const value = settings.value as unknown as typeof defaultVideoAccessSettings
    const lockScreen = value?.lockScreen

    return NextResponse.json({
      title: lockScreen?.title || defaultVideoAccessSettings.lockScreen.title,
      description: lockScreen?.description || defaultVideoAccessSettings.lockScreen.description,
      buttonText: lockScreen?.buttonText || defaultVideoAccessSettings.lockScreen.buttonText,
      buttonUrl: lockScreen?.buttonUrl || defaultVideoAccessSettings.lockScreen.buttonUrl,
      backgroundImage: lockScreen?.backgroundImage || null,
      overlaySize: lockScreen?.overlaySize || defaultVideoAccessSettings.lockScreen.overlaySize,
      showTierBadge: lockScreen?.showTierBadge ?? defaultVideoAccessSettings.lockScreen.showTierBadge,
    })
  } catch (error) {
    console.error("Error fetching video access settings:", error)
    return NextResponse.json(defaultVideoAccessSettings.lockScreen)
  }
}
