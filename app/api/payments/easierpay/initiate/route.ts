import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getEasierPayConfig, initTransaction, generateTransactionId, stringToNumericId } from "@/lib/easierpay"
import { headers } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 }
      )
    }

    // Load the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    // If the order belongs to a registered user, require that user to be logged in.
    // Guest orders (userId === null) can be paid by anyone with the orderId (it is a CUID).
    if (order.userId) {
      if (!session?.user?.id || order.userId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
    }

    // Only allow payment for pending orders
    if (order.paymentStatus !== "PENDING") {
      return NextResponse.json(
        { error: "This order has already been processed" },
        { status: 400 }
      )
    }

    // Get client IP
    const headersList = await headers()
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      undefined

    const config = getEasierPayConfig()

    console.log("[EasierPay] Order:", { id: order.id, orderNumber: order.orderNumber, total: order.total, totalAsNumber: Number(order.total) })

    // Call EasierPay - id and user.id must be integers per API docs
    const result = await initTransaction({
      id: generateTransactionId(),
      product: {
        id: "sale",
        amount: Number(order.total),
        description: `Order ${order.orderNumber}`,
      },
      user: {
        id: stringToNumericId(order.userId || order.id),
        name: order.user?.name || order.guestName || session?.user?.email || "Customer",
        email: order.user?.email || order.guestEmail || "",
        ip,
      },
      success_url: `${config.baseUrl}/checkout/resultado?order=${order.orderNumber}&status=success`,
      fail_url: `${config.baseUrl}/checkout/resultado?order=${order.orderNumber}&status=failed`,
      notification_url: `${config.baseUrl}/api/webhooks/easierpay`,
      custom: {
        type: "order",
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    })

    if (result.result !== "OK" || !result["pay-link"]) {
      console.error("[EasierPay] Init transaction failed:", result)
      return NextResponse.json(
        { error: result.message || "Failed to initiate payment" },
        { status: 502 }
      )
    }

    // Save EasierPay transaction ID on the order
    await prisma.order.update({
      where: { id: orderId },
      data: {
        transactionId: String(result.transactionId),
        paymentGateway: "easierpay",
      },
    })

    return NextResponse.json({ payLink: result["pay-link"] })
  } catch (error) {
    console.error("[EasierPay] Error initiating payment:", error)
    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 }
    )
  }
}
