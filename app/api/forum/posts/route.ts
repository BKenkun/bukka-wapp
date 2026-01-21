import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { getUserPlan, canUserAccessForum } from "@/lib/subscription-guard"

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
          user: { select: { id: true, name: true, image: true } },
          ForumCategory: { select: { id: true, slug: true, name: true } },
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

    // Check forum access
    const userPlan = await getUserPlan(session.user.id)
    if (!canUserAccessForum(userPlan)) {
      return NextResponse.json(
        { error: "Necesitas una suscripción Gold o superior para acceder al foro" },
        { status: 403 }
      )
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
      include: { SubscriptionPlan: true },
    })

    if (!category) {
      return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 })
    }

    // Check user tier for category access
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { SubscriptionPlan: true },
    })

    const userLevel = user?.SubscriptionPlan?.level ?? 0
    const requiredLevel = category.SubscriptionPlan?.level ?? 0

    if (userLevel < requiredLevel) {
      return NextResponse.json(
        {
          error: `Necesitas un nivel de suscripción ${category.SubscriptionPlan?.name || requiredLevel} para publicar en esta categoría`,
        },
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
        user: { select: { id: true, name: true, image: true } },
        ForumCategory: { select: { id: true, slug: true, name: true } },
      },
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error("Error creating forum post:", error)
    return NextResponse.json({ error: "Error al crear tema" }, { status: 500 })
  }
}
