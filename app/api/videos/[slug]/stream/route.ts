import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { checkVideoAccess } from "@/lib/subscription-guard"
import { getPlaybackToken, planQualityToMuxResolution } from "@/lib/mux/client"

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
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    if (!video.muxPlaybackId) {
      return NextResponse.json(
        { error: "Video not available for streaming" },
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
          SubscriptionPlan: true,
        },
      })
    }

    const accessResult = await checkVideoAccess(
      user ? {
        id: user.id,
        subscriptionPlanId: user.subscriptionPlanId,
        subscriptionPlan: user.SubscriptionPlan,
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
          error: "You do not have access to this video",
          reason: accessResult.reason,
          requiredPlanName: accessResult.requiredPlanName,
          availableAt: accessResult.availableAt,
        },
        { status: 403 }
      )
    }

    // Obtener la calidad máxima del plan del usuario
    const maxVideoQuality = user?.SubscriptionPlan?.maxVideoQuality || "720p"
    const muxMaxResolution = planQualityToMuxResolution(maxVideoQuality)

    // Generar token de playback con restricción de calidad
    const token = await getPlaybackToken(video.muxPlaybackId, user?.id, muxMaxResolution)

    return NextResponse.json({
      token,
      playbackId: video.muxPlaybackId,
      maxQuality: maxVideoQuality,
      maxResolution: muxMaxResolution,
    })
  } catch (error) {
    console.error("Error getting stream token:", error)
    return NextResponse.json(
      { error: "Error fetching streaming token" },
      { status: 500 }
    )
  }
}
