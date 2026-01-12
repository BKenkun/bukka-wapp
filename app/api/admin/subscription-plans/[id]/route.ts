import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const planSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones").optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  level: z.number().int().min(0).optional(),
  icon: z.string().optional().nullable(),
  monthlyPrice: z.number().min(0).optional(),
  yearlyPrice: z.number().optional().nullable(),
  features: z.any().optional(),
  maxVideoQuality: z.string().optional(),
  canComment: z.boolean().optional(),
  canAccessForum: z.boolean().optional(),
  canDownload: z.boolean().optional(),
  canAccessLimitedEdition: z.boolean().optional(),
  canAccessExclusive: z.boolean().optional(),
  shopDiscount: z.number().int().min(0).max(100).optional(),
  includesVIPPack: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  isFree: z.boolean().optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id },
    })

    if (!plan) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ plan })
  } catch (error) {
    console.error("Error fetching subscription plan:", error)
    return NextResponse.json({ error: "Error al obtener plan" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const data = planSchema.parse(body)

    // Check if plan exists
    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { id },
    })

    if (!existingPlan) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
    }

    // If changing slug, check it doesn't conflict
    if (data.slug && data.slug !== existingPlan.slug) {
      const slugExists = await prisma.subscriptionPlan.findUnique({
        where: { slug: data.slug },
      })
      if (slugExists) {
        return NextResponse.json({ error: "Este slug ya existe" }, { status: 400 })
      }
    }

    // If setting as default, remove default from others
    if (data.isDefault) {
      await prisma.subscriptionPlan.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      })
    }

    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data,
    })

    return NextResponse.json({ plan })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Error updating subscription plan:", error)
    return NextResponse.json({ error: "Error al actualizar plan" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check if plan exists
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id },
    })

    if (!plan) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
    }

    // Check if there are users with this plan
    const usersWithPlan = await prisma.user.count({
      where: { subscriptionPlanId: id },
    })

    if (usersWithPlan > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar: hay ${usersWithPlan} usuarios con este plan` },
        { status: 400 }
      )
    }

    // Check if any videos require this plan
    const videosWithPlan = await prisma.video.count({
      where: { minTierPlanId: id },
    })

    if (videosWithPlan > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar: hay ${videosWithPlan} videos que requieren este plan` },
        { status: 400 }
      )
    }

    await prisma.subscriptionPlan.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting subscription plan:", error)
    return NextResponse.json({ error: "Error al eliminar plan" }, { status: 500 })
  }
}
