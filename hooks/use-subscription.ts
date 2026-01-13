"use client"

import { useSession } from "next-auth/react"
import { useCallback, useEffect, useState } from "react"

const VISITOR_TRAILER_LIMIT = 3
const VISITOR_TRAILERS_KEY = "bukka_visitor_trailers"

interface VisitorTrailerData {
  viewedIds: string[]
  lastReset: number
}

/**
 * Hook para gestionar las restricciones de suscripción
 */
export function useSubscription() {
  const { data: session, status } = useSession()
  const [visitorTrailers, setVisitorTrailers] = useState<string[]>([])

  // Load visitor trailers from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const stored = localStorage.getItem(VISITOR_TRAILERS_KEY)
      if (stored) {
        const data: VisitorTrailerData = JSON.parse(stored)
        // Reset if older than 24 hours
        const dayInMs = 24 * 60 * 60 * 1000
        if (Date.now() - data.lastReset > dayInMs) {
          localStorage.removeItem(VISITOR_TRAILERS_KEY)
          setVisitorTrailers([])
        } else {
          setVisitorTrailers(data.viewedIds)
        }
      }
    } catch {
      // Invalid data, clear it
      localStorage.removeItem(VISITOR_TRAILERS_KEY)
    }
  }, [])

  const isAuthenticated = status === "authenticated"
  const isLoading = status === "loading"
  const plan = session?.user?.SubscriptionPlan

  /**
   * Track a trailer view for visitors
   */
  const trackTrailerView = useCallback((videoId: string) => {
    if (isAuthenticated) return true // Authenticated users can view unlimited trailers

    if (visitorTrailers.includes(videoId)) return true // Already viewed

    if (visitorTrailers.length >= VISITOR_TRAILER_LIMIT) {
      return false // Limit reached
    }

    const newTrailers = [...visitorTrailers, videoId]
    setVisitorTrailers(newTrailers)

    try {
      localStorage.setItem(
        VISITOR_TRAILERS_KEY,
        JSON.stringify({
          viewedIds: newTrailers,
          lastReset: Date.now(),
        } as VisitorTrailerData)
      )
    } catch {
      // localStorage might be full or disabled
    }

    return true
  }, [isAuthenticated, visitorTrailers])

  /**
   * Check if visitor can view more trailers
   */
  const canViewTrailer = useCallback((videoId: string): boolean => {
    if (isAuthenticated) return true
    if (visitorTrailers.includes(videoId)) return true
    return visitorTrailers.length < VISITOR_TRAILER_LIMIT
  }, [isAuthenticated, visitorTrailers])

  /**
   * Get remaining trailer views for visitors
   */
  const remainingTrailers = isAuthenticated
    ? Infinity
    : Math.max(0, VISITOR_TRAILER_LIMIT - visitorTrailers.length)

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

    // Visitor trailer limits
    visitorTrailers,
    remainingTrailers,
    canViewTrailer,
    trackTrailerView,
    trailerLimit: VISITOR_TRAILER_LIMIT,

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
