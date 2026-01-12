import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const planSchema = z.object({
  slug: z.string().min(1, "El slug es requerido").regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional().nullable(),
  level: z.number().int().min(0).default(0),
  icon: z.string().optional().nullable(),
  monthlyPrice: z.number().min(0).default(0),
  yearlyPrice: z.number().optional().nullable(),
  features: z.any().optional().default([]),
  maxVideoQuality: z.string().default("720p"),
  canComment: z.boolean().default(false),
  canAccessForum: z.boolean().default(false),
  canDownload: z.boolean().default(false),
  canAccessLimitedEdition: z.boolean().default(false),
  canAccessExclusive: z.boolean().default(false),
  shopDiscount: z.number().int().min(0).max(100).default(0),
  includesVIPPack: z.boolean().default(false),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  isFree: z.boolean().default(false),
})

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Verificar isAdmin desde la base de datos (como hace el layout)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Get plans with user counts
    const [plans, userCounts] = await Promise.all([
      prisma.subscriptionPlan.findMany({
        orderBy: { level: "asc" },
      }),
      prisma.user.groupBy({
        by: ["subscriptionPlanId"],
        _count: { id: true },
      }),
    ])

    // Map user counts
    const countsByPlanId: Record<string, number> = {}
    userCounts.forEach((item) => {
      if (item.subscriptionPlanId) {
        countsByPlanId[item.subscriptionPlanId] = item._count.id
      }
    })

    // Add user counts to each plan
    const plansWithCounts = plans.map((plan) => ({
      ...plan,
      userCount: countsByPlanId[plan.id] || 0,
    }))

    // Get stats
    const totalUsers = await prisma.user.count()
    const usersWithPlan = await prisma.user.count({
      where: { subscriptionPlanId: { not: null } },
    })
    const paidSubscribers = await prisma.user.count({
      where: {
        SubscriptionPlan: {
          isFree: false,
          monthlyPrice: { gt: 0 },
        },
      },
    })

    return NextResponse.json({
      plans: plansWithCounts,
      stats: {
        totalUsers,
        usersWithPlan,
        paidSubscribers,
        usersWithoutPlan: totalUsers - usersWithPlan,
      },
    })
  } catch (error) {
    console.error("Error fetching subscription plans:", error)
    return NextResponse.json({ error: "Error al obtener planes" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await request.json()
    const data = planSchema.parse(body)

    // Check if slug already exists
    const existingSlug = await prisma.subscriptionPlan.findUnique({
      where: { slug: data.slug },
    })

    if (existingSlug) {
      return NextResponse.json({ error: "Este slug ya existe" }, { status: 400 })
    }

    // If this plan is set as default, remove default from others
    if (data.isDefault) {
      await prisma.subscriptionPlan.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      })
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        slug: data.slug,
        name: data.name,
        description: data.description,
        level: data.level,
        icon: data.icon,
        monthlyPrice: data.monthlyPrice,
        yearlyPrice: data.yearlyPrice,
        features: data.features,
        maxVideoQuality: data.maxVideoQuality,
        canComment: data.canComment,
        canAccessForum: data.canAccessForum,
        canDownload: data.canDownload,
        canAccessLimitedEdition: data.canAccessLimitedEdition,
        canAccessExclusive: data.canAccessExclusive,
        shopDiscount: data.shopDiscount,
        includesVIPPack: data.includesVIPPack,
        isDefault: data.isDefault,
        isActive: data.isActive,
        isFree: data.isFree,
      },
    })

    return NextResponse.json({ plan })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Error creating subscription plan:", error)
    return NextResponse.json({ error: "Error al crear plan" }, { status: 500 })
  }
}
