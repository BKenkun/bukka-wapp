import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const tagSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
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
    const data = tagSchema.partial().parse(body)

    // Check if slug is unique (if updating)
    if (data.slug) {
      const existingSlug = await prisma.tag.findFirst({
        where: { slug: data.slug, id: { not: id } },
      })
      if (existingSlug) {
        return NextResponse.json({ error: "El slug ya existe" }, { status: 400 })
      }
    }

    const tag = await prisma.tag.update({
      where: { id },
      data,
    })

    return NextResponse.json({ tag })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Error updating tag:", error)
    return NextResponse.json({ error: "Error al actualizar tag" }, { status: 500 })
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

    await prisma.tag.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting tag:", error)
    return NextResponse.json({ error: "Error al eliminar tag" }, { status: 500 })
  }
}
