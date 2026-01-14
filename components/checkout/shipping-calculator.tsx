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
        setError(data.message || data.error || "Error al calcular envio")
        setRates([])
      }
    } catch (err) {
      console.error("Error calculating shipping:", err)
      setError("Error al calcular envio")
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
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Codigo Postal
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={postalCode}
            onChange={(e) => onPostalCodeChange(e.target.value.replace(/\D/g, "").slice(0, 5))}
            onBlur={handlePostalCodeBlur}
            onKeyDown={handlePostalCodeKeyDown}
            placeholder="Ej: 28001"
            className="flex-1 bg-[#1a1a1a] border border-gray-700 text-white px-4 py-2 focus:outline-none focus:border-[#FA4860]"
            maxLength={5}
          />
          <button
            onClick={calculateShipping}
            disabled={loading || postalCode.length < 4}
            className="bg-[#FA4860] text-white px-4 py-2 font-medium hover:bg-[#e8415a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "..." : "Calcular"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {/* Shipping Rates */}
      {rates.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            Metodo de envio
          </label>
          {rates.map((rate) => (
            <label
              key={rate.id}
              className={cn(
                "flex items-center justify-between p-4 border cursor-pointer transition-colors",
                selectedRateId === rate.id
                  ? "border-[#FA4860] bg-[#FA4860]/10"
                  : "border-gray-700 bg-[#1a1a1a] hover:border-gray-600",
                !rate.isAvailable && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="shippingRate"
                  checked={selectedRateId === rate.id}
                  onChange={() => rate.isAvailable && onShippingRateSelect(rate)}
                  disabled={!rate.isAvailable}
                  className="w-4 h-4 accent-[#FA4860]"
                />
                <div>
                  <p className="text-white font-medium">{rate.name}</p>
                  {rate.description && (
                    <p className="text-gray-400 text-sm">{rate.description}</p>
                  )}
                  {rate.estimatedDays && (
                    <p className="text-gray-500 text-xs">
                      Entrega en {rate.estimatedDays} {rate.estimatedDays === 1 ? "dia" : "dias"}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                {rate.isFree ? (
                  <div>
                    {rate.originalPrice > 0 && (
                      <span className="text-gray-500 line-through text-sm mr-2">
                        {rate.originalPrice.toFixed(2)} €
                      </span>
                    )}
                    <span className="text-green-500 font-bold">GRATIS</span>
                  </div>
                ) : (
                  <span className="text-white font-bold">{rate.price.toFixed(2)} €</span>
                )}
              </div>
            </label>
          ))}
        </div>
      )}

      {/* No shipping available message */}
      {hasCalculated && rates.length === 0 && !error && (
        <p className="text-yellow-500 text-sm">
          No hay opciones de envio disponibles para este codigo postal
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
    <div className="bg-[#1a1a1a] border border-gray-700 p-4">
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
          className="text-[#FA4860]"
        >
          <rect x="1" y="3" width="15" height="13" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
        <p className="text-white text-sm">
          {remaining > 0 ? (
            <>
              Anade <span className="text-[#FA4860] font-bold">{remaining.toFixed(2)} €</span> mas para envio GRATIS
            </>
          ) : (
            <span className="text-green-500 font-medium">Tienes envio GRATIS!</span>
          )}
        </p>
      </div>
      <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-500",
            percentage >= 100 ? "bg-green-500" : "bg-[#FA4860]"
          )}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
      <p className="text-gray-500 text-xs mt-1 text-right">
        Envio gratis desde {threshold.toFixed(2)} €
      </p>
    </div>
  )
}
