"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { getRecaptchaToken } from "@/lib/recaptcha-client"

interface NewsletterFormProps {
  title: string
  titleUrl?: string | null
  openInNewTab?: boolean
  placeholder: string
  buttonText: string
  privacyText: string
  privacyLinkText: string
  privacyLinkUrl?: string | null
  privacyLinkOpenInNewTab?: boolean
  source?: string
}

export function NewsletterForm({
  title,
  titleUrl,
  openInNewTab,
  placeholder,
  buttonText,
  privacyText,
  privacyLinkText,
  privacyLinkUrl,
  privacyLinkOpenInNewTab,
  source = "footer",
}: NewsletterFormProps) {
  const [email, setEmail] = useState("")
  const [accepted, setAccepted] = useState(false)
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accepted) {
      setStatus("error")
      setMessage("Please accept the privacy policy")
      return
    }
    setStatus("loading")
    setMessage("")

    try {
      const recaptchaToken = await getRecaptchaToken("NEWSLETTER")

      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source, recaptchaToken }),
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

  const titleElement = titleUrl ? (
    <Link
      href={titleUrl}
      target={openInNewTab ? "_blank" : undefined}
      rel={openInNewTab ? "noopener noreferrer" : undefined}
      className="hover:opacity-80 transition-opacity"
    >
      {title}
    </Link>
  ) : (
    title
  )

  return (
    <div className="max-w-md">
      <p
        className="font-black uppercase tracking-wide mb-3"
        style={{
          color: "var(--footer-title-color)",
          fontFamily: "var(--global-font)",
          fontSize: "13px",
        }}
      >
        {titleElement}
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          disabled={status === "loading"}
          className="flex-1 h-11 px-3 text-sm outline-none"
          style={{
            backgroundColor: "var(--form-input-bg, #ffffff)",
            color: "var(--form-input-text, #111111)",
            border: "1px solid var(--form-input-border, #e0e0e0)",
            fontFamily: "var(--global-font)",
          }}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="h-11 px-5 text-sm font-bold uppercase tracking-wide cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
          style={{
            backgroundColor: "var(--brand-color)",
            color: "#ffffff",
            fontFamily: "var(--global-font)",
          }}
        >
          {status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : buttonText}
        </button>
      </form>

      <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="size-3.5 accent-[var(--brand-color)]"
        />
        <span
          className="text-[11px]"
          style={{ color: "var(--footer-copyright-color)", fontFamily: "var(--global-font)" }}
        >
          {privacyText}{" "}
          {privacyLinkUrl ? (
            <Link
              href={privacyLinkUrl}
              target={privacyLinkOpenInNewTab ? "_blank" : undefined}
              rel={privacyLinkOpenInNewTab ? "noopener noreferrer" : undefined}
              className="underline hover:opacity-80"
              style={{ color: "var(--brand-color)" }}
            >
              {privacyLinkText}
            </Link>
          ) : (
            <span className="underline">{privacyLinkText}</span>
          )}
        </span>
      </label>

      {message && (
        <p
          className="mt-2 text-xs font-medium"
          style={{ color: status === "success" ? "#22c55e" : "#ef4444", fontFamily: "var(--global-font)" }}
        >
          {message}
        </p>
      )}
    </div>
  )
}
