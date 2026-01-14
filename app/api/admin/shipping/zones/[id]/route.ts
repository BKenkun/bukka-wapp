import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const zoneSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional().nullable(),
  countries: z.array(z.string()),
  postalCodes: z.array(z.string()),
  isActive: z.boolean(),
  order: z.number(),
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

    const zone = await prisma.shippingZone.findUnique({
      where: { id },
      include: {
        rates: {
          orderBy: [{ order: "asc" }, { name: "asc" }],
        },
      },
    })

    if (!zone) {
      return NextResponse.json({ error: "Zona no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ zone })
  } catch (error) {
    console.error("Error fetching shipping zone:", error)
    return NextResponse.json({ error: "Error al obtener zona" }, { status: 500 })
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
    const data = zoneSchema.partial().parse(body)

    const zone = await prisma.shippingZone.update({
      where: { id },
      data,
      include: {
        rates: {
          orderBy: [{ order: "asc" }, { name: "asc" }],
        },
      },
    })

    return NextResponse.json({ zone })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Error updating shipping zone:", error)
    return NextResponse.json({ error: "Error al actualizar zona" }, { status: 500 })
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

    await prisma.shippingZone.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting shipping zone:", error)
    return NextResponse.json({ error: "Error al eliminar zona" }, { status: 500 })
  }
}
