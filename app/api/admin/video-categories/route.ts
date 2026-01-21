import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const categorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  slug: z.string().min(1, "El slug es requerido"),
  description: z.string().optional().nullable(),
  order: z.number().optional().default(0),
  parentId: z.string().optional().nullable(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const categories = await prisma.videoCategory.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: {
        VideoCategory: {
          select: { id: true, name: true },
        },
        other_VideoCategory: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { VideoToCategory: true },
        },
      },
    })

    const transformedCategories = categories.map((c) => ({
      ...c,
      parent: c.VideoCategory,
      children: c.other_VideoCategory,
      _count: { videos: c._count.VideoToCategory },
    }))

    return NextResponse.json({ categories: transformedCategories })
  } catch (error) {
    console.error("Error fetching video categories:", error)
    return NextResponse.json({ error: "Error al obtener categorías" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = categorySchema.parse(body)

    // Check if slug is unique
    const existingSlug = await prisma.videoCategory.findUnique({
      where: { slug: data.slug },
    })

    if (existingSlug) {
      return NextResponse.json({ error: "El slug ya existe" }, { status: 400 })
    }

    const category = await prisma.videoCategory.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        order: data.order,
        parentId: data.parentId,
      },
    })

    return NextResponse.json({ category })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Error creating video category:", error)
    return NextResponse.json({ error: "Error al crear categoría" }, { status: 500 })
  }
}
