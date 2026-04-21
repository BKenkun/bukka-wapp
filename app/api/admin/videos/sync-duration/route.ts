import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getMuxAsset } from "@/lib/mux/client"

export async function POST() {
  try {
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

    const videos = await prisma.video.findMany({
      where: {
        muxAssetId: { not: null },
        duration: 0,
      },
      select: { id: true, muxAssetId: true, title: true },
    })

    let updated = 0
    let skipped = 0
    const errors: { id: string; title: string; reason: string }[] = []

    for (const v of videos) {
      if (!v.muxAssetId) {
        skipped++
        continue
      }
      try {
        const asset = await getMuxAsset(v.muxAssetId)
        if (asset.duration && asset.duration > 0) {
          await prisma.video.update({
            where: { id: v.id },
            data: { duration: Math.round(asset.duration) },
          })
          updated++
        } else {
          skipped++
        }
      } catch (err) {
        errors.push({
          id: v.id,
          title: v.title,
          reason: err instanceof Error ? err.message : "error desconocido",
        })
      }
    }

    return NextResponse.json({
      total: videos.length,
      updated,
      skipped,
      errors,
    })
  } catch (error) {
    console.error("Error syncing video durations:", error)
    return NextResponse.json(
      { error: "Error al sincronizar duraciones" },
      { status: 500 }
    )
  }
}
