import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  sendTemplateEmail,
  PaymentReceivedTemplate,
  PaymentFailedTemplate,
  SubscriptionActivatedTemplate,
  SubscriptionRenewedTemplate,
  SubscriptionCancelledTemplate,
  SubscriptionPaymentFailedTemplate,
} from "@/lib/email"
import { createAdminNotification } from "@/lib/admin-notifications"

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
    referralCodeId?: string
    referralDiscountPercent?: number
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

  const userName = order.user?.name || order.guestName || "Cliente"
  const userEmail = order.user?.email || order.guestEmail
  if (!userEmail) {
    console.warn(`[EasierPay Webhook] Order ${order.orderNumber} has no email; skipping notifications`)
  }

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

        if (order.referralCodeId) {
          await attributeReferral({
            referralCodeId: order.referralCodeId,
            type: "SHOP_PURCHASE",
            userId: order.userId,
            orderId: order.id,
            amount: Number(order.total),
            discountAmount: Number(order.discount),
          })
        }

        if (userEmail) await sendTemplateEmail({
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
        await createAdminNotification({
          type: "ORDER_PAID",
          title: `Pago recibido · Pedido #${order.orderNumber}`,
          message: `${Number(order.total).toFixed(2)} € · ${userName}`,
          relatedUrl: `/admin/orders/${order.id}`,
        })
      } else {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: "FAILED",
            transactionId: String(id_transaccion),
          },
        })

        if (userEmail) await sendTemplateEmail({
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
        await createAdminNotification({
          type: "PAYMENT_FAILED",
          title: `Pago fallido · Pedido #${order.orderNumber}`,
          message: `${Number(order.total).toFixed(2)} € · ${userName}`,
          relatedUrl: `/admin/orders/${order.id}`,
        })
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

        // Compute charged amount taking into account first-payment referral discount
        const refDiscountPct = Number(custom.referralDiscountPercent || 0)
        const chargedAmount = refDiscountPct > 0
          ? Math.max(0, Math.round((monthlyPrice * (1 - refDiscountPct / 100)) * 100) / 100)
          : monthlyPrice
        const refDiscountAmount = Math.max(0, Math.round((monthlyPrice - chargedAmount) * 100) / 100)

        // Create history record
        const history = await prisma.subscriptionHistory.create({
          data: {
            userId,
            planId: plan.id,
            startDate: now,
            endDate: subscriptionEnd,
            amount: chargedAmount,
            currency: "EUR",
            paymentGateway: "easierpay",
            transactionId: String(id_transaccion),
            referralCodeId: custom.referralCodeId || null,
          },
        })

        if (custom.referralCodeId) {
          await attributeReferral({
            referralCodeId: custom.referralCodeId,
            type: "SUBSCRIPTION",
            userId,
            subscriptionHistoryId: history.id,
            amount: chargedAmount,
            discountAmount: refDiscountAmount,
          })
        }

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
        await createAdminNotification({
          type: "NEW_SUBSCRIPTION",
          title: `Nueva suscripción ${plan.name}`,
          message: userEmail || `User ${userId}`,
          relatedUrl: `/admin/users/${userId}`,
        })
        console.log(
          `[EasierPay Webhook] Subscription activated (notif sent)`
        )
      } else {
        console.log(
          `[EasierPay Webhook] Subscription payment failed: user=${userId} plan=${plan.name}`
        )
        await sendTemplateEmail({
          to: userEmail,
          template: "subscriptions/payment-failed",
          subjectVariables: { planName: plan.name },
          react: SubscriptionPaymentFailedTemplate({
            customerName: userName,
            planName: plan.name,
            amount: monthlyPrice,
            reason: "We were unable to process your subscription payment",
          }),
          metadata: { userId, planId: plan.id },
        })
        await createAdminNotification({
          type: "PAYMENT_FAILED",
          title: `Pago de suscripción fallido · ${plan.name}`,
          message: userEmail,
          relatedUrl: `/admin/users/${userId}`,
        })
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
        // EasierPay reintenta la renovación de forma automática. Avisamos al
        // user + admin para que sepan que habrá un reintento y puedan
        // actualizar el método de pago si hace falta.
        await sendTemplateEmail({
          to: userEmail,
          template: "subscriptions/payment-failed",
          subjectVariables: { planName: plan.name },
          react: SubscriptionPaymentFailedTemplate({
            customerName: userName,
            planName: plan.name,
            amount: monthlyPrice,
            reason: "We were unable to charge your monthly renewal",
          }),
          metadata: { userId, planId: plan.id },
        })
        await createAdminNotification({
          type: "PAYMENT_FAILED",
          title: `Renovación fallida · ${plan.name}`,
          message: `${userEmail} — EasierPay reintentará`,
          relatedUrl: `/admin/users/${userId}`,
        })
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
      await createAdminNotification({
        type: "SUBSCRIPTION_CANCELLED",
        title: "Suscripción cancelada",
        message: userEmail || `User ${userId}`,
        relatedUrl: `/admin/users/${userId}`,
      })
      console.log(
        `[EasierPay Webhook] Subscription cancelled (notif sent)`
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

// ─── Referral attribution ────────────────────────────────────────────

interface AttributeReferralInput {
  referralCodeId: string
  type: "SHOP_PURCHASE" | "SUBSCRIPTION"
  userId: string | null
  orderId?: string
  subscriptionHistoryId?: string
  amount: number
  discountAmount: number
}

async function attributeReferral(input: AttributeReferralInput) {
  try {
    await prisma.$transaction(async (tx) => {
      // Idempotencia: si ya hay conversión para esta orden/historial, no la repetimos
      if (input.orderId) {
        const existing = await tx.referralConversion.findUnique({
          where: { orderId: input.orderId },
        })
        if (existing) return
      }
      if (input.subscriptionHistoryId) {
        const existing = await tx.referralConversion.findUnique({
          where: { subscriptionHistoryId: input.subscriptionHistoryId },
        })
        if (existing) return
      }

      // Comisión devengada para el creador/partner según el % del código
      const code = await tx.referralCode.findUnique({
        where: { id: input.referralCodeId },
        select: { commissionPercent: true },
      })
      const commissionPercent = Number(code?.commissionPercent ?? 0)
      const commissionAmount =
        commissionPercent > 0
          ? Math.round(input.amount * commissionPercent) / 100
          : 0

      await tx.referralConversion.create({
        data: {
          referralCodeId: input.referralCodeId,
          type: input.type,
          userId: input.userId,
          orderId: input.orderId,
          subscriptionHistoryId: input.subscriptionHistoryId,
          amount: input.amount,
          discountAmount: input.discountAmount,
          commissionAmount,
        },
      })

      await tx.referralCode.update({
        where: { id: input.referralCodeId },
        data: {
          usedCount: { increment: 1 },
          totalRevenue: { increment: input.amount },
        },
      })
    })
  } catch (err) {
    console.error("[Referral] attribution error", err)
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
