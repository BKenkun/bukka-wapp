"use client"

import * as React from "react"

const STORAGE_KEY = "age-verified"
const VERIFICATION_EXPIRY = 30 * 24 * 60 * 60 * 1000 // 30 days in ms

interface AgeVerificationModalProps {
  enabled?: boolean
  title?: string
  description?: string
  exitButtonText?: string
  exitUrl?: string
}

export function AgeVerificationModal({
  enabled = true,
  title = "Este es un Sitio Web para adultos",
  description = "Este sitio web contiene material restringido a menores de edad, que incluye desnudez y representaciones explícitas de actividad sexual. Al entrar, afirma que tiene por lo menos 18 años de edad o la mayoría de edad en la jurisdicción desde que está accediendo el sitio web y que da consentimiento en ver contenido sexualmente explícito.",
  exitButtonText = "Soy menor de 18 años - Salir",
  exitUrl = "https://www.google.com",
}: AgeVerificationModalProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [email, setEmail] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    const checkVerification = () => {
      if (!enabled) {
        setIsLoading(false)
        return
      }

      // Check if returning from OkySafe callback
      const params = new URLSearchParams(window.location.search)
      const avResult = params.get("av")

      if (avResult === "success") {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ verified: true, timestamp: Date.now() })
        )
        // Clean URL params
        window.history.replaceState({}, "", window.location.pathname)
        setIsLoading(false)
        return
      }

      // Check localStorage
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

      // Show error if verification failed
      if (avResult === "failed") {
        setError("La verificación no se completó correctamente. Inténtalo de nuevo.")
        // Clean URL params
        window.history.replaceState({}, "", window.location.pathname)
      } else if (avResult === "error") {
        setError("Hubo un error en la verificación. Inténtalo de nuevo.")
        window.history.replaceState({}, "", window.location.pathname)
      }

      setIsOpen(true)
      setIsLoading(false)
    }

    const timer = setTimeout(checkVerification, 100)
    return () => clearTimeout(timer)
  }, [enabled])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const res = await fetch("/api/verification/okysafe/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Error al iniciar la verificación")
        return
      }

      if (data.alreadyVerified) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ verified: true, timestamp: Date.now() })
        )
        setIsOpen(false)
        return
      }

      if (data.verificationUrl) {
        window.location.href = data.verificationUrl
      }
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
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

        {/* Verification Form */}
        <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Tu email"
            required
            disabled={isSubmitting}
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 mb-4 outline-none focus:border-[#FA4860] transition-colors"
            style={{
              fontFamily: "Montserrat",
              fontSize: "16px",
            }}
          />

          {error && (
            <p
              className="text-[#FA4860] mb-4 text-sm"
              style={{ fontFamily: "Montserrat" }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !email}
            className="btn-primary cursor-pointer w-full disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minWidth: "260px" }}
          >
            {isSubmitting ? "Verificando..." : "Verificar mi edad"}
          </button>
        </form>

        {/* Exit Button */}
        <button
          onClick={handleReject}
          className="btn-secondary cursor-pointer"
          style={{ minWidth: "260px" }}
        >
          {exitButtonText}
        </button>

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
