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
      // Get performers
      const trendingPerformers = await prisma.performer.findMany({
        take: 4,
        orderBy: { videoCount: "desc" },
        select: {
          id: true,
          slug: true,
          name: true,
          profileImage: true,
          videoCount: true,
          _count: {
            select: {
              favorites: true,
            },
          },
        },
      })

      // Get videos
      const popularVideos = await prisma.video.findMany({
        where: { status: "PUBLISHED" },
        take: 4,
        orderBy: { viewCount: "desc" },
        select: {
          id: true,
          slug: true,
          title: true,
          thumbnailUrl: true,
          duration: true,
          viewCount: true,
        },
      })

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

      // Sort performers by favorites count (descending), then videoCount
      const sortedPerformers = [...trendingPerformers].sort((a, b) => {
        if (b._count.favorites !== a._count.favorites) {
          return b._count.favorites - a._count.favorites
        }
        return b.videoCount - a.videoCount
      })

      return NextResponse.json({
        searches: trendingSearches.map((s) => s.query),
        performers: sortedPerformers.map((p) => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          profileImage: p.profileImage,
          followersCount: p._count.favorites,
        })),
        videos: popularVideos,
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
          videoCount: true,
        },
        take: limit,
        orderBy: { videoCount: "desc" },
      }),
    ])

    // Transform Decimal values to numbers
    const transformedProducts = products.map((p) => ({
      ...p,
      price: Number(p.price),
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
    }))

    return NextResponse.json({
      products: transformedProducts,
      videos,
      performers,
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
