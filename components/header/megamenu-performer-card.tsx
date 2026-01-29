"use client"

import Link from "next/link"
import type { MegamenuPerformer } from "@/types/megamenu"

interface MegamenuPerformerCardProps {
  performer: MegamenuPerformer
}

function formatViews(views: number): string {
  if (views >= 1000000000) {
    return `${(views / 1000000000).toFixed(1)}B`
  }
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(0)}K`
  }
  return views.toString()
}

export function MegamenuPerformerCard({ performer }: MegamenuPerformerCardProps) {
  return (
    <Link
      href={`/modelos/${performer.slug}`}
      className="group block cursor-pointer"
    >
      {/* Vertical image container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-800">
        {performer.profileImage ? (
          <img
            src={performer.profileImage}
            alt={performer.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl font-bold text-zinc-500">
              {performer.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Default gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

        {/* Hover overlay with "VER" - same as home page */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="text-white font-montserrat font-bold text-xl tracking-wider">VER</span>
        </div>

        {/* Name at bottom */}
        <div className="absolute bottom-3 left-3 z-10">
          <span className="text-white text-sm font-medium group-hover:text-white transition-colors">
            {performer.name}
          </span>
          {(performer.videoCount !== undefined || performer.totalViews !== undefined) && (
            <div className="flex items-center gap-1.5 mt-0.5 text-white/60 text-xs">
              {performer.videoCount !== undefined && (
                <span>{performer.videoCount} {performer.videoCount === 1 ? "Vídeo" : "Vídeos"}</span>
              )}
              {performer.videoCount !== undefined && performer.totalViews !== undefined && (
                <span className="text-white/40">·</span>
              )}
              {performer.totalViews !== undefined && (
                <span>{formatViews(performer.totalViews)} Visitas</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
