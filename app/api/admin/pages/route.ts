import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

// GET - Listar páginas (admin only)
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

    const pages = await prisma.page.findMany({
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json(pages)
  } catch (error) {
    console.error("Error fetching pages:", error)
    return NextResponse.json(
      { error: "Error al obtener páginas" },
      { status: 500 }
    )
  }
}

// POST - Crear página (admin only)
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

    // Validación básica
    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: "Título, slug y contenido son requeridos" },
        { status: 400 }
      )
    }

    // Verificar slug único
    const existingPage = await prisma.page.findUnique({
      where: { slug },
    })

    if (existingPage) {
      return NextResponse.json(
        { error: "Ya existe una página con ese slug" },
        { status: 400 }
      )
    }

    const page = await prisma.page.create({
      data: {
        title,
        slug,
        content,
        excerpt: excerpt || null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        status: status || "DRAFT",
        showInFooter: showInFooter || false,
        footerColumn: footerColumn || null,
        footerOrder: footerOrder || 0,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
      },
    })

    return NextResponse.json(page, { status: 201 })
  } catch (error) {
    console.error("Error creating page:", error)
    return NextResponse.json(
      { error: "Error al crear página" },
      { status: 500 }
    )
  }
}
