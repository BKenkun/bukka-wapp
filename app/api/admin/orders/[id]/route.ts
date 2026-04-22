import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import {
  sendTemplateEmail,
  OrderProcessingTemplate,
  OrderShippedTemplate,
  OrderDeliveredTemplate,
  OrderCancelledTemplate,
  PaymentReceivedTemplate,
  PaymentFailedTemplate,
} from "@/lib/email"

const updateOrderSchema = z.object({
  status: z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "ARCHIVED"]).optional(),
  paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]).optional(),
  trackingNumber: z.string().optional().nullable(),
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

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            SubscriptionPlan: {
              select: {
                slug: true,
                name: true,
              },
            },
          },
        },
        OrderItem: {
          include: {
            product: {
              select: { id: true, name: true, slug: true, images: true },
            },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 })
    }

    // Transform OrderItem to items for frontend compatibility
    const transformedOrder = {
      ...order,
      items: order.OrderItem,
      OrderItem: undefined,
    }

    return NextResponse.json({ order: transformedOrder })
  } catch (error) {
    console.error("Error fetching order:", error)
    return NextResponse.json({ error: "Error al obtener pedido" }, { status: 500 })
  }
}

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
    const existing = await prisma.order.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 })
    }

    await prisma.order.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error deleting order:", error)
    return NextResponse.json({ error: "Error al eliminar pedido" }, { status: 500 })
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
    const data = updateOrderSchema.parse(body)

    // Get current order state before update
    const currentOrder = await prisma.order.findUnique({
      where: { id },
      select: { status: true, paymentStatus: true },
    })

    const order = await prisma.order.update({
      where: { id },
      data,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        OrderItem: {
          include: {
            product: {
              select: { id: true, name: true, slug: true, price: true },
            },
          },
        },
      },
    })

    // Send emails based on status changes (supports both registered users and guests)
    const userEmail = order.user?.email || order.guestEmail
    const userName = order.user?.name || order.guestName || "Cliente"
    if (!userEmail) {
      // No email available — skip notifications but still return the updated order
      const transformedOrder = {
        ...order,
        items: order.OrderItem,
        OrderItem: undefined,
      }
      return NextResponse.json({ order: transformedOrder })
    }

    // Order status changed
    if (data.status && currentOrder?.status !== data.status) {
      switch (data.status) {
        case "PROCESSING":
          await sendTemplateEmail({
            to: userEmail,
            template: "orders/processing",
            subjectVariables: { orderNumber: order.orderNumber },
            react: OrderProcessingTemplate({
              customerName: userName,
              orderNumber: order.orderNumber,
            }),
            metadata: { orderId: order.id },
          })
          break

        case "SHIPPED":
          await sendTemplateEmail({
            to: userEmail,
            template: "orders/shipped",
            subjectVariables: { orderNumber: order.orderNumber },
            react: OrderShippedTemplate({
              customerName: userName,
              orderNumber: order.orderNumber,
              trackingNumber: order.trackingNumber || undefined,
            }),
            metadata: { orderId: order.id },
          })
          break

        case "DELIVERED":
          await sendTemplateEmail({
            to: userEmail,
            template: "orders/delivered",
            subjectVariables: { orderNumber: order.orderNumber },
            react: OrderDeliveredTemplate({
              customerName: userName,
              orderNumber: order.orderNumber,
              deliveredAt: new Date(),
            }),
            metadata: { orderId: order.id },
          })
          break

        case "CANCELLED":
          await sendTemplateEmail({
            to: userEmail,
            template: "orders/cancelled",
            subjectVariables: { orderNumber: order.orderNumber },
            react: OrderCancelledTemplate({
              customerName: userName,
              orderNumber: order.orderNumber,
              items: order.OrderItem.map((item) => ({
                name: item.product.name,
                quantity: item.quantity,
                price: Number(item.price),
              })),
              refundAmount: Number(order.total),
            }),
            metadata: { orderId: order.id },
          })
          break
      }
    }

    // Payment status changed
    if (data.paymentStatus && currentOrder?.paymentStatus !== data.paymentStatus) {
      switch (data.paymentStatus) {
        case "PAID":
          await sendTemplateEmail({
            to: userEmail,
            template: "orders/payment-received",
            subjectVariables: { orderNumber: order.orderNumber },
            react: PaymentReceivedTemplate({
              customerName: userName,
              orderNumber: order.orderNumber,
              amount: Number(order.total),
            }),
            metadata: { orderId: order.id },
          })
          break

        case "FAILED":
          await sendTemplateEmail({
            to: userEmail,
            template: "orders/payment-failed",
            subjectVariables: { orderNumber: order.orderNumber },
            react: PaymentFailedTemplate({
              customerName: userName,
              orderNumber: order.orderNumber,
              amount: Number(order.total),
            }),
            metadata: { orderId: order.id },
          })
          break
      }
    }

    // Transform OrderItem to items for frontend compatibility
    const transformedOrder = {
      ...order,
      items: order.OrderItem,
      OrderItem: undefined,
    }

    return NextResponse.json({ order: transformedOrder })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Error updating order:", error)
    return NextResponse.json({ error: "Error al actualizar pedido" }, { status: 500 })
  }
}
