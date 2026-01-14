import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"


const variantSchema = z.object({
  sku: z.string().optional().nullable(),
  price: z.union([z.string(), z.number()]).transform((val) => parseFloat(String(val))),
  compareAtPrice: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((val) => (val ? parseFloat(String(val)) : null)),
  stock: z.number().optional(),
  imageUrl: z.string().optional().nullable(),
  weight: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((val) => (val ? parseFloat(String(val)) : null)),
  isActive: z.boolean().optional(),
  attributeValueIds: z.array(z.string()).optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { variantId } = await params

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        attributeValues: {
          include: {
            attributeValue: {
              include: {
                attribute: true,
              },
            },
          },
        },
      },
    })

    if (!variant) {
      return NextResponse.json({ error: "Variante no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ variant })
  } catch (error) {
    console.error("Error fetching variant:", error)
    return NextResponse.json({ error: "Error al obtener variante" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { variantId } = await params
    const body = await request.json()
    const data = variantSchema.partial().parse(body)

    // Check if SKU is unique (if provided and changed)
    if (data.sku) {
      const existingSku = await prisma.productVariant.findFirst({
        where: {
          sku: data.sku,
          id: { not: variantId },
        },
      })
      if (existingSku) {
        return NextResponse.json({ error: "El SKU ya existe" }, { status: 400 })
      }
    }

    // Update variant
    const updateData: Record<string, unknown> = {}
    if (data.sku !== undefined) updateData.sku = data.sku
    if (data.price !== undefined) updateData.price = (data.price)
    if (data.compareAtPrice !== undefined) {
      updateData.compareAtPrice = data.compareAtPrice ? (data.compareAtPrice) : null
    }
    if (data.stock !== undefined) updateData.stock = data.stock
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
    if (data.weight !== undefined) {
      updateData.weight = data.weight ? (data.weight) : null
    }
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data: updateData,
    })

    // Update attribute values if provided
    if (data.attributeValueIds) {
      // Delete existing and create new
      await prisma.variantAttributeValue.deleteMany({
        where: { variantId },
      })
      await prisma.variantAttributeValue.createMany({
        data: data.attributeValueIds.map((valueId) => ({
          variantId,
          attributeValueId: valueId,
        })),
      })
    }

    // Fetch updated variant with relations
    const updatedVariant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        attributeValues: {
          include: {
            attributeValue: {
              include: {
                attribute: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ variant: updatedVariant })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Error updating variant:", error)
    return NextResponse.json({ error: "Error al actualizar variante" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { variantId } = await params

    // Check if variant is used in any orders
    const usedInOrders = await prisma.orderItem.count({
      where: { variantId },
    })

    if (usedInOrders > 0) {
      return NextResponse.json(
        { error: `Esta variante está en ${usedInOrders} pedido(s). No se puede eliminar.` },
        { status: 400 }
      )
    }

    // Delete cart items first
    await prisma.cartItem.deleteMany({
      where: { variantId },
    })

    // Delete variant (cascade will delete attribute values)
    await prisma.productVariant.delete({
      where: { id: variantId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting variant:", error)
    return NextResponse.json({ error: "Error al eliminar variante" }, { status: 500 })
  }
}
