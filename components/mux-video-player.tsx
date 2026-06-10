"use client"

import MuxPlayer from "@mux/mux-player-react"
import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Loader2, Lock, AlertCircle } from "lucide-react"
import { useAuthModal } from "@/components/auth/auth-modal-provider"
import type { VideoAccessLockConfig } from "@/lib/get-video-access-settings"

interface Subtitle {
  language: string
  label: string
  src: string
}

interface MuxVideoPlayerProps {
  videoId: string
  videoSlug: string
  playbackId: string
  title: string
  thumbnailUrl?: string
  subtitles?: Subtitle[]
  onProgress?: (seconds: number) => void
  onEnded?: () => void
  autoPlay?: boolean
  muted?: boolean
  loop?: boolean
  startTime?: number
  previewMode?: boolean
  previewDuration?: number
  locked?: boolean
  lockedMessage?: string
  requiredTier?: string
  viewerId?: string
  lockConfig?: VideoAccessLockConfig
}

interface PlaybackTokenResponse {
  token: string
  error?: string
}

export function MuxVideoPlayer({
  videoId,
  videoSlug,
  playbackId,
  title,
  thumbnailUrl,
  subtitles,
  onProgress,
  onEnded,
  autoPlay = false,
  muted = false,
  loop = false,
  startTime,
  previewMode = false,
  previewDuration = 30,
  locked = false,
  lockedMessage,
  requiredTier,
  viewerId,
  lockConfig,
}: MuxVideoPlayerProps) {
  const [isHovering, setIsHovering] = useState(false)
  const { data: session } = useSession()
  const { openAuthModal } = useAuthModal()

  // Use config values with fallbacks
  const config = {
    title: lockConfig?.title ?? "Access Denied",
    description: lockedMessage ?? lockConfig?.description ?? "This content requires a subscription",
    buttonText: lockConfig?.buttonText ?? "View Plans",
    buttonUrl: lockConfig?.buttonUrl ?? "/suscripciones",
    backgroundImage: lockConfig?.backgroundImage ?? null,
    overlaySize: lockConfig?.overlaySize ?? "normal",
    showTierBadge: lockConfig?.showTierBadge ?? true,
    // Title styling
    titleFontSize: lockConfig?.titleFontSize ?? "text-xl",
    titleFontWeight: lockConfig?.titleFontWeight ?? "font-bold",
    // Description styling
    descriptionFontSize: lockConfig?.descriptionFontSize ?? "text-base",
    descriptionFontWeight: lockConfig?.descriptionFontWeight ?? "font-normal",
    // Button styling
    buttonBgColor: lockConfig?.buttonBgColor ?? "#FA4860",
    buttonHoverBgColor: lockConfig?.buttonHoverBgColor ?? "#e03d53",
    buttonTextColor: lockConfig?.buttonTextColor ?? "#FFFFFF",
    buttonBorderRadius: lockConfig?.buttonBorderRadius ?? "rounded-none",
    buttonPaddingX: lockConfig?.buttonPaddingX ?? "px-6",
    buttonPaddingY: lockConfig?.buttonPaddingY ?? "py-3",
    // Tier badge — por defecto toma los colores definidos en Settings → Diseño → Videos
    tierBadgeTextColor: lockConfig?.tierBadgeTextColor ?? "var(--access-denied-text-color)",
    tierBadgeAccentColor: lockConfig?.tierBadgeAccentColor ?? "var(--access-denied-accent-color)",
  }
  const [playbackToken, setPlaybackToken] = useState<string>()
  const [thumbnailToken, setThumbnailToken] = useState<string>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  // Fetch playback tokens from server
  useEffect(() => {
    async function fetchTokens() {
      try {
        setLoading(true)
        setError(undefined)

        const response = await fetch(`/api/videos/${videoSlug}/stream`)
        const data: PlaybackTokenResponse = await response.json()

        if (!response.ok || data.error) {
          throw new Error(data.error || "Failed to get playback token")
        }

        setPlaybackToken(data.token)

        // Fetch thumbnail token
        const thumbResponse = await fetch(`/api/videos/${videoSlug}/thumbnail-token`)
        if (thumbResponse.ok) {
          const thumbData = await thumbResponse.json()
          setThumbnailToken(thumbData.token)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading video")
      } finally {
        setLoading(false)
      }
    }

    if (!locked && playbackId) {
      fetchTokens()
    } else {
      setLoading(false)
    }
  }, [videoSlug, playbackId, locked])

  // Handle time update for progress tracking
  const handleTimeUpdate = useCallback(
    (event: Event) => {
      const target = event.target as HTMLVideoElement
      if (onProgress) {
        onProgress(target.currentTime)
      }

      // Preview mode: stop at preview duration
      if (previewMode && target.currentTime >= previewDuration) {
        target.pause()
        target.currentTime = 0
      }
    },
    [onProgress, previewMode, previewDuration]
  )

  // Loading state
  if (loading) {
    return (
      <div className="relative aspect-video bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin" style={{ color: "var(--brand-color)" }} />
      </div>
    )
  }

  // Locked state
  if (locked) {
    const bgImage = config.backgroundImage || thumbnailUrl
    return (
      <div className="relative aspect-video bg-black overflow-hidden">
        {bgImage && (
          <>
            <img
              src={bgImage}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60" />
          </>
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center z-10">
          <div className="w-16 h-16 flex items-center justify-center" style={{ backgroundColor: "color-mix(in srgb, var(--brand-color) 20%, transparent)" }}>
            <Lock className="w-8 h-8" style={{ color: "var(--brand-color)" }} />
          </div>
          <div className="max-w-md space-y-4">
            <h3 className={`text-white ${config.titleFontSize} ${config.titleFontWeight}`}>
              {config.title}
            </h3>
            <p className={`text-white/80 ${config.descriptionFontSize} ${config.descriptionFontWeight}`}>
              {config.description}
            </p>
            {config.showTierBadge && requiredTier && (
              <p className="text-sm" style={{ color: config.tierBadgeTextColor }}>
                Requires a{" "}
                <span className="font-semibold" style={{ color: config.tierBadgeAccentColor }}>{requiredTier}</span>{" "}
                subscription or higher
              </p>
            )}
            {session?.user ? (
              <a
                href={config.buttonUrl}
                className={`inline-block mt-4 font-semibold transition-colors cursor-pointer ${config.buttonPaddingX} ${config.buttonPaddingY} ${config.buttonBorderRadius}`}
                style={{
                  backgroundColor: isHovering ? config.buttonHoverBgColor : config.buttonBgColor,
                  color: config.buttonTextColor,
                }}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
                {config.buttonText}
              </a>
            ) : (
              // Visitante sin cuenta: primero registro, después elegir plan
              <button
                type="button"
                onClick={() => openAuthModal({ view: "register", callbackUrl: config.buttonUrl })}
                className={`inline-block mt-4 font-semibold transition-colors cursor-pointer ${config.buttonPaddingX} ${config.buttonPaddingY} ${config.buttonBorderRadius}`}
                style={{
                  backgroundColor: isHovering ? config.buttonHoverBgColor : config.buttonBgColor,
                  color: config.buttonTextColor,
                }}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
                {config.buttonText}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="relative aspect-video bg-black flex flex-col items-center justify-center gap-4 p-6">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-white text-center">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 font-medium transition-colors"
          style={{ backgroundColor: "var(--brand-color)", color: "var(--text-primary)" }}
        >
          Reintentar
        </button>
      </div>
    )
  }

  // No token available
  if (!playbackToken) {
    return (
      <div className="relative aspect-video bg-black flex items-center justify-center">
        <p style={{ color: "var(--text-muted)" }}>Video no disponible</p>
      </div>
    )
  }

  return (
    <div className="relative aspect-video bg-black overflow-hidden">
      <style jsx global>{`
        mux-player::part(poster) {
          object-fit: cover !important;
        }
        mux-player::part(poster-layer) {
          background-size: cover !important;
          background-position: center !important;
        }
      `}</style>
      <MuxPlayer
        playbackId={playbackId}
        tokens={{ playback: playbackToken, thumbnail: thumbnailToken }}
        envKey={process.env.NEXT_PUBLIC_MUX_DATA_ENV_KEY}
        metadata={{
          video_id: videoId,
          video_title: title,
          viewer_user_id: viewerId,
        }}
        poster={thumbnailUrl}
        primaryColor="#FA4860"
        secondaryColor="#000000"
        accentColor="#FA4860"
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        startTime={startTime}
        onTimeUpdate={handleTimeUpdate}
        onEnded={onEnded}
        streamType="on-demand"
        style={{ width: "100%", height: "100%", ["--poster-object-fit" as string]: "cover" }}
      >
        {subtitles?.map((sub) => (
          <track
            key={sub.language}
            kind="subtitles"
            srcLang={sub.language}
            label={sub.label}
            src={sub.src}
          />
        ))}
      </MuxPlayer>

      {previewMode && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <p className="text-white text-sm text-center">
            Vista previa - {previewDuration} segundos
          </p>
        </div>
      )}
    </div>
  )
}

// Componente simplificado para thumbnails
export function MuxThumbnail({
  playbackId,
  alt,
  className,
  time = 0,
}: {
  playbackId: string
  alt: string
  className?: string
  time?: number
}) {
  const thumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg?time=${time}`

  return (
    <img
      src={thumbnailUrl}
      alt={alt}
      className={className}
      loading="lazy"
    />
  )
}

// Componente para GIF animado de preview
export function MuxAnimatedPreview({
  playbackId,
  alt,
  className,
  start = 0,
  end = 5,
}: {
  playbackId: string
  alt: string
  className?: string
  start?: number
  end?: number
}) {
  const gifUrl = `https://image.mux.com/${playbackId}/animated.gif?start=${start}&end=${end}`

  return (
    <img
      src={gifUrl}
      alt={alt}
      className={className}
      loading="lazy"
    />
  )
}
