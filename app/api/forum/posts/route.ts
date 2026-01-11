import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

// GET - List forum posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get("categoryId")
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")))
    const sort = searchParams.get("sort") || "recent" // recent, popular, replies

    const whereClause: Record<string, unknown> = {}

    if (categoryId) {
      whereClause.categoryId = categoryId
    }

    // Determine sort order
    let orderBy: Record<string, string>[]
    switch (sort) {
      case "popular":
        orderBy = [{ isPinned: "desc" }, { viewCount: "desc" }, { createdAt: "desc" }]
        break
      case "replies":
        orderBy = [{ isPinned: "desc" }, { replyCount: "desc" }, { createdAt: "desc" }]
        break
      default: // recent
        orderBy = [{ isPinned: "desc" }, { createdAt: "desc" }]
    }

    const [posts, totalCount] = await Promise.all([
      prisma.forumPost.findMany({
        where: whereClause,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          author: { select: { id: true, name: true, image: true } },
          category: { select: { id: true, slug: true, name: true } },
        },
      }),
      prisma.forumPost.count({ where: whereClause }),
    ])

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching forum posts:", error)
    return NextResponse.json({ error: "Error al obtener temas" }, { status: 500 })
  }
}

// POST - Create forum post
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, categoryId } = body

    if (!title || !content || !categoryId) {
      return NextResponse.json(
        { error: "Título, contenido y categoría son requeridos" },
        { status: 400 }
      )
    }

    // Check if category exists and user has access
    const category = await prisma.forumCategory.findUnique({
      where: { id: categoryId },
    })

    if (!category) {
      return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 })
    }

    // Check user tier for category access
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tier: true },
    })

    const tierOrder = ["VISITOR", "FREE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"]
    const userTierIndex = tierOrder.indexOf(user?.tier || "FREE")
    const requiredTierIndex = tierOrder.indexOf(category.minTier)

    if (userTierIndex < requiredTierIndex) {
      return NextResponse.json(
        { error: `Necesitas tier ${category.minTier} para publicar en esta categoría` },
        { status: 403 }
      )
    }

    const post = await prisma.forumPost.create({
      data: {
        title,
        content,
        authorId: session.user.id,
        categoryId,
      },
      include: {
        author: { select: { id: true, name: true, image: true } },
        category: { select: { id: true, slug: true, name: true } },
      },
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error("Error creating forum post:", error)
    return NextResponse.json({ error: "Error al crear tema" }, { status: 500 })
  }
}
