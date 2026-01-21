import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

interface RouteParams {
  params: Promise<{ slug: string }>
}

// GET - Obtener menú (admin only)
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

    const { slug } = await params

    const menu = await prisma.menu.findUnique({
      where: { slug },
      include: {
        items: {
          orderBy: { order: "asc" },
        },
      },
    })

    if (!menu) {
      return NextResponse.json(
        { error: "Menú no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(menu)
  } catch (error) {
    console.error("Error fetching menu:", error)
    return NextResponse.json(
      { error: "Error al obtener menú" },
      { status: 500 }
    )
  }
}

// POST - Crear menú (admin only)
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

    const { slug } = await params
    const body = await request.json()
    const { name, title, items } = body

    // Crear el menú con sus items
    const menu = await prisma.menu.create({
      data: {
        name,
        slug,
        title,
        items: {
          create: items.map((item: {
            label: string
            url: string | null
            pageId: string | null
            icon: string | null
            customIcon: string | null
            order: number
            openInNewTab: boolean
            isVisible: boolean
            highlight: boolean
            highlightColor: string | null
            minTierLevel: number | null
          }) => ({
            label: item.label,
            url: item.url,
            pageId: item.pageId,
            icon: item.icon,
            customIcon: item.customIcon,
            order: item.order,
            openInNewTab: item.openInNewTab,
            isVisible: item.isVisible,
            highlight: item.highlight,
            highlightColor: item.highlightColor,
            minTierLevel: item.minTierLevel,
          })),
        },
      },
      include: {
        items: {
          orderBy: { order: "asc" },
        },
      },
    })

    return NextResponse.json(menu, { status: 201 })
  } catch (error) {
    console.error("Error creating menu:", error)
    return NextResponse.json(
      { error: "Error al crear menú" },
      { status: 500 }
    )
  }
}

// PATCH - Actualizar menú (admin only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const { slug } = await params
    const body = await request.json()
    const { name, title, items } = body

    const existingMenu = await prisma.menu.findUnique({
      where: { slug },
    })

    if (!existingMenu) {
      return NextResponse.json(
        { error: "Menú no encontrado" },
        { status: 404 }
      )
    }

    // Eliminar items existentes y crear los nuevos
    await prisma.menuItem.deleteMany({
      where: { menuId: existingMenu.id },
    })

    const menu = await prisma.menu.update({
      where: { slug },
      data: {
        name: name || undefined,
        title: title !== undefined ? title : undefined,
        items: {
          create: items.map((item: {
            label: string
            url: string | null
            pageId: string | null
            icon: string | null
            customIcon: string | null
            order: number
            openInNewTab: boolean
            isVisible: boolean
            highlight: boolean
            highlightColor: string | null
            minTierLevel: number | null
          }) => ({
            label: item.label,
            url: item.url,
            pageId: item.pageId,
            icon: item.icon,
            customIcon: item.customIcon,
            order: item.order,
            openInNewTab: item.openInNewTab,
            isVisible: item.isVisible,
            highlight: item.highlight,
            highlightColor: item.highlightColor,
            minTierLevel: item.minTierLevel,
          })),
        },
      },
      include: {
        items: {
          orderBy: { order: "asc" },
        },
      },
    })

    return NextResponse.json(menu)
  } catch (error) {
    console.error("Error updating menu:", error)
    return NextResponse.json(
      { error: "Error al actualizar menú" },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar menú (admin only)
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

    const { slug } = await params

    const existingMenu = await prisma.menu.findUnique({
      where: { slug },
    })

    if (!existingMenu) {
      return NextResponse.json(
        { error: "Menú no encontrado" },
        { status: 404 }
      )
    }

    await prisma.menu.delete({
      where: { slug },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting menu:", error)
    return NextResponse.json(
      { error: "Error al eliminar menú" },
      { status: 500 }
    )
  }
}
