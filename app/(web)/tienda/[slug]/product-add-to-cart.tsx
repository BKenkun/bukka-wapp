"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface ProductAddToCartProps {
  productId: string
  stock: number
  trackInventory: boolean
}

export function ProductAddToCart({ productId, stock, trackInventory }: ProductAddToCartProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [quantity, setQuantity] = useState(1)

  const isOutOfStock = trackInventory && stock === 0
  const maxQuantity = trackInventory ? stock : 99

  const handleAddToCart = async () => {
    if (!session?.user) {
      router.push("/login?callbackUrl=" + encodeURIComponent(window.location.pathname))
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      })

      if (res.ok) {
        toast.success("Producto añadido al carrito")
        window.dispatchEvent(new CustomEvent("cart-updated"))
      } else {
        const error = await res.json()
        toast.error(error.error || "Error al añadir al carrito")
      }
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast.error("Error al añadir al carrito")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      {/* Quantity Selector */}
      {!isOutOfStock && (
        <div className="flex items-center border border-gray-700">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-4 py-3 text-white hover:bg-gray-800 transition-colors"
            disabled={quantity <= 1}
          >
            -
          </button>
          <span className="px-4 py-3 text-white font-medium min-w-[50px] text-center">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
            className="px-4 py-3 text-white hover:bg-gray-800 transition-colors"
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
        className="text-white text-center disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        style={{
          fontFamily: "Montserrat",
          fontSize: "16px",
          fontWeight: 500,
          background: isOutOfStock ? "#6B7280" : "#FA4860",
          padding: "14px 28px",
        }}
      >
        {loading ? "Añadiendo..." : isOutOfStock ? "Agotado" : "Añadir al carrito"}
      </button>
    </div>
  )
}
