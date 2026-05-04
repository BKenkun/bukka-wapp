import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getEasierPayConfig, initTransaction, generateTransactionId, stringToNumericId } from "@/lib/easierpay"
import { headers } from "next/headers"
import { validateReferralCode } from "@/lib/referral-codes"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { planId, referralCode } = await request.json()

    if (!planId) {
      return NextResponse.json(
        { error: "planId is required" },
        { status: 400 }
      )
    }

    // Load the subscription plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    })

    if (!plan) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      )
    }

    if (!plan.isActive) {
      return NextResponse.json(
        { error: "This plan is not available" },
        { status: 400 }
      )
    }

    if (plan.isFree) {
      return NextResponse.json(
        { error: "Cannot pay for a free plan" },
        { status: 400 }
      )
    }

    const monthlyPrice = Number(plan.monthlyPrice)
    if (monthlyPrice <= 0) {
      return NextResponse.json(
        { error: "Invalid plan price" },
        { status: 400 }
      )
    }

    // Validar código de referido (si se envía) y aplicar descuento al primer pago
    let referralCodeId: string | null = null
    let referralDiscountPercent = 0
    let chargeAmount = monthlyPrice
    if (typeof referralCode === "string" && referralCode.trim()) {
      const refResult = await validateReferralCode(referralCode, "subscription", monthlyPrice)
      if (refResult.ok && refResult.referral) {
        referralCodeId = refResult.referral.id
        referralDiscountPercent = refResult.referral.discountPercent
        if (referralDiscountPercent > 0) {
          chargeAmount = Math.max(
            0,
            Math.round((monthlyPrice * (1 - referralDiscountPercent / 100)) * 100) / 100,
          )
        }
      }
    }

    // Load user data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
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
        amount: chargeAmount,
        rebill_amount: monthlyPrice,
        description: `${plan.name} Subscription - Monthly`,
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
        referralCodeId: referralCodeId ?? undefined,
        referralDiscountPercent: referralDiscountPercent || undefined,
      },
    })

    if (result.result !== "OK" || !result["pay-link"]) {
      console.error("[EasierPay] Init subscription failed:", result)
      return NextResponse.json(
        { error: result.message || "Failed to initiate subscription payment" },
        { status: 502 }
      )
    }

    return NextResponse.json({ payLink: result["pay-link"] })
  } catch (error) {
    console.error("[EasierPay] Error initiating subscription:", error)
    return NextResponse.json(
      { error: "Failed to process subscription" },
      { status: 500 }
    )
  }
}
