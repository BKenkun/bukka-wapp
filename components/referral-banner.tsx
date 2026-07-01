"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { X, TicketPercent } from "lucide-react"

const COOKIE_NAME = "ref_code"
const DISMISS_KEY = "ref_banner_dismissed"

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null
}

interface BannerInfo {
  code: string
  discountPercent: number
  label: string | null
  ownerName: string
}

/**
 * Banner persistente cuando el usuario llegó con un enlace de referido (?ref=).
 * Deja claro que el cupón está aplicado y guía a la página de suscripciones.
 */
export function ReferralBanner() {
  const pathname = usePathname()
  const [info, setInfo] = useState<BannerInfo | null>(null)
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined") return

    const code = readCookie(COOKIE_NAME)
    if (!code) return

    if (sessionStorage.getItem(DISMISS_KEY) === code) {
      setDismissed(true)
      return
    }
    setDismissed(false)

    let cancelled = false
    fetch("/api/referral-codes/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, context: "subscription", amount: 0 }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !data?.valid) return
        setInfo({
          code: data.code,
          discountPercent: Number(data.discountPercent) || 0,
          label: data.label,
          ownerName: data.owner?.name || data.code,
        })
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [pathname])

  if (!info || dismissed) return null

  // En el propio flujo de suscripción/checkout ya se ve el cupón aplicado
  if (
    pathname?.startsWith("/suscripciones") ||
    pathname?.startsWith("/my-account/subscription") ||
    pathname?.startsWith("/checkout")
  ) {
    return null
  }

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, info.code)
    setDismissed(true)
  }

  return (
    <div
      className="w-full px-4 py-2.5 flex items-center justify-center gap-3 text-sm"
      style={{
        backgroundColor: "color-mix(in srgb, var(--brand-color) 15%, var(--global-bg))",
        color: "var(--text-primary)",
        fontFamily: "var(--global-font)",
        borderBottom: "1px solid color-mix(in srgb, var(--brand-color) 30%, transparent)",
      }}
    >
      <TicketPercent className="w-4 h-4 shrink-0" style={{ color: "var(--brand-color)" }} />
      <p className="text-center">
        <span className="font-semibold">
          {`${info.ownerName}'s coupon`} ({info.code})
        </span>{" "}
        {info.discountPercent > 0 ? (
          <>
            applied — <span className="font-bold">{info.discountPercent}% off</span> your first
            payment.
          </>
        ) : (
          "applied to your purchase."
        )}
      </p>
      <Link
        href="/suscripciones"
        className="shrink-0 font-bold uppercase text-xs px-3 py-1.5 hover:opacity-90 transition-opacity"
        style={{ backgroundColor: "var(--brand-color)", color: "#ffffff" }}
      >
        Choose your plan
      </Link>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="shrink-0 p-1 hover:opacity-70 transition-opacity cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
