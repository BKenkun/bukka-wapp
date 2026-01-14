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
  isActive: z.boolean().default(true),
  order: z.number().default(0),
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

    const { id: zoneId } = await params

    const rates = await prisma.shippingRate.findMany({
      where: { zoneId },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    })

    return NextResponse.json({ rates })
  } catch (error) {
    console.error("Error fetching shipping rates:", error)
    return NextResponse.json({ error: "Error al obtener tarifas" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: zoneId } = await params
    const body = await request.json()
    const data = rateSchema.parse(body)

    // Verify zone exists
    const zone = await prisma.shippingZone.findUnique({
      where: { id: zoneId },
    })

    if (!zone) {
      return NextResponse.json({ error: "Zona no encontrada" }, { status: 404 })
    }

    const rate = await prisma.shippingRate.create({
      data: {
        zoneId,
        name: data.name,
        description: data.description,
        price: (data.price),
        minOrderAmount: data.minOrderAmount ? (data.minOrderAmount) : null,
        freeShippingAmount: data.freeShippingAmount ? (data.freeShippingAmount) : null,
        minWeight: data.minWeight ? (data.minWeight) : null,
        maxWeight: data.maxWeight ? (data.maxWeight) : null,
        estimatedDays: data.estimatedDays,
        isActive: data.isActive,
        order: data.order,
      },
    })

    return NextResponse.json({ rate })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Error creating shipping rate:", error)
    return NextResponse.json({ error: "Error al crear tarifa" }, { status: 500 })
  }
}
