import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

interface RouteParams {
  params: Promise<{ slug: string }>
}

// GET - List photos for a performer
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params

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

    const photos = await prisma.performerPhoto.findMany({
      where: { performerId: performer.id },
      orderBy: { order: "asc" },
    })

    return NextResponse.json({ photos })
  } catch (error) {
    console.error("Error fetching performer photos:", error)
    return NextResponse.json(
      { error: "Error fetching photos" },
      { status: 500 }
    )
  }
}

// POST - Add photo to performer (admin only)
export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const { imageUrl, caption } = body

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL required" },
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

    // Get the highest order number
    const lastPhoto = await prisma.performerPhoto.findFirst({
      where: { performerId: performer.id },
      orderBy: { order: "desc" },
      select: { order: true },
    })

    const newOrder = (lastPhoto?.order ?? -1) + 1

    const photo = await prisma.performerPhoto.create({
      data: {
        performerId: performer.id,
        imageUrl,
        caption: caption || null,
        order: newOrder,
      },
    })

    return NextResponse.json(photo, { status: 201 })
  } catch (error) {
    console.error("Error creating performer photo:", error)
    return NextResponse.json(
      { error: "Error creating photo" },
      { status: 500 }
    )
  }
}
