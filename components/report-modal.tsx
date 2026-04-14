"use client"

import { useState } from "react"

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  itemType: "FORUM_POST" | "FORUM_REPLY" | "VIDEO_COMMENT"
  itemId: string
}

const REASONS = [
  { value: "SPAM", label: "Spam or scam" },
  { value: "HARASSMENT", label: "Harassment or bullying" },
  { value: "INAPPROPRIATE", label: "Inappropriate content" },
  { value: "MISINFORMATION", label: "Misinformation" },
  { value: "OTHER", label: "Other" },
] as const

export function ReportModal({ isOpen, onClose, itemType, itemId }: ReportModalProps) {
  const [reason, setReason] = useState<string>("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!reason || submitting) return

    setSubmitting(true)
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType, itemId, reason, message }),
      })

      if (res.ok) {
        setSubmitted(true)
      } else {
        const data = await res.json()
        alert(data.error || "Failed to submit report")
      }
    } catch {
      alert("Failed to submit report")
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setReason("")
    setMessage("")
    setSubmitted(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={handleClose}>
      <div className="absolute inset-0" style={{ backgroundColor: "color-mix(in srgb, var(--global-bg) 85%, transparent)" }} />
      <div
        className="relative w-full max-w-md mx-4 overflow-hidden"
        style={{ backgroundColor: "var(--surface-bg)", border: "1px solid var(--border-color)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid var(--border-color)" }}>
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--text-primary)", fontFamily: "var(--global-font)" }}
          >
            {submitted ? "Report Submitted" : "Report Content"}
          </h2>
          <button onClick={handleClose} className="cursor-pointer hover:opacity-70 transition-opacity" style={{ color: "var(--text-muted)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {submitted ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "color-mix(in srgb, var(--success-color) 20%, transparent)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success-color)" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-base font-medium mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--global-font)" }}>
                Thank you for your report
              </p>
              <p className="text-sm" style={{ color: "var(--text-muted)", fontFamily: "var(--global-font)" }}>
                Our team will review it shortly.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm mb-4" style={{ color: "var(--text-muted)", fontFamily: "var(--global-font)" }}>
                Why are you reporting this content?
              </p>

              <div className="space-y-2 mb-4">
                {REASONS.map((r) => (
                  <label
                    key={r.value}
                    className="flex items-center gap-3 p-3 cursor-pointer transition-colors"
                    style={{
                      backgroundColor: reason === r.value ? "color-mix(in srgb, var(--brand-color) 15%, transparent)" : "var(--global-bg)",
                      border: reason === r.value ? "1px solid var(--brand-color)" : "1px solid var(--border-color)",
                    }}
                  >
                    <input
                      type="radio"
                      name="report-reason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={(e) => setReason(e.target.value)}
                      style={{ accentColor: "var(--brand-color)" }}
                    />
                    <span className="text-sm" style={{ color: "var(--text-primary)", fontFamily: "var(--global-font)" }}>
                      {r.label}
                    </span>
                  </label>
                ))}
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add additional details (optional)..."
                className="w-full p-3 text-sm min-h-[80px] focus:outline-none"
                style={{
                  backgroundColor: "var(--global-bg)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--global-font)",
                }}
              />
            </>
          )}
        </div>

        {/* Footer */}
        {!submitted && (
          <div className="flex justify-end gap-3 p-5" style={{ borderTop: "1px solid var(--border-color)" }}>
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm transition-colors cursor-pointer"
              style={{ color: "var(--text-muted)", fontFamily: "var(--global-font)" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!reason || submitting}
              className="px-5 py-2 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "var(--brand-color)",
                color: "var(--text-primary)",
                fontFamily: "var(--global-font)",
              }}
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
