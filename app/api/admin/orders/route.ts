import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "20")
    const status = searchParams.get("status")
    const paymentStatus = searchParams.get("paymentStatus")
    const search = searchParams.get("search")
    const skip = (page - 1) * pageSize

    // Por defecto se ocultan los pedidos ARCHIVED. Si el admin filtra
    // explícitamente por status=ARCHIVED, se muestran solo archivados.
    const statusFilter = status
      ? { status: status as "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "ARCHIVED" }
      : { status: { not: "ARCHIVED" as const } }

    const where = {
      ...statusFilter,
      ...(paymentStatus && { paymentStatus: paymentStatus as "PENDING" | "PAID" | "FAILED" | "REFUNDED" }),
      ...(search && {
        OR: [
          { orderNumber: { contains: search, mode: "insensitive" as const } },
          { user: { email: { contains: search, mode: "insensitive" as const } } },
          { user: { name: { contains: search, mode: "insensitive" as const } } },
          { guestEmail: { contains: search, mode: "insensitive" as const } },
          { guestName: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    }

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          OrderItem: {
            include: {
              product: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ])

    const totalPages = Math.ceil(totalCount / pageSize)

    // Transform OrderItem to items for frontend compatibility
    const transformedOrders = orders.map((order) => ({
      ...order,
      items: order.OrderItem,
      OrderItem: undefined,
    }))

    return NextResponse.json({
      orders: transformedOrders,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
      },
    })
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Error al obtener pedidos" }, { status: 500 })
  }
}
