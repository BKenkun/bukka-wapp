"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"

const COOKIE_NAME = "ref_code"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 días

function setRefCookie(code: string) {
  if (typeof document === "undefined") return
  const isHttps = typeof window !== "undefined" && window.location.protocol === "https:"
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(code)}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax${
    isHttps ? "; secure" : ""
  }`
}

export function ReferralAttribution() {
  const params = useSearchParams()
  const pathname = usePathname()

  useEffect(() => {
    const raw = params.get("ref")
    if (!raw) return
    const code = raw.trim().toUpperCase()
    if (!code || !/^[A-Z0-9_-]{2,32}$/.test(code)) return

    setRefCookie(code)
    fetch("/api/referral-codes/track-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      keepalive: true,
    }).catch(() => {})
  }, [params, pathname])

  return null
}
