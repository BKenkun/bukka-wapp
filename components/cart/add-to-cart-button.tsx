"use client"

import { useState } from "react"
import { toast } from "sonner"

interface AddToCartButtonProps {
  productId: string
  stock: number
  trackInventory: boolean
  className?: string
  quantity?: number
}

export function AddToCartButton({
  productId,
  stock,
  trackInventory,
  className = "",
  quantity = 1,
}: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false)

  const isOutOfStock = trackInventory && stock === 0

  const handleAddToCart = async () => {
    setLoading(true)

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      })

      if (res.ok) {
        toast.success("Product added to cart")
        // Dispatch custom event to update cart button
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
    <button
      onClick={handleAddToCart}
      disabled={loading || isOutOfStock}
      className={`text-center disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{
        color: "var(--text-primary)",
        fontFamily: "var(--global-font)",
        fontSize: "19.756px",
        fontWeight: 400,
        lineHeight: "normal",
        background: isOutOfStock ? "color-mix(in srgb, var(--text-primary) 40%, transparent)" : "var(--brand-color)",
        border: "none",
        padding: "12px 72px",
      }}
    >
      {loading ? "Adding..." : isOutOfStock ? "Sold Out" : "Add to Cart"}
    </button>
  )
}
