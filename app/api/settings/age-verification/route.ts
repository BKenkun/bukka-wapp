import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const SETTINGS_KEY = "age_verification_settings"

const DEFAULT_SETTINGS = {
  enabled: true,
  okysafeEnabled: true,
  title: "This is an Adult Website",
  description: "This website contains age-restricted material, including nudity and explicit depictions of sexual activity. By entering, you affirm that you are at least 18 years of age or the age of majority in the jurisdiction from which you are accessing the website, and that you consent to viewing sexually explicit content.",
  enterButtonText: "I am 18 or older - Enter",
  exitButtonText: "I am under 18 - Exit",
  exitUrl: "https://www.google.com",
}

// GET - Obtener configuración de verificación de edad (público)
export async function GET() {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { key: SETTINGS_KEY },
    })

    if (!settings) {
      return NextResponse.json(DEFAULT_SETTINGS)
    }

    const data = settings.value as typeof DEFAULT_SETTINGS

    return NextResponse.json({
      ...DEFAULT_SETTINGS,
      ...data,
    })
  } catch (error) {
    console.error("Error fetching age verification settings:", error)
    return NextResponse.json(DEFAULT_SETTINGS)
  }
}
