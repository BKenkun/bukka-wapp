import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { VideoStatus } from "@prisma/client"

// POST - Crear video (admin only)
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const {
      title,
      slug,
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

    // Verificar slug único
    const existingVideo = await prisma.video.findUnique({
      where: { slug },
    })

    if (existingVideo) {
      return NextResponse.json(
        { error: "Ya existe un video con ese slug" },
        { status: 400 }
      )
    }

    const video = await prisma.video.create({
      data: {
        title,
        slug,
        description,
        thumbnailUrl,
        previewUrl: previewUrl || null,
        status: status || "DRAFT",
        minTierPlanId: minTierPlanId || null,
        isDiamondExclusive: isDiamondExclusive || false,
        isLimitedEdition: isLimitedEdition || false,
        limitedAccessUntil: limitedAccessUntil ? new Date(limitedAccessUntil) : null,
        releaseDate: releaseDate ? new Date(releaseDate) : new Date(),
        has720p: has720p ?? true,
        has1080p: has1080p ?? true,
        has4k: has4k ?? false,
        allowDownload: allowDownload ?? false,
        metaTitle,
        metaDescription,
        performers: performerIds?.length
          ? {
              create: performerIds.map((performerId: string) => ({
                performer: { connect: { id: performerId } },
              })),
            }
          : undefined,
        categories: categoryIds?.length
          ? {
              create: categoryIds.map((categoryId: string) => ({
                category: { connect: { id: categoryId } },
              })),
            }
          : undefined,
      },
      include: {
        performers: { include: { performer: true } },
        categories: { include: { category: true } },
      },
    })

    return NextResponse.json(video, { status: 201 })
  } catch (error) {
    console.error("Error creating video:", error)
    return NextResponse.json(
      { error: "Error al crear video" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parámetros de paginación
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "12")
    const skip = (page - 1) * limit

    // Filtros
    const categorySlug = searchParams.get("category")
    const performerSlug = searchParams.get("performer")
    const tagSlug = searchParams.get("tag")
    const search = searchParams.get("search")
    const sortBy = searchParams.get("sort") || "releaseDate"
    const sortOrder = searchParams.get("order") || "desc"

    // Obtener sesión para verificar plan de suscripción
    const session = await auth()
    let userPlan: { level: number; canAccessExclusive: boolean; canAccessLimitedEdition: boolean } | null = null

    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { subscriptionPlan: true },
      })
      userPlan = user?.subscriptionPlan || null
    }

    // Si no hay plan, usar el plan por defecto
    if (!userPlan) {
      const defaultPlan = await prisma.subscriptionPlan.findFirst({
        where: { isDefault: true, isActive: true },
      })
      if (defaultPlan) {
        userPlan = {
          level: defaultPlan.level,
          canAccessExclusive: defaultPlan.canAccessExclusive,
          canAccessLimitedEdition: defaultPlan.canAccessLimitedEdition,
        }
      } else {
        userPlan = { level: 0, canAccessExclusive: false, canAccessLimitedEdition: false }
      }
    }

    // Construir query
    const where: Record<string, unknown> = {
      status: VideoStatus.PUBLISHED,
    }

    // Filtrar por nivel de plan (mostrar videos con nivel <= al del usuario)
    where.OR = [
      { minTierPlan: null },
      { minTierPlan: { level: { lte: userPlan.level } } },
    ]

    // Filtrar Diamond exclusives si no puede acceder
    if (!userPlan.canAccessExclusive) {
      where.isDiamondExclusive = false
    }

    // Filtrar Limited Edition si no puede acceder
    if (!userPlan.canAccessLimitedEdition) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        {
          OR: [
            { isLimitedEdition: false },
            { limitedAccessUntil: { lte: new Date() } },
            { limitedAccessUntil: null },
          ],
        },
      ]
    }

    // Filtro por categoría
    if (categorySlug) {
      where.categories = {
        some: {
          category: { slug: categorySlug },
        },
      }
    }

    // Filtro por performer
    if (performerSlug) {
      where.performers = {
        some: {
          performer: { slug: performerSlug },
        },
      }
    }

    // Filtro por tag
    if (tagSlug) {
      where.tags = {
        some: {
          tag: { slug: tagSlug },
        },
      }
    }

    // Búsqueda por texto
    if (search) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        },
      ]
    }

    // Ordenación
    const orderBy: Record<string, string> = {}
    if (sortBy === "releaseDate") {
      orderBy.releaseDate = sortOrder
    } else if (sortBy === "views") {
      orderBy.viewCount = sortOrder
    } else if (sortBy === "title") {
      orderBy.title = sortOrder
    }

    // Ejecutar query
    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
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
        },
      }),
      prisma.video.count({ where }),
    ])

    // Transformar respuesta
    const transformedVideos = videos.map((video) => ({
      id: video.id,
      slug: video.slug,
      title: video.title,
      description: video.description,
      thumbnailUrl: video.thumbnailUrl,
      previewUrl: video.previewUrl,
      duration: video.duration,
      releaseDate: video.releaseDate,
      viewCount: video.viewCount,
      likeCount: video.likeCount,
      minTierPlan: video.minTierPlan,
      isLimitedEdition: video.isLimitedEdition,
      isDiamondExclusive: video.isDiamondExclusive,
      has720p: video.has720p,
      has1080p: video.has1080p,
      has4k: video.has4k,
      performers: video.performers.map((vp) => vp.performer),
      categories: video.categories.map((vc) => vc.category),
      tags: video.tags.map((vt) => vt.tag),
    }))

    return NextResponse.json({
      videos: transformedVideos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching videos:", error)
    return NextResponse.json(
      { error: "Error al obtener videos" },
      { status: 500 }
    )
  }
}
