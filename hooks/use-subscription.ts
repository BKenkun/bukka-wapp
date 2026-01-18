"use client"

import { useSession } from "next-auth/react"
import { useCallback, useEffect, useState } from "react"

const TRAILER_LIMIT = 3
const TRAILERS_KEY = "bukka_trailers_viewed"

interface TrailerData {
  viewedIds: string[]
  lastReset: number
}

/**
 * Hook para gestionar las restricciones de suscripción
 */
export function useSubscription() {
  const { data: session, status } = useSession()
  const [viewedTrailers, setViewedTrailers] = useState<string[]>([])

  // Load trailer views from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const stored = localStorage.getItem(TRAILERS_KEY)
      if (stored) {
        const data: TrailerData = JSON.parse(stored)
        // Reset if older than 24 hours
        const dayInMs = 24 * 60 * 60 * 1000
        if (Date.now() - data.lastReset > dayInMs) {
          localStorage.removeItem(TRAILERS_KEY)
          setViewedTrailers([])
        } else {
          setViewedTrailers(data.viewedIds)
        }
      }
    } catch {
      // Invalid data, clear it
      localStorage.removeItem(TRAILERS_KEY)
    }
  }, [])

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
  const trackTrailerView = useCallback((videoId: string) => {
    if (!shouldLimitTrailers) return true // Premium+ users can view unlimited trailers

    if (viewedTrailers.includes(videoId)) return true // Already viewed

    if (viewedTrailers.length >= TRAILER_LIMIT) {
      return false // Limit reached
    }

    const newTrailers = [...viewedTrailers, videoId]
    setViewedTrailers(newTrailers)

    try {
      localStorage.setItem(
        TRAILERS_KEY,
        JSON.stringify({
          viewedIds: newTrailers,
          lastReset: Date.now(),
        } as TrailerData)
      )
    } catch {
      // localStorage might be full or disabled
    }

    return true
  }, [shouldLimitTrailers, viewedTrailers])

  /**
   * Check if user can view more trailers
   */
  const canViewTrailer = useCallback((videoId: string): boolean => {
    if (!shouldLimitTrailers) return true
    if (viewedTrailers.includes(videoId)) return true
    return viewedTrailers.length < TRAILER_LIMIT
  }, [shouldLimitTrailers, viewedTrailers])

  /**
   * Get remaining trailer views for limited users
   */
  const remainingTrailers = shouldLimitTrailers
    ? Math.max(0, TRAILER_LIMIT - viewedTrailers.length)
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
  const planName = plan?.name ?? (isAuthenticated ? "Gratuito" : "Visitante")

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
    trailerLimit: TRAILER_LIMIT,

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
