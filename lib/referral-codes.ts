import { prisma } from "@/lib/prisma"

export type ReferralContext = "shop" | "subscription"

export interface ReferralValidationResult {
  ok: boolean
  error?: string
  referral?: {
    id: string
    code: string
    discountPercent: number
    label: string | null
    performer: {
      id: string
      slug: string
      name: string
      profileImage: string | null
    }
  }
  discountAmount?: number
}

export const REFERRAL_COOKIE_NAME = "ref_code"
export const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 días

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "")
}

export async function validateReferralCode(
  rawCode: string,
  context: ReferralContext,
  amount: number,
): Promise<ReferralValidationResult> {
  const code = normalizeCode(rawCode)
  if (!code) return { ok: false, error: "Código requerido" }

  const referral = await prisma.referralCode.findUnique({
    where: { code },
    include: {
      performer: {
        select: { id: true, slug: true, name: true, profileImage: true },
      },
    },
  })

  if (!referral) return { ok: false, error: "Código no válido" }
  if (!referral.isActive) return { ok: false, error: "Este código ya no está activo" }

  const now = new Date()
  if (referral.startDate && now < referral.startDate) {
    return { ok: false, error: "Este código aún no está activo" }
  }
  if (referral.endDate && now > referral.endDate) {
    return { ok: false, error: "Este código ha expirado" }
  }
  if (referral.maxUses !== null && referral.usedCount >= referral.maxUses) {
    return { ok: false, error: "Este código ha alcanzado su límite de uso" }
  }

  const discountPercent = Number(referral.discountPercent)
  const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0
  const discountAmount =
    discountPercent > 0
      ? Math.round(((safeAmount * discountPercent) / 100) * 100) / 100
      : 0

  return {
    ok: true,
    referral: {
      id: referral.id,
      code: referral.code,
      discountPercent,
      label: referral.label,
      performer: {
        id: referral.performer.id,
        slug: referral.performer.slug,
        name: referral.performer.name,
        profileImage: referral.performer.profileImage,
      },
    },
    discountAmount,
    // El context se acepta para futuras restricciones (ej. códigos
    // exclusivos de tienda o de suscripción). Hoy todos aplican a ambos.
    ...(context ? {} : {}),
  }
}
