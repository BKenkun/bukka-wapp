"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Lock } from "lucide-react"
import { useAuthModal } from "@/components/auth/auth-modal-provider"
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
  const { data: session } = useSession()
  const { openAuthModal } = useAuthModal()

  // Use config values with fallbacks
  const config = {
    title: lockConfig?.title ?? "Access Denied",
    description: lockMessage ?? lockConfig?.description ?? "This content requires a subscription",
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

  return (
    <div className="relative w-full aspect-video overflow-hidden bg-black">
      {/* Background image */}
      <img
        src={isLocked && config.backgroundImage ? config.backgroundImage : (thumbnailUrl || "/placeholder.svg?height=600&width=900")}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark overlay when locked */}
      {isLocked && (
        <div className="absolute inset-0 bg-black/60" />
      )}

      {/* Access Denied Overlay */}
      {isLocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="w-16 h-16 flex items-center justify-center" style={{ backgroundColor: "color-mix(in srgb, var(--brand-color) 20%, transparent)" }}>
            <Lock className="w-8 h-8" style={{ color: "var(--brand-color)" }} />
          </div>
          <div className="max-w-md space-y-4">
            <h2 className={`text-white ${config.titleFontSize} ${config.titleFontWeight}`}>
              {config.title}
            </h2>
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
      )}
    </div>
  )
}
