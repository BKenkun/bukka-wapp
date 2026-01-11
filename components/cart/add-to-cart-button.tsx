"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
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
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const isOutOfStock = trackInventory && stock === 0

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
        // Dispatch custom event to update cart button
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
    <button
      onClick={handleAddToCart}
      disabled={loading || isOutOfStock}
      className={`text-white text-center disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{
        fontFamily: "Montserrat",
        fontSize: "19.756px",
        fontWeight: 400,
        lineHeight: "normal",
        background: isOutOfStock ? "#6B7280" : "#FA4860",
        border: "0 solid #E5E7EB",
        padding: "12px 72px",
      }}
    >
      {loading ? "Añadiendo..." : isOutOfStock ? "Agotado" : "Añadir al carrito"}
    </button>
  )
}
