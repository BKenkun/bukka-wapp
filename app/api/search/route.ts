import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")?.trim()
    const limit = parseInt(searchParams.get("limit") || "5")

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
