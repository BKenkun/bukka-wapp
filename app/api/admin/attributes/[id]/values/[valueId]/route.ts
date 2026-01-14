import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const valueSchema = z.object({
  value: z.string().min(1, "El valor es requerido"),
  slug: z.string().min(1, "El slug es requerido"),
  colorHex: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  order: z.number().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; valueId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { valueId } = await params

    const value = await prisma.attributeValue.findUnique({
      where: { id: valueId },
      include: {
        attribute: {
          select: { id: true, name: true, type: true },
        },
      },
    })

    if (!value) {
      return NextResponse.json({ error: "Valor no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ value })
  } catch (error) {
    console.error("Error fetching attribute value:", error)
    return NextResponse.json({ error: "Error al obtener valor" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; valueId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: attributeId, valueId } = await params
    const body = await request.json()
    const data = valueSchema.partial().parse(body)

    // Check if slug is unique within this attribute (if updating)
    if (data.slug) {
      const existingSlug = await prisma.attributeValue.findFirst({
        where: {
          attributeId,
          slug: data.slug,
          id: { not: valueId },
        },
      })

      if (existingSlug) {
        return NextResponse.json({ error: "El slug ya existe para este atributo" }, { status: 400 })
      }
    }

    const value = await prisma.attributeValue.update({
      where: { id: valueId },
      data,
    })

    return NextResponse.json({ value })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Error updating attribute value:", error)
    return NextResponse.json({ error: "Error al actualizar valor" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; valueId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { valueId } = await params

    // Check if value is used by any variants
    const usedByVariants = await prisma.variantAttributeValue.count({
      where: { attributeValueId: valueId },
    })

    if (usedByVariants > 0) {
      return NextResponse.json(
        { error: `Este valor está siendo usado por ${usedByVariants} variante(s). Elimina primero las referencias.` },
        { status: 400 }
      )
    }

    await prisma.attributeValue.delete({
      where: { id: valueId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting attribute value:", error)
    return NextResponse.json({ error: "Error al eliminar valor" }, { status: 500 })
  }
}
