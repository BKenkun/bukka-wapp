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

    // If specific IDs are requested, fetch those performers
    if (ids.length > 0) {
      const performers = await prisma.performer.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          name: true,
          slug: true,
          profileImage: true,
        },
      })

      // Sort by the order of IDs provided
      const sortedPerformers = ids
        .map((id) => performers.find((p) => p.id === id))
        .filter(Boolean)

      return NextResponse.json({ performers: sortedPerformers })
    }

    // Search performers by name or slug
    const performers = await prisma.performer.findMany({
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
        profileImage: true,
      },
      orderBy: { name: "asc" },
      take: limit,
    })

    return NextResponse.json({ performers })
  } catch (error) {
    console.error("Error searching performers:", error)
    return NextResponse.json(
      { error: "Error al buscar modelos" },
      { status: 500 }
    )
  }
}
