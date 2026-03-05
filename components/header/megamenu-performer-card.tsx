"use client"

import Link from "next/link"
import type { MegamenuPerformer } from "@/types/megamenu"

interface MegamenuPerformerCardProps {
  performer: MegamenuPerformer
}

function VerifiedBadge({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M14.0488 5.53954C14.464 5.44421 14.8939 5.62231 15.1201 5.98327L16.114 7.56981C16.1942 7.69788 16.3025 7.80609 16.4305 7.88633L18.0171 8.88028C18.378 9.10642 18.5561 9.53639 18.4608 9.95153L18.0418 11.7762C18.008 11.9235 18.008 12.0765 18.0418 12.2238L18.4608 14.0485C18.5561 14.4637 18.378 14.8936 18.0171 15.1198L16.4305 16.1137C16.3025 16.194 16.1942 16.3022 16.114 16.4302L15.1201 18.0168C14.8939 18.3777 14.464 18.5558 14.0488 18.4605L12.2241 18.0415C12.0768 18.0077 11.9238 18.0077 11.7765 18.0415L9.95181 18.4605C9.53667 18.5558 9.1067 18.3777 8.88057 18.0168L7.88661 16.4302C7.80638 16.3022 7.69816 16.194 7.57009 16.1137L5.98355 15.1198C5.62259 14.8936 5.44449 14.4637 5.53983 14.0485L5.95885 12.2238C5.99267 12.0766 5.99267 11.9235 5.95885 11.7762L5.53983 9.95153C5.44449 9.53639 5.62259 9.10642 5.98355 8.88028L7.57009 7.88633C7.69816 7.80609 7.80638 7.69788 7.88661 7.56981L8.88057 5.98327C9.1067 5.62231 9.53667 5.44421 9.95181 5.53954L11.7765 5.95856C11.9238 5.99239 12.0768 5.99239 12.2241 5.95856L14.0488 5.53954Z"
        stroke="var(--pc-verified-color, #00aaff)"
        strokeWidth="1.5"
      />
      <path
        d="M9.51538 12.5362L11.55 14.4846L14.4846 9.51538"
        stroke="var(--pc-verified-color, #00aaff)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
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
          <span className="text-white text-sm font-medium group-hover:text-white transition-colors inline-flex items-center gap-1">
            {performer.name}
            {performer.verified && <VerifiedBadge className="w-4 h-4 flex-shrink-0" />}
          </span>
          {(performer.videoCount !== undefined || performer.totalViews !== undefined) && (
            <div className="flex items-center gap-1.5 mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
              {performer.videoCount !== undefined && (
                <span>{performer.videoCount} {performer.videoCount === 1 ? "Vídeo" : "Vídeos"}</span>
              )}
              {performer.videoCount !== undefined && performer.totalViews !== undefined && (
                <span style={{ opacity: 0.6 }}>·</span>
              )}
              {performer.totalViews !== undefined && (
                <span>{formatViews(performer.totalViews)} Views</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
