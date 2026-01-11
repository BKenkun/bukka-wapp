import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

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
        author: { select: { id: true, name: true, image: true, tier: true } },
      },
    })

    return NextResponse.json({ replies })
  } catch (error) {
    console.error("Error fetching replies:", error)
    return NextResponse.json({ error: "Error al obtener respuestas" }, { status: 500 })
  }
}

// POST - Create reply
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id: postId } = await params
    const body = await request.json()
    const { content, parentId } = body

    if (!content) {
      return NextResponse.json({ error: "El contenido es requerido" }, { status: 400 })
    }

    // Check if post exists and is not locked
    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
      include: { category: true },
    })

    if (!post) {
      return NextResponse.json({ error: "Tema no encontrado" }, { status: 404 })
    }

    if (post.isLocked) {
      return NextResponse.json({ error: "Este tema está cerrado" }, { status: 403 })
    }

    // Check user tier for category access
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tier: true },
    })

    const tierOrder = ["VISITOR", "FREE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"]
    const userTierIndex = tierOrder.indexOf(user?.tier || "FREE")
    const requiredTierIndex = tierOrder.indexOf(post.category.minTier)

    if (userTierIndex < requiredTierIndex) {
      return NextResponse.json(
        { error: `Necesitas tier ${post.category.minTier} para responder` },
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
          author: { select: { id: true, name: true, image: true, tier: true } },
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
    return NextResponse.json({ error: "Error al crear respuesta" }, { status: 500 })
  }
}
