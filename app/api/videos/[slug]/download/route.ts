import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { checkVideoAccess } from "@/lib/subscription-guard"
import { getVideoToken, planQualityToMuxResolution } from "@/lib/mux/client"

interface RouteParams {
  params: Promise<{ slug: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params

    // Verificar autenticación
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para descargar" },
        { status: 401 }
      )
    }

    // Obtener usuario con plan de suscripción
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        SubscriptionPlan: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    // Verificar que el plan permita descargas
    if (!user.SubscriptionPlan?.canDownload) {
      return NextResponse.json(
        {
          error: "Tu plan no permite descargas",
          requiredFeature: "canDownload",
        },
        { status: 403 }
      )
    }

    // Obtener el video
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
        { error: "Video no disponible para descarga" },
        { status: 404 }
      )
    }

    // Verificar acceso al video
    const accessResult = await checkVideoAccess(
      {
        id: user.id,
        subscriptionPlanId: user.subscriptionPlanId,
        subscriptionPlan: user.SubscriptionPlan,
        subscriptionEnd: user.subscriptionEnd,
      },
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
        },
        { status: 403 }
      )
    }

    // Determinar la calidad de descarga basada en el plan
    const maxVideoQuality = user.SubscriptionPlan?.maxVideoQuality || "720p"
    const muxResolution = planQualityToMuxResolution(maxVideoQuality)

    // Mapear resolución Mux a calidad de descarga MP4
    let downloadQuality: "low" | "medium" | "high" = "medium"
    if (muxResolution === "2160p" || muxResolution === "1440p" || muxResolution === "1080p") {
      downloadQuality = "high"
    } else if (muxResolution === "720p") {
      downloadQuality = "medium"
    } else {
      downloadQuality = "low"
    }

    // Generar token firmado para la descarga
    const token = await getVideoToken(video.muxPlaybackId)

    // Construir URL de descarga
    const downloadUrl = `https://stream.mux.com/${video.muxPlaybackId}/${downloadQuality}.mp4?token=${token}&download=${encodeURIComponent(video.title)}`

    return NextResponse.json({
      downloadUrl,
      quality: downloadQuality,
      maxQuality: maxVideoQuality,
      filename: `${video.title}.mp4`,
    })
  } catch (error) {
    console.error("Error generating download URL:", error)
    return NextResponse.json(
      { error: "Error al generar enlace de descarga" },
      { status: 500 }
    )
  }
}
