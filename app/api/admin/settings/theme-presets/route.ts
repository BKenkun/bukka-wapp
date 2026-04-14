import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

interface ThemePreset {
  id: string
  name: string
  theme: Record<string, unknown>
  createdAt: string
}

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  })

  return user?.isAdmin ? session : null
}

async function loadPresets(): Promise<ThemePreset[]> {
  const setting = await prisma.siteSettings.findUnique({
    where: { key: "theme_presets" },
  })

  if (setting?.value && Array.isArray(setting.value)) {
    return setting.value as unknown as ThemePreset[]
  }

  return []
}

export async function GET() {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const presets = await loadPresets()
    return NextResponse.json({ presets })
  } catch (error) {
    console.error("Error loading theme presets:", error)
    return NextResponse.json(
      { error: "Error al cargar los diseños guardados" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { name, theme } = body

    if (!name || !theme) {
      return NextResponse.json(
        { error: "Nombre y tema son obligatorios" },
        { status: 400 }
      )
    }

    const presets = await loadPresets()

    const newPreset: ThemePreset = {
      id: crypto.randomUUID(),
      name: name.trim(),
      theme,
      createdAt: new Date().toISOString(),
    }

    presets.push(newPreset)

    await prisma.siteSettings.upsert({
      where: { key: "theme_presets" },
      update: { value: presets as unknown as Prisma.InputJsonValue },
      create: { key: "theme_presets", value: presets as unknown as Prisma.InputJsonValue },
    })

    return NextResponse.json({ preset: newPreset })
  } catch (error) {
    console.error("Error saving theme preset:", error)
    return NextResponse.json(
      { error: "Error al guardar el diseño" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID del diseño es obligatorio" },
        { status: 400 }
      )
    }

    const presets = await loadPresets()
    const filtered = presets.filter((p) => p.id !== id)

    if (filtered.length === presets.length) {
      return NextResponse.json(
        { error: "Diseño no encontrado" },
        { status: 404 }
      )
    }

    await prisma.siteSettings.upsert({
      where: { key: "theme_presets" },
      update: { value: filtered as unknown as Prisma.InputJsonValue },
      create: { key: "theme_presets", value: filtered as unknown as Prisma.InputJsonValue },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting theme preset:", error)
    return NextResponse.json(
      { error: "Error al eliminar el diseño" },
      { status: 500 }
    )
  }
}
