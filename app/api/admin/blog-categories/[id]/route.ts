import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await ctx.params
    const data = await request.json()

    const category = await prisma.blogCategory.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
        ...(data.description !== undefined ? { description: data.description || null } : {}),
        ...(data.order !== undefined ? { order: data.order } : {}),
      },
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error("Error updating blog category:", error)
    return NextResponse.json({ error: "Error al actualizar categoría" }, { status: 500 })
  }
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await ctx.params

    // Los posts asociados quedan sin categoría (no se borran)
    await prisma.blogPost.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    })

    await prisma.blogCategory.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error deleting blog category:", error)
    return NextResponse.json({ error: "Error al eliminar categoría" }, { status: 500 })
  }
}
