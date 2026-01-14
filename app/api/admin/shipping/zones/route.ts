import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const zoneSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional().nullable(),
  countries: z.array(z.string()).default([]),
  postalCodes: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  order: z.number().default(0),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const zones = await prisma.shippingZone.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: {
        rates: {
          orderBy: [{ order: "asc" }, { name: "asc" }],
        },
        _count: {
          select: { rates: true },
        },
      },
    })

    return NextResponse.json({ zones })
  } catch (error) {
    console.error("Error fetching shipping zones:", error)
    return NextResponse.json({ error: "Error al obtener zonas de envio" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = zoneSchema.parse(body)

    const zone = await prisma.shippingZone.create({
      data: {
        name: data.name,
        description: data.description,
        countries: data.countries,
        postalCodes: data.postalCodes,
        isActive: data.isActive,
        order: data.order,
      },
      include: {
        rates: true,
      },
    })

    return NextResponse.json({ zone })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Error creating shipping zone:", error)
    return NextResponse.json({ error: "Error al crear zona de envio" }, { status: 500 })
  }
}
