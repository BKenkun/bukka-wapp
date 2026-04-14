import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const SETTINGS_KEY = "age_verification_settings"

const DEFAULT_SETTINGS = {
  enabled: true,
  okysafeEnabled: true,
  title: "Este es un Sitio Web para adultos",
  description: "Este sitio web contiene material restringido a menores de edad, que incluye desnudez y representaciones explícitas de actividad sexual. Al entrar, afirma que tiene por lo menos 18 años de edad o la mayoría de edad en la jurisdicción desde que está accediendo el sitio web y que da consentimiento en ver contenido sexualmente explícito.",
  enterButtonText: "Tengo 18 años o más - Entrar",
  exitButtonText: "Soy menor de 18 años - Salir",
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
