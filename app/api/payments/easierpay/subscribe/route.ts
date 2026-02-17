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

    const { planId } = await request.json()

    if (!planId) {
      return NextResponse.json(
        { error: "planId es requerido" },
        { status: 400 }
      )
    }

    // Load the subscription plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    })

    if (!plan) {
      return NextResponse.json(
        { error: "Plan no encontrado" },
        { status: 404 }
      )
    }

    if (!plan.isActive) {
      return NextResponse.json(
        { error: "Este plan no está disponible" },
        { status: 400 }
      )
    }

    if (plan.isFree) {
      return NextResponse.json(
        { error: "No se puede pagar por un plan gratuito" },
        { status: 400 }
      )
    }

    const monthlyPrice = Number(plan.monthlyPrice)
    if (monthlyPrice <= 0) {
      return NextResponse.json(
        { error: "Precio de plan no válido" },
        { status: 400 }
      )
    }

    // Load user data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Get client IP
    const headersList = await headers()
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      undefined

    const config = getEasierPayConfig()

    // Call EasierPay with rebill_amount for recurring subscription
    // id must be integer, user.id must be numeric per API docs
    const result = await initTransaction({
      id: generateTransactionId(),
      product: {
        id: plan.slug,
        amount: monthlyPrice,
        rebill_amount: monthlyPrice,
        description: `Suscripción ${plan.name} - Mensual`,
      },
      user: {
        id: stringToNumericId(user.id),
        name: user.name || user.email,
        email: user.email,
        ip,
      },
      success_url: `${config.baseUrl}/suscripcion/resultado?plan=${plan.slug}&status=success`,
      fail_url: `${config.baseUrl}/suscripcion/resultado?plan=${plan.slug}&status=failed`,
      notification_url: `${config.baseUrl}/api/webhooks/easierpay`,
      custom: {
        type: "subscription",
        planId: plan.id,
        userId: user.id,
      },
    })

    if (result.result !== "OK" || !result["pay-link"]) {
      console.error("[EasierPay] Init subscription failed:", result)
      return NextResponse.json(
        { error: result.message || "Error al iniciar el pago de suscripción" },
        { status: 502 }
      )
    }

    return NextResponse.json({ payLink: result["pay-link"] })
  } catch (error) {
    console.error("[EasierPay] Error initiating subscription:", error)
    return NextResponse.json(
      { error: "Error al procesar la suscripción" },
      { status: 500 }
    )
  }
}
