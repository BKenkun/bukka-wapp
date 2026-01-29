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
          include: {
            megamenuConfig: true,
          },
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
            hasMegamenu?: boolean
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
            hasMegamenu: item.hasMegamenu || false,
          })),
        },
      },
      include: {
        items: {
          orderBy: { order: "asc" },
          include: {
            megamenuConfig: true,
          },
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
      include: {
        items: {
          select: { id: true },
        },
      },
    })

    if (!existingMenu) {
      return NextResponse.json(
        { error: "Menú no encontrado" },
        { status: 404 }
      )
    }

    // Separate items into existing (with id) and new (without id)
    const itemsWithId = items.filter((item: { id?: string }) => item.id)
    const itemsWithoutId = items.filter((item: { id?: string }) => !item.id)

    // Find items to delete (existing items not in the new list)
    const newItemIds = itemsWithId.map((item: { id: string }) => item.id)
    const itemsToDelete = existingMenu.items.filter(
      (item) => !newItemIds.includes(item.id)
    )

    // Delete removed items
    if (itemsToDelete.length > 0) {
      await prisma.menuItem.deleteMany({
        where: {
          id: { in: itemsToDelete.map((item) => item.id) },
        },
      })
    }

    // Update existing items
    for (const item of itemsWithId) {
      await prisma.menuItem.update({
        where: { id: item.id },
        data: {
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
          hasMegamenu: item.hasMegamenu || false,
        },
      })
    }

    // Create new items
    if (itemsWithoutId.length > 0) {
      await prisma.menuItem.createMany({
        data: itemsWithoutId.map((item: {
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
          hasMegamenu?: boolean
        }) => ({
          menuId: existingMenu.id,
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
          hasMegamenu: item.hasMegamenu || false,
        })),
      })
    }

    // Update menu title/name
    const menu = await prisma.menu.update({
      where: { slug },
      data: {
        name: name || undefined,
        title: title !== undefined ? title : undefined,
      },
      include: {
        items: {
          orderBy: { order: "asc" },
          include: {
            megamenuConfig: true,
          },
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
