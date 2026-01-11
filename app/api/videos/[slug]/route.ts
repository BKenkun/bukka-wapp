import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { checkVideoAccess } from "@/lib/subscription-guard"

interface RouteParams {
  params: Promise<{ slug: string }>
}

// PATCH - Actualizar video (admin only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const { slug } = await params
    const body = await request.json()

    const existingVideo = await prisma.video.findUnique({
      where: { slug },
    })

    if (!existingVideo) {
      return NextResponse.json({ error: "Video no encontrado" }, { status: 404 })
    }

    const {
      title,
      slug: newSlug,
      description,
      thumbnailUrl,
      previewUrl,
      status,
      minTierPlanId,
      isDiamondExclusive,
      isLimitedEdition,
      limitedAccessUntil,
      releaseDate,
      has720p,
      has1080p,
      has4k,
      allowDownload,
      metaTitle,
      metaDescription,
      performerIds,
      categoryIds,
    } = body

    // Si cambia el slug, verificar que no exista
    if (newSlug && newSlug !== slug) {
      const slugExists = await prisma.video.findUnique({
        where: { slug: newSlug },
      })
      if (slugExists) {
        return NextResponse.json(
          { error: "Ya existe un video con ese slug" },
          { status: 400 }
        )
      }
    }

    // Actualizar relaciones de performers
    if (performerIds !== undefined) {
      await prisma.videoPerformer.deleteMany({
        where: { videoId: existingVideo.id },
      })

      if (performerIds.length > 0) {
        await prisma.videoPerformer.createMany({
          data: performerIds.map((performerId: string) => ({
            videoId: existingVideo.id,
            performerId,
          })),
        })
      }
    }

    // Actualizar relaciones de categorías
    if (categoryIds !== undefined) {
      await prisma.videoToCategory.deleteMany({
        where: { videoId: existingVideo.id },
      })

      if (categoryIds.length > 0) {
        await prisma.videoToCategory.createMany({
          data: categoryIds.map((categoryId: string) => ({
            videoId: existingVideo.id,
            categoryId,
          })),
        })
      }
    }

    const video = await prisma.video.update({
      where: { id: existingVideo.id },
      data: {
        title,
        slug: newSlug || slug,
        description,
        thumbnailUrl,
        previewUrl: previewUrl || null,
        status,
        minTierPlanId: minTierPlanId !== undefined ? minTierPlanId : undefined,
        isDiamondExclusive,
        isLimitedEdition,
        limitedAccessUntil: limitedAccessUntil ? new Date(limitedAccessUntil) : null,
        releaseDate: releaseDate ? new Date(releaseDate) : undefined,
        has720p,
        has1080p,
        has4k,
        allowDownload,
        metaTitle,
        metaDescription,
      },
      include: {
        performers: { include: { performer: true } },
        categories: { include: { category: true } },
      },
    })

    return NextResponse.json(video)
  } catch (error) {
    console.error("Error updating video:", error)
    return NextResponse.json(
      { error: "Error al actualizar video" },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar video (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { slug } = await params

    const video = await prisma.video.findUnique({
      where: { slug },
    })

    if (!video) {
      return NextResponse.json({ error: "Video no encontrado" }, { status: 404 })
    }

    await prisma.video.delete({
      where: { id: video.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting video:", error)
    return NextResponse.json(
      { error: "Error al eliminar video" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params

    const video = await prisma.video.findUnique({
      where: { slug },
      include: {
        subtitles: true,
        minTierPlan: {
          select: { id: true, slug: true, name: true, level: true },
        },
        performers: {
          include: {
            performer: {
              select: {
                id: true,
                slug: true,
                name: true,
                profileImage: true,
                bio: true,
              },
            },
          },
        },
        categories: {
          include: {
            category: {
              select: {
                id: true,
                slug: true,
                name: true,
              },
            },
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                slug: true,
                name: true,
              },
            },
          },
        },
        gallery: {
          orderBy: { order: "asc" },
        },
        relatedProducts: {
          include: {
            product: {
              select: {
                id: true,
                slug: true,
                name: true,
                price: true,
                images: true,
              },
            },
          },
        },
      },
    })

    if (!video) {
      return NextResponse.json({ error: "Video no encontrado" }, { status: 404 })
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

    // Incrementar vistas si tiene acceso
    if (accessResult.hasAccess) {
      await prisma.video.update({
        where: { id: video.id },
        data: { viewCount: { increment: 1 } },
      })

      // Registrar en historial si está autenticado
      if (user) {
        await prisma.watchHistory.upsert({
          where: {
            userId_videoId: {
              userId: user.id,
              videoId: video.id,
            },
          },
          update: {
            lastWatchedAt: new Date(),
          },
          create: {
            userId: user.id,
            videoId: video.id,
          },
        })
      }
    }

    // Transformar respuesta
    const response = {
      id: video.id,
      slug: video.slug,
      title: video.title,
      description: video.description,
      thumbnailUrl: video.thumbnailUrl,
      previewUrl: video.previewUrl,
      duration: video.duration,
      releaseDate: video.releaseDate,
      viewCount: video.viewCount + (accessResult.hasAccess ? 1 : 0),
      likeCount: video.likeCount,
      minTierPlan: video.minTierPlan,
      isLimitedEdition: video.isLimitedEdition,
      isDiamondExclusive: video.isDiamondExclusive,
      limitedAccessUntil: video.limitedAccessUntil,
      has720p: video.has720p,
      has1080p: video.has1080p,
      has4k: video.has4k,
      allowDownload: video.allowDownload,
      metaTitle: video.metaTitle,
      metaDescription: video.metaDescription,
      performers: video.performers.map((vp) => vp.performer),
      categories: video.categories.map((vc) => vc.category),
      tags: video.tags.map((vt) => vt.tag),
      gallery: video.gallery,
      relatedProducts: video.relatedProducts.map((vp) => vp.product),
      subtitles: video.subtitles,
      // Información de acceso
      access: accessResult.hasAccess
        ? {
            hasAccess: true,
            maxQuality: accessResult.maxQuality,
            muxPlaybackId: video.muxPlaybackId,
          }
        : {
            hasAccess: false,
            reason: accessResult.reason,
            requiredPlanName: accessResult.requiredPlanName,
            availableAt: accessResult.availableAt,
          },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching video:", error)
    return NextResponse.json(
      { error: "Error al obtener video" },
      { status: 500 }
    )
  }
}
