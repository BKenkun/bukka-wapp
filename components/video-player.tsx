"use client"

import { useState } from "react"
import Link from "next/link"
import { Lock } from "lucide-react"
import type { VideoAccessLockConfig } from "@/lib/get-video-access-settings"

interface VideoPlayerProps {
  thumbnailUrl: string
  title: string
  isLocked?: boolean
  lockMessage?: string
  requiredTier?: string
  lockConfig?: VideoAccessLockConfig
}

export function VideoPlayer({
  thumbnailUrl,
  title,
  isLocked = false,
  lockMessage,
  requiredTier,
  lockConfig,
}: VideoPlayerProps) {
  const [isHovering, setIsHovering] = useState(false)

  // Use config values with fallbacks
  const config = {
    title: lockConfig?.title ?? "Acceso Denegado",
    description: lockMessage ?? lockConfig?.description ?? "Este contenido requiere una suscripción",
    buttonText: lockConfig?.buttonText ?? "Ver Planes",
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
  }

  return (
    <div className="relative w-full aspect-video overflow-hidden bg-black">
      {/* Background image */}
      {isLocked && config.backgroundImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${config.backgroundImage})` }}
        />
      ) : (
        <img
          src={thumbnailUrl || "/placeholder.svg?height=600&width=900"}
          alt={title}
          className={`w-full h-full object-cover ${isLocked ? "opacity-30" : ""}`}
        />
      )}

      {/* Access Denied Overlay */}
      {isLocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-[#FA4860]/20 flex items-center justify-center">
            <Lock className="w-8 h-8 text-[#FA4860]" />
          </div>
          <div className="max-w-md space-y-4">
            <h2 className={`text-white ${config.titleFontSize} ${config.titleFontWeight}`}>
              {config.title}
            </h2>
            <p className={`text-white/80 ${config.descriptionFontSize} ${config.descriptionFontWeight}`}>
              {config.description}
            </p>
            {config.showTierBadge && requiredTier && (
              <p className="text-gray-400 text-sm">
                Requiere suscripción{" "}
                <span className="text-[#FA4860] font-semibold">{requiredTier}</span> o
                superior
              </p>
            )}
            <Link
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
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
