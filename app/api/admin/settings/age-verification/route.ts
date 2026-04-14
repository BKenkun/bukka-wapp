import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

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

// GET - Obtener configuración de verificación de edad (admin)
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

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
    return NextResponse.json(
      { error: "Error al obtener configuración" },
      { status: 500 }
    )
  }
}

// POST - Guardar configuración de verificación de edad
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await request.json()

    const settingsData = {
      enabled: body.enabled ?? DEFAULT_SETTINGS.enabled,
      okysafeEnabled: body.okysafeEnabled ?? DEFAULT_SETTINGS.okysafeEnabled,
      title: body.title || DEFAULT_SETTINGS.title,
      description: body.description || DEFAULT_SETTINGS.description,
      enterButtonText: body.enterButtonText || DEFAULT_SETTINGS.enterButtonText,
      exitButtonText: body.exitButtonText || DEFAULT_SETTINGS.exitButtonText,
      exitUrl: body.exitUrl || DEFAULT_SETTINGS.exitUrl,
    }

    await prisma.siteSettings.upsert({
      where: { key: SETTINGS_KEY },
      create: {
        key: SETTINGS_KEY,
        value: settingsData,
      },
      update: {
        value: settingsData,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving age verification settings:", error)
    return NextResponse.json(
      { error: "Error al guardar configuración" },
      { status: 500 }
    )
  }
}
