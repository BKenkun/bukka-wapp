import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// PATCH /api/admin/notifications/:id → mark as read
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const notification = await prisma.adminNotification.findUnique({ where: { id } })
    if (!notification) {
      return NextResponse.json({ error: "Notificación no encontrada" }, { status: 404 })
    }

    await prisma.adminNotification.update({
      where: { id },
      data: { read: true },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error updating admin notification:", error)
    return NextResponse.json({ error: "Error al actualizar notificación" }, { status: 500 })
  }
}

// DELETE /api/admin/notifications/:id
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const existing = await prisma.adminNotification.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Notificación no encontrada" }, { status: 404 })
    }

    await prisma.adminNotification.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error deleting admin notification:", error)
    return NextResponse.json({ error: "Error al eliminar notificación" }, { status: 500 })
  }
}
