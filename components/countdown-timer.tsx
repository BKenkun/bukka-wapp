"use client"

import { useEffect, useState } from "react"

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

type ContentPosition = "top-left" | "top-center" | "top-right" | "center-left" | "center" | "center-right" | "bottom-left" | "bottom-center" | "bottom-right"

interface CountdownTimerProps {
  targetDate?: string
  title?: string
  subtitle?: string
  backgroundImage?: string
  videoUrl?: string
  height?: number
  contentPosition?: ContentPosition
  overlayEnabled?: boolean
  overlayOpacity?: number
  blurEnabled?: boolean
  blurIntensity?: number
  titleFontFamily?: string
  titleFontSize?: number
}

export function CountdownTimer({
  targetDate: targetDateProp = "2025-10-24",
  title = "Countdown to next release",
  subtitle = "",
  backgroundImage = "/images/background.png",
  videoUrl,
  height = 500,
  contentPosition = "center",
  overlayEnabled = true,
  overlayOpacity = 0.6,
  blurEnabled = false,
  blurIntensity = 4,
  titleFontFamily,
  titleFontSize,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const targetDate = new Date(`${targetDateProp}T00:00:00`)

    const calculateTimeLeft = () => {
      const difference = +targetDate - +new Date()
      if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      }
    }

    setTimeLeft(calculateTimeLeft())
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000)
    return () => clearInterval(timer)
  }, [targetDateProp])

  const formatNumber = (num: number) => num.toString().padStart(2, "0")

  const blurStyle = blurEnabled ? { filter: `blur(${blurIntensity}px)`, transform: "scale(1.1)" } : undefined

  const positionMap: Record<ContentPosition, { items: string; justify: string; text: string }> = {
    "top-left":      { items: "items-start", justify: "justify-start", text: "text-left" },
    "top-center":    { items: "items-start", justify: "justify-center", text: "text-center" },
    "top-right":     { items: "items-start", justify: "justify-end", text: "text-right" },
    "center-left":   { items: "items-center", justify: "justify-start", text: "text-left" },
    "center":        { items: "items-center", justify: "justify-center", text: "text-center" },
    "center-right":  { items: "items-center", justify: "justify-end", text: "text-right" },
    "bottom-left":   { items: "items-end", justify: "justify-start", text: "text-left" },
    "bottom-center": { items: "items-end", justify: "justify-center", text: "text-center" },
    "bottom-right":  { items: "items-end", justify: "justify-end", text: "text-right" },
  }
  const pos = positionMap[contentPosition] || positionMap.center

  return (
    <div className="relative w-full overflow-hidden" style={{ height: `${height}px` }}>
      {/* Background Video or Image */}
      <div className="absolute inset-0">
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
        ) : backgroundImage ? (
          <img
            src={backgroundImage}
            alt="Background"
            className="w-full h-full object-cover"
            style={blurStyle}
          />
        ) : null}
        {overlayEnabled && (
          <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }} />
        )}
      </div>

      {/* Content Container */}
      <div className={`relative z-10 flex flex-col ${pos.justify} ${pos.items} h-full px-8 py-12`}>
        {/* Title */}
        <h2
          className={`font-bold leading-[48px] ${pos.text} mb-10`}
          style={{
            color: "var(--cd-title-color)",
            fontSize: titleFontSize ? `${titleFontSize}px` : "var(--cd-title-size)",
            fontFamily: titleFontFamily || "var(--global-font)",
          }}
        >
          {title}
        </h2>

        {/* Timer */}
        <div className="flex gap-8 md:gap-16">
          {[
            { value: timeLeft.days, label: "Days" },
            { value: timeLeft.hours, label: "Hours" },
            { value: timeLeft.minutes, label: "Minutes" },
            { value: timeLeft.seconds, label: "Seconds" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center">
              <span className="font-bold leading-[48px]" style={{ color: "var(--cd-number-color)", fontSize: "var(--cd-number-size)", fontFamily: "var(--global-font)" }}>
                {formatNumber(item.value)}
              </span>
              <span className="font-medium text-[20px] leading-[48px] mt-[15px]" style={{ color: "var(--cd-label-color)", fontFamily: "var(--global-font)" }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Date/Subtitle */}
        {subtitle && (
          <div className={`font-semibold text-[24px] leading-[48px] ${pos.text} mt-5`} style={{ color: "var(--cd-subtitle-color)", fontFamily: "var(--global-font)" }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  )
}
