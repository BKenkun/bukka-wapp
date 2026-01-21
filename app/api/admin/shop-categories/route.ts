import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const categorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  slug: z.string().min(1, "El slug es requerido"),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  order: z.number().optional().default(0),
  parentId: z.string().optional().nullable(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const categories = await prisma.shopCategory.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: {
        ShopCategory: {
          select: { id: true, name: true },
        },
        other_ShopCategory: {
          select: { id: true },
        },
        _count: {
          select: { ProductToCategory: true },
        },
      },
    })

    const categoriesWithCount = categories.map((cat) => ({
      ...cat,
      parent: cat.ShopCategory,
      children: cat.other_ShopCategory,
      _count: {
        products: cat._count.ProductToCategory,
      },
    }))

    return NextResponse.json({ categories: categoriesWithCount })
  } catch (error) {
    console.error("Error fetching shop categories:", error)
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
    const existingSlug = await prisma.shopCategory.findUnique({
      where: { slug: data.slug },
    })

    if (existingSlug) {
      return NextResponse.json({ error: "El slug ya existe" }, { status: 400 })
    }

    const category = await prisma.shopCategory.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        imageUrl: data.imageUrl,
        order: data.order,
        parentId: data.parentId,
      },
    })

    return NextResponse.json({ category })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Error creating shop category:", error)
    return NextResponse.json({ error: "Error al crear categoría" }, { status: 500 })
  }
}
