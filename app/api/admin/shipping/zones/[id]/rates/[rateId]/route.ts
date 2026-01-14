import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"


const rateSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional().nullable(),
  price: z.union([z.string(), z.number()]).transform((val) => parseFloat(String(val))),
  minOrderAmount: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((val) => (val ? parseFloat(String(val)) : null)),
  freeShippingAmount: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((val) => (val ? parseFloat(String(val)) : null)),
  minWeight: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((val) => (val ? parseFloat(String(val)) : null)),
  maxWeight: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((val) => (val ? parseFloat(String(val)) : null)),
  estimatedDays: z.number().optional().nullable(),
  isActive: z.boolean(),
  order: z.number(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; rateId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { rateId } = await params

    const rate = await prisma.shippingRate.findUnique({
      where: { id: rateId },
      include: {
        zone: {
          select: { id: true, name: true },
        },
      },
    })

    if (!rate) {
      return NextResponse.json({ error: "Tarifa no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ rate })
  } catch (error) {
    console.error("Error fetching shipping rate:", error)
    return NextResponse.json({ error: "Error al obtener tarifa" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; rateId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { rateId } = await params
    const body = await request.json()
    const data = rateSchema.partial().parse(body)

    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.price !== undefined) updateData.price = (data.price)
    if (data.minOrderAmount !== undefined) {
      updateData.minOrderAmount = data.minOrderAmount ? (data.minOrderAmount) : null
    }
    if (data.freeShippingAmount !== undefined) {
      updateData.freeShippingAmount = data.freeShippingAmount
        ? (data.freeShippingAmount)
        : null
    }
    if (data.minWeight !== undefined) {
      updateData.minWeight = data.minWeight ? (data.minWeight) : null
    }
    if (data.maxWeight !== undefined) {
      updateData.maxWeight = data.maxWeight ? (data.maxWeight) : null
    }
    if (data.estimatedDays !== undefined) updateData.estimatedDays = data.estimatedDays
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.order !== undefined) updateData.order = data.order

    const rate = await prisma.shippingRate.update({
      where: { id: rateId },
      data: updateData,
    })

    return NextResponse.json({ rate })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Error updating shipping rate:", error)
    return NextResponse.json({ error: "Error al actualizar tarifa" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; rateId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { rateId } = await params

    await prisma.shippingRate.delete({
      where: { id: rateId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting shipping rate:", error)
    return NextResponse.json({ error: "Error al eliminar tarifa" }, { status: 500 })
  }
}
