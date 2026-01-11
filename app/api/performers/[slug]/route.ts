import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

interface RouteParams {
  params: Promise<{ slug: string }>
}

// PATCH - Actualizar performer (admin only)
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

    const existingPerformer = await prisma.performer.findUnique({
      where: { slug },
    })

    if (!existingPerformer) {
      return NextResponse.json({ error: "Performer no encontrada" }, { status: 404 })
    }

    const {
      name,
      slug: newSlug,
      bio,
      profileImage,
      coverImage,
      nationality,
      birthDate,
      height,
      measurements,
      hairColor,
      eyeColor,
      skinTone,
      instagram,
      twitter,
      onlyfans,
    } = body

    // Si cambia el slug, verificar que no exista
    if (newSlug && newSlug !== slug) {
      const slugExists = await prisma.performer.findUnique({
        where: { slug: newSlug },
      })
      if (slugExists) {
        return NextResponse.json(
          { error: "Ya existe una performer con ese slug" },
          { status: 400 }
        )
      }
    }

    const performer = await prisma.performer.update({
      where: { id: existingPerformer.id },
      data: {
        name,
        slug: newSlug || slug,
        bio,
        profileImage: profileImage || null,
        coverImage: coverImage || null,
        nationality: nationality || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        height: height || null,
        measurements: measurements || null,
        hairColor: hairColor || null,
        eyeColor: eyeColor || null,
        skinTone: skinTone || null,
        instagram: instagram || null,
        twitter: twitter || null,
        onlyfans: onlyfans || null,
      },
    })

    return NextResponse.json(performer)
  } catch (error) {
    console.error("Error updating performer:", error)
    return NextResponse.json(
      { error: "Error al actualizar performer" },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar performer (admin only)
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

    const performer = await prisma.performer.findUnique({
      where: { slug },
    })

    if (!performer) {
      return NextResponse.json({ error: "Performer no encontrada" }, { status: 404 })
    }

    await prisma.performer.delete({
      where: { id: performer.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting performer:", error)
    return NextResponse.json(
      { error: "Error al eliminar performer" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)

    // Parámetros para videos
    const videosPage = parseInt(searchParams.get("videosPage") || "1")
    const videosLimit = parseInt(searchParams.get("videosLimit") || "6")
    const videosSkip = (videosPage - 1) * videosLimit

    const performer = await prisma.performer.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            badges: {
              include: {
                badge: true,
              },
            },
          },
        },
        products: {
          where: { status: "ACTIVE" },
          take: 4,
          select: {
            id: true,
            slug: true,
            name: true,
            price: true,
            images: true,
          },
        },
      },
    })

    if (!performer) {
      return NextResponse.json(
        { error: "Performer no encontrada" },
        { status: 404 }
      )
    }

    // Obtener videos de la performer
    const [videos, totalVideos] = await Promise.all([
      prisma.video.findMany({
        where: {
          status: "PUBLISHED",
          performers: {
            some: {
              performerId: performer.id,
            },
          },
        },
        orderBy: { releaseDate: "desc" },
        skip: videosSkip,
        take: videosLimit,
        select: {
          id: true,
          slug: true,
          title: true,
          thumbnailUrl: true,
          duration: true,
          releaseDate: true,
          viewCount: true,
          minTier: true,
          isLimitedEdition: true,
          isDiamondExclusive: true,
        },
      }),
      prisma.video.count({
        where: {
          status: "PUBLISHED",
          performers: {
            some: {
              performerId: performer.id,
            },
          },
        },
      }),
    ])

    // Verificar si el usuario tiene esta performer en favoritos
    let isFavorite = false
    const session = await auth()
    if (session?.user?.id) {
      const favorite = await prisma.favorite.findUnique({
        where: {
          userId_performerId: {
            userId: session.user.id,
            performerId: performer.id,
          },
        },
      })
      isFavorite = !!favorite
    }

    // Contar favoritos totales
    const favoritesCount = await prisma.favorite.count({
      where: { performerId: performer.id },
    })

    return NextResponse.json({
      id: performer.id,
      slug: performer.slug,
      name: performer.name,
      bio: performer.bio,
      profileImage: performer.profileImage,
      coverImage: performer.coverImage,
      galleryImages: performer.galleryImages,
      nationality: performer.nationality,
      birthDate: performer.birthDate,
      height: performer.height,
      measurements: performer.measurements,
      hairColor: performer.hairColor,
      eyeColor: performer.eyeColor,
      skinTone: performer.skinTone,
      instagram: performer.instagram,
      twitter: performer.twitter,
      onlyfans: performer.onlyfans,
      videoCount: performer.videoCount,
      isVerified: !!performer.user,
      verifiedUser: performer.user
        ? {
            username: performer.user.username,
            badges: performer.user.badges.map((ub) => ({
              slug: ub.badge.slug,
              name: ub.badge.name,
              color: ub.badge.color,
            })),
          }
        : null,
      products: performer.products,
      videos: {
        items: videos,
        pagination: {
          page: videosPage,
          limit: videosLimit,
          total: totalVideos,
          totalPages: Math.ceil(totalVideos / videosLimit),
        },
      },
      isFavorite,
      favoritesCount,
    })
  } catch (error) {
    console.error("Error fetching performer:", error)
    return NextResponse.json(
      { error: "Error al obtener performer" },
      { status: 500 }
    )
  }
}
