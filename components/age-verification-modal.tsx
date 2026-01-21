"use client"

import * as React from "react"

const STORAGE_KEY = "age-verified"
const VERIFICATION_EXPIRY = 30 * 24 * 60 * 60 * 1000 // 30 days in ms

interface AgeVerificationModalProps {
  enabled?: boolean
  title?: string
  description?: string
  enterButtonText?: string
  exitButtonText?: string
  exitUrl?: string
}

export function AgeVerificationModal({
  enabled = true,
  title = "Este es un Sitio Web para adultos",
  description = "Este sitio web contiene material restringido a menores de edad, que incluye desnudez y representaciones explícitas de actividad sexual. Al entrar, afirma que tiene por lo menos 18 años de edad o la mayoría de edad en la jurisdicción desde que está accediendo el sitio web y que da consentimiento en ver contenido sexualmente explícito.",
  enterButtonText = "Tengo 18 años o más - Entrar",
  exitButtonText = "Soy menor de 18 años - Salir",
  exitUrl = "https://www.google.com",
}: AgeVerificationModalProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const checkVerification = () => {
      if (!enabled) {
        setIsLoading(false)
        return
      }

      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const { timestamp } = JSON.parse(stored)
          const isExpired = Date.now() - timestamp > VERIFICATION_EXPIRY
          if (!isExpired) {
            setIsLoading(false)
            return
          }
        } catch {
          // Invalid stored data, show modal
        }
      }

      setIsOpen(true)
      setIsLoading(false)
    }

    const timer = setTimeout(checkVerification, 100)
    return () => clearTimeout(timer)
  }, [enabled])

  const handleConfirm = () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ verified: true, timestamp: Date.now() })
    )
    setIsOpen(false)
  }

  const handleReject = () => {
    window.location.href = exitUrl
  }

  if (isLoading || !enabled || !isOpen) {
    return null
  }

  const currentYear = new Date().getFullYear()

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-2xl text-center">
        {/* Logo */}
        <h1
          className="text-[#FA4860] font-black mb-8"
          style={{
            fontFamily: "Montserrat",
            fontSize: "clamp(28px, 5vw, 42px)",
            fontWeight: 900,
            lineHeight: "normal",
          }}
        >
          BUKKAKERY
        </h1>

        {/* Title */}
        <h2
          className="text-white font-bold mb-6"
          style={{
            fontFamily: "Montserrat",
            fontSize: "clamp(24px, 4vw, 32px)",
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          {title}
        </h2>

        {/* Description */}
        <p
          className="text-white/80 mb-8 max-w-xl mx-auto"
          style={{
            fontFamily: "Montserrat",
            fontSize: "clamp(14px, 2vw, 16px)",
            fontWeight: 400,
            lineHeight: 1.6,
          }}
        >
          {description}
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button
            onClick={handleConfirm}
            className="btn-primary cursor-pointer"
            style={{
              minWidth: "260px",
            }}
          >
            {enterButtonText}
          </button>
          <button
            onClick={handleReject}
            className="btn-secondary cursor-pointer"
            style={{
              minWidth: "260px",
            }}
          >
            {exitButtonText}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <p
            className="text-white/40"
            style={{
              fontFamily: "Montserrat",
              fontSize: "12px",
              fontWeight: 400,
            }}
          >
            © Bukkakery.com, {currentYear}
          </p>
        </div>
      </div>
    </div>
  )
}
