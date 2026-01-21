import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { defaultVideoAccessSettings } from "@/lib/get-video-access-settings"

const SETTINGS_KEY = "video_access_settings"

// GET - Obtener configuración de acceso a videos
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
      return NextResponse.json(defaultVideoAccessSettings)
    }

    // Merge with defaults to ensure all fields exist
    const value = settings.value as unknown as typeof defaultVideoAccessSettings
    return NextResponse.json({
      lockScreen: {
        ...defaultVideoAccessSettings.lockScreen,
        ...value.lockScreen,
      },
    })
  } catch (error) {
    console.error("Error fetching video access settings:", error)
    return NextResponse.json(
      { error: "Error al obtener configuración" },
      { status: 500 }
    )
  }
}

// POST - Guardar configuración de acceso a videos
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
    const { lockScreen } = body

    await prisma.siteSettings.upsert({
      where: { key: SETTINGS_KEY },
      create: {
        key: SETTINGS_KEY,
        value: {
          lockScreen: {
            ...defaultVideoAccessSettings.lockScreen,
            ...lockScreen,
          },
        },
      },
      update: {
        value: {
          lockScreen: {
            ...defaultVideoAccessSettings.lockScreen,
            ...lockScreen,
          },
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving video access settings:", error)
    return NextResponse.json(
      { error: "Error al guardar configuración" },
      { status: 500 }
    )
  }
}
