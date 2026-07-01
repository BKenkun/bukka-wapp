"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

export type ReferralOwner =
  | {
      type: "performer"
      id: string
      slug: string
      name: string
      profileImage: string | null
    }
  | {
      type: "partner"
      name: string
    }

export interface AppliedReferral {
  code: string
  discountPercent: number
  discountAmount: number
  label: string | null
  owner: ReferralOwner
}

interface ReferralCodeInputProps {
  context: "shop" | "subscription"
  amount: number
  applied: AppliedReferral | null
  onApply: (referral: AppliedReferral) => void
  onRemove: () => void
  className?: string
  title?: string
  placeholder?: string
}

const COOKIE_NAME = "ref_code"

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null
}

export function ReferralCodeInput({
  context,
  amount,
  applied,
  onApply,
  onRemove,
  className,
  title = "Have a creator code?",
  placeholder = "Enter your code",
}: ReferralCodeInputProps) {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const autoTriedRef = useRef<string | null>(null)

  async function applyCode(rawCode: string, silent = false) {
    const code = rawCode.trim().toUpperCase()
    if (!code) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/referral-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, context, amount }),
      })
      const data = await res.json()
      if (!res.ok || !data.valid) {
        if (!silent) setError(data.error || "Invalid code")
        return
      }
      onApply({
        code: data.code,
        discountPercent: Number(data.discountPercent),
        discountAmount: Number(data.discountAmount),
        label: data.label,
        owner: data.owner,
      })
      if (!silent) {
        const ownerName: string = data.owner?.name || "referral"
        if (Number(data.discountPercent) > 0) {
          toast.success(
            data.owner?.type === "performer"
              ? `Creator coupon ${ownerName} applied`
              : `Coupon ${ownerName} applied`,
          )
        } else {
          toast.success(`Coupon from ${ownerName} applied`)
        }
      }
    } catch {
      if (!silent) setError("Error validating code")
    } finally {
      setLoading(false)
    }
  }

  // Auto-aplicar cookie ref_code una sola vez al montar
  useEffect(() => {
    if (applied) return
    const cookieCode = readCookie(COOKIE_NAME)
    if (!cookieCode || autoTriedRef.current === cookieCode) return
    autoTriedRef.current = cookieCode
    applyCode(cookieCode, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Si cambia el amount con un código aplicado, recalculamos el descuento
  useEffect(() => {
    if (!applied || applied.discountPercent <= 0) return
    const newDiscount =
      Math.round(((amount * applied.discountPercent) / 100) * 100) / 100
    if (newDiscount !== applied.discountAmount) {
      onApply({ ...applied, discountAmount: newDiscount })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, applied?.code, applied?.discountPercent])

  if (applied) {
    const isDiscount = applied.discountPercent > 0
    const ownerName = applied.owner.name
    const ownerImage =
      applied.owner.type === "performer" ? applied.owner.profileImage : null
    const defaultLabel = isDiscount
      ? applied.owner.type === "performer"
        ? `Creator coupon ${ownerName} · ${applied.discountPercent}%`
        : `Coupon ${ownerName} · ${applied.discountPercent}%`
      : `Referral coupon ${ownerName}`
    return (
      <div className={className}>
        <p
          className="font-medium mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </p>
        <div
          className="flex items-center justify-between p-3"
          style={{
            backgroundColor: isDiscount
              ? "color-mix(in srgb, var(--success-color) 12%, transparent)"
              : "color-mix(in srgb, var(--accent-color) 10%, transparent)",
            border: `1px solid ${
              isDiscount
                ? "color-mix(in srgb, var(--success-color) 35%, transparent)"
                : "color-mix(in srgb, var(--accent-color) 30%, transparent)"
            }`,
          }}
        >
          <div className="flex items-center gap-3">
            {ownerImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ownerImage}
                alt={ownerName}
                className="w-9 h-9 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold"
                style={{
                  backgroundColor: "var(--accent-color)",
                  color: "var(--text-primary)",
                }}
              >
                {ownerName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p
                className="font-semibold text-sm"
                style={{
                  color: isDiscount
                    ? "var(--success-color)"
                    : "var(--text-primary)",
                }}
              >
                {defaultLabel}
              </p>
              {isDiscount ? (
                <p
                  className="text-xs"
                  style={{ color: "var(--success-color)" }}
                >
                  -{applied.discountAmount.toFixed(2)} €
                </p>
              ) : (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Attributed to {ownerName}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onRemove()
              setInput("")
              setError(null)
              autoTriedRef.current = null
              if (typeof document !== "undefined") {
                document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`
              }
            }}
            className="text-sm transition-colors"
            style={{ color: "var(--cart-summary-label)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--text-primary)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--cart-summary-label)")
            }
          >
            Remove
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <p className="font-medium mb-3" style={{ color: "var(--text-primary)" }}>
        {title}
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value.toUpperCase())
            setError(null)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              applyCode(input)
            }
          }}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 text-sm focus:outline-none"
          style={{
            backgroundColor: "var(--form-input-bg)",
            border: "1px solid var(--form-input-border)",
            color: "var(--form-input-text)",
          }}
          onFocus={(e) =>
            (e.currentTarget.style.borderColor =
              "var(--form-input-focus-border)")
          }
          onBlur={(e) =>
            (e.currentTarget.style.borderColor = "var(--form-input-border)")
          }
        />
        <button
          type="button"
          onClick={() => applyCode(input)}
          disabled={loading || !input.trim()}
          className="px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{
            backgroundColor: "var(--accent-color)",
            color: "var(--text-primary)",
          }}
        >
          {loading ? "..." : "Apply"}
        </button>
      </div>
      {error && (
        <p className="text-xs mt-2" style={{ color: "var(--error-color)" }}>
          {error}
        </p>
      )}
    </div>
  )
}
