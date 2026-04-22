import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await prisma.adminNotification.updateMany({
      where: { read: false },
      data: { read: true },
    })

    return NextResponse.json({ updated: result.count })
  } catch (error) {
    console.error("Error marking admin notifications as read:", error)
    return NextResponse.json({ error: "Error al marcar notificaciones" }, { status: 500 })
  }
}
