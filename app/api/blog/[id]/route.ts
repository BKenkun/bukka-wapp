import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Get single blog post
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, image: true } },
        BlogCategory: { select: { id: true, slug: true, name: true } },
      },
    })

    if (!post) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error("Error fetching blog post:", error)
    return NextResponse.json({ error: "Error fetching article" }, { status: 500 })
  }
}

// PATCH - Update blog post (admin only)
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
    const { title, slug, excerpt, content, featuredImage, categoryId, type, status } = body

    const existingPost = await prisma.blogPost.findUnique({ where: { id } })
    if (!existingPost) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    // Check slug uniqueness if changed
    if (slug !== existingPost.slug) {
      const slugExists = await prisma.blogPost.findUnique({ where: { slug } })
      if (slugExists) {
        return NextResponse.json({ error: "An article with that slug already exists" }, { status: 400 })
      }
    }

    // Set publishedAt if publishing for the first time
    let publishedAt = existingPost.publishedAt
    if (status === "PUBLISHED" && existingPost.status !== "PUBLISHED") {
      publishedAt = new Date()
    }

    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        title,
        slug,
        excerpt: excerpt || null,
        content,
        featuredImage: featuredImage || null,
        categoryId: categoryId || null,
        type,
        status,
        publishedAt,
      },
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error("Error updating blog post:", error)
    return NextResponse.json({ error: "Error updating article" }, { status: 500 })
  }
}

// DELETE - Delete blog post (admin only)
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

    await prisma.blogPost.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting blog post:", error)
    return NextResponse.json({ error: "Error deleting article" }, { status: 500 })
  }
}
