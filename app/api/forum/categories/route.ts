import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

// GET - List forum categories
export async function GET() {
  try {
    const categories = await prisma.forumCategory.findMany({
      orderBy: { order: "asc" },
      include: {
        _count: { select: { ForumPost: true } },
      },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error("Error fetching forum categories:", error)
    return NextResponse.json({ error: "Error fetching categories" }, { status: 500 })
  }
}

// POST - Create forum category (admin only)
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { name, slug, description, minTierPlanId } = body

    // Check slug uniqueness
    const existing = await prisma.forumCategory.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: "A category with that slug already exists" }, { status: 400 })
    }

    // Get max order
    const lastCategory = await prisma.forumCategory.findFirst({
      orderBy: { order: "desc" },
      select: { order: true },
    })

    const category = await prisma.forumCategory.create({
      data: {
        name,
        slug,
        description: description || null,
        minTierPlanId: minTierPlanId || null,
        order: (lastCategory?.order || 0) + 1,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error("Error creating forum category:", error)
    return NextResponse.json({ error: "Error creating category" }, { status: 500 })
  }
}
