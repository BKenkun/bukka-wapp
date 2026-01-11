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
}

export function CountdownTimer({
  targetDate: targetDateProp = "2025-10-24",
  title = "Cuenta atrás próximo lanzamiento",
  subtitle = "Viernes 24 de octubre 2025",
  backgroundImage = "/images/background.png",
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
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={backgroundImage}
          alt="Background"
          className="w-full h-full object-cover"
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center py-[124px] px-4">
        {/* Title */}
        <h2 className="text-white font-['Montserrat'] font-bold text-[32px] leading-[48px] text-center mb-[40px]">
          {title}
        </h2>

        {/* Timer */}
        <div className="flex flex-col items-center mb-[20px]">
          <div className="flex gap-8 md:gap-16 justify-center">
            {/* Days */}
            <div className="flex flex-col items-center">
              <span className="text-white font-['Montserrat'] font-bold text-[48px] leading-[48px]">
                {formatNumber(timeLeft.days)}
              </span>
              <span className="text-white font-['Montserrat'] font-medium text-[20px] leading-[48px] mt-[15px]">
                Días
              </span>
            </div>

            {/* Hours */}
            <div className="flex flex-col items-center">
              <span className="text-white font-['Montserrat'] font-bold text-[48px] leading-[48px]">
                {formatNumber(timeLeft.hours)}
              </span>
              <span className="text-white font-['Montserrat'] font-medium text-[20px] leading-[48px] mt-[15px]">
                Horas
              </span>
            </div>

            {/* Minutes */}
            <div className="flex flex-col items-center">
              <span className="text-white font-['Montserrat'] font-bold text-[48px] leading-[48px]">
                {formatNumber(timeLeft.minutes)}
              </span>
              <span className="text-white font-['Montserrat'] font-medium text-[20px] leading-[48px] mt-[15px]">
                Minutos
              </span>
            </div>

            {/* Seconds */}
            <div className="flex flex-col items-center">
              <span className="text-white font-['Montserrat'] font-bold text-[48px] leading-[48px]">
                {formatNumber(timeLeft.seconds)}
              </span>
              <span className="text-white font-['Montserrat'] font-medium text-[20px] leading-[48px] mt-[15px]">
                Segundos
              </span>
            </div>
          </div>
        </div>

        {/* Date/Subtitle */}
        <div className="text-white font-['Montserrat'] font-semibold text-[24px] leading-[48px] text-center">
          {subtitle}
        </div>
      </div>
    </div>
  )
}
