import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createMuxUpload, getUploadStatus, getMuxAsset } from "@/lib/mux/client"

// POST - Create new Mux upload URL
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Verify admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await request.json()
    const { videoId } = body

    // Create Mux upload
    const { uploadUrl, uploadId } = await createMuxUpload()

    // If videoId provided, update video with new upload ID and clear old Mux data
    if (videoId) {
      await prisma.video.update({
        where: { id: videoId },
        data: {
          muxUploadId: uploadId,
          muxAssetId: null,
          muxPlaybackId: null,
          duration: 0,
          status: "DRAFT",
        },
      })
    }

    return NextResponse.json({
      uploadUrl,
      uploadId,
    })
  } catch (error) {
    console.error("Error creating Mux upload:", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json(
      { error: `Error al crear upload: ${errorMessage}` },
      { status: 500 }
    )
  }
}

// GET - Check upload status and get asset info
export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const uploadId = searchParams.get("uploadId")

    if (!uploadId) {
      return NextResponse.json({ error: "uploadId requerido" }, { status: 400 })
    }

    const uploadStatus = await getUploadStatus(uploadId)

    // If asset is created, get asset details including playbackId
    if (uploadStatus.assetId) {
      try {
        const asset = await getMuxAsset(uploadStatus.assetId)
        return NextResponse.json({
          status: uploadStatus.status,
          assetId: uploadStatus.assetId,
          assetStatus: asset.status,
          playbackId: asset.playback_ids?.[0]?.id || null,
          duration: asset.duration ? Math.round(asset.duration) : null,
        })
      } catch (assetError) {
        // Asset might not be ready yet
        return NextResponse.json({
          status: uploadStatus.status,
          assetId: uploadStatus.assetId,
        })
      }
    }

    return NextResponse.json(uploadStatus)
  } catch (error) {
    console.error("Error checking upload status:", error)
    return NextResponse.json(
      { error: "Error al verificar estado" },
      { status: 500 }
    )
  }
}
