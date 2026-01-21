import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const categorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  slug: z.string().min(1, "El slug es requerido"),
  description: z.string().optional().nullable(),
  order: z.number().optional(),
  parentId: z.string().optional().nullable(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const category = await prisma.videoCategory.findUnique({
      where: { id },
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

    if (!category) {
      return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 })
    }

    const transformedCategory = {
      ...category,
      parent: category.VideoCategory,
      children: category.other_VideoCategory,
      _count: { videos: category._count.VideoToCategory },
    }

    return NextResponse.json({ category: transformedCategory })
  } catch (error) {
    console.error("Error fetching video category:", error)
    return NextResponse.json({ error: "Error al obtener categoría" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const data = categorySchema.partial().parse(body)

    // Check if slug is unique (if updating)
    if (data.slug) {
      const existingSlug = await prisma.videoCategory.findFirst({
        where: {
          slug: data.slug,
          id: { not: id },
        },
      })

      if (existingSlug) {
        return NextResponse.json({ error: "El slug ya existe" }, { status: 400 })
      }
    }

    const category = await prisma.videoCategory.update({
      where: { id },
      data,
    })

    return NextResponse.json({ category })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Error updating video category:", error)
    return NextResponse.json({ error: "Error al actualizar categoría" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Delete the category (VideoOnCategory entries will be deleted by cascade)
    await prisma.videoCategory.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting video category:", error)
    return NextResponse.json({ error: "Error al eliminar categoría" }, { status: 500 })
  }
}
