import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: Promise<{ slug: string }>
}

// GET - Obtener menú público (solo items visibles)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params

    const menu = await prisma.menu.findUnique({
      where: { slug },
      include: {
        items: {
          where: { isVisible: true },
          orderBy: { order: "asc" },
          select: {
            id: true,
            label: true,
            url: true,
            pageId: true,
            icon: true,
            customIcon: true,
            order: true,
            openInNewTab: true,
            highlight: true,
            highlightColor: true,
          },
        },
      },
    })

    if (!menu) {
      // Si no existe el menú, devolver array vacío en lugar de error
      // Esto permite que el frontend maneje menús no configurados
      return NextResponse.json({
        slug,
        name: slug,
        items: []
      })
    }

    // Obtener las URLs de las páginas vinculadas
    const itemsWithPageUrls = await Promise.all(
      menu.items.map(async (item) => {
        if (item.pageId) {
          const page = await prisma.page.findUnique({
            where: { id: item.pageId, status: "PUBLISHED" },
            select: { slug: true },
          })
          return {
            ...item,
            url: page ? `/p/${page.slug}` : item.url,
          }
        }
        return item
      })
    )

    return NextResponse.json({
      ...menu,
      items: itemsWithPageUrls,
    })
  } catch (error) {
    console.error("Error fetching menu:", error)
    return NextResponse.json(
      { error: "Error fetching menu" },
      { status: 500 }
    )
  }
}
