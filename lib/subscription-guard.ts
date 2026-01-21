import { prisma } from "./prisma"

export type VideoQuality = "480p" | "720p" | "1080p" | "4k"

export type VideoAccessResult =
  | { hasAccess: true; maxQuality: VideoQuality }
  | { hasAccess: false; reason: VideoAccessDeniedReason; requiredPlanName?: string; availableAt?: Date }

export type VideoAccessDeniedReason =
  | "SUBSCRIPTION_EXPIRED"
  | "EXCLUSIVE_CONTENT"
  | "LIMITED_EDITION"
  | "PLAN_LEVEL_TOO_LOW"
  | "NOT_AUTHENTICATED"

interface SubscriptionPlan {
  id: string
  slug: string
  name: string
  level: number
  maxVideoQuality: string
  canComment: boolean
  canAccessForum: boolean
  canDownload: boolean
  canAccessLimitedEdition: boolean
  canAccessExclusive: boolean
  shopDiscount: number
  isFree: boolean
}

interface VideoForAccess {
  minTierPlanId: string | null
  minTierPlan: { level: number; name: string } | null
  isDiamondExclusive: boolean
  isLimitedEdition: boolean
  limitedAccessUntil: Date | null
}

interface UserForAccess {
  id: string
  subscriptionPlanId: string | null
  subscriptionPlan: SubscriptionPlan | null
  subscriptionEnd: Date | null
}

/**
 * Get default plan for visitors (no auth) - lowest level plan
 */
export async function getDefaultPlan(): Promise<SubscriptionPlan | null> {
  const plan = await prisma.subscriptionPlan.findFirst({
    where: { isActive: true, isDefault: true },
  })
  if (plan) {
    return {
      id: plan.id,
      slug: plan.slug,
      name: plan.name,
      level: plan.level,
      maxVideoQuality: plan.maxVideoQuality,
      canComment: plan.canComment,
      canAccessForum: plan.canAccessForum,
      canDownload: plan.canDownload,
      canAccessLimitedEdition: plan.canAccessLimitedEdition,
      canAccessExclusive: plan.canAccessExclusive,
      shopDiscount: plan.shopDiscount,
      isFree: plan.isFree,
    }
  }
  // Fallback: get lowest level plan
  const lowestPlan = await prisma.subscriptionPlan.findFirst({
    where: { isActive: true },
    orderBy: { level: "asc" },
  })
  if (!lowestPlan) return null
  return {
    id: lowestPlan.id,
    slug: lowestPlan.slug,
    name: lowestPlan.name,
    level: lowestPlan.level,
    maxVideoQuality: lowestPlan.maxVideoQuality,
    canComment: lowestPlan.canComment,
    canAccessForum: lowestPlan.canAccessForum,
    canDownload: lowestPlan.canDownload,
    canAccessLimitedEdition: lowestPlan.canAccessLimitedEdition,
    canAccessExclusive: lowestPlan.canAccessExclusive,
    shopDiscount: lowestPlan.shopDiscount,
    isFree: lowestPlan.isFree,
  }
}

/**
 * Verifica si la suscripción ha expirado
 */
export function isSubscriptionExpired(subscriptionEnd: Date | null): boolean {
  if (!subscriptionEnd) return false
  return subscriptionEnd < new Date()
}

/**
 * Degrada un usuario al plan por defecto cuando su suscripción expira
 */
export async function downgradeToDefault(userId: string): Promise<void> {
  const defaultPlan = await getDefaultPlan()
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionPlanId: defaultPlan?.id || null,
      subscriptionEnd: null,
    },
  })
}

/**
 * Compara niveles de planes
 */
export function isPlanLevelAtLeast(userPlanLevel: number, requiredLevel: number): boolean {
  return userPlanLevel >= requiredLevel
}

/**
 * Verifica si un usuario tiene acceso a un video específico
 */
export async function checkVideoAccess(
  user: UserForAccess | null,
  video: VideoForAccess
): Promise<VideoAccessResult> {
  const defaultPlan = await getDefaultPlan()

  // Sin autenticación = usar plan por defecto
  if (!user) {
    const userLevel = defaultPlan?.level ?? 0
    const requiredLevel = video.minTierPlan?.level ?? 0

    if (requiredLevel > userLevel) {
      return {
        hasAccess: false,
        reason: "PLAN_LEVEL_TOO_LOW",
        requiredPlanName: video.minTierPlan?.name,
      }
    }

    // Contenido exclusivo
    if (video.isDiamondExclusive) {
      return { hasAccess: false, reason: "EXCLUSIVE_CONTENT" }
    }

    // Edición limitada
    if (video.isLimitedEdition && video.limitedAccessUntil && video.limitedAccessUntil > new Date()) {
      return {
        hasAccess: false,
        reason: "LIMITED_EDITION",
        availableAt: video.limitedAccessUntil,
      }
    }

    return { hasAccess: true, maxQuality: (defaultPlan?.maxVideoQuality || "720p") as VideoQuality }
  }

  const userPlan = user.subscriptionPlan

  // Verificar expiración de suscripción
  if (isSubscriptionExpired(user.subscriptionEnd)) {
    await downgradeToDefault(user.id)
    // Recalcular con plan por defecto
    return checkVideoAccess(
      { ...user, subscriptionPlan: defaultPlan, subscriptionEnd: null },
      video
    )
  }

  const userLevel = userPlan?.level ?? defaultPlan?.level ?? 0
  const requiredLevel = video.minTierPlan?.level ?? 0

  // Contenido exclusivo (requiere el plan con canAccessExclusive)
  if (video.isDiamondExclusive && !userPlan?.canAccessExclusive) {
    return { hasAccess: false, reason: "EXCLUSIVE_CONTENT" }
  }

  // Edición limitada (requiere plan con canAccessLimitedEdition)
  if (video.isLimitedEdition && video.limitedAccessUntil && video.limitedAccessUntil > new Date()) {
    if (!userPlan?.canAccessLimitedEdition) {
      return {
        hasAccess: false,
        reason: "LIMITED_EDITION",
        availableAt: video.limitedAccessUntil,
      }
    }
  }

  // Verificar nivel mínimo
  if (requiredLevel > userLevel) {
    return {
      hasAccess: false,
      reason: "PLAN_LEVEL_TOO_LOW",
      requiredPlanName: video.minTierPlan?.name,
    }
  }

  // Acceso concedido
  const maxQuality = (userPlan?.maxVideoQuality || defaultPlan?.maxVideoQuality || "720p") as VideoQuality
  return { hasAccess: true, maxQuality }
}

/**
 * Verifica si un usuario puede comentar
 */
export function canUserComment(plan: SubscriptionPlan | null): boolean {
  return plan?.canComment ?? false
}

/**
 * Verifica si un usuario puede acceder al foro
 */
export function canUserAccessForum(plan: SubscriptionPlan | null): boolean {
  return plan?.canAccessForum ?? false
}

/**
 * Verifica si un usuario puede descargar videos
 */
export function canUserDownload(plan: SubscriptionPlan | null): boolean {
  return plan?.canDownload ?? false
}

/**
 * Obtiene el descuento en tienda para un plan
 */
export function getShopDiscount(plan: SubscriptionPlan | null): number {
  return plan?.shopDiscount ?? 0
}

/**
 * Calcula el precio con descuento de suscripción
 */
export function applySubscriptionDiscount(price: number, plan: SubscriptionPlan | null): number {
  const discount = getShopDiscount(plan)
  if (discount === 0) return price
  return price * (1 - discount / 100)
}

/**
 * Verifica acceso a una categoría del foro
 */
export async function canAccessForumCategory(
  userPlan: SubscriptionPlan | null,
  categoryMinPlanLevel: number
): Promise<boolean> {
  if (!canUserAccessForum(userPlan)) return false
  const userLevel = userPlan?.level ?? 0
  return userLevel >= categoryMinPlanLevel
}

/**
 * Obtiene la calidad máxima de video permitida para un plan
 */
export function getMaxVideoQuality(plan: SubscriptionPlan | null): VideoQuality {
  return (plan?.maxVideoQuality || "720p") as VideoQuality
}

/**
 * Verifica si un usuario puede ver un video en una calidad específica
 */
export function canWatchInQuality(
  plan: SubscriptionPlan | null,
  requestedQuality: VideoQuality,
  videoHasQuality: boolean
): boolean {
  if (!videoHasQuality) return false

  const maxQuality = getMaxVideoQuality(plan)
  const qualityOrder: VideoQuality[] = ["480p", "720p", "1080p", "4k"]

  const maxIndex = qualityOrder.indexOf(maxQuality)
  const requestedIndex = qualityOrder.indexOf(requestedQuality)

  return requestedIndex <= maxIndex
}

/**
 * Helper para obtener el plan de un usuario desde la DB
 */
export async function getUserPlan(userId: string): Promise<SubscriptionPlan | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { SubscriptionPlan: true },
  })
  if (!user?.SubscriptionPlan) return null
  const plan = user.SubscriptionPlan
  return {
    id: plan.id,
    slug: plan.slug,
    name: plan.name,
    level: plan.level,
    maxVideoQuality: plan.maxVideoQuality,
    canComment: plan.canComment,
    canAccessForum: plan.canAccessForum,
    canDownload: plan.canDownload,
    canAccessLimitedEdition: plan.canAccessLimitedEdition,
    canAccessExclusive: plan.canAccessExclusive,
    shopDiscount: plan.shopDiscount,
    isFree: plan.isFree,
  }
}
