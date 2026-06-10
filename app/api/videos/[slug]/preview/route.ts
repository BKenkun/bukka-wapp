import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getVideoToken, getVideoPreviewUrl } from "@/lib/mux/client"

interface RouteParams {
  params: Promise<{ slug: string }>
}

/**
 * GET - Obtiene la URL del preview video MP4 con token firmado
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const quality = (searchParams.get("quality") as "low" | "medium" | "high") || "medium"

    const video = await prisma.video.findUnique({
      where: { slug },
      select: {
        muxPlaybackId: true,
        previewStartTime: true,
        previewEndTime: true,
      },
    })

    if (!video) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      )
    }

    if (!video.muxPlaybackId) {
      return NextResponse.json(
        { error: "The video has not been processed in Mux yet" },
        { status: 400 }
      )
    }

    // Generar token firmado para el video MP4
    const token = await getVideoToken(video.muxPlaybackId)

    // Generar URL del MP4 con token
    const previewUrl = getVideoPreviewUrl(video.muxPlaybackId, token, quality)

    return NextResponse.json({
      previewUrl,
      playbackId: video.muxPlaybackId,
      format: "mp4",
      quality,
      options: {
        start: video.previewStartTime,
        end: video.previewEndTime,
        duration: video.previewEndTime - video.previewStartTime,
      },
    })
  } catch (error) {
    console.error("Error generating preview URL:", error)
    return NextResponse.json(
      { error: "Error generating preview URL" },
      { status: 500 }
    )
  }
}
