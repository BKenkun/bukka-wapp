import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

const SETTINGS_KEY = "shop_settings"

export interface ShopSettings {
  banner: {
    imageUrl: string | null
    alt: string
  }
}

const DEFAULT_SETTINGS: ShopSettings = {
  banner: {
    imageUrl: "/images/shop.jpg",
    alt: "Tienda",
  },
}

// GET - Obtener configuración de la tienda
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
        settings: DEFAULT_SETTINGS,
      })
    }

    const savedSettings = settings.value as unknown as ShopSettings
    return NextResponse.json({
      settings: {
        ...DEFAULT_SETTINGS,
        ...savedSettings,
        banner: { ...DEFAULT_SETTINGS.banner, ...savedSettings.banner },
      },
    })
  } catch (error) {
    console.error("Error fetching shop settings:", error)
    return NextResponse.json(
      { error: "Error al obtener configuración" },
      { status: 500 }
    )
  }
}

// POST - Guardar configuración de la tienda
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

    await prisma.siteSettings.upsert({
      where: { key: SETTINGS_KEY },
      create: {
        key: SETTINGS_KEY,
        value: body,
      },
      update: {
        value: body,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving shop settings:", error)
    return NextResponse.json(
      { error: "Error al guardar configuración" },
      { status: 500 }
    )
  }
}
