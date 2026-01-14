import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const valueSchema = z.object({
  value: z.string().min(1, "El valor es requerido"),
  slug: z.string().min(1, "El slug es requerido"),
  colorHex: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  order: z.number().optional().default(0),
  isActive: z.boolean().optional().default(true),
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

    const values = await prisma.attributeValue.findMany({
      where: { attributeId: id },
      orderBy: [{ order: "asc" }, { value: "asc" }],
    })

    return NextResponse.json({ values })
  } catch (error) {
    console.error("Error fetching attribute values:", error)
    return NextResponse.json({ error: "Error al obtener valores" }, { status: 500 })
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

    const { id: attributeId } = await params
    const body = await request.json()
    const data = valueSchema.parse(body)

    // Check if attribute exists
    const attribute = await prisma.attribute.findUnique({
      where: { id: attributeId },
    })

    if (!attribute) {
      return NextResponse.json({ error: "Atributo no encontrado" }, { status: 404 })
    }

    // Check if slug is unique within this attribute
    const existingSlug = await prisma.attributeValue.findUnique({
      where: {
        attributeId_slug: {
          attributeId,
          slug: data.slug,
        },
      },
    })

    if (existingSlug) {
      return NextResponse.json({ error: "El slug ya existe para este atributo" }, { status: 400 })
    }

    const value = await prisma.attributeValue.create({
      data: {
        attributeId,
        value: data.value,
        slug: data.slug,
        colorHex: data.colorHex,
        imageUrl: data.imageUrl,
        order: data.order,
        isActive: data.isActive,
      },
    })

    return NextResponse.json({ value })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Error creating attribute value:", error)
    return NextResponse.json({ error: "Error al crear valor" }, { status: 500 })
  }
}
