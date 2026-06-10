"use client"

import * as React from "react"

const STORAGE_KEY = "age-verified"

interface AgeVerificationModalProps {
  enabled?: boolean
  okysafeEnabled?: boolean
  title?: string
  description?: string
  exitButtonText?: string
  exitUrl?: string
}

export function AgeVerificationModal({
  enabled = true,
  okysafeEnabled = true,
  title = "This is an Adult Website",
  description = "This website contains age-restricted material, including nudity and explicit depictions of sexual activity. By entering, you affirm that you are at least 18 years of age or the age of majority in the jurisdiction from which you are accessing the website, and that you consent to viewing sexually explicit content.",
  exitButtonText = "I am under 18 - Exit",
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
        sessionStorage.setItem(STORAGE_KEY, "true")
        // Clean URL params
        window.history.replaceState({}, "", window.location.pathname)
        setIsLoading(false)
        return
      }

      // Check sessionStorage (only lasts for the browser session)
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored === "true") {
        setIsLoading(false)
        return
      }

      // Show error if verification failed
      if (avResult === "failed") {
        setError("Verification was not completed successfully. Please try again.")
        // Clean URL params
        window.history.replaceState({}, "", window.location.pathname)
      } else if (avResult === "error") {
        setError("There was an error during verification. Please try again.")
        window.history.replaceState({}, "", window.location.pathname)
      }

      setIsOpen(true)
      setIsLoading(false)
    }

    const timer = setTimeout(checkVerification, 100)
    return () => clearTimeout(timer)
  }, [enabled])

  const handleOkySafeSubmit = async (e: React.FormEvent) => {
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
        setError(data.error || "Error starting verification")
        return
      }

      if (data.alreadyVerified) {
        sessionStorage.setItem(STORAGE_KEY, "true")
        setIsOpen(false)
        return
      }

      if (data.verificationUrl) {
        window.location.href = data.verificationUrl
      }
    } catch {
      setError("Connection error. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSimpleAccept = () => {
    sessionStorage.setItem(STORAGE_KEY, "true")
    setIsOpen(false)
  }

  const handleReject = () => {
    window.location.href = exitUrl
  }

  if (isLoading || !enabled || !isOpen) {
    return null
  }

  const currentYear = new Date().getFullYear()

  // Simple age verification (OkySafe disabled)
  if (!okysafeEnabled) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#1a1a1a] flex items-start md:items-center justify-center p-4 overflow-y-auto">
        <div
          className="w-full max-w-[620px] bg-[#222222] p-8 md:p-10 shadow-2xl"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          {/* Logo */}
          <h1
            className="text-center font-black mb-2 tracking-wide"
            style={{
              fontSize: "clamp(32px, 5vw, 44px)",
              fontWeight: 900,
              color: "#FFFFFF",
            }}
          >
            BUKKAKERY
          </h1>

          {/* Warning subtitle */}
          <h2
            className="text-center font-bold mb-6"
            style={{
              fontSize: "clamp(14px, 2.5vw, 17px)",
              fontWeight: 700,
              color: "#6CB4D9",
              letterSpacing: "0.5px",
            }}
          >
            WARNING: THIS WEBSITE IS FOR ADULTS ONLY!
          </h2>

          {/* Legal text */}
          <div className="text-white/80 space-y-4 mb-6" style={{ fontSize: "14px", lineHeight: 1.65 }}>
            <p>
              This Website is for use solely by individuals who are at least 18 years of age and
              have reached the age of majority or age of consent as determined by the laws of the
              jurisdiction from which they are accessing the Website. Accessing this Website while
              underage might be prohibited by law.
            </p>
            <p>
              In accordance with 47 U.S.C. &sect; 230(d), you are notified that parental control
              protections (including computer hardware, software, or filtering services) are
              commercially available that might help in limiting access to material that is harmful
              to minors.
            </p>
          </div>

          {/* Bold statement */}
          <p
            className="text-white font-bold mb-4"
            style={{ fontSize: "14px", lineHeight: 1.5 }}
          >
            BY CLICKING &ldquo;YES, I&rsquo;M OLDER THAN 18&rdquo; BELOW, YOU STATE THAT THE
            FOLLOWING FACTS ARE ACCURATE:
          </p>

          {/* Bullet points */}
          <ul className="text-white/80 space-y-2.5 mb-6 list-disc pl-5" style={{ fontSize: "14px", lineHeight: 1.55 }}>
            <li>
              You are at least 18 years of age and have reached the age of majority or age of
              consent in your jurisdiction.
            </li>
            <li>
              You will promptly leave this Website if sexually explicit content offends you.
            </li>
            <li>
              You will not hold the Website&rsquo;s owners or its employees responsible for any
              materials located on the Website.
            </li>
            <li>
              You acknowledge that the Website&rsquo;s Terms of Service govern your use of the
              Website, and you have reviewed and agree to be bound by it.
            </li>
          </ul>

          {/* Disagree text */}
          <p className="text-white/80 mb-8" style={{ fontSize: "14px", lineHeight: 1.55 }}>
            If you disagree with the above, click on the &ldquo;No&rdquo; button below to leave
            the Website.
          </p>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleReject}
              className="flex-1 py-3.5 border border-white/30 text-white font-semibold text-sm cursor-pointer transition-colors hover:bg-white/10"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              No
            </button>
            <button
              onClick={handleSimpleAccept}
              className="flex-1 py-3.5 font-semibold text-sm text-white cursor-pointer transition-colors hover:opacity-90"
              style={{
                fontFamily: "Montserrat, sans-serif",
                backgroundColor: "#5BA8C8",
              }}
            >
              Yes, I&rsquo;m older than 18
            </button>
          </div>
        </div>
      </div>
    )
  }

  // OkySafe verification (original flow)
  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-start md:items-center justify-center p-4 overflow-y-auto">
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
        <form onSubmit={handleOkySafeSubmit} className="max-w-md mx-auto mb-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email"
            required
            disabled={isSubmitting}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/50 mb-4 outline-none focus:border-[#FA4860] transition-colors"
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
            {isSubmitting ? "Verifying..." : "Verify My Age"}
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
            &copy; Bukkakery.com, {currentYear}
          </p>
        </div>
      </div>
    </div>
  )
}
