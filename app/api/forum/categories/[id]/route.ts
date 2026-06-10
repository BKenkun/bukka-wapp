import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

interface RouteParams {
  params: Promise<{ id: string }>
}

// PATCH - Update forum category (admin only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params
    const body = await request.json()
    const { name, slug, description, minTier, order } = body

    const existingCategory = await prisma.forumCategory.findUnique({ where: { id } })
    if (!existingCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    // Check slug uniqueness if changed
    if (slug !== existingCategory.slug) {
      const slugExists = await prisma.forumCategory.findUnique({ where: { slug } })
      if (slugExists) {
        return NextResponse.json({ error: "A category with that slug already exists" }, { status: 400 })
      }
    }

    const category = await prisma.forumCategory.update({
      where: { id },
      data: {
        name,
        slug,
        description: description || null,
        minTierPlanId: minTier,
        order: order ?? existingCategory.order,
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error("Error updating forum category:", error)
    return NextResponse.json({ error: "Error updating category" }, { status: 500 })
  }
}

// DELETE - Delete forum category (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params

    // Check if category has posts
    const postsCount = await prisma.forumPost.count({ where: { categoryId: id } })
    if (postsCount > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar. Hay ${postsCount} temas en esta categoría.` },
        { status: 400 }
      )
    }

    await prisma.forumCategory.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting forum category:", error)
    return NextResponse.json({ error: "Error deleting category" }, { status: 500 })
  }
}
