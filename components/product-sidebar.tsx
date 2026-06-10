"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { ShoppingCart, Loader2 } from "lucide-react"

interface Product {
  id: string
  slug: string
  imageUrl: string
  title: string
  price: number
  tag?: string
}

interface ProductSidebarProps {
  products: Product[]
}

export function ProductSidebar({ products }: ProductSidebarProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleAddToCart = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault()
    e.stopPropagation()

    setLoadingId(productId)

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
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
      setLoadingId(null)
    }
  }

  if (products.length === 0) {
    return (
      <div className="p-4 text-center" style={{ color: "var(--text-muted)" }}>
        <p className="text-sm">No related products</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 p-2">
      {products.map((product) => (
        <div
          key={product.id}
          className="group relative overflow-hidden transition-all duration-300 flex items-center gap-3"
          style={{
            backgroundColor: "color-mix(in srgb, var(--text-primary) 5%, transparent)",
            border: "1px solid transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "color-mix(in srgb, var(--brand-color) 30%, transparent)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "transparent"
          }}
        >
          <Link href={`/tienda/${product.slug}`} className="block shrink-0">
            <div className="relative h-24 w-24 overflow-hidden">
              <Image
                src={product.imageUrl || "/placeholder-product.jpg"}
                alt={product.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="96px"
              />
              {product.tag && (
                <span
                  className="absolute top-1 left-1 px-1.5 py-0.5 text-[10px] font-bold"
                  style={{
                    backgroundColor: "var(--brand-color)",
                    color: "#fff",
                  }}
                >
                  {product.tag}
                </span>
              )}
            </div>
          </Link>
          <div className="flex-1 py-2 pr-2 min-w-0">
            <Link href={`/tienda/${product.slug}`} className="block">
              <h4
                className="font-semibold text-xs truncate transition-colors"
                style={{ color: "var(--text-primary)" }}
              >
                {product.title}
              </h4>
              <div className="flex items-baseline gap-1 mt-1">
                <span
                  className="text-sm font-bold"
                  style={{ color: "var(--brand-color)" }}
                >
                  {product.price.toFixed(2)}€
                </span>
              </div>
            </Link>
            <div className="mt-2">
              <button
                onClick={(e) => handleAddToCart(e, product.id)}
                disabled={loadingId === product.id}
                className="h-7 text-xs w-full flex items-center justify-center gap-1.5 font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{
                  backgroundColor: "var(--brand-color)",
                  color: "#fff",
                }}
              >
                {loadingId === product.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ShoppingCart className="h-3.5 w-3.5" />
                )}
                {loadingId === product.id ? "..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
