import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { checkVideoAccess } from "@/lib/subscription-guard"
import { getPlaybackToken } from "@/lib/mux/client"

interface RouteParams {
  params: Promise<{ slug: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params

    const video = await prisma.video.findUnique({
      where: { slug },
      include: {
        minTierPlan: {
          select: { id: true, slug: true, name: true, level: true },
        },
      },
    })

    if (!video) {
      return NextResponse.json({ error: "Video no encontrado" }, { status: 404 })
    }

    if (!video.muxPlaybackId) {
      return NextResponse.json(
        { error: "Video no disponible para streaming" },
        { status: 404 }
      )
    }

    // Verificar acceso
    const session = await auth()
    let user = null

    if (session?.user?.id) {
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          subscriptionPlan: true,
        },
      })
    }

    const accessResult = await checkVideoAccess(
      user ? {
        id: user.id,
        subscriptionPlanId: user.subscriptionPlanId,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionEnd: user.subscriptionEnd,
      } : null,
      {
        minTierPlanId: video.minTierPlanId,
        minTierPlan: video.minTierPlan,
        isDiamondExclusive: video.isDiamondExclusive,
        isLimitedEdition: video.isLimitedEdition,
        limitedAccessUntil: video.limitedAccessUntil,
      }
    )

    if (!accessResult.hasAccess) {
      return NextResponse.json(
        {
          error: "No tienes acceso a este video",
          reason: accessResult.reason,
          requiredPlanName: accessResult.requiredPlanName,
          availableAt: accessResult.availableAt,
        },
        { status: 403 }
      )
    }

    // Generar token de playback
    const token = await getPlaybackToken(video.muxPlaybackId, user?.id)

    return NextResponse.json({
      token,
      playbackId: video.muxPlaybackId,
      maxQuality: accessResult.maxQuality,
    })
  } catch (error) {
    console.error("Error getting stream token:", error)
    return NextResponse.json(
      { error: "Error al obtener token de streaming" },
      { status: 500 }
    )
  }
}
