"use client"

import MuxPlayer from "@mux/mux-player-react"
import { useEffect, useState, useCallback } from "react"
import { Loader2, Lock, AlertCircle } from "lucide-react"

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
  lockedMessage = "Este contenido requiere una suscripción",
  requiredTier,
  viewerId,
}: MuxVideoPlayerProps) {
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
        <Loader2 className="w-12 h-12 text-[#FA4860] animate-spin" />
      </div>
    )
  }

  // Locked state
  if (locked) {
    return (
      <div className="relative aspect-video bg-black">
        {thumbnailUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${thumbnailUrl})` }}
          />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-[#FA4860]/20 flex items-center justify-center">
            <Lock className="w-8 h-8 text-[#FA4860]" />
          </div>
          <h3 className="text-xl font-bold text-white">{lockedMessage}</h3>
          {requiredTier && (
            <p className="text-gray-400">
              Requiere suscripción <span className="text-[#FA4860] font-semibold">{requiredTier}</span> o superior
            </p>
          )}
          <a
            href="/suscripcion"
            className="mt-4 px-6 py-3 bg-[#FA4860] text-white font-bold uppercase hover:bg-[#FA4860]/90 transition-colors"
          >
            Ver Planes
          </a>
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
          className="px-4 py-2 bg-[#FA4860] text-white font-medium hover:bg-[#FA4860]/90 transition-colors"
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
        <p className="text-gray-400">Video no disponible</p>
      </div>
    )
  }

  return (
    <div className="relative aspect-video bg-black">
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
        style={{ width: "100%", height: "100%" }}
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
