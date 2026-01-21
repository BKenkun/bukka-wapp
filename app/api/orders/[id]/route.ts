import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Obtener detalle de una orden
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        OrderItem: {
          include: {
            product: {
              select: {
                id: true,
                slug: true,
                name: true,
                images: true,
              },
            },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Verify order belongs to user
    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        subtotal: Number(order.subtotal),
        discount: Number(order.discount),
        tax: Number(order.tax),
        shipping: Number(order.shipping),
        total: Number(order.total),
        tierDiscountPercent: order.tierDiscountPercent,
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
        trackingNumber: order.trackingNumber,
        paymentGateway: order.paymentGateway,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        items: order.OrderItem.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          price: Number(item.price),
          total: Number(item.price) * item.quantity,
          product: {
            id: item.product.id,
            slug: item.product.slug,
            name: item.product.name,
            imageUrl: item.product.images[0] || null,
          },
        })),
      },
    })
  } catch (error) {
    console.error("Error fetching order:", error)
    return NextResponse.json(
      { error: "Error fetching order" },
      { status: 500 }
    )
  }
}
