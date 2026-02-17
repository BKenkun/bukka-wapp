"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"

interface CtaBannerProps {
  title: string
  description: string
  buttonText: string
  buttonUrl?: string
  backgroundImage?: string
  videoUrl?: string
  titleFontFamily?: string
  titleFontSize?: number
  buttonBgColor?: string
  buttonHoverColor?: string
  buttonTextColor?: string
  buttonHoverTextColor?: string
  overlayEnabled?: boolean
  overlayOpacity?: number
  blurEnabled?: boolean
  blurIntensity?: number
}

export function CtaBanner({
  title,
  description,
  buttonText,
  buttonUrl,
  backgroundImage = "/red-lips-artistic.jpg",
  videoUrl,
  titleFontFamily,
  titleFontSize,
  buttonBgColor,
  buttonHoverColor,
  buttonTextColor,
  buttonHoverTextColor,
  overlayEnabled = true,
  overlayOpacity,
  blurEnabled = false,
  blurIntensity = 4,
}: CtaBannerProps) {
  const [isHovered, setIsHovered] = useState(false)

  const blurStyle = blurEnabled ? { filter: `blur(${blurIntensity}px)`, transform: "scale(1.1)" } : undefined

  const buttonStyle = {
    backgroundColor: isHovered
      ? (buttonHoverColor || buttonBgColor || "var(--brand-color)")
      : (buttonBgColor || "var(--brand-color)"),
    color: isHovered
      ? (buttonHoverTextColor || buttonTextColor || "#FFFFFF")
      : (buttonTextColor || "#FFFFFF"),
  }

  return (
    <div className="relative w-full h-[486px] flex items-center justify-center overflow-hidden">
      {/* Background Video or Image */}
      <div className="absolute inset-0 z-0">
        {videoUrl ? (
          <video
            src={videoUrl}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            style={blurStyle}
          />
        ) : (
          <Image
            src={backgroundImage || "/placeholder.svg"}
            alt="Background"
            fill
            className="object-cover"
            priority
            style={blurStyle}
          />
        )}
      </div>

      {/* Dark Overlay for readability */}
      {overlayEnabled && (
        <div
          className="absolute inset-0 z-[1]"
          style={{
            backgroundColor: overlayOpacity !== undefined
              ? `rgba(0,0,0,${overlayOpacity})`
              : `rgba(0,0,0,var(--cta-overlay-opacity))`,
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl px-4">
        <h2
          className="font-bold leading-[48px]"
          style={{
            color: "var(--cta-title-color)",
            fontSize: titleFontSize ? `${titleFontSize}px` : "var(--cta-title-size)",
            fontFamily: titleFontFamily || "var(--font-montserrat, Montserrat, sans-serif)",
          }}
        >
          &ldquo;{title}&rdquo;
        </h2>

        <p
          className="font-bold leading-[48px] font-montserrat mt-[29px]"
          style={{ color: "var(--cta-desc-color)", fontSize: "var(--cta-desc-size)" }}
        >
          {description}
        </p>

        {/* Button with optional link */}
        {buttonUrl ? (
          <Link
            href={buttonUrl}
            className="mt-8 uppercase px-8 py-3 font-semibold text-sm tracking-wider transition-colors"
            style={buttonStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {buttonText}
          </Link>
        ) : (
          <button
            className="mt-8 uppercase px-8 py-3 font-semibold text-sm tracking-wider transition-colors"
            style={buttonStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {buttonText}
          </button>
        )}
      </div>
    </div>
  )
}
