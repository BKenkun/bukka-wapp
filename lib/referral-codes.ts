import { prisma } from "@/lib/prisma"

export type ReferralContext = "shop" | "subscription"

export type ReferralOwner =
  | {
      type: "performer"
      id: string
      slug: string
      name: string
      profileImage: string | null
    }
  | {
      type: "partner"
      name: string
    }

export interface ReferralValidationResult {
  ok: boolean
  error?: string
  referral?: {
    id: string
    code: string
    discountPercent: number
    label: string | null
    owner: ReferralOwner
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
  if (!code) return { ok: false, error: "Code required" }

  const referral = await prisma.referralCode.findUnique({
    where: { code },
    include: {
      performer: {
        select: { id: true, slug: true, name: true, profileImage: true },
      },
    },
  })

  if (!referral) return { ok: false, error: "Invalid code" }
  if (!referral.isActive) return { ok: false, error: "This code is no longer active" }

  const now = new Date()
  if (referral.startDate && now < referral.startDate) {
    return { ok: false, error: "This code is not active yet" }
  }
  if (referral.endDate && now > referral.endDate) {
    return { ok: false, error: "This code has expired" }
  }
  if (referral.maxUses !== null && referral.usedCount >= referral.maxUses) {
    return { ok: false, error: "This code has reached its usage limit" }
  }

  const discountPercent = Number(referral.discountPercent)
  const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0
  const discountAmount =
    discountPercent > 0
      ? Math.round(((safeAmount * discountPercent) / 100) * 100) / 100
      : 0

  const owner: ReferralOwner = referral.performer
    ? {
        type: "performer",
        id: referral.performer.id,
        slug: referral.performer.slug,
        name: referral.performer.name,
        profileImage: referral.performer.profileImage,
      }
    : {
        type: "partner",
        name: referral.partnerName || "Partner",
      }

  return {
    ok: true,
    referral: {
      id: referral.id,
      code: referral.code,
      discountPercent,
      label: referral.label,
      owner,
    },
    discountAmount,
    // El context se acepta para futuras restricciones (ej. códigos
    // exclusivos de tienda o de suscripción). Hoy todos aplican a ambos.
    ...(context ? {} : {}),
  }
}
