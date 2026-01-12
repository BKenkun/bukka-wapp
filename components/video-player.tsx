"use client"

import Link from "next/link"

interface VideoPlayerProps {
  thumbnailUrl: string
  title: string
  isLocked?: boolean
  lockMessage?: string
  requiredTier?: string
}

export function VideoPlayer({
  thumbnailUrl,
  title,
  isLocked = false,
  lockMessage = "Este contenido requiere una suscripción",
  requiredTier,
}: VideoPlayerProps) {
  return (
    <div className="relative w-full aspect-video overflow-hidden bg-black">
      {/* Blurred background image */}
      <img
        src={thumbnailUrl || "/placeholder.svg?height=600&width=900"}
        alt={title}
        className={`w-full h-full object-cover ${isLocked ? "blur-md opacity-50" : ""}`}
      />

      {/* Access Denied Overlay */}
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/90 flex flex-col items-center gap-4 p-8 max-w-md mx-4">
            <h2 className="text-white text-center uppercase text-xl font-semibold">
              Acceso Denegado
            </h2>
            <p className="text-white/80 text-center text-sm">
              {lockMessage}
            </p>
            {requiredTier && (
              <p className="text-[#FA4860] text-center text-sm font-medium">
                Requiere: {requiredTier}
              </p>
            )}
            <Link
              href="/suscripcion"
              className="bg-[#FA4860] hover:bg-[#e03d53] text-white uppercase font-semibold px-8 py-3 transition-colors"
            >
              Ver Planes
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
