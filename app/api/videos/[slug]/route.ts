import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { checkVideoAccess } from "@/lib/subscription-guard"
import { deleteMuxAsset } from "@/lib/mux/client"
import { deleteLocalFile } from "@/lib/file-utils"

interface RouteParams {
  params: Promise<{ slug: string }>
}

// PATCH - Actualizar video (admin only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const { slug } = await params
    const body = await request.json()

    const existingVideo = await prisma.video.findUnique({
      where: { slug },
    })

    if (!existingVideo) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
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
      // Preview customization
      previewStartTime,
      previewEndTime,
      metaTitle,
      metaDescription,
      performerIds,
      categoryIds,
      productIds,
      tagIds,
      // Mux video replacement
      muxUploadId,
      muxAssetId,
      muxPlaybackId,
    } = body

    // Si se está reemplazando el video (nuevo muxAssetId), eliminar el asset antiguo de Mux
    if (muxAssetId && existingVideo.muxAssetId && muxAssetId !== existingVideo.muxAssetId) {
      try {
        await deleteMuxAsset(existingVideo.muxAssetId)
        console.log(`Old Mux asset ${existingVideo.muxAssetId} deleted on video replacement`)
      } catch (muxError) {
        // Log el error pero continuar - el asset podría ya no existir
        console.error("Error deleting old Mux asset on replacement:", muxError)
      }
    }

    // Si se está reemplazando el thumbnail, eliminar el archivo antiguo
    if (thumbnailUrl && existingVideo.thumbnailUrl && thumbnailUrl !== existingVideo.thumbnailUrl) {
      await deleteLocalFile(existingVideo.thumbnailUrl)
    }

    // Si se está reemplazando el preview personalizado, eliminar el archivo antiguo
    if (previewUrl !== undefined && existingVideo.previewUrl && previewUrl !== existingVideo.previewUrl) {
      await deleteLocalFile(existingVideo.previewUrl)
    }

    // Si cambia el slug, verificar que no exista
    if (newSlug && newSlug !== slug) {
      const slugExists = await prisma.video.findUnique({
        where: { slug: newSlug },
      })
      if (slugExists) {
        return NextResponse.json(
          { error: "A video with that slug already exists" },
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

    // Actualizar relaciones de productos
    if (productIds !== undefined) {
      await prisma.videoProduct.deleteMany({
        where: { videoId: existingVideo.id },
      })

      if (productIds.length > 0) {
        await prisma.videoProduct.createMany({
          data: productIds.map((productId: string) => ({
            videoId: existingVideo.id,
            productId,
          })),
        })
      }
    }

    // Actualizar relaciones de tags
    if (tagIds !== undefined) {
      await prisma.videoTag.deleteMany({
        where: { videoId: existingVideo.id },
      })

      if (tagIds.length > 0) {
        await prisma.videoTag.createMany({
          data: tagIds.map((tagId: string) => ({
            videoId: existingVideo.id,
            tagId,
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
        // Preview customization
        previewStartTime: previewStartTime !== undefined ? previewStartTime : undefined,
        previewEndTime: previewEndTime !== undefined ? previewEndTime : undefined,
        metaTitle,
        metaDescription,
        // Mux fields (for video replacement)
        ...(muxUploadId !== undefined && { muxUploadId }),
        ...(muxAssetId !== undefined && { muxAssetId }),
        ...(muxPlaybackId !== undefined && { muxPlaybackId }),
      },
      include: {
        performers: { include: { performer: true } },
        categories: { include: { category: true } },
        relatedProducts: { include: { product: true } },
        tags: { include: { tag: true } },
      },
    })

    return NextResponse.json(video)
  } catch (error) {
    console.error("Error updating video:", error)
    return NextResponse.json(
      { error: "Error updating video" },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar video (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const { slug } = await params

    const video = await prisma.video.findUnique({
      where: { slug },
      select: {
        id: true,
        muxAssetId: true,
        thumbnailUrl: true,
        previewUrl: true,
      },
    })

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    // Eliminar asset de Mux si existe
    if (video.muxAssetId) {
      try {
        await deleteMuxAsset(video.muxAssetId)
        console.log(`Mux asset ${video.muxAssetId} deleted successfully`)
      } catch (muxError) {
        // Log el error pero continuar con la eliminación de la BD
        // El asset podría ya no existir en Mux
        console.error("Error deleting Mux asset:", muxError)
      }
    }

    // Eliminar archivos locales (thumbnail y preview)
    await deleteLocalFile(video.thumbnailUrl)
    await deleteLocalFile(video.previewUrl)

    // Eliminar video de la base de datos
    await prisma.video.delete({
      where: { id: video.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting video:", error)
    return NextResponse.json(
      { error: "Error deleting video" },
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
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
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

    // Generar URL del preview MP4 video
    let previewVideoUrl = video.previewUrl
    if (video.muxPlaybackId) {
      // Usar MP4 medium quality (960x540) para preview
      previewVideoUrl = `https://stream.mux.com/${video.muxPlaybackId}/medium.mp4`
    }

    // Transformar respuesta
    const response = {
      id: video.id,
      slug: video.slug,
      title: video.title,
      description: video.description,
      thumbnailUrl: video.thumbnailUrl,
      previewUrl: previewVideoUrl,
      duration: video.duration,
      releaseDate: video.releaseDate,
      viewCount: video.viewCount + (accessResult.hasAccess ? 1 : 0),
      likeCount: video.likeCount,
      minTierPlan: video.minTierPlan,
      isLimitedEdition: video.isLimitedEdition,
      isDiamondExclusive: video.isDiamondExclusive,
      limitedAccessUntil: video.limitedAccessUntil,
      metaTitle: video.metaTitle,
      metaDescription: video.metaDescription,
      performers: video.performers.map((vp) => vp.performer),
      categories: video.categories.map((vc) => vc.category),
      tags: video.tags.map((vt) => vt.tag),
      gallery: video.gallery,
      relatedProducts: video.relatedProducts.map((vp) => vp.product),
      subtitles: video.subtitles,
      // Preview settings
      previewSettings: {
        startTime: video.previewStartTime,
        endTime: video.previewEndTime,
        duration: video.previewEndTime - video.previewStartTime,
      },
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
      { error: "Error fetching video" },
      { status: 500 }
    )
  }
}
