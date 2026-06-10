import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { getUserPlan, canUserAccessForum } from "@/lib/subscription-guard"

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST - Toggle like on a reply
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

    const { id: replyId } = await params

    // Check if reply exists
    const reply = await prisma.forumReply.findUnique({
      where: { id: replyId },
    })

    if (!reply) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 })
    }

    // Check if user already liked
    const existingLike = await prisma.forumLike.findUnique({
      where: {
        userId_replyId: {
          userId: session.user.id,
          replyId,
        },
      },
    })

    if (existingLike) {
      // Unlike - remove like and decrement count
      await prisma.$transaction([
        prisma.forumLike.delete({
          where: { id: existingLike.id },
        }),
        prisma.forumReply.update({
          where: { id: replyId },
          data: { likeCount: { decrement: 1 } },
        }),
      ])

      return NextResponse.json({
        liked: false,
        likeCount: reply.likeCount - 1,
      })
    } else {
      // Like - create like and increment count
      await prisma.$transaction([
        prisma.forumLike.create({
          data: {
            userId: session.user.id,
            replyId,
          },
        }),
        prisma.forumReply.update({
          where: { id: replyId },
          data: { likeCount: { increment: 1 } },
        }),
      ])

      return NextResponse.json({
        liked: true,
        likeCount: reply.likeCount + 1,
      })
    }
  } catch (error) {
    console.error("Error toggling reply like:", error)
    return NextResponse.json({ error: "Error processing like" }, { status: 500 })
  }
}

// GET - Check if user liked the reply
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ liked: false })
    }

    const { id: replyId } = await params

    const like = await prisma.forumLike.findUnique({
      where: {
        userId_replyId: {
          userId: session.user.id,
          replyId,
        },
      },
    })

    return NextResponse.json({ liked: !!like })
  } catch (error) {
    console.error("Error checking reply like:", error)
    return NextResponse.json({ error: "Error checking like" }, { status: 500 })
  }
}
