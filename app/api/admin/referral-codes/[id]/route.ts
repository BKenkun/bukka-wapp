import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission, type AdminRole } from "@/lib/admin-permissions"
import { z } from "zod"

const updateSchema = z.object({
  partnerName: z.string().min(1).max(120).nullable().optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  commissionPercent: z.number().min(0).max(100).optional(),
  label: z.string().max(80).nullable().optional(),
  isActive: z.boolean().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
})

function requireAdmin(role: AdminRole | null | undefined) {
  return hasPermission(role, "referrals")
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const role = session?.user?.adminRole as AdminRole | null
  if (!session?.user?.id || !requireAdmin(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await ctx.params
  const code = await prisma.referralCode.findUnique({
    where: { id },
    include: {
      performer: { select: { id: true, name: true, slug: true, profileImage: true } },
    },
  })

  if (!code) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  return NextResponse.json({
    code: {
      id: code.id,
      code: code.code,
      performer: code.performer,
      partnerName: code.partnerName,
      ownerType: code.performer ? "performer" : "partner",
      ownerName: code.performer?.name ?? code.partnerName ?? "—",
      discountPercent: Number(code.discountPercent),
      commissionPercent: Number(code.commissionPercent),
      label: code.label,
      isActive: code.isActive,
      maxUses: code.maxUses,
      usedCount: code.usedCount,
      totalClicks: code.totalClicks,
      totalRevenue: Number(code.totalRevenue),
      startDate: code.startDate?.toISOString() ?? null,
      endDate: code.endDate?.toISOString() ?? null,
      createdAt: code.createdAt.toISOString(),
    },
  })
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const role = session?.user?.adminRole as AdminRole | null
  if (!session?.user?.id || !requireAdmin(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await ctx.params
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || "Datos inválidos" },
      { status: 400 },
    )
  }

  const data: Record<string, unknown> = {}
  if (parsed.data.discountPercent !== undefined) data.discountPercent = parsed.data.discountPercent
  if (parsed.data.commissionPercent !== undefined) data.commissionPercent = parsed.data.commissionPercent
  if (parsed.data.label !== undefined) data.label = parsed.data.label
  if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive
  if (parsed.data.maxUses !== undefined) data.maxUses = parsed.data.maxUses
  if (parsed.data.partnerName !== undefined) data.partnerName = parsed.data.partnerName
  if (parsed.data.startDate !== undefined) {
    data.startDate = parsed.data.startDate ? new Date(parsed.data.startDate) : null
  }
  if (parsed.data.endDate !== undefined) {
    data.endDate = parsed.data.endDate ? new Date(parsed.data.endDate) : null
  }

  // Si el código no es de modelo (no tiene performerId) y se intenta limpiar
  // partnerName, evitamos quedarnos sin dueño.
  if (parsed.data.partnerName !== undefined && (parsed.data.partnerName === null || parsed.data.partnerName === "")) {
    const current = await prisma.referralCode.findUnique({
      where: { id },
      select: { performerId: true },
    })
    if (current && !current.performerId) {
      return NextResponse.json(
        { error: "El código necesita un dueño (modelo o tercero)" },
        { status: 400 },
      )
    }
  }

  try {
    const updated = await prisma.referralCode.update({ where: { id }, data })
    return NextResponse.json({ code: { id: updated.id } })
  } catch {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const role = session?.user?.adminRole as AdminRole | null
  if (!session?.user?.id || !requireAdmin(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await ctx.params
  try {
    await prisma.referralCode.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  }
}
