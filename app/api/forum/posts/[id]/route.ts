import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Get single forum post with replies
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const post = await prisma.forumPost.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, image: true, subscriptionPlanId: true } },
        ForumCategory: { select: { id: true, slug: true, name: true } },
        ForumReply: {
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { id: true, name: true, image: true, subscriptionPlanId: true } },
          },
        },
      },
    })

    if (!post) {
      return NextResponse.json({ error: "Tema no encontrado" }, { status: 404 })
    }

    // Increment view count
    await prisma.forumPost.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error("Error fetching forum post:", error)
    return NextResponse.json({ error: "Error al obtener tema" }, { status: 500 })
  }
}

// PATCH - Update forum post
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { title, content, isPinned, isLocked } = body

    const existingPost = await prisma.forumPost.findUnique({
      where: { id },
      include: { user: { select: { id: true } } },
    })

    if (!existingPost) {
      return NextResponse.json({ error: "Tema no encontrado" }, { status: 404 })
    }

    // Check permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true, isModerator: true },
    })

    const isOwner = existingPost.authorId === session.user.id
    const isMod = user?.isAdmin || user?.isModerator

    // Only owner can edit title/content, only mod can pin/lock
    if (!isOwner && !isMod) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const updateData: Record<string, unknown> = {}

    // Owner can edit content
    if (isOwner && !existingPost.isLocked) {
      if (title !== undefined) updateData.title = title
      if (content !== undefined) updateData.content = content
    }

    // Mod can pin/lock
    if (isMod) {
      if (isPinned !== undefined) updateData.isPinned = isPinned
      if (isLocked !== undefined) updateData.isLocked = isLocked
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No hay cambios para aplicar" }, { status: 400 })
    }

    const post = await prisma.forumPost.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, image: true } },
        ForumCategory: { select: { id: true, slug: true, name: true } },
      },
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error("Error updating forum post:", error)
    return NextResponse.json({ error: "Error al actualizar tema" }, { status: 500 })
  }
}

// DELETE - Delete forum post
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params

    const existingPost = await prisma.forumPost.findUnique({
      where: { id },
    })

    if (!existingPost) {
      return NextResponse.json({ error: "Tema no encontrado" }, { status: 404 })
    }

    // Check permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true, isModerator: true },
    })

    const isOwner = existingPost.authorId === session.user.id
    const isMod = user?.isAdmin || user?.isModerator

    if (!isOwner && !isMod) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    await prisma.forumPost.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting forum post:", error)
    return NextResponse.json({ error: "Error al eliminar tema" }, { status: 500 })
  }
}
