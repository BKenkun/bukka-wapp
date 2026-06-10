import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { getUserPlan, canUserAccessForum } from "@/lib/subscription-guard"
import { createAdminNotification } from "@/lib/admin-notifications"

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
    return NextResponse.json({ error: "Error fetching topics" }, { status: 500 })
  }
}

// POST - Create forum post
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 })
    }

    // Check forum access
    const userPlan = await getUserPlan(session.user.id)
    if (!canUserAccessForum(userPlan)) {
      return NextResponse.json(
        { error: "You need a Gold subscription or higher to access the forum" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, content, categoryId, poll } = body

    if (!title || !content || !categoryId) {
      return NextResponse.json(
        { error: "Title, content and category are required" },
        { status: 400 }
      )
    }

    // Validate optional poll
    let pollData: { question: string; multiple: boolean; options: string[] } | null = null
    if (poll != null) {
      if (typeof poll !== "object" || Array.isArray(poll)) {
        return NextResponse.json({ error: "Invalid poll" }, { status: 400 })
      }
      const question = typeof poll.question === "string" ? poll.question.trim() : ""
      if (question.length < 1 || question.length > 200) {
        return NextResponse.json(
          { error: "Poll question must be between 1 and 200 characters" },
          { status: 400 }
        )
      }
      if (!Array.isArray(poll.options)) {
        return NextResponse.json({ error: "Poll options are required" }, { status: 400 })
      }
      const options = poll.options
        .map((o: unknown) => (typeof o === "string" ? o.trim() : ""))
        .filter((o: string) => o.length > 0)
      if (options.length < 2 || options.length > 6) {
        return NextResponse.json(
          { error: "Poll must have between 2 and 6 options" },
          { status: 400 }
        )
      }
      if (options.some((o: string) => o.length > 100)) {
        return NextResponse.json(
          { error: "Poll options must be 100 characters or less" },
          { status: 400 }
        )
      }
      pollData = { question, multiple: poll.multiple === true, options }
    }

    // Check if category exists and user has access
    const category = await prisma.forumCategory.findUnique({
      where: { id: categoryId },
      include: { SubscriptionPlan: true },
    })

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
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
        ...(pollData
          ? {
              poll: {
                create: {
                  question: pollData.question,
                  multiple: pollData.multiple,
                  options: {
                    create: pollData.options.map((text, index) => ({ text, order: index })),
                  },
                },
              },
            }
          : {}),
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        ForumCategory: { select: { id: true, slug: true, name: true } },
      },
    })

    await createAdminNotification({
      type: "NEW_FORUM_POST",
      title: "Nuevo tema en el foro",
      message: `${post.user.name || "Usuario"}: ${post.title}`,
      relatedUrl: `/admin/forum`,
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error("Error creating forum post:", error)
    return NextResponse.json({ error: "Error creating topic" }, { status: 500 })
  }
}
