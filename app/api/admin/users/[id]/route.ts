import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import {
  sendTemplateEmail,
  SubscriptionUpgradeTemplate,
  SubscriptionDowngradeTemplate,
} from "@/lib/email"
import { createAdminNotification } from "@/lib/admin-notifications"

interface RouteParams {
  params: Promise<{ id: string }>
}

// PATCH - Actualizar usuario (admin only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const {
      subscriptionPlanId,
      subscriptionEnd,
      isAdmin,
      adminRole,
      isPerformer,
      isModerator,
      isVerified,
    } = body

    // Si el plan cambia, crear history + preparar email upgrade/downgrade
    let previousPlan: { id: string; name: string; level: number; monthlyPrice: unknown } | null = null
    let newPlanData: { id: string; name: string; level: number; monthlyPrice: unknown; features: unknown } | null = null
    const planChanged =
      subscriptionPlanId !== undefined &&
      subscriptionPlanId !== existingUser.subscriptionPlanId

    if (planChanged) {
      if (existingUser.subscriptionPlanId) {
        previousPlan = await prisma.subscriptionPlan.findUnique({
          where: { id: existingUser.subscriptionPlanId },
          select: { id: true, name: true, level: true, monthlyPrice: true },
        })
      }
      if (subscriptionPlanId) {
        newPlanData = await prisma.subscriptionPlan.findUnique({
          where: { id: subscriptionPlanId },
          select: { id: true, name: true, level: true, monthlyPrice: true, features: true },
        })
      }

      await prisma.subscriptionHistory.create({
        data: {
          userId: id,
          planId: subscriptionPlanId,
          startDate: new Date(),
          amount: 0, // Admin change, no payment
          currency: "EUR",
          paymentGateway: "admin",
        },
      })
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        subscriptionPlanId: subscriptionPlanId !== undefined ? subscriptionPlanId : undefined,
        subscriptionEnd: subscriptionEnd ? new Date(subscriptionEnd) : null,
        subscriptionStart: subscriptionPlanId !== undefined && subscriptionPlanId !== existingUser.subscriptionPlanId
          ? new Date()
          : undefined,
        isAdmin: isAdmin !== undefined ? isAdmin : undefined,
        adminRole: adminRole !== undefined ? adminRole : undefined,
        isPerformer: isPerformer !== undefined ? isPerformer : undefined,
        isModerator: isModerator !== undefined ? isModerator : undefined,
        isVerified: isVerified !== undefined ? isVerified : undefined,
      },
      include: {
        SubscriptionPlan: true,
      },
    })

    // Emails + notif admin al upgrade/downgrade (solo si ambos planes están definidos)
    if (planChanged && previousPlan && newPlanData && previousPlan.id !== newPlanData.id) {
      const isUpgrade = newPlanData.level > previousPlan.level
      const customerName = user.name || "Cliente"
      const effectiveDate = new Date()

      try {
        if (isUpgrade) {
          const features = Array.isArray(newPlanData.features)
            ? (newPlanData.features as { text: string; included: boolean }[])
                .filter((f) => f.included)
                .map((f) => f.text)
            : []
          await sendTemplateEmail({
            to: user.email,
            template: "subscriptions/upgrade",
            subjectVariables: { planName: newPlanData.name },
            react: SubscriptionUpgradeTemplate({
              customerName,
              previousPlan: previousPlan.name,
              newPlan: newPlanData.name,
              newFeatures: features,
              effectiveDate,
              newAmount: Number(newPlanData.monthlyPrice),
            }),
            metadata: { userId: id, planId: newPlanData.id },
          })
        } else {
          await sendTemplateEmail({
            to: user.email,
            template: "subscriptions/downgrade",
            subjectVariables: { planName: newPlanData.name },
            react: SubscriptionDowngradeTemplate({
              customerName,
              previousPlan: previousPlan.name,
              newPlan: newPlanData.name,
              effectiveDate,
              newAmount: Number(newPlanData.monthlyPrice),
            }),
            metadata: { userId: id, planId: newPlanData.id },
          })
        }
      } catch (err) {
        console.error("Error sending upgrade/downgrade email:", err)
      }

      await createAdminNotification({
        type: "NEW_SUBSCRIPTION",
        title: isUpgrade
          ? `Upgrade manual: ${previousPlan.name} → ${newPlanData.name}`
          : `Downgrade manual: ${previousPlan.name} → ${newPlanData.name}`,
        message: user.email,
        relatedUrl: `/admin/users/${id}`,
      })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Error al actualizar usuario" },
      { status: 500 }
    )
  }
}

// GET - Obtener detalles de usuario (admin only)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        SubscriptionPlan: true,
        UserBadge: {
          include: { Badge: true },
        },
        Order: {
          orderBy: { createdAt: "desc" },
          include: {
            OrderItem: {
              include: {
                product: {
                  select: { id: true, name: true, images: true },
                },
              },
            },
          },
        },
        SubscriptionHistory: {
          orderBy: { startDate: "desc" },
          include: {
            SubscriptionPlan: {
              select: { id: true, slug: true, name: true },
            },
          },
        },
        _count: {
          select: {
            Order: true,
            favorites: true,
            Comment: true,
            ForumPost: true,
            ForumReply: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const transformedUser = {
      ...user,
      subscriptionPlan: user.SubscriptionPlan,
      badges: user.UserBadge.map((b) => ({ ...b, badge: b.Badge })),
      orders: user.Order.map((o) => ({ ...o, items: o.OrderItem })),
      subscriptionHistory: user.SubscriptionHistory.map((h) => ({ ...h, plan: h.SubscriptionPlan })),
      _count: {
        ...user._count,
        orders: user._count.Order,
        forumPosts: user._count.ForumPost,
        forumReplies: user._count.ForumReply,
        comments: user._count.Comment,
      },
    }

    return NextResponse.json(transformedUser)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { error: "Error al obtener usuario" },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar/suspender usuario (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id } = await params

    // Don't allow deleting yourself
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "No puedes eliminar tu propia cuenta" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Get default plan for downgrade
    const defaultPlan = await prisma.subscriptionPlan.findFirst({
      where: { isDefault: true, isActive: true },
    })

    // Soft delete by clearing subscription and marking as inactive
    await prisma.user.update({
      where: { id },
      data: {
        subscriptionPlanId: defaultPlan?.id || null,
        subscriptionEnd: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "Error al eliminar usuario" },
      { status: 500 }
    )
  }
}
