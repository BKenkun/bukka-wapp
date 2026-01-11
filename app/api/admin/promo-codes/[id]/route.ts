import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const promoCodeSchema = z.object({
  code: z.string().min(1).toUpperCase(),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  discountValue: z.number().min(0),
  applicableTo: z.enum(["ALL", "SUBSCRIPTIONS", "SHOP"]),
  maxUses: z.number().optional().nullable(),
  minPurchase: z.number().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

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
    const data = promoCodeSchema.partial().parse(body)

    // Check if code is unique (if updating)
    if (data.code) {
      const existingCode = await prisma.promoCode.findFirst({
        where: { code: data.code, id: { not: id } },
      })
      if (existingCode) {
        return NextResponse.json({ error: "El codigo ya existe" }, { status: 400 })
      }
    }

    const updateData: Record<string, unknown> = { ...data }
    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate ? new Date(data.startDate) : null
    }
    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate ? new Date(data.endDate) : null
    }

    const promoCode = await prisma.promoCode.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ promoCode })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Error updating promo code:", error)
    return NextResponse.json({ error: "Error al actualizar codigo" }, { status: 500 })
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

    await prisma.promoCode.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting promo code:", error)
    return NextResponse.json({ error: "Error al eliminar codigo" }, { status: 500 })
  }
}
