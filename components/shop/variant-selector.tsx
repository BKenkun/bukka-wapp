"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface AttributeValue {
  id: string
  value: string
  slug: string
  colorHex: string | null
  imageUrl: string | null
}

interface Attribute {
  id: string
  name: string
  slug: string
  type: "SELECT" | "COLOR" | "IMAGE"
  values: AttributeValue[]
}

interface VariantInfo {
  id: string
  sku: string | null
  price: number
  compareAtPrice: number | null
  stock: number
  imageUrl: string | null
  isAvailable: boolean
}

interface VariantSelectorProps {
  productSlug: string
  attributes: Attribute[]
  basePrice: number
  onVariantChange?: (variant: VariantInfo | null, selectedValues: Record<string, string>) => void
  className?: string
}

export function VariantSelector({
  productSlug,
  attributes,
  basePrice,
  onVariantChange,
  className,
}: VariantSelectorProps) {
  const [selectedValues, setSelectedValues] = React.useState<Record<string, string>>({})
  const [currentVariant, setCurrentVariant] = React.useState<VariantInfo | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  // Use ref to store callback to avoid infinite loops
  const onVariantChangeRef = React.useRef(onVariantChange)
  React.useEffect(() => {
    onVariantChangeRef.current = onVariantChange
  }, [onVariantChange])

  // Initialize with first values
  React.useEffect(() => {
    const initial: Record<string, string> = {}
    attributes.forEach((attr) => {
      if (attr.values.length > 0) {
        initial[attr.id] = attr.values[0].id
      }
    })
    setSelectedValues(initial)
  }, [attributes])

  // Fetch variant when selection changes
  React.useEffect(() => {
    const valueIds = Object.values(selectedValues).filter(Boolean)
    if (valueIds.length === 0 || valueIds.length !== attributes.length) {
      setCurrentVariant(null)
      onVariantChangeRef.current?.(null, selectedValues)
      return
    }

    async function fetchVariant() {
      setIsLoading(true)
      try {
        const res = await fetch(
          `/api/products/${productSlug}/variant?values=${valueIds.join(",")}`
        )
        if (res.ok) {
          const data = await res.json()
          setCurrentVariant(data.variant)
          onVariantChangeRef.current?.(data.variant, selectedValues)
        } else {
          setCurrentVariant(null)
          onVariantChangeRef.current?.(null, selectedValues)
        }
      } catch {
        setCurrentVariant(null)
        onVariantChangeRef.current?.(null, selectedValues)
      } finally {
        setIsLoading(false)
      }
    }

    fetchVariant()
  }, [selectedValues, productSlug, attributes.length])

  const handleValueChange = (attributeId: string, valueId: string) => {
    setSelectedValues((prev) => ({
      ...prev,
      [attributeId]: valueId,
    }))
  }

  return (
    <div className={cn("space-y-4", className)}>
      {attributes.map((attr) => (
        <div key={attr.id} className="space-y-2">
          <Label className="text-sm font-medium">{attr.name}</Label>

          {attr.type === "SELECT" && (
            <div className="flex flex-wrap gap-2">
              {attr.values.map((val) => {
                const isSelected = selectedValues[attr.id] === val.id
                return (
                  <button
                    key={val.id}
                    type="button"
                    onClick={() => handleValueChange(attr.id, val.id)}
                    className="px-6 py-3 text-sm font-semibold transition-all"
                    style={isSelected ? {
                      backgroundColor: "var(--variant-selected-bg, var(--brand-color, #E03E54))",
                      color: "var(--variant-selected-text, #fff)",
                    } : {
                      backgroundColor: "var(--variant-default-bg, #f3f4f6)",
                      color: "var(--variant-default-text, #000)",
                    }}
                  >
                    {val.value}
                  </button>
                )
              })}
            </div>
          )}

          {attr.type === "COLOR" && (
            <div className="flex flex-wrap gap-2">
              {attr.values.map((val) => {
                const isSelected = selectedValues[attr.id] === val.id
                return (
                  <button
                    key={val.id}
                    type="button"
                    onClick={() => handleValueChange(attr.id, val.id)}
                    className={cn(
                      "relative size-10 border-2 transition-all",
                      isSelected
                        ? "ring-2 ring-primary ring-offset-2"
                        : "hover:scale-110"
                    )}
                    style={{ backgroundColor: val.colorHex || "#ccc" }}
                    title={val.value}
                  >
                    <span className="sr-only">{val.value}</span>
                  </button>
                )
              })}
            </div>
          )}

          {attr.type === "IMAGE" && (
            <div className="flex flex-wrap gap-2">
              {attr.values.map((val) => {
                const isSelected = selectedValues[attr.id] === val.id
                return (
                  <button
                    key={val.id}
                    type="button"
                    onClick={() => handleValueChange(attr.id, val.id)}
                    className={cn(
                      "relative size-16 border-2 overflow-hidden transition-all",
                      isSelected
                        ? "ring-2 ring-primary ring-offset-2 border-primary"
                        : "hover:scale-105 border-muted"
                    )}
                    title={val.value}
                  >
                    {val.imageUrl ? (
                      <img
                        src={val.imageUrl}
                        alt={val.value}
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="flex items-center justify-center size-full text-xs">
                        {val.value}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

        </div>
      ))}

      {/* Variant Info Display */}
      {!isLoading && currentVariant && !currentVariant.isAvailable && (
        <p className="text-sm font-medium pt-2" style={{ color: "var(--error-color)" }}>Sold Out</p>
      )}
    </div>
  )
}
