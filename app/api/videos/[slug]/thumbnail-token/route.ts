import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getThumbnailToken } from "@/lib/mux/client"

interface RouteParams {
  params: Promise<{ slug: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params

    const video = await prisma.video.findUnique({
      where: { slug },
      select: {
        muxPlaybackId: true,
      },
    })

    if (!video?.muxPlaybackId) {
      return NextResponse.json(
        { error: "Video not found or missing playback ID" },
        { status: 404 }
      )
    }

    const token = await getThumbnailToken(video.muxPlaybackId)

    return NextResponse.json({ token })
  } catch (error) {
    console.error("Error getting thumbnail token:", error)
    return NextResponse.json(
      { error: "Error fetching thumbnail token" },
      { status: 500 }
    )
  }
}
