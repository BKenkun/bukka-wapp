import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  sendTemplateEmail,
  PaymentReceivedTemplate,
  PaymentFailedTemplate,
  SubscriptionActivatedTemplate,
  SubscriptionRenewedTemplate,
  SubscriptionCancelledTemplate,
} from "@/lib/email"

// EasierPay webhook actions
type EasierPayAction = "BAJA" | "RENOVACION" | "VENTA" | "DEVOLUCION" | "REEMBOLSO"

interface EasierPayWebhookPayload {
  action: EasierPayAction
  result: "OK" | "KO"
  id_transaccion: number   // Unique EasierPay transaction ID (integer per docs)
  id_suscripcion: number   // Unique EasierPay subscription ID (integer per docs)
  id_referencia: number    // Referenced transaction ID (integer per docs)
  email: string
  usuario?: string
  usuario_id?: string | number
  producto?: string
  procesadora?: string
  custom?: {
    type: "order" | "subscription"
    orderId?: string
    orderNumber?: string
    planId?: string
    userId?: string
  } | null
}

export async function POST(request: Request) {
  try {
    const body: EasierPayWebhookPayload = await request.json()

    console.log(
      `[EasierPay Webhook] action=${body.action} result=${body.result} tx=${body.id_transaccion}`
    )

    const customData = body.custom
    if (!customData?.type) {
      console.warn("[EasierPay Webhook] No custom data or type, ignoring")
      return buildResponse(String(body.id_transaccion), "OK")
    }

    if (customData.type === "order") {
      await handleOrderWebhook(body, customData)
    } else if (customData.type === "subscription") {
      await handleSubscriptionWebhook(body, customData)
    }

    return buildResponse(String(body.id_transaccion), "OK")
  } catch (error) {
    console.error("[EasierPay Webhook] Error:", error)
    // Still return 200 to prevent EasierPay retries for processing errors
    return buildResponse("unknown", "KO", "Internal processing error")
  }
}

// ─── Order Handlers ──────────────────────────────────────────────────

async function handleOrderWebhook(
  body: EasierPayWebhookPayload,
  custom: NonNullable<EasierPayWebhookPayload["custom"]>
) {
  const { action, result, id_transaccion } = body
  const orderId = custom.orderId

  if (!orderId) {
    console.warn("[EasierPay Webhook] Order webhook without orderId")
    return
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  })

  if (!order) {
    console.error(`[EasierPay Webhook] Order not found: ${orderId}`)
    return
  }

  const userName = order.user.name || "Cliente"
  const userEmail = order.user.email

  switch (action) {
    case "VENTA": {
      if (result === "OK") {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: "PAID",
            transactionId: String(id_transaccion),
          },
        })

        await sendTemplateEmail({
          to: userEmail,
          template: "orders/payment-received",
          subjectVariables: { orderNumber: order.orderNumber },
          react: PaymentReceivedTemplate({
            customerName: userName,
            orderNumber: order.orderNumber,
            amount: Number(order.total),
            paymentMethod: "EasierPay",
            transactionId: String(id_transaccion),
          }),
          metadata: { orderId: order.id },
        })

        console.log(`[EasierPay Webhook] Order ${order.orderNumber} marked as PAID`)
      } else {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: "FAILED",
            transactionId: String(id_transaccion),
          },
        })

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

        console.log(`[EasierPay Webhook] Order ${order.orderNumber} payment FAILED`)
      }
      break
    }

    case "DEVOLUCION":
    case "REEMBOLSO": {
      if (result === "OK") {
        await prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: "REFUNDED" },
        })
        console.log(`[EasierPay Webhook] Order ${order.orderNumber} REFUNDED`)
      }
      break
    }

    default:
      console.log(
        `[EasierPay Webhook] Unhandled order action: ${action}`
      )
  }
}

// ─── Subscription Handlers ───────────────────────────────────────────

async function handleSubscriptionWebhook(
  body: EasierPayWebhookPayload,
  custom: NonNullable<EasierPayWebhookPayload["custom"]>
) {
  const { action, result, id_transaccion, id_suscripcion } = body
  const planId = custom.planId
  const userId = custom.userId

  if (!userId) {
    console.warn("[EasierPay Webhook] Subscription webhook without userId")
    return
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { SubscriptionPlan: true },
  })

  if (!user) {
    console.error(`[EasierPay Webhook] User not found: ${userId}`)
    return
  }

  const plan = planId
    ? await prisma.subscriptionPlan.findUnique({ where: { id: planId } })
    : user.SubscriptionPlan

  if (!plan) {
    console.error(`[EasierPay Webhook] Plan not found: ${planId}`)
    return
  }

  const userName = user.name || "Cliente"
  const userEmail = user.email
  const monthlyPrice = Number(plan.monthlyPrice)

  switch (action) {
    case "VENTA": {
      if (result === "OK") {
        const now = new Date()
        const subscriptionEnd = new Date(now)
        subscriptionEnd.setDate(subscriptionEnd.getDate() + 30)

        // Activate subscription
        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionPlanId: plan.id,
            subscriptionStart: now,
            subscriptionEnd,
            easierpaySubscriptionId: String(id_suscripcion || id_transaccion),
          },
        })

        // Create history record
        await prisma.subscriptionHistory.create({
          data: {
            userId,
            planId: plan.id,
            startDate: now,
            endDate: subscriptionEnd,
            amount: monthlyPrice,
            currency: "EUR",
            paymentGateway: "easierpay",
            transactionId: String(id_transaccion),
          },
        })

        // Get plan features for email
        const features = Array.isArray(plan.features)
          ? (plan.features as { text: string; included: boolean }[])
              .filter((f) => f.included)
              .map((f) => f.text)
          : []

        await sendTemplateEmail({
          to: userEmail,
          template: "subscriptions/activated",
          subjectVariables: { planName: plan.name },
          react: SubscriptionActivatedTemplate({
            customerName: userName,
            planName: plan.name,
            features,
            startDate: now,
            nextBillingDate: subscriptionEnd,
            amount: monthlyPrice,
          }),
          metadata: { userId, planId: plan.id },
        })

        console.log(
          `[EasierPay Webhook] Subscription activated: user=${userId} plan=${plan.name}`
        )
      } else {
        console.log(
          `[EasierPay Webhook] Subscription payment failed: user=${userId} plan=${plan.name}`
        )
      }
      break
    }

    case "RENOVACION": {
      if (result === "OK") {
        // Extend subscription by 30 days from current end or now
        const currentEnd = user.subscriptionEnd || new Date()
        const baseDate = currentEnd > new Date() ? currentEnd : new Date()
        const newEnd = new Date(baseDate)
        newEnd.setDate(newEnd.getDate() + 30)

        await prisma.user.update({
          where: { id: userId },
          data: { subscriptionEnd: newEnd },
        })

        await prisma.subscriptionHistory.create({
          data: {
            userId,
            planId: plan.id,
            startDate: new Date(),
            endDate: newEnd,
            amount: monthlyPrice,
            currency: "EUR",
            paymentGateway: "easierpay",
            transactionId: String(id_transaccion),
          },
        })

        await sendTemplateEmail({
          to: userEmail,
          template: "subscriptions/renewed",
          subjectVariables: { planName: plan.name },
          react: SubscriptionRenewedTemplate({
            customerName: userName,
            planName: plan.name,
            renewedAt: new Date(),
            nextBillingDate: newEnd,
            amount: monthlyPrice,
          }),
          metadata: { userId, planId: plan.id },
        })

        console.log(
          `[EasierPay Webhook] Subscription renewed: user=${userId} until=${newEnd.toISOString()}`
        )
      } else {
        console.warn(
          `[EasierPay Webhook] Subscription renewal failed: user=${userId} (EasierPay will retry)`
        )
      }
      break
    }

    case "BAJA": {
      // Subscription cancelled - keep active until subscriptionEnd
      await sendTemplateEmail({
        to: userEmail,
        template: "subscriptions/cancelled",
        subjectVariables: { planName: plan.name },
        react: SubscriptionCancelledTemplate({
          customerName: userName,
          planName: plan.name,
          endDate: user.subscriptionEnd || new Date(),
        }),
        metadata: { userId, planId: plan.id },
      })

      console.log(
        `[EasierPay Webhook] Subscription cancelled: user=${userId} (active until ${user.subscriptionEnd?.toISOString()})`
      )
      break
    }

    case "DEVOLUCION":
    case "REEMBOLSO": {
      if (result === "OK") {
        // Immediate downgrade on refund
        const defaultPlan = await prisma.subscriptionPlan.findFirst({
          where: { isActive: true, isDefault: true },
        })

        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionPlanId: defaultPlan?.id || null,
            subscriptionEnd: null,
            easierpaySubscriptionId: null,
          },
        })

        console.log(
          `[EasierPay Webhook] Subscription refunded and downgraded: user=${userId}`
        )
      }
      break
    }

    default:
      console.log(
        `[EasierPay Webhook] Unhandled subscription action: ${action}`
      )
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────

function buildResponse(
  transactionId: string,
  result: "OK" | "KO",
  message?: string
) {
  return NextResponse.json(
    {
      status: 200,
      id_transaction: transactionId,
      data: {
        result,
        message: message || "Processed successfully",
      },
    },
    { status: 200 }
  )
}
