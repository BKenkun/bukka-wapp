import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("q") || ""
    const ids = searchParams.get("ids")?.split(",").filter(Boolean) || []
    const limit = parseInt(searchParams.get("limit") || "20")

    // If specific IDs are requested, fetch those videos
    if (ids.length > 0) {
      const videos = await prisma.video.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnailUrl: true,
          muxPlaybackId: true,
          status: true,
        },
      })

      // Sort by the order of IDs provided
      const sortedVideos = ids
        .map((id) => videos.find((v) => v.id === id))
        .filter(Boolean)

      return NextResponse.json({ videos: sortedVideos })
    }

    // Search videos by title or slug
    const videos = await prisma.video.findMany({
      where: search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { slug: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      select: {
        id: true,
        title: true,
        slug: true,
        thumbnailUrl: true,
        muxPlaybackId: true,
        status: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return NextResponse.json({ videos })
  } catch (error) {
    console.error("Error searching videos:", error)
    return NextResponse.json(
      { error: "Error al buscar videos" },
      { status: 500 }
    )
  }
}
