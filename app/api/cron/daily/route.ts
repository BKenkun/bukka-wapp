import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createAdminNotification } from "@/lib/admin-notifications"
import { sendTemplateEmail, RenewalReminderTemplate, SubscriptionExpiredTemplate } from "@/lib/email"

/**
 * Daily cron endpoint. Runs:
 *  - Renewal reminder: subscriptionEnd en 3 días (±12h).
 *  - Subscription expired: subscriptionEnd < ahora y plan aún asignado.
 *
 * Se protege con el header `X-Cron-Secret` que compara con CRON_SECRET.
 * Diseñado para ser idempotente: tras notificar expirada, se limpia
 * subscriptionPlanId/subscriptionEnd del user para no volver a disparar.
 *
 * Dispara en el EC2 vía systemd timer (ver ops/systemd/bukka-cron.*).
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret")
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()

  // Ventana ±12h centrada a 3 días desde ahora → cada user la cruza 1 sola vez.
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const windowStart = new Date(in3Days.getTime() - 12 * 60 * 60 * 1000)
  const windowEnd = new Date(in3Days.getTime() + 12 * 60 * 60 * 1000)

  const expiringSoon = await prisma.user.findMany({
    where: {
      subscriptionEnd: { gte: windowStart, lte: windowEnd },
      subscriptionPlanId: { not: null },
    },
    include: { SubscriptionPlan: true },
  })

  let remindersSent = 0
  for (const user of expiringSoon) {
    if (!user.SubscriptionPlan || !user.subscriptionEnd) continue

    await createAdminNotification({
      type: "SUBSCRIPTION_RENEWAL_REMINDER",
      title: "Suscripción expira en 3 días",
      message: `${user.name || user.email} · plan ${user.SubscriptionPlan.name}`,
      relatedUrl: `/admin/users/${user.id}`,
    })

    try {
      await sendTemplateEmail({
        to: user.email,
        template: "subscriptions/renewal-reminder",
        subjectVariables: { planName: user.SubscriptionPlan.name },
        react: RenewalReminderTemplate({
          customerName: user.name || "",
          planName: user.SubscriptionPlan.name,
          expirationDate: user.subscriptionEnd,
          amount: Number(user.SubscriptionPlan.monthlyPrice ?? 0),
          daysRemaining: 3,
        }),
        metadata: { userId: user.id, planId: user.SubscriptionPlan.id },
      })
    } catch (err) {
      console.error("Error sending renewal-reminder email:", err)
    }
    remindersSent++
  }

  // Expirados: subscriptionEnd < ahora y aún con plan activo
  const justExpired = await prisma.user.findMany({
    where: {
      subscriptionEnd: { lt: now },
      subscriptionPlanId: { not: null },
    },
    include: { SubscriptionPlan: true },
  })

  let expiredCleared = 0
  for (const user of justExpired) {
    const plan = user.SubscriptionPlan

    await createAdminNotification({
      type: "SUBSCRIPTION_EXPIRED",
      title: "Suscripción expirada",
      message: `${user.name || user.email}${plan ? ` · plan ${plan.name}` : ""}`,
      relatedUrl: `/admin/users/${user.id}`,
    })

    try {
      await sendTemplateEmail({
        to: user.email,
        template: "subscriptions/expired",
        subjectVariables: { planName: plan?.name || "" },
        react: SubscriptionExpiredTemplate({
          customerName: user.name || "",
          planName: plan?.name || "",
          expiredAt: user.subscriptionEnd || now,
        }),
        metadata: { userId: user.id, planId: plan?.id },
      })
    } catch (err) {
      console.error("Error sending subscription-expired email:", err)
    }

    // Limpiar plan para que sea idempotente y el user vuelva a Visitor/Free
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionPlanId: null,
        subscriptionEnd: null,
      },
    })
    expiredCleared++
  }

  return NextResponse.json({
    ok: true,
    remindersSent,
    expiredCleared,
    now: now.toISOString(),
  })
}
