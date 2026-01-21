import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// GET - Listar favoritos del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "all" // all | videos | performers | products
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const where = { userId: session.user.id }

    // Build conditional where based on type
    const typeFilter = type === "videos"
      ? { videoId: { not: null } }
      : type === "performers"
      ? { performerId: { not: null } }
      : type === "products"
      ? { productId: { not: null } }
      : {}

    const [favorites, total] = await Promise.all([
      prisma.favorite.findMany({
        where: { ...where, ...typeFilter },
        include: {
          Video: {
            select: {
              id: true,
              slug: true,
              title: true,
              thumbnailUrl: true,
              viewCount: true,
              likeCount: true,
              duration: true,
              performers: {
                include: {
                  performer: {
                    select: { name: true },
                  },
                },
                take: 1,
              },
            },
          },
          Performer: {
            select: {
              id: true,
              slug: true,
              name: true,
              profileImage: true,
              videoCount: true,
            },
          },
          Product: {
            select: {
              id: true,
              slug: true,
              name: true,
              price: true,
              images: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.favorite.count({ where: { ...where, ...typeFilter } }),
    ])

    // Transform favorites based on type
    const transformedFavorites = favorites.map((fav) => {
      if (fav.Video) {
        return {
          id: fav.id,
          type: "video" as const,
          createdAt: fav.createdAt.toISOString(),
          item: {
            id: fav.Video.id,
            slug: fav.Video.slug,
            title: fav.Video.title,
            thumbnailUrl: fav.Video.thumbnailUrl,
            viewCount: fav.Video.viewCount,
            likeCount: fav.Video.likeCount,
            duration: fav.Video.duration,
            performerName: fav.Video.performers[0]?.performer?.name || null,
          },
        }
      }
      if (fav.Performer) {
        return {
          id: fav.id,
          type: "performer" as const,
          createdAt: fav.createdAt.toISOString(),
          item: {
            id: fav.Performer.id,
            slug: fav.Performer.slug,
            name: fav.Performer.name,
            profileImage: fav.Performer.profileImage,
            videoCount: fav.Performer.videoCount,
          },
        }
      }
      if (fav.Product) {
        return {
          id: fav.id,
          type: "product" as const,
          createdAt: fav.createdAt.toISOString(),
          item: {
            id: fav.Product.id,
            slug: fav.Product.slug,
            name: fav.Product.name,
            price: Number(fav.Product.price),
            imageUrl: fav.Product.images[0] || null,
          },
        }
      }
      return null
    }).filter(Boolean)

    return NextResponse.json({
      favorites: transformedFavorites,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching favorites:", error)
    return NextResponse.json(
      { error: "Error fetching favorites" },
      { status: 500 }
    )
  }
}

const addFavoriteSchema = z.object({
  videoId: z.string().optional(),
  performerId: z.string().optional(),
  productId: z.string().optional(),
}).refine(
  (data) => data.videoId || data.performerId || data.productId,
  { message: "Must provide videoId, performerId, or productId" }
)

// POST - Añadir favorito
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = addFavoriteSchema.safeParse(body)

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validatedData.error.errors },
        { status: 400 }
      )
    }

    const { videoId, performerId, productId } = validatedData.data

    // Check if already favorited
    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        userId: session.user.id,
        ...(videoId && { videoId }),
        ...(performerId && { performerId }),
        ...(productId && { productId }),
      },
    })

    if (existingFavorite) {
      return NextResponse.json(
        { error: "Already in favorites" },
        { status: 409 }
      )
    }

    // Verify the item exists
    if (videoId) {
      const video = await prisma.video.findUnique({ where: { id: videoId } })
      if (!video) {
        return NextResponse.json({ error: "Video not found" }, { status: 404 })
      }
    }
    if (performerId) {
      const performer = await prisma.performer.findUnique({ where: { id: performerId } })
      if (!performer) {
        return NextResponse.json({ error: "Performer not found" }, { status: 404 })
      }
    }
    if (productId) {
      const product = await prisma.product.findUnique({ where: { id: productId } })
      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 })
      }
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: session.user.id,
        videoId: videoId || null,
        performerId: performerId || null,
        productId: productId || null,
      },
    })

    return NextResponse.json({ favorite }, { status: 201 })
  } catch (error) {
    console.error("Error adding favorite:", error)
    return NextResponse.json(
      { error: "Error adding favorite" },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar favorito
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get("videoId")
    const performerId = searchParams.get("performerId")
    const productId = searchParams.get("productId")

    if (!videoId && !performerId && !productId) {
      return NextResponse.json(
        { error: "Must provide videoId, performerId, or productId" },
        { status: 400 }
      )
    }

    const favorite = await prisma.favorite.findFirst({
      where: {
        userId: session.user.id,
        ...(videoId && { videoId }),
        ...(performerId && { performerId }),
        ...(productId && { productId }),
      },
    })

    if (!favorite) {
      return NextResponse.json({ error: "Favorite not found" }, { status: 404 })
    }

    await prisma.favorite.delete({
      where: { id: favorite.id },
    })

    return NextResponse.json({ message: "Favorite removed" })
  } catch (error) {
    console.error("Error removing favorite:", error)
    return NextResponse.json(
      { error: "Error removing favorite" },
      { status: 500 }
    )
  }
}
