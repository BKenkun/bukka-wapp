import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

interface RouteParams {
  params: Promise<{ slug: string }>
}

// PATCH - Reorder photos for performer (admin only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const { slug } = await params
    const body = await request.json()
    const { photoIds } = body

    if (!Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json(
        { error: "An array of photo IDs is required" },
        { status: 400 }
      )
    }

    const performer = await prisma.performer.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!performer) {
      return NextResponse.json(
        { error: "Actress not found" },
        { status: 404 }
      )
    }

    // Verify all photos belong to this performer
    const photos = await prisma.performerPhoto.findMany({
      where: {
        id: { in: photoIds },
        performerId: performer.id,
      },
      select: { id: true },
    })

    if (photos.length !== photoIds.length) {
      return NextResponse.json(
        { error: "Some photos do not belong to this actress" },
        { status: 400 }
      )
    }

    // Update order for each photo
    await prisma.$transaction(
      photoIds.map((photoId: string, index: number) =>
        prisma.performerPhoto.update({
          where: { id: photoId },
          data: { order: index },
        })
      )
    )

    // Return updated photos
    const updatedPhotos = await prisma.performerPhoto.findMany({
      where: { performerId: performer.id },
      orderBy: { order: "asc" },
    })

    return NextResponse.json({ photos: updatedPhotos })
  } catch (error) {
    console.error("Error reordering performer photos:", error)
    return NextResponse.json(
      { error: "Error reordering photos" },
      { status: 500 }
    )
  }
}
