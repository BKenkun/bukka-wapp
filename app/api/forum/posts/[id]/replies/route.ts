import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { getUserPlan, canUserAccessForum } from "@/lib/subscription-guard"

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Get replies for a post
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const replies = await prisma.forumReply.findMany({
      where: { postId: id },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            SubscriptionPlan: { select: { name: true, level: true } },
          },
        },
      },
    })

    return NextResponse.json({ replies })
  } catch (error) {
    console.error("Error fetching replies:", error)
    return NextResponse.json({ error: "Error fetching replies" }, { status: 500 })
  }
}

// POST - Create reply
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const { id: postId } = await params
    const body = await request.json()
    const { content, parentId } = body

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Check if post exists and is not locked
    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
      include: { ForumCategory: { include: { SubscriptionPlan: true } } },
    })

    if (!post) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }

    if (post.isLocked) {
      return NextResponse.json({ error: "This topic is closed" }, { status: 403 })
    }

    // Check user tier for category access
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { SubscriptionPlan: true },
    })

    const userLevel = user?.SubscriptionPlan?.level ?? 0
    const requiredLevel = post.ForumCategory.SubscriptionPlan?.level ?? 0

    if (userLevel < requiredLevel) {
      return NextResponse.json(
        {
          error: `Necesitas un nivel de suscripción ${post.ForumCategory.SubscriptionPlan?.name || requiredLevel} para responder`,
        },
        { status: 403 }
      )
    }

    // Create reply and update post counters
    const [reply] = await prisma.$transaction([
      prisma.forumReply.create({
        data: {
          content,
          authorId: session.user.id,
          postId,
          parentId: parentId || null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              SubscriptionPlan: { select: { name: true, level: true } },
            },
          },
        },
      }),
      prisma.forumPost.update({
        where: { id: postId },
        data: {
          replyCount: { increment: 1 },
          lastReplyAt: new Date(),
        },
      }),
    ])

    return NextResponse.json(reply, { status: 201 })
  } catch (error) {
    console.error("Error creating reply:", error)
    return NextResponse.json({ error: "Error creating reply" }, { status: 500 })
  }
}
