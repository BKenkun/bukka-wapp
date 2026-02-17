"use client"

import Image from "next/image"
import Link from "next/link"

// Verified badge SVG component
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

interface ActressCardProps {
  name: string
  image: string
  slug?: string
  verified?: boolean
  viewMode?: "grid" | "list"
  videoCount?: number
  totalViews?: number
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

export function ActressCard({ name, image, slug, verified = false, viewMode = "grid", videoCount, totalViews }: ActressCardProps) {
  const href = slug ? `/modelos/${slug}` : `/modelos/${name.toLowerCase().replace(/\s+/g, "-")}`

  if (viewMode === "list") {
    return (
      <Link
        href={href}
        className="flex gap-4 bg-gray-900/30 rounded-lg overflow-hidden group cursor-pointer hover:bg-gray-900/50 transition-colors"
      >
        <div className="relative w-[300px] h-[200px] flex-shrink-0">
          <Image
            src={image || "/placeholder.svg"}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="300px"
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <span className="text-white font-montserrat font-bold text-lg tracking-wider">VER</span>
          </div>
        </div>
        <div className="flex flex-col justify-center py-4 pr-4 flex-1">
          <div className="flex items-center gap-2">
            <h3
              className="font-montserrat font-bold"
              style={{
                color: "var(--pc-name-color)",
                fontSize: "24px",
                lineHeight: "28px",
              }}
            >
              {name}
            </h3>
            {verified && <VerifiedBadge className="w-10 h-6 flex-shrink-0" />}
          </div>
          {(videoCount !== undefined || totalViews !== undefined) && (
            <div className="flex items-center gap-2 mt-1 text-sm font-montserrat" style={{ color: "var(--pc-stats-color)" }}>
              {videoCount !== undefined && (
                <span>{videoCount} {videoCount === 1 ? "Vídeo" : "Vídeos"}</span>
              )}
              {videoCount !== undefined && totalViews !== undefined && (
                <span className="text-white/40">·</span>
              )}
              {totalViews !== undefined && (
                <span>{formatViews(totalViews)} Visitas</span>
              )}
            </div>
          )}
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className="block relative h-[640px] overflow-hidden group cursor-pointer"
    >
      <Image
        src={image || "/placeholder.svg"}
        alt={name}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 20vw"
      />

      {/* Default gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

      {/* Hover overlay with "VER" */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
        <span className="text-white font-montserrat font-bold text-2xl tracking-wider">VER</span>
      </div>

      <div className="absolute bottom-6 left-5 z-10">
        <div className="flex items-center gap-2">
          <h3
            className="font-montserrat font-normal"
            style={{
              color: "var(--pc-name-color)",
              fontSize: "20px",
              lineHeight: "24px",
            }}
          >
            {name}
          </h3>
          {verified && <VerifiedBadge className="w-6 h-5 flex-shrink-0" />}
        </div>
        {(videoCount !== undefined || totalViews !== undefined) && (
          <div className="flex items-center gap-2 mt-1 text-sm font-montserrat" style={{ color: "var(--pc-stats-color)" }}>
            {videoCount !== undefined && (
              <span>{videoCount} {videoCount === 1 ? "Vídeo" : "Vídeos"}</span>
            )}
            {videoCount !== undefined && totalViews !== undefined && (
              <span className="text-white/40">·</span>
            )}
            {totalViews !== undefined && (
              <span>{formatViews(totalViews)} Visitas</span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
