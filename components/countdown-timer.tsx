"use client"

import { useEffect, useState } from "react"

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

interface CountdownTimerProps {
  targetDate?: string
  title?: string
  subtitle?: string
  backgroundImage?: string
  videoUrl?: string
}

export function CountdownTimer({
  targetDate: targetDateProp = "2025-10-24",
  title = "Cuenta atrás próximo lanzamiento",
  subtitle = "Viernes 24 de octubre 2025",
  backgroundImage = "/images/background.png",
  videoUrl,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const targetDate = new Date(`${targetDateProp}T00:00:00`)

    const calculateTimeLeft = () => {
      const difference = +targetDate - +new Date()
      let timeLeft: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 }

      if (difference > 0) {
        timeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        }
      }

      return timeLeft
    }

    // Set initial time
    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDateProp])

  const formatNumber = (num: number) => num.toString().padStart(2, "0")

  return (
    <div className="relative w-full h-auto overflow-hidden">
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
          />
        ) : (
          <img
            src={backgroundImage}
            alt="Background"
            className="w-full h-full object-cover"
          />
        )}
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center py-[124px] px-4">
        {/* Title */}
        <h2
          className="font-bold leading-[48px] text-center mb-[40px]"
          style={{ color: "var(--cd-title-color)", fontSize: "var(--cd-title-size)", fontFamily: "var(--global-font)" }}
        >
          {title}
        </h2>

        {/* Timer */}
        <div className="flex flex-col items-center mb-[20px]">
          <div className="flex gap-8 md:gap-16 justify-center">
            {/* Days */}
            <div className="flex flex-col items-center">
              <span className="font-bold leading-[48px]" style={{ color: "var(--cd-number-color)", fontSize: "var(--cd-number-size)", fontFamily: "var(--global-font)" }}>
                {formatNumber(timeLeft.days)}
              </span>
              <span className="font-medium text-[20px] leading-[48px] mt-[15px]" style={{ color: "var(--cd-label-color)", fontFamily: "var(--global-font)" }}>
                Days
              </span>
            </div>

            {/* Hours */}
            <div className="flex flex-col items-center">
              <span className="font-bold leading-[48px]" style={{ color: "var(--cd-number-color)", fontSize: "var(--cd-number-size)", fontFamily: "var(--global-font)" }}>
                {formatNumber(timeLeft.hours)}
              </span>
              <span className="font-medium text-[20px] leading-[48px] mt-[15px]" style={{ color: "var(--cd-label-color)", fontFamily: "var(--global-font)" }}>
                Hours
              </span>
            </div>

            {/* Minutes */}
            <div className="flex flex-col items-center">
              <span className="font-bold leading-[48px]" style={{ color: "var(--cd-number-color)", fontSize: "var(--cd-number-size)", fontFamily: "var(--global-font)" }}>
                {formatNumber(timeLeft.minutes)}
              </span>
              <span className="font-medium text-[20px] leading-[48px] mt-[15px]" style={{ color: "var(--cd-label-color)", fontFamily: "var(--global-font)" }}>
                Minutes
              </span>
            </div>

            {/* Seconds */}
            <div className="flex flex-col items-center">
              <span className="font-bold leading-[48px]" style={{ color: "var(--cd-number-color)", fontSize: "var(--cd-number-size)", fontFamily: "var(--global-font)" }}>
                {formatNumber(timeLeft.seconds)}
              </span>
              <span className="font-medium text-[20px] leading-[48px] mt-[15px]" style={{ color: "var(--cd-label-color)", fontFamily: "var(--global-font)" }}>
                Seconds
              </span>
            </div>
          </div>
        </div>

        {/* Date/Subtitle */}
        <div
          className="font-semibold text-[24px] leading-[48px] text-center"
          style={{ color: "var(--cd-subtitle-color)", fontFamily: "var(--global-font)" }}
        >
          {subtitle}
        </div>
      </div>
    </div>
  )
}
