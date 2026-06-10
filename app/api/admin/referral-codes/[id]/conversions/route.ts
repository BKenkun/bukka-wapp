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
    select: {
      id: true,
      code: true,
      totalClicks: true,
      totalRevenue: true,
      usedCount: true,
      commissionPercent: true,
    },
  })
  if (!code) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  const commissionPercent = Number(code.commissionPercent)

  // Comisión efectiva de una conversión: la guardada en el momento de la venta,
  // o (si es anterior a configurar el %) el % actual aplicado retroactivamente.
  const effectiveCommission = (amount: number, stored: number) =>
    stored > 0 ? stored : Math.round(amount * commissionPercent) / 100

  // Todas las conversiones (campos mínimos) para comisiones e histórico mensual
  const allConversions = await prisma.referralConversion.findMany({
    where: { referralCodeId: id },
    select: { amount: true, commissionAmount: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 5000,
  })

  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  let commissionCurrentMonth = 0
  let commissionPreviousMonth = 0
  let commissionTotal = 0
  const monthlyMap = new Map<string, { revenue: number; commission: number; count: number }>()

  for (const c of allConversions) {
    const amount = Number(c.amount)
    const commission = effectiveCommission(amount, Number(c.commissionAmount))
    commissionTotal += commission

    if (c.createdAt >= currentMonthStart) {
      commissionCurrentMonth += commission
    } else if (c.createdAt >= previousMonthStart) {
      commissionPreviousMonth += commission
    }

    const monthKey = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, "0")}`
    const entry = monthlyMap.get(monthKey) ?? { revenue: 0, commission: 0, count: 0 }
    entry.revenue += amount
    entry.commission += commission
    entry.count += 1
    monthlyMap.set(monthKey, entry)
  }

  const round2 = (n: number) => Math.round(n * 100) / 100
  const monthlyHistory = [...monthlyMap.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, 12)
    .map(([month, v]) => ({
      month,
      revenue: round2(v.revenue),
      commission: round2(v.commission),
      conversions: v.count,
    }))

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
      commissionPercent,
    },
    summary: {
      conversions: conversions.length,
      shopCount,
      subscriptionCount: subCount,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      commissionCurrentMonth: round2(commissionCurrentMonth),
      commissionPreviousMonth: round2(commissionPreviousMonth),
      commissionTotal: round2(commissionTotal),
    },
    monthlyHistory,
    conversions: conversions.map((c) => ({
      id: c.id,
      type: c.type,
      amount: Number(c.amount),
      discountAmount: Number(c.discountAmount),
      commissionAmount: effectiveCommission(Number(c.amount), Number(c.commissionAmount)),
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
