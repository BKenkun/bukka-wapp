"use client"

import * as React from "react"
import { toast } from "sonner"
import { VariantSelector } from "@/components/shop/variant-selector"

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

interface ProductAddToCartProps {
  productId: string
  productSlug: string
  productType: "SIMPLE" | "VARIABLE"
  stock: number
  trackInventory: boolean
  basePrice: number
  compareAtPrice: number | null
  attributes?: Attribute[]
  onPriceChange?: (price: number, compareAtPrice: number | null) => void
}

export function ProductAddToCart({
  productId,
  productSlug,
  productType,
  stock,
  trackInventory,
  basePrice,
  compareAtPrice,
  attributes = [],
  onPriceChange,
}: ProductAddToCartProps) {
  const [loading, setLoading] = React.useState(false)
  const [quantity, setQuantity] = React.useState(1)
  const [selectedVariant, setSelectedVariant] = React.useState<VariantInfo | null>(null)

  const isVariable = productType === "VARIABLE"

  // For VARIABLE products, use variant stock. For SIMPLE, use product stock
  const currentStock = isVariable && selectedVariant ? selectedVariant.stock : stock
  const currentPrice = isVariable && selectedVariant ? selectedVariant.price : basePrice
  const currentCompareAtPrice = isVariable && selectedVariant
    ? selectedVariant.compareAtPrice
    : compareAtPrice

  const isOutOfStock = isVariable
    ? !selectedVariant || !selectedVariant.isAvailable
    : trackInventory && stock === 0
  const maxQuantity = trackInventory ? currentStock : 99

  // Notify parent of price changes
  React.useEffect(() => {
    if (onPriceChange) {
      onPriceChange(currentPrice, currentCompareAtPrice)
    }
  }, [currentPrice, currentCompareAtPrice, onPriceChange])

  const handleVariantChange = (variant: VariantInfo | null) => {
    setSelectedVariant(variant)
    setQuantity(1) // Reset quantity when variant changes
  }

  const handleAddToCart = async () => {
    if (isVariable && !selectedVariant) {
      toast.error("Please select a variant")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          quantity,
          variantId: selectedVariant?.id || null,
        }),
      })

      if (res.ok) {
        toast.success("Product added to cart")
        window.dispatchEvent(new CustomEvent("cart-updated"))
      } else {
        const error = await res.json()
        toast.error(error.error || "Error adding to cart")
      }
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast.error("Error adding to cart")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Variant Selector */}
      {isVariable && attributes.length > 0 && (
        <VariantSelector
          productSlug={productSlug}
          attributes={attributes}
          basePrice={basePrice}
          onVariantChange={handleVariantChange}
        />
      )}

      <div className="flex items-center gap-4">
        {/* Quantity Selector */}
        {!isOutOfStock && (
          <div className="flex items-center" style={{ border: "1px solid color-mix(in srgb, var(--text-primary) 30%, transparent)" }}>
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-4 py-3 transition-colors hover:opacity-80"
              style={{ color: "var(--text-primary)" }}
              disabled={quantity <= 1}
            >
              -
            </button>
            <span className="px-4 py-3 font-medium min-w-[50px] text-center" style={{ color: "var(--text-primary)" }}>
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
              className="px-4 py-3 transition-colors hover:opacity-80"
              style={{ color: "var(--text-primary)" }}
              disabled={quantity >= maxQuantity}
            >
              +
            </button>
          </div>
        )}

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={loading || isOutOfStock}
          className="text-center disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          style={{
            color: "var(--text-primary)",
            fontFamily: "var(--global-font)",
            fontSize: "16px",
            fontWeight: 500,
            background: isOutOfStock ? "color-mix(in srgb, var(--text-primary) 40%, transparent)" : "var(--brand-color)",
            padding: "14px 28px",
          }}
        >
          {loading
            ? "Adding..."
            : isOutOfStock
              ? isVariable && !selectedVariant
                ? "Select Options"
                : "Sold Out"
              : "Add to Cart"}
        </button>
      </div>
    </div>
  )
}
