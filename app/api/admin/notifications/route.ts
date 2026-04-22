import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/notifications?limit=15&unreadOnly=false
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get("limit") || "15"), 50)
    const unreadOnly = searchParams.get("unreadOnly") === "true"

    const where = unreadOnly ? { read: false } : {}

    const [notifications, unreadCount] = await Promise.all([
      prisma.adminNotification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.adminNotification.count({ where: { read: false } }),
    ])

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
    })
  } catch (error) {
    console.error("Error fetching admin notifications:", error)
    return NextResponse.json({ error: "Error al obtener notificaciones" }, { status: 500 })
  }
}
