"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2, CheckCircle, Mail } from "lucide-react"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [gdprConsent, setGdprConsent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, gdprConsent }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "An error occurred")
        return
      }

      setSuccess(true)
      setFormData({ name: "", email: "", subject: "", message: "" })
      setGdprConsent(false)
    } catch {
      setError("Connection error. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputStyle = {
    backgroundColor: "var(--form-input-bg)",
    border: "1px solid var(--form-input-border)",
    color: "var(--form-input-text)",
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center py-16">
          <div
            className="w-20 h-20 mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: "color-mix(in srgb, var(--brand-color) 20%, transparent)" }}
          >
            <CheckCircle className="w-10 h-10" style={{ color: "var(--brand-color)" }} />
          </div>
          <h1 className="text-2xl font-bold mb-4" style={{ color: "var(--text-primary)", fontFamily: "var(--global-font)" }}>
            Message Sent
          </h1>
          <p className="mb-8" style={{ color: "var(--text-muted)" }}>
            Thank you for contacting us. We will get back to you as soon as possible.
          </p>
          <Link href="/" className="btn-primary inline-block">
            Back to Home
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-4 md:px-8 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-8 h-8" style={{ color: "var(--brand-color)" }} />
            <h1
              className="font-montserrat font-bold"
              style={{ color: "var(--text-primary)", fontSize: "30px", lineHeight: "36px" }}
            >
              Contact & Support
            </h1>
          </div>
          <p style={{ color: "var(--text-muted)" }}>
            Have a question, suggestion, or need help? Fill out the form below and we will respond as soon as possible.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-4">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--form-label-color)" }}>
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your name"
                required
                disabled={isSubmitting}
                className="w-full px-4 py-3 focus:outline-none transition-colors"
                style={inputStyle}
                onFocus={(e) => e.currentTarget.style.borderColor = "var(--form-input-focus-border)"}
                onBlur={(e) => e.currentTarget.style.borderColor = "var(--form-input-border)"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--form-label-color)" }}>
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
                required
                disabled={isSubmitting}
                className="w-full px-4 py-3 focus:outline-none transition-colors"
                style={inputStyle}
                onFocus={(e) => e.currentTarget.style.borderColor = "var(--form-input-focus-border)"}
                onBlur={(e) => e.currentTarget.style.borderColor = "var(--form-input-border)"}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--form-label-color)" }}>
              Subject *
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="What is this about?"
              required
              disabled={isSubmitting}
              className="w-full px-4 py-3 focus:outline-none transition-colors"
              style={inputStyle}
              onFocus={(e) => e.currentTarget.style.borderColor = "var(--form-input-focus-border)"}
              onBlur={(e) => e.currentTarget.style.borderColor = "var(--form-input-border)"}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--form-label-color)" }}>
              Message *
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Write your message here..."
              required
              disabled={isSubmitting}
              rows={6}
              className="w-full px-4 py-3 focus:outline-none transition-colors resize-none"
              style={inputStyle}
              onFocus={(e) => e.currentTarget.style.borderColor = "var(--form-input-focus-border)"}
              onBlur={(e) => e.currentTarget.style.borderColor = "var(--form-input-border)"}
            />
          </div>

          {/* GDPR Consent */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="gdpr-consent"
              checked={gdprConsent}
              onChange={(e) => setGdprConsent(e.target.checked)}
              required
              className="mt-1 w-4 h-4 cursor-pointer accent-[var(--brand-color)]"
            />
            <label htmlFor="gdpr-consent" className="text-sm cursor-pointer" style={{ color: "var(--text-muted)" }}>
              I have read and accept the{" "}
              <Link href="/p/privacy-policy" className="underline" style={{ color: "var(--brand-color)" }}>
                Privacy Policy
              </Link>
              . I consent to the processing of my personal data to respond to my inquiry, in accordance with Regulation (EU) 2016/679 (GDPR). I understand I can withdraw my consent at any time.
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !gdprConsent}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </span>
            ) : (
              "Send Message"
            )}
          </button>

          <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
            Your data will only be used to respond to your inquiry and will not be shared with third parties.
          </p>
        </form>
      </div>
    </main>
  )
}
