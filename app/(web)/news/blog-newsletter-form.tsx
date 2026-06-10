"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

export function BlogNewsletterForm() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    setMessage("")
    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "blog" }),
      })
      const data = await response.json()
      if (!response.ok) {
        setStatus("error")
        setMessage(data.error || "Something went wrong. Please try again.")
        return
      }
      setStatus("success")
      setMessage(data.message || "You're subscribed!")
      setEmail("")
    } catch {
      setStatus("error")
      setMessage("Something went wrong. Please try again.")
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email"
        disabled={status === "loading"}
        className="w-full border-0 font-['Montserrat'] text-base px-4 py-2 mb-3"
        style={{
          backgroundColor: "var(--form-input-bg, #ffffff)",
          color: "var(--form-input-text, #111111)",
        }}
      />
      <button type="submit" disabled={status === "loading"} className="w-full btn-primary disabled:opacity-50">
        {status === "loading" ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Subscribing...
          </span>
        ) : (
          "Subscribe"
        )}
      </button>
      {message && (
        <p
          className="mt-2 text-xs font-medium font-['Montserrat']"
          style={{ color: status === "success" ? "var(--success-color, #22c55e)" : "var(--error-color, #ef4444)" }}
        >
          {message}
        </p>
      )}
    </form>
  )
}
