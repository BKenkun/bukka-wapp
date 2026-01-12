import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: Promise<{ slug: string }>
}

// GET - List comments for a video
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const sort = searchParams.get("sort") || "recent" // recent | popular

    const video = await prisma.video.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    const orderBy = sort === "popular"
      ? { likeCount: "desc" as const }
      : { createdAt: "desc" as const }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: {
          videoId: video.id,
          parentId: null, // Only top-level comments
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              SubscriptionPlan: {
                select: {
                  slug: true,
                  name: true,
                },
              },
            },
          },
          other_Comment: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.comment.count({
        where: { videoId: video.id, parentId: null },
      }),
    ])

    // Transform comments for response
    const transformedComments = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      likeCount: comment.likeCount,
      createdAt: comment.createdAt.toISOString(),
      author: {
        id: comment.user.id,
        name: comment.user.name || "Usuario",
        image: comment.user.image,
        plan: comment.user.SubscriptionPlan,
      },
      replies: comment.other_Comment.map((reply) => ({
        id: reply.id,
        content: reply.content,
        likeCount: reply.likeCount,
        createdAt: reply.createdAt.toISOString(),
        author: {
          id: reply.user.id,
          name: reply.user.name || "Usuario",
          image: reply.user.image,
        },
      })),
    }))

    return NextResponse.json({
      comments: transformedComments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json(
      { error: "Error fetching comments" },
      { status: 500 }
    )
  }
}

// POST - Create a new comment
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { slug } = await params
    const body = await request.json()
    const { content, parentId } = body

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      )
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: "Comment too long (max 2000 characters)" },
        { status: 400 }
      )
    }

    const video = await prisma.video.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    // If parentId is provided, verify it exists and belongs to this video
    if (parentId) {
      const parentComment = await prisma.comment.findFirst({
        where: {
          id: parentId,
          videoId: video.id,
        },
      })

      if (!parentComment) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        )
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        authorId: session.user.id,
        videoId: video.id,
        parentId: parentId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            SubscriptionPlan: {
              select: {
                slug: true,
                name: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      comment: {
        id: comment.id,
        content: comment.content,
        likeCount: comment.likeCount,
        createdAt: comment.createdAt.toISOString(),
        author: {
          id: comment.user.id,
          name: comment.user.name || "Usuario",
          image: comment.user.image,
          plan: comment.user.SubscriptionPlan,
        },
        replies: [],
      },
    })
  } catch (error) {
    console.error("Error creating comment:", error)
    return NextResponse.json(
      { error: "Error creating comment" },
      { status: 500 }
    )
  }
}
