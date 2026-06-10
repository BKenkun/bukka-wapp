"use client"

import { useState } from "react"
import Link from "next/link"
import type { MegamenuVideo } from "@/types/megamenu"

interface MegamenuVideoCardProps {
  video: MegamenuVideo
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "—"
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function MegamenuVideoCard({ video }: MegamenuVideoCardProps) {
  const [isHovering, setIsHovering] = useState(false)

  return (
    <Link
      href={`/videos/${video.slug}`}
      className="group block"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Thumbnail 16:9: las miniaturas de video son horizontales y en
          vertical se recortaban tanto que no se distinguía el video */}
      <div className="relative aspect-video overflow-hidden bg-zinc-900">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Duration badge (always visible; falls back to "—" if duration is missing) */}
        <span className="absolute bottom-2 right-2 bg-black/90 text-white text-xs font-medium px-1.5 py-0.5">
          {formatDuration(video.duration)}
        </span>

        {/* Hover overlay with play button */}
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200 ${isHovering ? 'opacity-100' : 'opacity-0'}`}>
          <div className="w-12 h-12 flex items-center justify-center" style={{ backgroundColor: "var(--brand-color)" }}>
            <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Video info — --text-primary: --vc-title-color es blanco (pensado
          para overlays oscuros) y se perdía sobre el fondo del megamenú */}
      <div className="mt-2">
        <h4 className="text-sm font-medium line-clamp-2 transition-colors leading-tight" style={{ color: "var(--text-primary)" }}>
          {video.title}
        </h4>
      </div>
    </Link>
  )
}
