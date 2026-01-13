"use client"

import Link from "next/link"
import { Eye, ThumbsUp, CheckCircle, MoreHorizontal, Lock } from "lucide-react"
import { useState, useRef } from "react"
import { useSubscription } from "@/hooks/use-subscription"

interface VideoCardProps {
  title: string
  subtitle: string
  views: string
  likes: string
  imageUrl: string
  previewUrl?: string
  previewStartTime?: number
  previewEndTime?: number
  isVerified?: boolean
  variant?: "overlay" | "below"
  slug?: string
  videoId?: string
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
}: VideoCardProps) {
  const [isHovering, setIsHovering] = useState(false)
  const [showTrailerLimit, setShowTrailerLimit] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { canViewTrailer, trackTrailerView, remainingTrailers, isAuthenticated } = useSubscription()

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

  // Trailer limit overlay component
  const TrailerLimitOverlay = () => (
    <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-10 p-4 text-center">
      <Lock className="w-12 h-12 text-[#FA4860] mb-3" />
      <h4 className="text-white font-bold text-lg mb-2">Límite de trailers alcanzado</h4>
      <p className="text-gray-400 text-sm mb-4">
        {isAuthenticated
          ? "Has visto el límite de trailers."
          : "Los visitantes pueden ver 3 trailers. Regístrate para ver más."}
      </p>
      <Link
        href={isAuthenticated ? "/suscripciones" : "/registro"}
        className="bg-[#FA4860] text-white px-6 py-2 text-sm font-medium hover:bg-[#FA4860]/80 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {isAuthenticated ? "Ver Suscripciones" : "Registrarse Gratis"}
      </Link>
    </div>
  )

  const CardContent = () => {
    if (variant === "below") {
      return (
        <div
          className="group cursor-pointer"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Video thumbnail / preview */}
          <div className="relative w-full aspect-[476/309] overflow-hidden rounded-sm mb-3 bg-black">
            {/* Trailer limit overlay */}
            {showTrailerLimit && <TrailerLimitOverlay />}

            {/* Thumbnail image */}
            <img
              src={imageUrl || "/placeholder.svg"}
              alt={title}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${
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
                loop={!previewEndTime}
                onTimeUpdate={previewEndTime ? handleTimeUpdate : undefined}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                  isHovering ? "opacity-100" : "opacity-0"
                }`}
              />
            )}
          </div>

          {/* Content below */}
          <div className="flex flex-col">
            {/* Title */}
            <h3 className="text-white font-bold text-lg leading-tight mb-1 line-clamp-1">{title}</h3>

            {/* Subtitle/Author */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-white/60 text-sm">{subtitle}</span>
              {isVerified && <CheckCircle className="w-4 h-4 text-white/60 flex-shrink-0" />}
            </div>

            {/* Stats & Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-white/60 text-sm">
                <div className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  <span>{views}</span>
                </div>
                <span className="text-white/40">•</span>
                <div className="flex items-center gap-1.5">
                  <ThumbsUp className="w-4 h-4" />
                  <span>{likes}</span>
                </div>
              </div>

              <button className="text-white/60 hover:text-white transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div
        className="relative group cursor-pointer overflow-hidden"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Video thumbnail / preview */}
        <div className="relative w-full aspect-[476/309] bg-black">
          {/* Trailer limit overlay */}
          {showTrailerLimit && <TrailerLimitOverlay />}

          {/* Thumbnail image */}
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={title}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
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
              loop={!previewEndTime}
              onTimeUpdate={previewEndTime ? handleTimeUpdate : undefined}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
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

            {/* Subtitle with verified badge */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-white/90 text-sm">{subtitle}</span>
              {isVerified && <CheckCircle className="w-4 h-4 text-white flex-shrink-0" />}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 text-white text-sm">
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                <span>{views}</span>
              </div>
              <span className="text-white/60">•</span>
              <div className="flex items-center gap-1.5">
                <ThumbsUp className="w-4 h-4" />
                <span>{likes}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Link href={`/videos/${slug}`}>
      <CardContent />
    </Link>
  )
}
