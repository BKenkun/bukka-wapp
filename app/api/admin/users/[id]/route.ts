import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

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
      isPerformer,
      isModerator,
      isVerified,
    } = body

    // If subscription plan changed, create history record
    if (subscriptionPlanId !== undefined && subscriptionPlanId !== existingUser.subscriptionPlanId) {
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
        isPerformer: isPerformer !== undefined ? isPerformer : undefined,
        isModerator: isModerator !== undefined ? isModerator : undefined,
        isVerified: isVerified !== undefined ? isVerified : undefined,
      },
      include: {
        subscriptionPlan: true,
      },
    })

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
        subscriptionPlan: true,
        badges: {
          include: { badge: true },
        },
        orders: {
          orderBy: { createdAt: "desc" },
          include: {
            items: {
              include: {
                product: {
                  select: { id: true, name: true, images: true },
                },
              },
            },
          },
        },
        subscriptionHistory: {
          orderBy: { startDate: "desc" },
          include: {
            plan: {
              select: { id: true, slug: true, name: true },
            },
          },
        },
        _count: {
          select: {
            orders: true,
            favorites: true,
            comments: true,
            forumPosts: true,
            forumReplies: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    return NextResponse.json(user)
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
