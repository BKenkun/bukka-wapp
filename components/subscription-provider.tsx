"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"

const TRAILER_LIMIT = 3
const TRAILERS_KEY = "bukka_trailers_viewed"
const DAY_MS = 24 * 60 * 60 * 1000

interface TrailerData {
  viewedIds: string[]
  lastReset: number
}

interface TrailerViewsContextValue {
  viewedTrailers: string[]
  trailerLimit: number
  trackTrailerView: (videoId: string, shouldLimit: boolean) => boolean
  canViewTrailer: (videoId: string, shouldLimit: boolean) => boolean
}

const TrailerViewsContext = createContext<TrailerViewsContextValue | null>(null)

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [viewedTrailers, setViewedTrailers] = useState<string[]>([])
  const [windowStart, setWindowStart] = useState<number | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = localStorage.getItem(TRAILERS_KEY)
      if (!stored) return
      const data: TrailerData = JSON.parse(stored)
      if (Date.now() - data.lastReset > DAY_MS) {
        localStorage.removeItem(TRAILERS_KEY)
        setViewedTrailers([])
        setWindowStart(null)
      } else {
        setViewedTrailers(data.viewedIds)
        setWindowStart(data.lastReset)
      }
    } catch {
      localStorage.removeItem(TRAILERS_KEY)
    }
  }, [])

  const trackTrailerView = useCallback(
    (videoId: string, shouldLimit: boolean) => {
      if (!shouldLimit) return true
      if (viewedTrailers.includes(videoId)) return true
      if (viewedTrailers.length >= TRAILER_LIMIT) return false

      const next = [...viewedTrailers, videoId]
      // La ventana se ancla a la PRIMERA vista del lote y no se desliza con cada nuevo trailer
      const lastReset = windowStart ?? Date.now()
      setViewedTrailers(next)
      if (windowStart === null) setWindowStart(lastReset)
      try {
        localStorage.setItem(
          TRAILERS_KEY,
          JSON.stringify({ viewedIds: next, lastReset } satisfies TrailerData),
        )
      } catch {
        // localStorage lleno o deshabilitado: seguimos con el estado en memoria
      }
      return true
    },
    [viewedTrailers, windowStart],
  )

  const canViewTrailer = useCallback(
    (videoId: string, shouldLimit: boolean) => {
      if (!shouldLimit) return true
      if (viewedTrailers.includes(videoId)) return true
      return viewedTrailers.length < TRAILER_LIMIT
    },
    [viewedTrailers],
  )

  return (
    <TrailerViewsContext.Provider
      value={{ viewedTrailers, trailerLimit: TRAILER_LIMIT, trackTrailerView, canViewTrailer }}
    >
      {children}
    </TrailerViewsContext.Provider>
  )
}

export function useTrailerViews() {
  const ctx = useContext(TrailerViewsContext)
  if (!ctx) {
    throw new Error("useTrailerViews debe usarse dentro de <SubscriptionProvider>")
  }
  return ctx
}
