import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { getUserPlan, canUserAccessForum } from "@/lib/subscription-guard"

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST - Toggle like on a post
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const { id: postId } = await params

    // Check if post exists
    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
    })

    if (!post) {
      return NextResponse.json({ error: "Tema no encontrado" }, { status: 404 })
    }

    // Check if user already liked
    const existingLike = await prisma.forumLike.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId,
        },
      },
    })

    if (existingLike) {
      // Unlike - remove like and decrement count
      await prisma.$transaction([
        prisma.forumLike.delete({
          where: { id: existingLike.id },
        }),
        prisma.forumPost.update({
          where: { id: postId },
          data: { likeCount: { decrement: 1 } },
        }),
      ])

      return NextResponse.json({
        liked: false,
        likeCount: post.likeCount - 1,
      })
    } else {
      // Like - create like and increment count
      await prisma.$transaction([
        prisma.forumLike.create({
          data: {
            userId: session.user.id,
            postId,
          },
        }),
        prisma.forumPost.update({
          where: { id: postId },
          data: { likeCount: { increment: 1 } },
        }),
      ])

      return NextResponse.json({
        liked: true,
        likeCount: post.likeCount + 1,
      })
    }
  } catch (error) {
    console.error("Error toggling post like:", error)
    return NextResponse.json({ error: "Error al procesar like" }, { status: 500 })
  }
}

// GET - Check if user liked the post
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ liked: false })
    }

    const { id: postId } = await params

    const like = await prisma.forumLike.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId,
        },
      },
    })

    return NextResponse.json({ liked: !!like })
  } catch (error) {
    console.error("Error checking post like:", error)
    return NextResponse.json({ error: "Error al verificar like" }, { status: 500 })
  }
}
