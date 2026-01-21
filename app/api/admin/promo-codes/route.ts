import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const promoCodeSchema = z.object({
  code: z.string().min(1, "El codigo es requerido").toUpperCase(),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  discountValue: z.number().min(0),
  applicableTo: z.enum(["ALL", "SUBSCRIPTIONS", "SHOP"]),
  maxUses: z.number().optional().nullable(),
  minPurchase: z.number().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const promoCodes = await prisma.promoCode.findMany({
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ promoCodes })
  } catch (error) {
    console.error("Error fetching promo codes:", error)
    return NextResponse.json({ error: "Error al obtener codigos" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = promoCodeSchema.parse(body)

    // Check if code is unique
    const existingCode = await prisma.promoCode.findUnique({
      where: { code: data.code },
    })

    if (existingCode) {
      return NextResponse.json({ error: "El codigo ya existe" }, { status: 400 })
    }

    const promoCode = await prisma.promoCode.create({
      data: {
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        applicableTo: data.applicableTo === "SUBSCRIPTIONS" ? "SUBSCRIPTION" : data.applicableTo,
        maxUses: data.maxUses,
        usedCount: 0,startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        isActive: data.isActive,
      },
    })

    return NextResponse.json({ promoCode })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Error creating promo code:", error)
    return NextResponse.json({ error: "Error al crear codigo" }, { status: 500 })
  }
}
