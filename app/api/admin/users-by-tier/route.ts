import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const planId = searchParams.get("planId")
    const cursor = searchParams.get("cursor")
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50)
    const search = searchParams.get("search")?.trim() || ""

    const where = {
      subscriptionPlanId: planId || undefined,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { username: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        image: true,
        subscriptionPlanId: true,
        subscriptionPlan: {
          select: {
            name: true,
            slug: true,
          },
        },
        subscriptionStart: true,
        subscriptionEnd: true,
        createdAt: true,
        isVerified: true,
        _count: {
          select: {
            orders: true,
            watchHistory: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    })

    let nextCursor: string | null = null
    if (users.length > limit) {
      const nextItem = users.pop()
      nextCursor = nextItem?.id || null
    }

    return NextResponse.json({
      users,
      nextCursor,
    })
  } catch (error) {
    console.error("Error fetching users by plan:", error)
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 })
  }
}
