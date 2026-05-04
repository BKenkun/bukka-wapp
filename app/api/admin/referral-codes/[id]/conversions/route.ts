import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission, type AdminRole } from "@/lib/admin-permissions"

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const role = session?.user?.adminRole as AdminRole | null
  if (!session?.user?.id || !hasPermission(role, "referrals")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await ctx.params

  const code = await prisma.referralCode.findUnique({
    where: { id },
    select: { id: true, code: true, totalClicks: true, totalRevenue: true, usedCount: true },
  })
  if (!code) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  const conversions = await prisma.referralConversion.findMany({
    where: { referralCodeId: id },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { id: true, name: true, email: true } },
      order: {
        select: {
          id: true,
          orderNumber: true,
          total: true,
          paymentStatus: true,
          createdAt: true,
        },
      },
      subscriptionHistory: {
        select: {
          id: true,
          amount: true,
          createdAt: true,
          SubscriptionPlan: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  })

  const shopCount = conversions.filter((c) => c.type === "SHOP_PURCHASE").length
  const subCount = conversions.filter((c) => c.type === "SUBSCRIPTION").length
  const totalRevenue = conversions.reduce((sum, c) => sum + Number(c.amount), 0)

  return NextResponse.json({
    code: {
      id: code.id,
      code: code.code,
      totalClicks: code.totalClicks,
      totalRevenue: Number(code.totalRevenue),
      usedCount: code.usedCount,
    },
    summary: {
      conversions: conversions.length,
      shopCount,
      subscriptionCount: subCount,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
    },
    conversions: conversions.map((c) => ({
      id: c.id,
      type: c.type,
      amount: Number(c.amount),
      discountAmount: Number(c.discountAmount),
      createdAt: c.createdAt.toISOString(),
      user: c.user,
      order: c.order
        ? {
            id: c.order.id,
            orderNumber: c.order.orderNumber,
            total: Number(c.order.total),
            paymentStatus: c.order.paymentStatus,
            createdAt: c.order.createdAt.toISOString(),
          }
        : null,
      subscriptionHistory: c.subscriptionHistory
        ? {
            id: c.subscriptionHistory.id,
            amount: Number(c.subscriptionHistory.amount),
            createdAt: c.subscriptionHistory.createdAt.toISOString(),
            plan: c.subscriptionHistory.SubscriptionPlan,
          }
        : null,
    })),
  })
}
