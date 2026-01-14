import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const attributeSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  slug: z.string().min(1, "El slug es requerido"),
  type: z.enum(["SELECT", "COLOR", "IMAGE"]),
  order: z.number().optional(),
  isActive: z.boolean().optional(),
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

    const attribute = await prisma.attribute.findUnique({
      where: { id },
      include: {
        values: {
          orderBy: [{ order: "asc" }, { value: "asc" }],
        },
        _count: {
          select: { products: true },
        },
      },
    })

    if (!attribute) {
      return NextResponse.json({ error: "Atributo no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ attribute })
  } catch (error) {
    console.error("Error fetching attribute:", error)
    return NextResponse.json({ error: "Error al obtener atributo" }, { status: 500 })
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
    const data = attributeSchema.partial().parse(body)

    // Check if slug is unique (if updating)
    if (data.slug) {
      const existingSlug = await prisma.attribute.findFirst({
        where: {
          slug: data.slug,
          id: { not: id },
        },
      })

      if (existingSlug) {
        return NextResponse.json({ error: "El slug ya existe" }, { status: 400 })
      }
    }

    const attribute = await prisma.attribute.update({
      where: { id },
      data,
      include: {
        values: {
          orderBy: [{ order: "asc" }, { value: "asc" }],
        },
      },
    })

    return NextResponse.json({ attribute })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Error updating attribute:", error)
    return NextResponse.json({ error: "Error al actualizar atributo" }, { status: 500 })
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

    // Check if attribute is used by any products
    const usedByProducts = await prisma.productAttribute.count({
      where: { attributeId: id },
    })

    if (usedByProducts > 0) {
      return NextResponse.json(
        { error: `Este atributo está siendo usado por ${usedByProducts} producto(s). Elimina primero las referencias.` },
        { status: 400 }
      )
    }

    await prisma.attribute.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting attribute:", error)
    return NextResponse.json({ error: "Error al eliminar atributo" }, { status: 500 })
  }
}
