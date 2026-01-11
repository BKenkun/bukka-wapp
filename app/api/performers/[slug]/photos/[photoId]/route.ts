import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

interface RouteParams {
  params: Promise<{ slug: string; photoId: string }>
}

// DELETE - Remove photo from performer (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { slug, photoId } = await params

    const performer = await prisma.performer.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!performer) {
      return NextResponse.json(
        { error: "Actriz no encontrada" },
        { status: 404 }
      )
    }

    const photo = await prisma.performerPhoto.findFirst({
      where: {
        id: photoId,
        performerId: performer.id,
      },
    })

    if (!photo) {
      return NextResponse.json(
        { error: "Foto no encontrada" },
        { status: 404 }
      )
    }

    await prisma.performerPhoto.delete({
      where: { id: photoId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting performer photo:", error)
    return NextResponse.json(
      { error: "Error al eliminar foto" },
      { status: 500 }
    )
  }
}

// PATCH - Update photo caption (admin only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { slug, photoId } = await params
    const body = await request.json()
    const { caption } = body

    const performer = await prisma.performer.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!performer) {
      return NextResponse.json(
        { error: "Actriz no encontrada" },
        { status: 404 }
      )
    }

    const photo = await prisma.performerPhoto.findFirst({
      where: {
        id: photoId,
        performerId: performer.id,
      },
    })

    if (!photo) {
      return NextResponse.json(
        { error: "Foto no encontrada" },
        { status: 404 }
      )
    }

    const updatedPhoto = await prisma.performerPhoto.update({
      where: { id: photoId },
      data: { caption: caption || null },
    })

    return NextResponse.json(updatedPhoto)
  } catch (error) {
    console.error("Error updating performer photo:", error)
    return NextResponse.json(
      { error: "Error al actualizar foto" },
      { status: 500 }
    )
  }
}
