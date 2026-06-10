"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ShippingRate {
  id: string
  name: string
  description: string | null
  originalPrice: number
  price: number
  isFree: boolean
  estimatedDays: number | null
  isAvailable: boolean
}

interface FreeShippingInfo {
  threshold: number
  remaining: number
  percentage: number
}

interface ShippingCalculatorProps {
  postalCode: string
  country?: string
  subtotal: number
  onPostalCodeChange: (postalCode: string) => void
  onShippingRateSelect: (rate: ShippingRate | null) => void
  selectedRateId?: string | null
  className?: string
}

export function ShippingCalculator({
  postalCode,
  country = "ES",
  subtotal,
  onPostalCodeChange,
  onShippingRateSelect,
  selectedRateId,
  className,
}: ShippingCalculatorProps) {
  const [loading, setLoading] = React.useState(false)
  const [rates, setRates] = React.useState<ShippingRate[]>([])
  const [freeShippingInfo, setFreeShippingInfo] = React.useState<FreeShippingInfo | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [hasCalculated, setHasCalculated] = React.useState(false)

  const calculateShipping = React.useCallback(async () => {
    if (!postalCode || postalCode.length < 4) {
      setRates([])
      setFreeShippingInfo(null)
      setHasCalculated(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postalCode,
          country,
          subtotal,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setRates(data.rates || [])
        setFreeShippingInfo(data.freeShippingInfo || null)
        setHasCalculated(true)

        // Auto-select first available rate if none selected
        if (data.rates?.length > 0 && !selectedRateId) {
          const firstAvailable = data.rates.find((r: ShippingRate) => r.isAvailable)
          if (firstAvailable) {
            onShippingRateSelect(firstAvailable)
          }
        }
      } else {
        setError(data.message || data.error || "Error calculating shipping")
        setRates([])
      }
    } catch (err) {
      console.error("Error calculating shipping:", err)
      setError("Error calculating shipping")
      setRates([])
    } finally {
      setLoading(false)
    }
  }, [postalCode, country, subtotal, selectedRateId, onShippingRateSelect])

  // Recalculate when subtotal changes (for free shipping)
  React.useEffect(() => {
    if (hasCalculated && postalCode.length >= 4) {
      calculateShipping()
    }
  }, [subtotal])

  const handlePostalCodeBlur = () => {
    if (postalCode.length >= 4) {
      calculateShipping()
    }
  }

  const handlePostalCodeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && postalCode.length >= 4) {
      calculateShipping()
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Free Shipping Progress */}
      {freeShippingInfo && (
        <FreeShippingProgress
          remaining={freeShippingInfo.remaining}
          percentage={freeShippingInfo.percentage}
          threshold={freeShippingInfo.threshold}
        />
      )}

      {/* Postal Code Input */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: "var(--form-label-color)" }}>
          Postal Code
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={postalCode}
            onChange={(e) => onPostalCodeChange(e.target.value.replace(/\D/g, "").slice(0, 5))}
            onBlur={handlePostalCodeBlur}
            onKeyDown={handlePostalCodeKeyDown}
            placeholder="E.g. 28001"
            className="flex-1 px-4 py-2 focus:outline-none"
            style={{ backgroundColor: "var(--surface-bg)", border: "1px solid var(--form-input-border)", color: "var(--form-input-text)" }}
            onFocus={(e) => e.currentTarget.style.borderColor = "var(--form-input-focus-border)"}
            maxLength={5}
          />
          <button
            onClick={calculateShipping}
            disabled={loading || postalCode.length < 4}
            className="btn-primary px-4 py-2"
          >
            {loading ? "..." : "Calculate"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm" style={{ color: "var(--error-color)" }}>{error}</p>
      )}

      {/* Shipping Rates */}
      {rates.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium" style={{ color: "var(--form-label-color)" }}>
            Shipping method
          </label>
          {rates.map((rate) => (
            <label
              key={rate.id}
              className={cn(
                "flex items-center justify-between p-4 cursor-pointer transition-colors",
                !rate.isAvailable && "opacity-50 cursor-not-allowed"
              )}
              style={selectedRateId === rate.id
                ? { border: "1px solid var(--brand-color)", backgroundColor: "color-mix(in srgb, var(--brand-color) 10%, transparent)" }
                : { border: "1px solid var(--border-color)", backgroundColor: "var(--surface-bg)" }
              }
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="shippingRate"
                  checked={selectedRateId === rate.id}
                  onChange={() => rate.isAvailable && onShippingRateSelect(rate)}
                  disabled={!rate.isAvailable}
                  className="w-4 h-4"
                  style={{ accentColor: "var(--brand-color)" }}
                />
                <div>
                  <p className="font-medium" style={{ color: "var(--text-primary)" }}>{rate.name}</p>
                  {rate.description && (
                    <p className="text-sm" style={{ color: "var(--form-label-color)" }}>{rate.description}</p>
                  )}
                  {rate.estimatedDays && (
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Delivery in {rate.estimatedDays} {rate.estimatedDays === 1 ? "day" : "days"}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                {rate.isFree ? (
                  <div>
                    {rate.originalPrice > 0 && (
                      <span className="line-through text-sm mr-2" style={{ color: "var(--text-muted)" }}>
                        {rate.originalPrice.toFixed(2)} €
                      </span>
                    )}
                    <span className="font-bold" style={{ color: "var(--success-color)" }}>FREE</span>
                  </div>
                ) : (
                  <span className="font-bold" style={{ color: "var(--text-primary)" }}>{rate.price.toFixed(2)} €</span>
                )}
              </div>
            </label>
          ))}
        </div>
      )}

      {/* No shipping available message */}
      {hasCalculated && rates.length === 0 && !error && (
        <p className="text-sm" style={{ color: "var(--warning-color)" }}>
          No shipping options available for this postal code
        </p>
      )}
    </div>
  )
}

// Free Shipping Progress Bar Component
interface FreeShippingProgressProps {
  remaining: number
  percentage: number
  threshold: number
}

export function FreeShippingProgress({ remaining, percentage, threshold }: FreeShippingProgressProps) {
  return (
    <div className="p-4" style={{ backgroundColor: "var(--surface-bg)", border: "1px solid var(--border-color)" }}>
      <div className="flex items-center gap-2 mb-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "var(--brand-color)" }}
        >
          <rect x="1" y="3" width="15" height="13" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
        <p className="text-sm" style={{ color: "var(--text-primary)" }}>
          {remaining > 0 ? (
            <>
              Add <span className="font-bold" style={{ color: "var(--brand-color)" }}>{remaining.toFixed(2)} €</span> more for FREE shipping
            </>
          ) : (
            <span className="font-medium" style={{ color: "var(--success-color)" }}>You have FREE shipping!</span>
          )}
        </p>
      </div>
      <div className="w-full h-2 overflow-hidden" style={{ backgroundColor: "var(--border-color)" }}>
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${Math.min(100, percentage)}%`,
            backgroundColor: percentage >= 100 ? "var(--success-color)" : "var(--brand-color)",
          }}
        />
      </div>
      <p className="text-xs mt-1 text-right" style={{ color: "var(--text-muted)" }}>
        Free shipping from {threshold.toFixed(2)} €
      </p>
    </div>
  )
}
