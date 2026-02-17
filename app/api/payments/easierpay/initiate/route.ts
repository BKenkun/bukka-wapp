import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getEasierPayConfig, initTransaction, generateTransactionId, stringToNumericId } from "@/lib/easierpay"
import { headers } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId es requerido" },
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
        { error: "Pedido no encontrado" },
        { status: 404 }
      )
    }

    // Verify the order belongs to this user
    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Only allow payment for pending orders
    if (order.paymentStatus !== "PENDING") {
      return NextResponse.json(
        { error: "Este pedido ya ha sido procesado" },
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

    // Call EasierPay - id and user.id must be integers per API docs
    const result = await initTransaction({
      id: generateTransactionId(),
      product: {
        id: order.id,
        amount: Number(order.total),
        description: `Pedido ${order.orderNumber}`,
      },
      user: {
        id: stringToNumericId(session.user.id),
        name: order.user.name || session.user.email || "Cliente",
        email: order.user.email,
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
        { error: result.message || "Error al iniciar el pago" },
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
      { error: "Error al procesar el pago" },
      { status: 500 }
    )
  }
}
