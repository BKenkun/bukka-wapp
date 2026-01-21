import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const categorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  slug: z.string().min(1, "El slug es requerido"),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
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

    const category = await prisma.shopCategory.findUnique({
      where: { id },
      include: {
        ShopCategory: {
          select: { id: true, name: true },
        },
        other_ShopCategory: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { ProductToCategory: true },
        },
      },
    })

    if (!category) {
      return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 })
    }

    const transformedCategory = {
      ...category,
      parent: category.ShopCategory,
      children: category.other_ShopCategory,
      _count: {
        products: category._count.ProductToCategory,
      },
    }

    return NextResponse.json({ category: transformedCategory })
  } catch (error) {
    console.error("Error fetching shop category:", error)
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
      const existingSlug = await prisma.shopCategory.findFirst({
        where: {
          slug: data.slug,
          id: { not: id },
        },
      })

      if (existingSlug) {
        return NextResponse.json({ error: "El slug ya existe" }, { status: 400 })
      }
    }

    const category = await prisma.shopCategory.update({
      where: { id },
      data,
    })

    return NextResponse.json({ category })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Error updating shop category:", error)
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

    await prisma.shopCategory.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting shop category:", error)
    return NextResponse.json({ error: "Error al eliminar categoría" }, { status: 500 })
  }
}
