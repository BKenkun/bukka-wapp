import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getMuxAsset } from "@/lib/mux/client"

export async function GET(request: NextRequest) {
  try {
    // Only admins can check asset status
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const assetId = searchParams.get("assetId")

    if (!assetId) {
      return NextResponse.json({ error: "assetId requerido" }, { status: 400 })
    }

    const asset = await getMuxAsset(assetId)

    return NextResponse.json({
      status: asset.status, // "preparing", "ready", "errored"
      playbackId: asset.playback_ids?.[0]?.id || null,
      duration: asset.duration || null,
      aspectRatio: asset.aspect_ratio || null,
      resolution: asset.resolution_tier || null,
    })
  } catch (error) {
    console.error("Error checking Mux asset status:", error)
    return NextResponse.json(
      { error: "Error al verificar estado del video" },
      { status: 500 }
    )
  }
}
