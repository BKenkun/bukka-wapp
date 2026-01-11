import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Obtener página (admin only)
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

    const { id } = await params

    const page = await prisma.page.findUnique({
      where: { id },
    })

    if (!page) {
      return NextResponse.json(
        { error: "Página no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json(page)
  } catch (error) {
    console.error("Error fetching page:", error)
    return NextResponse.json(
      { error: "Error al obtener página" },
      { status: 500 }
    )
  }
}

// PATCH - Actualizar página (admin only)
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

    const { id } = await params
    const body = await request.json()

    const existingPage = await prisma.page.findUnique({
      where: { id },
    })

    if (!existingPage) {
      return NextResponse.json(
        { error: "Página no encontrada" },
        { status: 404 }
      )
    }

    const {
      title,
      slug,
      content,
      excerpt,
      metaTitle,
      metaDescription,
      status,
      showInFooter,
      footerColumn,
      footerOrder,
      publishedAt,
    } = body

    // Verificar slug único si cambió
    if (slug && slug !== existingPage.slug) {
      const slugExists = await prisma.page.findUnique({
        where: { slug },
      })

      if (slugExists) {
        return NextResponse.json(
          { error: "Ya existe una página con ese slug" },
          { status: 400 }
        )
      }
    }

    const page = await prisma.page.update({
      where: { id },
      data: {
        title: title || undefined,
        slug: slug || undefined,
        content: content || undefined,
        excerpt: excerpt !== undefined ? excerpt : undefined,
        metaTitle: metaTitle !== undefined ? metaTitle : undefined,
        metaDescription: metaDescription !== undefined ? metaDescription : undefined,
        status: status || undefined,
        showInFooter: showInFooter !== undefined ? showInFooter : undefined,
        footerColumn: footerColumn !== undefined ? footerColumn : undefined,
        footerOrder: footerOrder !== undefined ? footerOrder : undefined,
        publishedAt: publishedAt !== undefined ? (publishedAt ? new Date(publishedAt) : null) : undefined,
      },
    })

    return NextResponse.json(page)
  } catch (error) {
    console.error("Error updating page:", error)
    return NextResponse.json(
      { error: "Error al actualizar página" },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar página (admin only)
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

    const { id } = await params

    const existingPage = await prisma.page.findUnique({
      where: { id },
    })

    if (!existingPage) {
      return NextResponse.json(
        { error: "Página no encontrada" },
        { status: 404 }
      )
    }

    await prisma.page.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting page:", error)
    return NextResponse.json(
      { error: "Error al eliminar página" },
      { status: 500 }
    )
  }
}
