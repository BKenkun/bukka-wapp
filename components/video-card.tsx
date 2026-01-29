"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, Lock } from "lucide-react"
import { useState, useRef } from "react"
import { useSubscription } from "@/hooks/use-subscription"

// Play icon SVG component
function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

interface Performer {
  name: string
  slug: string
}

interface VideoCardProps {
  title: string
  subtitle?: string
  views: string
  likes?: string
  imageUrl: string
  previewUrl?: string
  previewStartTime?: number
  previewEndTime?: number
  isVerified?: boolean
  variant?: "overlay" | "below"
  slug?: string
  videoId?: string
  category?: string
  performers?: Performer[]
}

export function VideoCard({
  title,
  subtitle,
  views,
  likes,
  imageUrl,
  previewUrl,
  previewStartTime = 0,
  previewEndTime,
  isVerified = true,
  variant = "overlay",
  slug = "video-ejemplo",
  videoId,
  category,
  performers = [],
}: VideoCardProps) {
  const router = useRouter()
  const [isHovering, setIsHovering] = useState(false)
  const [showTrailerLimit, setShowTrailerLimit] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { canViewTrailer, trackTrailerView, isAuthenticated } = useSubscription()

  const effectiveVideoId = videoId || slug

  const handleMouseEnter = () => {
    // Check if visitor can view more trailers
    if (!canViewTrailer(effectiveVideoId)) {
      setShowTrailerLimit(true)
      return
    }

    // Small delay before starting preview to avoid accidental triggers
    hoverTimeoutRef.current = setTimeout(() => {
      // Track the trailer view when it starts
      const canView = trackTrailerView(effectiveVideoId)
      if (!canView) {
        setShowTrailerLimit(true)
        return
      }

      setIsHovering(true)
      if (videoRef.current && previewUrl) {
        videoRef.current.currentTime = previewStartTime
        videoRef.current.play().catch(() => {
          // Autoplay might be blocked, ignore error
        })
      }
    }, 300)
  }

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    setIsHovering(false)
    setShowTrailerLimit(false)
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = previewStartTime
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current && previewEndTime && videoRef.current.currentTime >= previewEndTime) {
      videoRef.current.currentTime = previewStartTime
    }
  }

  const handleCardClick = () => {
    router.push(`/videos/${slug}`)
  }

  const handlePerformerClick = (e: React.MouseEvent, performerSlug: string) => {
    e.stopPropagation()
    router.push(`/modelos/${performerSlug}`)
  }

  // Trailer limit overlay component
  const TrailerLimitOverlay = () => (
    <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20 p-4 text-center">
      <Lock className="w-12 h-12 text-[#FA4860] mb-3" />
      <h4 className="text-white font-bold text-lg mb-2">Límite de trailers alcanzado</h4>
      <p className="text-gray-400 text-sm mb-4">
        {isAuthenticated
          ? "Has alcanzado tu límite diario de trailers. Mejora tu plan para ver más."
          : "Los visitantes pueden ver 3 trailers. Regístrate para ver más."}
      </p>
      <Link
        href={isAuthenticated ? "/suscripciones" : "/registro"}
        className="bg-[#FA4860] text-white px-6 py-2 text-sm font-medium hover:bg-[#FA4860]/80 transition-colors"
      >
        {isAuthenticated ? "Ver Suscripciones" : "Registrarse Gratis"}
      </Link>
    </div>
  )

  // Render performers as clickable spans (not links to avoid nesting)
  const PerformersLinks = () => {
    if (performers.length === 0) return null
    return (
      <span className="text-white text-xs font-medium drop-shadow-lg uppercase flex flex-wrap gap-1">
        {performers.map((performer, index) => (
          <span key={performer.slug} className="flex items-center">
            <span
              onClick={(e) => handlePerformerClick(e, performer.slug)}
              className="hover:text-[#FA4860] transition-colors cursor-pointer"
            >
              {performer.name}
            </span>
            {index < performers.length - 1 && <span className="mx-1">&</span>}
          </span>
        ))}
      </span>
    )
  }

  if (variant === "below") {
    return (
      <div
        className="group cursor-pointer"
        onClick={handleCardClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Video thumbnail / preview */}
        <div className="relative w-full aspect-[476/309] overflow-hidden rounded-sm mb-3 bg-black">
          {/* Trailer limit overlay */}
          {showTrailerLimit && <TrailerLimitOverlay />}

          {/* Play icon - center */}
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className={`bg-black/50 rounded-full p-3 transition-transform duration-300 ${isHovering ? "scale-110" : ""}`}>
              <PlayIcon className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Category and performers overlay - top left, only on hover */}
          {(category || performers.length > 0) && (
            <div
              className={`absolute top-2 left-2 z-10 flex flex-col gap-1 max-w-[80%] transition-opacity duration-300 ${
                isHovering ? "opacity-100" : "opacity-0"
              }`}
            >
              {category && (
                <span className="text-white text-sm font-bold drop-shadow-lg uppercase">
                  {category}
                </span>
              )}
              <PerformersLinks />
            </div>
          )}

          {/* Thumbnail image */}
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={title}
            className={`absolute inset-0 w-full h-full object-cover object-left transition-all duration-300 ${
              isHovering && previewUrl ? "opacity-0" : "opacity-100 group-hover:scale-105"
            }`}
          />

          {/* Preview video */}
          {previewUrl && (
            <video
              ref={videoRef}
              src={previewUrl}
              muted
              playsInline
              preload="auto"
              loop={!previewEndTime}
              onTimeUpdate={previewEndTime ? handleTimeUpdate : undefined}
              className={`absolute inset-0 w-full h-full object-cover object-left transition-opacity duration-300 ${
                isHovering ? "opacity-100" : "opacity-0"
              }`}
            />
          )}
        </div>

        {/* Content below */}
        <div className="flex flex-col">
          {/* Title */}
          <h3 className="text-white font-bold text-lg leading-tight mb-1 line-clamp-1">{title}</h3>

          {/* Views */}
          <div className="flex items-center gap-1.5 text-white/60 text-sm">
            <Eye className="w-4 h-4" />
            <span>{views}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative group cursor-pointer overflow-hidden"
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Video thumbnail / preview */}
      <div className="relative w-full aspect-[476/309] bg-black">
        {/* Trailer limit overlay */}
        {showTrailerLimit && <TrailerLimitOverlay />}

        {/* Play icon - center */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className={`bg-black/50 rounded-full p-3 transition-transform duration-300 ${isHovering ? "scale-110" : ""}`}>
            <PlayIcon className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Category and performers overlay - top left, only on hover */}
        {(category || performers.length > 0) && (
          <div
            className={`absolute top-2 left-2 z-10 flex flex-col gap-1 max-w-[80%] transition-opacity duration-300 ${
              isHovering ? "opacity-100" : "opacity-0"
            }`}
          >
            {category && (
              <span className="text-white text-sm font-bold drop-shadow-lg uppercase">
                {category}
              </span>
            )}
            <PerformersLinks />
          </div>
        )}

        {/* Thumbnail image */}
        <img
          src={imageUrl || "/placeholder.svg"}
          alt={title}
          className={`absolute inset-0 w-full h-full object-cover object-left transition-opacity duration-300 ${
            isHovering && previewUrl ? "opacity-0" : "opacity-100"
          }`}
        />

        {/* Preview video */}
        {previewUrl && (
          <video
            ref={videoRef}
            src={previewUrl}
            muted
            playsInline
            preload="auto"
            loop={!previewEndTime}
            onTimeUpdate={previewEndTime ? handleTimeUpdate : undefined}
            className={`absolute inset-0 w-full h-full object-cover object-left transition-opacity duration-300 ${
              isHovering ? "opacity-100" : "opacity-0"
            }`}
          />
        )}

        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Content overlay */}
        <div className="absolute inset-0 p-4 flex flex-col justify-end">
          {/* Title */}
          <h3 className="text-white font-bold text-lg leading-tight mb-2">{title}</h3>

          {/* Views */}
          <div className="flex items-center gap-1.5 text-white text-sm">
            <Eye className="w-4 h-4" />
            <span>{views}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
