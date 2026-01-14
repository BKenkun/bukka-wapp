import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const attributeSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  slug: z.string().min(1, "El slug es requerido"),
  type: z.enum(["SELECT", "COLOR", "IMAGE"]).default("SELECT"),
  order: z.number().optional().default(0),
  isActive: z.boolean().optional().default(true),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const attributes = await prisma.attribute.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: {
        values: {
          orderBy: [{ order: "asc" }, { value: "asc" }],
        },
        _count: {
          select: { products: true },
        },
      },
    })

    return NextResponse.json({ attributes })
  } catch (error) {
    console.error("Error fetching attributes:", error)
    return NextResponse.json({ error: "Error al obtener atributos" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = attributeSchema.parse(body)

    // Check if slug is unique
    const existingSlug = await prisma.attribute.findUnique({
      where: { slug: data.slug },
    })

    if (existingSlug) {
      return NextResponse.json({ error: "El slug ya existe" }, { status: 400 })
    }

    const attribute = await prisma.attribute.create({
      data: {
        name: data.name,
        slug: data.slug,
        type: data.type,
        order: data.order,
        isActive: data.isActive,
      },
      include: {
        values: true,
      },
    })

    return NextResponse.json({ attribute })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Error creating attribute:", error)
    return NextResponse.json({ error: "Error al crear atributo" }, { status: 500 })
  }
}
