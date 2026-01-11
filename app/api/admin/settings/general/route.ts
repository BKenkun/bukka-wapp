import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

const SETTINGS_KEY = "general_settings"

// GET - Obtener configuración general
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
      return NextResponse.json({
        site: {
          name: "BUKKAKERY",
          description: "",
          supportEmail: "",
          maintenanceMode: false,
        },
        ageVerification: {
          enabled: true,
          text: "Este sitio web contiene material para adultos. Al entrar, confirmas que tienes al menos 18 años de edad.",
        },
        company: {
          name: "NEON BULB, S.L.",
          address: "",
          vat: "",
        },
      })
    }

    return NextResponse.json(settings.value)
  } catch (error) {
    console.error("Error fetching general settings:", error)
    return NextResponse.json(
      { error: "Error al obtener configuración" },
      { status: 500 }
    )
  }
}

// POST - Guardar configuración general
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
    const { site, ageVerification, company } = body

    await prisma.siteSettings.upsert({
      where: { key: SETTINGS_KEY },
      create: {
        key: SETTINGS_KEY,
        value: {
          site: site || {},
          ageVerification: ageVerification || {},
          company: company || {},
        },
      },
      update: {
        value: {
          site: site || {},
          ageVerification: ageVerification || {},
          company: company || {},
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving general settings:", error)
    return NextResponse.json(
      { error: "Error al guardar configuración" },
      { status: 500 }
    )
  }
}
