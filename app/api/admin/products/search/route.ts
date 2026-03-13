import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("q") || ""
    const ids = searchParams.get("ids")?.split(",").filter(Boolean) || []
    const limit = parseInt(searchParams.get("limit") || "20")

    // If specific IDs are requested, fetch those products
    if (ids.length > 0) {
      const products = await prisma.product.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          name: true,
          slug: true,
          images: true,
          price: true,
        },
      })

      // Sort by the order of IDs provided
      const sortedProducts = ids
        .map((id) => products.find((p) => p.id === id))
        .filter(Boolean)

      return NextResponse.json({ products: sortedProducts })
    }

    // Search products by name or slug
    const products = await prisma.product.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { slug: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      select: {
        id: true,
        name: true,
        slug: true,
        images: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error("Error searching products:", error)
    return NextResponse.json(
      { error: "Error al buscar productos" },
      { status: 500 }
    )
  }
}
