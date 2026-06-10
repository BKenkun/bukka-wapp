"use client"

import { useSession } from "next-auth/react"
import { useCallback } from "react"
import { useTrailerViews } from "@/components/subscription-provider"

/**
 * Hook para gestionar las restricciones de suscripción
 */
export function useSubscription() {
  const { data: session, status } = useSession()
  const {
    viewedTrailers,
    trailerLimit,
    trackTrailerView: trackTrailerViewCtx,
    canViewTrailer: canViewTrailerCtx,
  } = useTrailerViews()

  const isAuthenticated = status === "authenticated"
  const isLoading = status === "loading"
  const plan = session?.user?.SubscriptionPlan

  /**
   * Check if user should have limited trailers
   * Visitante (L0) and Free (L1) have the 3 trailer limit
   * Premium+ (L2+) have unlimited trailers
   */
  const shouldLimitTrailers = !isAuthenticated || (plan?.level ?? 0) <= 1

  /**
   * Track a trailer view for limited users (Visitante/Free)
   */
  const trackTrailerView = useCallback(
    (videoId: string) => trackTrailerViewCtx(videoId, shouldLimitTrailers),
    [trackTrailerViewCtx, shouldLimitTrailers],
  )

  /**
   * Check if user can view more trailers
   */
  const canViewTrailer = useCallback(
    (videoId: string): boolean => canViewTrailerCtx(videoId, shouldLimitTrailers),
    [canViewTrailerCtx, shouldLimitTrailers],
  )

  /**
   * Get remaining trailer views for limited users
   */
  const remainingTrailers = shouldLimitTrailers
    ? Math.max(0, trailerLimit - viewedTrailers.length)
    : Infinity

  /**
   * Check if user can comment
   */
  const canComment = plan?.canComment ?? false

  /**
   * Check if user can access forum
   */
  const canAccessForum = plan?.canAccessForum ?? false

  /**
   * Check if user can download videos
   */
  const canDownload = plan?.canDownload ?? false

  /**
   * Check if user can access exclusive content
   */
  const canAccessExclusive = plan?.canAccessExclusive ?? false

  /**
   * Check if user can access limited edition / early access content
   */
  const canAccessLimitedEdition = plan?.canAccessLimitedEdition ?? false

  /**
   * Get the maximum video quality for the user
   */
  const maxVideoQuality = plan?.maxVideoQuality ?? "720p"

  /**
   * Get shop discount percentage
   */
  const shopDiscount = plan?.shopDiscount ?? 0

  /**
   * Get plan level (higher = more access)
   */
  const planLevel = plan?.level ?? 0

  /**
   * Get plan name for display
   */
  const planName = plan?.name ?? (isAuthenticated ? "Free" : "Visitor")

  /**
   * Get plan slug
   */
  const planSlug = plan?.slug ?? "visitor"

  /**
   * Check if a specific video quality is available
   */
  const canWatchInQuality = useCallback((quality: "480p" | "720p" | "1080p" | "4k"): boolean => {
    const qualityOrder = ["480p", "720p", "1080p", "4k"]
    const maxIndex = qualityOrder.indexOf(maxVideoQuality)
    const requestedIndex = qualityOrder.indexOf(quality)
    return requestedIndex <= maxIndex
  }, [maxVideoQuality])

  /**
   * Apply shop discount to a price
   */
  const applyDiscount = useCallback((price: number): number => {
    if (shopDiscount === 0) return price
    return price * (1 - shopDiscount / 100)
  }, [shopDiscount])

  return {
    // Session info
    isAuthenticated,
    isLoading,
    plan,
    planName,
    planSlug,
    planLevel,

    // Trailer limits (applies to Visitante and Free users)
    viewedTrailers,
    remainingTrailers,
    canViewTrailer,
    trackTrailerView,
    shouldLimitTrailers,
    trailerLimit,

    // Plan capabilities
    canComment,
    canAccessForum,
    canDownload,
    canAccessExclusive,
    canAccessLimitedEdition,

    // Quality
    maxVideoQuality,
    canWatchInQuality,

    // Shop
    shopDiscount,
    applyDiscount,
  }
}

export type UseSubscriptionReturn = ReturnType<typeof useSubscription>
