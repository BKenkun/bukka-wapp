import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

const SETTINGS_KEY = "search_settings"

// GET - Obtener configuración del buscador
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
        featuredPerformers: [],
        featuredVideos: [],
        featuredProducts: [],
      })
    }

    return NextResponse.json(settings.value)
  } catch (error) {
    console.error("Error fetching search settings:", error)
    return NextResponse.json(
      { error: "Error al obtener configuración" },
      { status: 500 }
    )
  }
}

// POST - Guardar configuración del buscador
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
    const { featuredPerformers, featuredVideos, featuredProducts } = body

    const value = {
      featuredPerformers: Array.isArray(featuredPerformers) ? featuredPerformers.slice(0, 4) : [],
      featuredVideos: Array.isArray(featuredVideos) ? featuredVideos.slice(0, 4) : [],
      featuredProducts: Array.isArray(featuredProducts) ? featuredProducts.slice(0, 4) : [],
    }

    await prisma.siteSettings.upsert({
      where: { key: SETTINGS_KEY },
      create: { key: SETTINGS_KEY, value },
      update: { value },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving search settings:", error)
    return NextResponse.json(
      { error: "Error al guardar configuración" },
      { status: 500 }
    )
  }
}
