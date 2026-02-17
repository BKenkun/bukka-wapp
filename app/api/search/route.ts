import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")?.trim()
    const limit = parseInt(searchParams.get("limit") || "5")
    const trending = searchParams.get("trending") === "true"

    // If trending=true, return trending data
    if (trending) {
      // Load search settings
      let searchSettings: {
        featuredPerformers?: string[]
        featuredVideos?: string[]
        featuredProducts?: string[]
      } = {}
      try {
        const settingsRecord = await prisma.siteSettings.findUnique({
          where: { key: "search_settings" },
        })
        if (settingsRecord?.value) {
          searchSettings = settingsRecord.value as typeof searchSettings
        }
      } catch {
        // Settings may not exist
      }

      const featuredPerformerIds = searchSettings.featuredPerformers || []
      const featuredVideoIds = searchSettings.featuredVideos || []
      const featuredProductIds = searchSettings.featuredProducts || []

      // --- Performers ---
      const performerSelect = {
        id: true,
        slug: true,
        name: true,
        profileImage: true,
        _count: {
          select: {
            favorites: true,
            VideoPerformer: true,
          },
        },
        VideoPerformer: {
          select: {
            video: {
              select: { viewCount: true },
            },
          },
        },
      } as const

      let finalPerformers: Array<{
        id: string
        slug: string
        name: string
        profileImage: string | null
        _count: { favorites: number; VideoPerformer: number }
        VideoPerformer: Array<{ video: { viewCount: number } }>
      }> = []

      if (featuredPerformerIds.length > 0) {
        const featured = await prisma.performer.findMany({
          where: { id: { in: featuredPerformerIds } },
          select: performerSelect,
        })
        // Preserve configured order
        const ordered = featuredPerformerIds
          .map((id) => featured.find((p) => p.id === id))
          .filter((p): p is NonNullable<typeof p> => p != null)
        finalPerformers = ordered

        if (finalPerformers.length < 4) {
          const remaining = await prisma.performer.findMany({
            where: { id: { notIn: featuredPerformerIds } },
            take: 4 - finalPerformers.length,
            orderBy: { VideoPerformer: { _count: "desc" } },
            select: performerSelect,
          })
          const sorted = [...remaining].sort((a, b) => {
            if (b._count.favorites !== a._count.favorites) return b._count.favorites - a._count.favorites
            return b._count.VideoPerformer - a._count.VideoPerformer
          })
          finalPerformers = [...finalPerformers, ...sorted]
        }
      } else {
        const performers = await prisma.performer.findMany({
          take: 4,
          orderBy: { VideoPerformer: { _count: "desc" } },
          select: performerSelect,
        })
        finalPerformers = [...performers].sort((a, b) => {
          if (b._count.favorites !== a._count.favorites) return b._count.favorites - a._count.favorites
          return b._count.VideoPerformer - a._count.VideoPerformer
        })
      }

      // --- Videos ---
      let finalVideos: Array<{
        id: string
        slug: string
        title: string
        thumbnailUrl: string | null
        duration: number
        viewCount: number
      }> = []

      const videoSelect = {
        id: true,
        slug: true,
        title: true,
        thumbnailUrl: true,
        duration: true,
        viewCount: true,
      } as const

      if (featuredVideoIds.length > 0) {
        const featured = await prisma.video.findMany({
          where: { id: { in: featuredVideoIds }, status: "PUBLISHED" },
          select: videoSelect,
        })
        const ordered = featuredVideoIds
          .map((id) => featured.find((v) => v.id === id))
          .filter((v): v is NonNullable<typeof v> => v != null)
        finalVideos = ordered

        if (finalVideos.length < 4) {
          const remaining = await prisma.video.findMany({
            where: { status: "PUBLISHED", id: { notIn: featuredVideoIds } },
            take: 4 - finalVideos.length,
            orderBy: { viewCount: "desc" },
            select: videoSelect,
          })
          finalVideos = [...finalVideos, ...remaining]
        }
      } else {
        finalVideos = await prisma.video.findMany({
          where: { status: "PUBLISHED" },
          take: 4,
          orderBy: { viewCount: "desc" },
          select: videoSelect,
        })
      }

      // --- Products ---
      let finalProducts: Array<{
        id: string
        slug: string
        name: string
        price: number
        compareAtPrice: number | null
        images: string[]
      }> = []

      const productSelect = {
        id: true,
        slug: true,
        name: true,
        price: true,
        compareAtPrice: true,
        images: true,
      } as const

      if (featuredProductIds.length > 0) {
        const featured = await prisma.product.findMany({
          where: { id: { in: featuredProductIds }, status: "ACTIVE" },
          select: productSelect,
        })
        const ordered = featuredProductIds
          .map((id) => featured.find((p) => p.id === id))
          .filter((p): p is NonNullable<typeof p> => p != null)
        finalProducts = ordered.map((p) => ({
          ...p,
          price: Number(p.price),
          compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
        }))

        if (finalProducts.length < 4) {
          const remaining = await prisma.product.findMany({
            where: { status: "ACTIVE", id: { notIn: featuredProductIds } },
            take: 4 - finalProducts.length,
            select: productSelect,
          })
          finalProducts = [
            ...finalProducts,
            ...remaining.map((p) => ({
              ...p,
              price: Number(p.price),
              compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
            })),
          ]
        }
      } else {
        const products = await prisma.product.findMany({
          where: { status: "ACTIVE" },
          take: 4,
          select: productSelect,
        })
        finalProducts = products.map((p) => ({
          ...p,
          price: Number(p.price),
          compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
        }))
      }

      // Get trending searches (may not exist yet)
      let trendingSearches: { query: string }[] = []
      try {
        trendingSearches = await prisma.searchTrend.findMany({
          orderBy: { count: "desc" },
          take: 10,
          select: { query: true },
        })
      } catch {
        // Table may not exist yet
      }

      return NextResponse.json({
        searches: trendingSearches.map((s) => s.query),
        performers: finalPerformers.map((p) => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          profileImage: p.profileImage,
          followersCount: p._count.favorites,
          videoCount: p._count.VideoPerformer,
          totalViews: p.VideoPerformer.reduce((sum, vp) => sum + vp.video.viewCount, 0),
        })),
        videos: finalVideos,
        products: finalProducts,
      })
    }

    if (!query || query.length < 2) {
      return NextResponse.json({
        products: [],
        videos: [],
        performers: [],
      })
    }

    // Search in parallel for better performance
    const [products, videos, performers] = await Promise.all([
      // Search products
      prisma.product.findMany({
        where: {
          status: "ACTIVE",
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          slug: true,
          name: true,
          price: true,
          compareAtPrice: true,
          images: true,
        },
        take: limit,
        orderBy: { createdAt: "desc" },
      }),

      // Search videos
      prisma.video.findMany({
        where: {
          status: "PUBLISHED",
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          slug: true,
          title: true,
          thumbnailUrl: true,
          duration: true,
          viewCount: true,
        },
        take: limit,
        orderBy: { createdAt: "desc" },
      }),

      // Search performers (models)
      prisma.performer.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { bio: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          slug: true,
          name: true,
          profileImage: true,
          _count: {
            select: { VideoPerformer: true },
          },
          VideoPerformer: {
            select: {
              video: {
                select: { viewCount: true },
              },
            },
          },
        },
        take: limit,
        orderBy: { VideoPerformer: { _count: "desc" } },
      }),
    ])

    // Transform Decimal values to numbers
    const transformedProducts = products.map((p) => ({
      ...p,
      price: Number(p.price),
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
    }))

    // Transform performers with totalViews
    const transformedPerformers = performers.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      profileImage: p.profileImage,
      videoCount: p._count.VideoPerformer,
      totalViews: p.VideoPerformer.reduce((sum, vp) => sum + vp.video.viewCount, 0),
    }))

    return NextResponse.json({
      products: transformedProducts,
      videos,
      performers: transformedPerformers,
    })
  } catch (error) {
    console.error("Error searching:", error)
    return NextResponse.json({ error: "Error en la búsqueda" }, { status: 500 })
  }
}

// POST - Record a search trend
export async function POST(request: Request) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return NextResponse.json({ success: false })
    }

    const normalizedQuery = query.trim().toLowerCase()

    await prisma.searchTrend.upsert({
      where: { query: normalizedQuery },
      update: { count: { increment: 1 } },
      create: { query: normalizedQuery, count: 1 },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error recording search:", error)
    return NextResponse.json({ success: false })
  }
}
