import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

const SETTINGS_KEY = "discount_banners"

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
      return NextResponse.json({ banners: [] })
    }

    return NextResponse.json(settings.value)
  } catch (error) {
    console.error("Error fetching discount banners:", error)
    return NextResponse.json(
      { error: "Error al obtener configuración" },
      { status: 500 }
    )
  }
}

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
    const { banners } = body

    await prisma.siteSettings.upsert({
      where: { key: SETTINGS_KEY },
      create: {
        key: SETTINGS_KEY,
        value: { banners: banners || [] },
      },
      update: {
        value: { banners: banners || [] },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving discount banners:", error)
    return NextResponse.json(
      { error: "Error al guardar configuración" },
      { status: 500 }
    )
  }
}
