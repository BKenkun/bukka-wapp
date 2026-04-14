import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { z } from "zod"
import type { VideoSourceType } from "@prisma/client"

interface RouteParams {
  params: Promise<{ menuItemId: string }>
}

const megamenuLinkSchema = z.object({
  id: z.string(),
  label: z.string(),
  url: z.string().optional(),
  pageId: z.string().optional(),
  categoryId: z.string().optional(),
  openInNewTab: z.boolean(),
})

const megamenuConfigSchema = z.object({
  featuredPerformerIds: z.array(z.string()).max(6),
  featuredProductIds: z.array(z.string()).max(6).default([]),
  videoSource: z.enum(["MANUAL", "CATEGORY", "LATEST", "POPULAR"]),
  videoIds: z.array(z.string()).max(8),
  videoCategoryId: z.string().nullable(),
  links: z.array(megamenuLinkSchema),
  linksSectionTitle: z.string().default("Descubre"),
})

// GET - Get megamenu config for a menu item
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const { menuItemId } = await params

    const config = await prisma.megamenuConfig.findUnique({
      where: { menuItemId },
    })

    return NextResponse.json({ config })
  } catch (error) {
    console.error("Error fetching megamenu config:", error)
    return NextResponse.json({ error: "Error al obtener configuración" }, { status: 500 })
  }
}

// POST/PUT - Create or update megamenu config
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const { menuItemId } = await params
    const body = await request.json()
    const data = megamenuConfigSchema.parse(body)

    // Verify menu item exists
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
    })

    if (!menuItem) {
      return NextResponse.json({ error: "Menu item no encontrado" }, { status: 404 })
    }

    // Upsert megamenu config
    const config = await prisma.megamenuConfig.upsert({
      where: { menuItemId },
      update: {
        featuredPerformerIds: data.featuredPerformerIds,
        featuredProductIds: data.featuredProductIds,
        videoSource: data.videoSource as VideoSourceType,
        videoIds: data.videoIds,
        videoCategoryId: data.videoCategoryId,
        links: data.links,
        linksSectionTitle: data.linksSectionTitle,
      },
      create: {
        menuItemId,
        featuredPerformerIds: data.featuredPerformerIds,
        featuredProductIds: data.featuredProductIds,
        videoSource: data.videoSource as VideoSourceType,
        videoIds: data.videoIds,
        videoCategoryId: data.videoCategoryId,
        links: data.links,
        linksSectionTitle: data.linksSectionTitle,
      },
    })

    // Update menu item to have hasMegamenu = true
    await prisma.menuItem.update({
      where: { id: menuItemId },
      data: { hasMegamenu: true },
    })

    return NextResponse.json({ config })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Error saving megamenu config:", error)
    return NextResponse.json({ error: "Error al guardar configuración" }, { status: 500 })
  }
}

// DELETE - Delete megamenu config
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { menuItemId } = await params

    // Delete megamenu config if exists
    await prisma.megamenuConfig.deleteMany({
      where: { menuItemId },
    })

    // Update menu item
    await prisma.menuItem.update({
      where: { id: menuItemId },
      data: { hasMegamenu: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting megamenu config:", error)
    return NextResponse.json({ error: "Error al eliminar configuración" }, { status: 500 })
  }
}
