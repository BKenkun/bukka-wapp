import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission, type AdminRole } from "@/lib/admin-permissions"
import { normalizeCode } from "@/lib/referral-codes"
import { z } from "zod"

const createSchema = z
  .object({
    code: z.string().min(2, "El código debe tener al menos 2 caracteres"),
    performerId: z.string().min(1).nullable().optional(),
    partnerName: z.string().min(1).max(120).nullable().optional(),
    discountPercent: z.number().min(0).max(100),
    label: z.string().max(80).nullable().optional(),
    isActive: z.boolean().optional().default(true),
    maxUses: z.number().int().positive().nullable().optional(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
  })
  .refine((d) => Boolean(d.performerId) || Boolean(d.partnerName?.trim()), {
    message: "Debes seleccionar una modelo o introducir un nombre de tercero",
    path: ["performerId"],
  })

function requireAdmin(role: AdminRole | null | undefined) {
  return hasPermission(role, "referrals")
}

export async function GET() {
  const session = await auth()
  const role = session?.user?.adminRole as AdminRole | null
  if (!session?.user?.id || !requireAdmin(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const codes = await prisma.referralCode.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      performer: { select: { id: true, name: true, slug: true, profileImage: true } },
      _count: { select: { conversions: true, orders: true, subscriptions: true } },
    },
  })

  return NextResponse.json({
    codes: codes.map((c) => ({
      id: c.id,
      code: c.code,
      performer: c.performer,
      partnerName: c.partnerName,
      ownerType: c.performer ? "performer" : "partner",
      ownerName: c.performer?.name ?? c.partnerName ?? "—",
      discountPercent: Number(c.discountPercent),
      label: c.label,
      isActive: c.isActive,
      maxUses: c.maxUses,
      usedCount: c.usedCount,
      totalClicks: c.totalClicks,
      totalRevenue: Number(c.totalRevenue),
      startDate: c.startDate?.toISOString() ?? null,
      endDate: c.endDate?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
      counts: c._count,
    })),
  })
}

export async function POST(request: Request) {
  const session = await auth()
  const role = session?.user?.adminRole as AdminRole | null
  if (!session?.user?.id || !requireAdmin(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || "Datos inválidos" },
      { status: 400 },
    )
  }

  const code = normalizeCode(parsed.data.code)
  if (!/^[A-Z0-9_-]{2,32}$/.test(code)) {
    return NextResponse.json(
      { error: "El código solo puede contener letras, números, guiones o guiones bajos (2-32)" },
      { status: 400 },
    )
  }

  const existing = await prisma.referralCode.findUnique({ where: { code } })
  if (existing) {
    return NextResponse.json({ error: "Ese código ya existe" }, { status: 400 })
  }

  let performerId: string | null = null
  if (parsed.data.performerId) {
    const performer = await prisma.performer.findUnique({
      where: { id: parsed.data.performerId },
    })
    if (!performer) {
      return NextResponse.json({ error: "Modelo no encontrada" }, { status: 400 })
    }
    performerId = performer.id
  }
  const partnerName = performerId ? null : parsed.data.partnerName?.trim() || null

  const created = await prisma.referralCode.create({
    data: {
      code,
      performerId,
      partnerName,
      discountPercent: parsed.data.discountPercent,
      label: parsed.data.label || null,
      isActive: parsed.data.isActive,
      maxUses: parsed.data.maxUses ?? null,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
    },
    include: {
      performer: { select: { id: true, name: true, slug: true, profileImage: true } },
    },
  })

  return NextResponse.json({
    code: {
      id: created.id,
      code: created.code,
      performer: created.performer,
      partnerName: created.partnerName,
      ownerType: created.performer ? "performer" : "partner",
      ownerName: created.performer?.name ?? created.partnerName ?? "—",
      discountPercent: Number(created.discountPercent),
      label: created.label,
      isActive: created.isActive,
      maxUses: created.maxUses,
      usedCount: created.usedCount,
      totalClicks: created.totalClicks,
      totalRevenue: Number(created.totalRevenue),
      startDate: created.startDate?.toISOString() ?? null,
      endDate: created.endDate?.toISOString() ?? null,
      createdAt: created.createdAt.toISOString(),
    },
  })
}
